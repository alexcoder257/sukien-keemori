import { Injectable } from '@nestjs/common';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { DailyVisit } from './daily-visit.entity';

@Injectable()
export class AnalyticsRepository extends Repository<DailyVisit> {
  constructor(private readonly dataSource: DataSource) {
    super(DailyVisit, dataSource.createEntityManager());
  }

  /**
   * Ghi nhận một lượt truy cập bằng **một câu upsert**, không đọc-sửa-ghi:
   * nhiều tab mở cùng lúc là chuyện thường và read-modify-write sẽ nuốt lượt.
   */
  async record(day: string, isNewVisitor: boolean): Promise<void> {
    await this.query(
      `INSERT INTO daily_visits (day, page_views, visitors)
       VALUES ($1, 1, $2)
       ON CONFLICT (day) DO UPDATE
         SET page_views = daily_visits.page_views + 1,
             visitors = daily_visits.visitors + EXCLUDED.visitors,
             updated_at = now()`,
      [day, isNewVisitor ? 1 : 0],
    );
  }

  /** Chuỗi ngày gần đây, cũ trước — biểu đồ đọc theo chiều thời gian. */
  findSince(since: string): Promise<DailyVisit[]> {
    return this.find({
      where: { day: MoreThanOrEqual(since) },
      order: { day: 'ASC' },
    });
  }

  async totals(): Promise<{ pageViews: number; visitors: number }> {
    const row = await this.createQueryBuilder('visit')
      .select('COALESCE(SUM(visit.page_views), 0)', 'pageViews')
      .addSelect('COALESCE(SUM(visit.visitors), 0)', 'visitors')
      .getRawOne<{ pageViews: string; visitors: string }>();
    return {
      pageViews: Number(row?.pageViews ?? 0),
      visitors: Number(row?.visitors ?? 0),
    };
  }
}
