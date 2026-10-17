import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity, Index } from 'typeorm';

/**
 * Lưu lượng truy cập gộp **theo ngày**, một hàng một ngày.
 *
 * Cố tình không lưu từng lượt truy cập: câu hỏi của spec (mục 10) là "bao nhiêu
 * người vào website", không phải "ai vào" — mà một bảng log từng lượt thì vừa
 * phình vô hạn vừa biến số liệu marketing thành dữ liệu cá nhân phải bảo vệ.
 *
 * `visitors` là **lượt khách mới trong ngày**, do trình duyệt tự khai: nó chỉ
 * gửi cờ "lần đầu trong hôm nay" dựa trên một mốc lưu ở `localStorage`. Vì thế
 * đây là ước lượng — xoá dữ liệu trình duyệt hoặc đổi máy sẽ đếm thành khách
 * mới. Đúng bản chất của số liệu marketing, và đổi lại là không đặt cookie định
 * danh nào.
 */
@Entity('daily_visits')
export class DailyVisit extends BaseEntity {
  /** Ngày dạng `YYYY-MM-DD`; khoá tự nhiên của bảng. */
  @Index({ unique: true })
  @Column({ type: 'date' })
  day: string;

  /** Tổng lượt xem trang trong ngày. */
  @Column({ name: 'page_views', type: 'int', default: 0 })
  pageViews: number;

  /** Số khách mới trong ngày — xem ghi chú ở đầu file về độ chính xác. */
  @Column({ type: 'int', default: 0 })
  visitors: number;
}
