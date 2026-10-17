import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import {
  EMPTY_GOOGLE_ANALYTICS_REPORT,
  type GoogleAnalyticsBreakdownRow,
  type GoogleAnalyticsReport,
} from './google-analytics.types';

/** Số dòng giữ lại ở mỗi bảng phân bổ. Đủ để thấy hình, chưa đủ để thành báo cáo. */
const BREAKDOWN_LIMIT = 6;

/** Cache trong bộ nhớ tiến trình. GA cập nhật theo giờ, hỏi lại mỗi lần mở màn là phí. */
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Đọc báo cáo từ Google Analytics Data API (GA4).
 *
 * **Chỉ đọc, và chỉ những chỉ số `daily_visits` không có.** Bảng đếm của mình
 * là nguồn chính của lưu lượng — nó không bị ad-blocker chặn và có tính cả
 * trang thiệp. GA trả lời câu khác hẳn: khách *đến từ đâu*, bằng *thiết bị gì*,
 * xem *trang nào*. Hai nguồn không bao giờ khớp số và không được phép khớp.
 *
 * Không cấu hình đủ ba biến thì service **không sập, không ném lỗi** — nó trả
 * `configured: false`. Đây là công cụ nội bộ đọc dữ liệu của một dịch vụ ngoài;
 * để nó chặn được đường khởi động backend là đổi một tiện nghi lấy toàn bộ sản
 * phẩm. Cùng lý do với `RECAPTCHA_SECRET_KEY` bỏ trống ở dev.
 */
@Injectable()
export class GoogleAnalyticsService {
  private readonly logger = new Logger(GoogleAnalyticsService.name);
  private readonly propertyId: string;
  private readonly client: BetaAnalyticsDataClient | null;
  private cache: {
    key: string;
    at: number;
    report: GoogleAnalyticsReport;
  } | null = null;

  constructor(configService: ConfigService) {
    this.propertyId = configService.get<string>('GA_PROPERTY_ID') ?? '';
    const clientEmail = configService.get<string>('GA_CLIENT_EMAIL') ?? '';
    const privateKey = configService.get<string>('GA_PRIVATE_KEY') ?? '';

    if (!this.propertyId || !clientEmail || !privateKey) {
      this.client = null;
      return;
    }

    this.client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        // Khoá PEM tới đây ở một trong hai dạng, tuỳ ai đọc tệp env: xuống
        // dòng thật (Docker Compose hoàn nguyên `\n` khi nạp `env_file`), hoặc
        // `\n` còn nguyên hai ký tự. Phép thay này xử lý dạng thứ hai và là
        // no-op với dạng thứ nhất, nên **đừng bỏ** vì thấy nó thừa ở môi trường
        // mình đang chạy. Sai dạng thì thư viện ném "invalid PEM" — lỗi trông
        // như sai khoá chứ không như sai định dạng, nên rất tốn thời gian dò.
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
    });
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async report(days: number): Promise<GoogleAnalyticsReport> {
    if (!this.client) {
      return { ...EMPTY_GOOGLE_ANALYTICS_REPORT, days };
    }

    const cacheKey = String(days);
    if (
      this.cache?.key === cacheKey &&
      Date.now() - this.cache.at < CACHE_TTL_MS
    ) {
      return this.cache.report;
    }

    try {
      const report = await this.fetch(days);
      this.cache = { key: cacheKey, at: Date.now(), report };
      return report;
    } catch (error) {
      // Hỏng mềm: màn Phân tích còn nguyên phần dữ liệu của mình, chỉ mất khối
      // GA. Nhưng phải kêu to trong log — một tích hợp chết lặng lẽ chỉ bị phát
      // hiện vào đúng hôm cần tới nó.
      this.logger.error(
        `Không đọc được báo cáo Google Analytics: ${(error as Error).message}`,
      );
      return { ...EMPTY_GOOGLE_ANALYTICS_REPORT, configured: true, days };
    }
  }

  /**
   * Bốn báo cáo trong **một** lượt gọi mạng.
   *
   * `batchRunReports` nhận tối đa 5 báo cáo và tính quota như một request, nên
   * gọi rời từng cái vừa chậm gấp bốn vừa đốt quota gấp bốn.
   */
  private async fetch(days: number): Promise<GoogleAnalyticsReport> {
    const property = `properties/${this.propertyId}`;
    // GA đếm `NdaysAgo` lùi từ hôm nay, nên `days - 1` mới ra đúng N ngày kể cả
    // hôm nay — khớp cách `AnalyticsService.traffic` cắt khoảng.
    const dateRanges = [{ startDate: `${days - 1}daysAgo`, endDate: 'today' }];

    const [response] = await this.client!.batchRunReports({
      property,
      requests: [
        {
          dateRanges,
          metrics: [
            { name: 'sessions' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
          ],
        },
        {
          dateRanges,
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: BREAKDOWN_LIMIT,
        },
        {
          dateRanges,
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: BREAKDOWN_LIMIT,
        },
        {
          dateRanges,
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: BREAKDOWN_LIMIT,
        },
      ],
    });

    const [totals, channels, devices, pages] = response.reports ?? [];
    const metric = (index: number): number =>
      Number(totals?.rows?.[0]?.metricValues?.[index]?.value ?? 0);
    const totalUsers = metric(3);

    return {
      configured: true,
      days,
      sessions: metric(0),
      engagementRate: metric(1),
      averageSessionDuration: metric(2),
      newUserRate: totalUsers > 0 ? metric(4) / totalUsers : 0,
      channels: toRows(channels),
      devices: toRows(devices),
      topPages: toRows(pages),
    };
  }
}

/** Bảng GA → cặp `key`/`value`, bỏ dòng thiếu nhãn. */
function toRows(report: {
  rows?:
    | {
        dimensionValues?: { value?: string | null }[] | null;
        metricValues?: { value?: string | null }[] | null;
      }[]
    | null;
}): GoogleAnalyticsBreakdownRow[] {
  return (report?.rows ?? []).flatMap((row) => {
    const key = row.dimensionValues?.[0]?.value;
    if (!key) return [];
    return [{ key, value: Number(row.metricValues?.[0]?.value ?? 0) }];
  });
}
