/**
 * Đánh dấu document đang chạy trong iframe xem thử. Layout gốc luôn kèm chrome
 * của app (nút lên đầu trang, con trỏ tự vẽ, thanh tiến trình) — bên trong
 * một bản xem thử chúng chỉ là rác: `globals.css` ẩn mọi phần tử có
 * `data-app-chrome` khi cờ này bật, còn thanh tiến trình bị giấu bằng `#nprogress`.
 *
 * Đặt cờ bằng thẻ `<script>` chứ không bằng effect: cờ phải có mặt trước khi
 * mấy component chrome kia chạy effect đầu tiên của chúng.
 */
export function EmbedFlag() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.dataset.embed="true"`,
      }}
    />
  );
}
