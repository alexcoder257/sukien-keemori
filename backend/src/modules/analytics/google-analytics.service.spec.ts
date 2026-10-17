import { ConfigService } from '@nestjs/config';
import { GoogleAnalyticsService } from './google-analytics.service';

function serviceWith(env: Record<string, string>): GoogleAnalyticsService {
  const config = {
    get: (key: string) => env[key],
  } as unknown as ConfigService;
  return new GoogleAnalyticsService(config);
}

/** Khoá PEM hợp lệ về mặt định dạng; không gọi mạng nên nội dung không quan trọng. */
const FAKE_KEY =
  '-----BEGIN PRIVATE KEY-----\\nMIIE\\n-----END PRIVATE KEY-----\\n';

describe('GoogleAnalyticsService', () => {
  it('không sập khi thiếu cấu hình và báo là chưa kết nối', async () => {
    const service = serviceWith({});

    expect(service.isConfigured).toBe(false);
    await expect(service.report(30)).resolves.toEqual({
      configured: false,
      days: 30,
      sessions: 0,
      engagementRate: 0,
      averageSessionDuration: 0,
      newUserRate: 0,
      channels: [],
      devices: [],
      topPages: [],
    });
  });

  it('thiếu một trong ba biến vẫn là chưa cấu hình', () => {
    expect(
      serviceWith({ GA_PROPERTY_ID: '1', GA_CLIENT_EMAIL: 'a@b.c' })
        .isConfigured,
    ).toBe(false);
  });

  it('đọc và ánh xạ báo cáo gộp thành đúng một report', async () => {
    const service = serviceWith({
      GA_PROPERTY_ID: '123',
      GA_CLIENT_EMAIL: 'a@b.iam.gserviceaccount.com',
      GA_PRIVATE_KEY: FAKE_KEY,
    });
    const batchRunReports = jest.fn().mockResolvedValue([
      {
        reports: [
          {
            rows: [
              {
                metricValues: [
                  { value: '480' },
                  { value: '0.62' },
                  { value: '95.5' },
                  { value: '300' },
                  { value: '210' },
                ],
              },
            ],
          },
          {
            rows: [
              {
                dimensionValues: [{ value: 'Organic Search' }],
                metricValues: [{ value: '300' }],
              },
              // Dòng thiếu nhãn phải bị bỏ, không được thành một cột trống.
              {
                dimensionValues: [{ value: '' }],
                metricValues: [{ value: '9' }],
              },
            ],
          },
          {
            rows: [
              {
                dimensionValues: [{ value: 'mobile' }],
                metricValues: [{ value: '420' }],
              },
            ],
          },
          {
            rows: [
              {
                dimensionValues: [{ value: '/vi/bang-gia' }],
                metricValues: [{ value: '150' }],
              },
            ],
          },
        ],
      },
    ]);
    Object.assign(service, { client: { batchRunReports } });

    const report = await service.report(7);

    expect(report.configured).toBe(true);
    expect(report.sessions).toBe(480);
    expect(report.engagementRate).toBeCloseTo(0.62);
    expect(report.newUserRate).toBeCloseTo(0.7);
    expect(report.channels).toEqual([{ key: 'Organic Search', value: 300 }]);
    expect(report.devices).toEqual([{ key: 'mobile', value: 420 }]);
    expect(report.topPages).toEqual([{ key: '/vi/bang-gia', value: 150 }]);

    // Lần hỏi thứ hai phải lấy từ cache, không gọi lại GA.
    await service.report(7);
    expect(batchRunReports).toHaveBeenCalledTimes(1);
  });

  it('GA hỏng thì trả report rỗng thay vì ném lỗi lên màn Phân tích', async () => {
    const service = serviceWith({
      GA_PROPERTY_ID: '123',
      GA_CLIENT_EMAIL: 'a@b.iam.gserviceaccount.com',
      GA_PRIVATE_KEY: FAKE_KEY,
    });
    Object.assign(service, {
      client: {
        batchRunReports: jest.fn().mockRejectedValue(new Error('403 denied')),
      },
    });

    const report = await service.report(30);

    expect(report.configured).toBe(true);
    expect(report.sessions).toBe(0);
    expect(report.channels).toEqual([]);
  });
});
