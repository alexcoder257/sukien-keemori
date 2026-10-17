import { notFound } from "next/navigation";

/**
 * Catch-all xếp cuối: mọi URL dưới `/{locale}` không khớp route nào.
 *
 * Vì sao cần một route chỉ để ném 404: `not-found.tsx` **chỉ** bắt những chỗ
 * code gọi `notFound()`. URL không khớp route nào thì Next không dựng cây
 * `[locale]` nữa mà trả thẳng trang 404 mặc định của framework — nền trắng,
 * chữ tiếng Anh, không header, không theme. Đẩy trường hợp đó qua một route
 * thật rồi gọi `notFound()` là cách kéo nó về đúng trang 404 của mình.
 *
 * Cách còn lại là `app/global-not-found.tsx` (cờ `experimental.globalNotFound`),
 * đúng theo tài liệu cho trường hợp root layout nằm ở segment động như
 * `app/[locale]/`. Không chọn vì nó bỏ qua toàn bộ vòng render bình thường:
 * trang đó phải tự dựng `<html>`, tự nạp font và không có provider nào — tức là
 * một trang 404 **thứ hai** trông khác hẳn cái này, phải sửa hai chỗ mỗi lần
 * đổi chữ. Catch-all thì dùng lại đúng layout, header và footer thật.
 *
 * Segment catch-all có độ ưu tiên thấp nhất trong bảng route của Next, nên nó
 * không che route nào đang có; thêm route mới cũng không phải đụng tới file này.
 */
export default function CatchAllNotFound(): never {
  notFound();
}
