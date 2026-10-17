import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { DailyVisit } from './daily-visit.entity';

/** Lưu lượng truy cập: tổng cộng dồn + chuỗi ngày để vẽ biểu đồ. */
export interface TrafficStats {
  totalPageViews: number;
  totalVisitors: number;
  daily: { day: string; pageViews: number; visitors: number }[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  /** Ngày tính theo múi giờ máy chủ — số liệu marketing đọc theo một lịch duy nhất. */
  record(isNewVisitor: boolean): Promise<void> {
    const day = new Date().toISOString().slice(0, 10);
    return this.analyticsRepository.record(day, isNewVisitor);
  }

  async traffic(days = 30): Promise<TrafficStats> {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    const [rows, totals] = await Promise.all([
      this.analyticsRepository.findSince(since.toISOString().slice(0, 10)),
      this.analyticsRepository.totals(),
    ]);

    return {
      totalPageViews: totals.pageViews,
      totalVisitors: totals.visitors,
      daily: rows.map((row: DailyVisit) => ({
        day: row.day,
        pageViews: row.pageViews,
        visitors: row.visitors,
      })),
    };
  }
}
