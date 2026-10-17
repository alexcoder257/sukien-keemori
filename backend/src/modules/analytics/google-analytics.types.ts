/** Một dòng trong bảng phân bổ (kênh, thiết bị, trang). */
export interface GoogleAnalyticsBreakdownRow {
  /** Giá trị thô do GA trả về — dashboard tự dịch sang chữ người đọc. */
  key: string;
  value: number;
}

/**
 * Báo cáo Google Analytics cho màn Phân tích của CMS.
 *
 * Cố ý **chỉ gồm thứ `daily_visits` không đo được**. Tổng lượt truy cập và
 * khách theo ngày đã có ở `AnalyticsService` và chính xác hơn ở đây (không bị
 * ad-blocker chặn, có tính cả trang thiệp), nên lặp lại chúng chỉ đẻ ra hai con
 * số vênh nhau trong cùng một màn.
 */
export interface GoogleAnalyticsReport {
  /**
   * Đã khai đủ ba biến môi trường hay chưa. `false` thì mọi trường còn lại là
   * giá trị rỗng — dashboard hiện lời nhắc cấu hình chứ không hiện số 0, vì
   * "chưa kết nối" và "không có ai truy cập" là hai chuyện khác nhau.
   */
  configured: boolean;
  days: number;
  sessions: number;
  /** Tỉ lệ phiên có tương tác thật, 0–1. */
  engagementRate: number;
  /** Thời lượng phiên trung bình, tính bằng giây. */
  averageSessionDuration: number;
  /** Tỉ lệ người dùng lần đầu vào site, 0–1. */
  newUserRate: number;
  /** Nhóm kênh mặc định của GA: Organic Search, Direct, Referral… */
  channels: GoogleAnalyticsBreakdownRow[];
  /** `desktop` · `mobile` · `tablet`. */
  devices: GoogleAnalyticsBreakdownRow[];
  /** Đường dẫn được xem nhiều nhất. */
  topPages: GoogleAnalyticsBreakdownRow[];
}

export const EMPTY_GOOGLE_ANALYTICS_REPORT: Omit<
  GoogleAnalyticsReport,
  'days'
> = {
  configured: false,
  sessions: 0,
  engagementRate: 0,
  averageSessionDuration: 0,
  newUserRate: 0,
  channels: [],
  devices: [],
  topPages: [],
};
