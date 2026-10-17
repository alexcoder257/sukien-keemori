/**
 * Google Analytics 4.
 *
 * Màn `/phan-tich` **không đọc dữ liệu GA** — nó chỉ mở giao diện GA ra tab
 * mới. Kéo số liệu về đây được (Data API + service account), nhưng giao diện GA
 * đã tốt hơn bất cứ thứ gì dựng lại, còn người dùng màn này chỉ có vài người
 * vận hành. Nếu ngày nào cần nhúng thật thì đó là một module backend mới, không
 * phải sửa hằng số này.
 *
 * Hai nguồn lưu lượng ở đây **không khớp nhau và không được phép khớp**: khối
 * biểu đồ trong màn đếm cả trang thiệp `/t/*` và không bị ad-blocker chặn, còn
 * GA cố ý bỏ trang thiệp (slug chứa tên thật của cô dâu chú rể) và mất phần
 * khách chặn tracker. Nhãn trên nút phải nói rõ điều đó, nếu không người vận
 * hành sẽ đi tìm một lỗi không tồn tại.
 *
 * URL để trần vì đây là địa chỉ cố định của một sản phẩm bên thứ ba, không phải
 * URL môi trường của mình. GA tự mở tài sản được xem gần nhất. Khi cần trỏ
 * thẳng vào một tài sản, đổi thành
 * `https://analytics.google.com/analytics/web/#/p<PROPERTY_ID>/reports/intelligenthome`
 * — `PROPERTY_ID` là dãy số ở Quản trị → Chi tiết tài sản, **không phải** mã
 * `G-` dùng trong `NEXT_PUBLIC_GA_ID` của `frontend/`.
 */
export const GOOGLE_ANALYTICS_URL =
  "https://analytics.google.com/analytics/web/";
