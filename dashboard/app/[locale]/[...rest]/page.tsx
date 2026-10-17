import { notFound } from "next/navigation";

/**
 * Catch-all xếp cuối: mọi URL dưới `/{locale}` không khớp màn nào.
 *
 * Vì sao cần một route chỉ để ném 404: `not-found.tsx` **chỉ** bắt những chỗ
 * code gọi `notFound()`. URL không khớp route nào thì Next không dựng cây
 * `[locale]` nữa mà trả thẳng trang 404 mặc định của framework — nền trắng,
 * chữ tiếng Anh, không sidebar. Đẩy trường hợp đó qua một route thật rồi gọi
 * `notFound()` là cách kéo nó về đúng trang 404 của mình.
 *
 * Segment catch-all có độ ưu tiên thấp nhất trong bảng route của Next, nên nó
 * không che màn nào đang có; thêm màn mới cũng không phải đụng tới file này.
 *
 * Giống hệt `frontend/app/[locale]/[...rest]/page.tsx` — bản sao có chủ đích,
 * hai app không import xuyên nhau.
 */
export default function CatchAllNotFound(): never {
  notFound();
}
