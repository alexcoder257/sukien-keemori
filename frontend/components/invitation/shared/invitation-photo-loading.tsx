"use client";

import { useEffect, useRef } from "react";

/**
 * Bật nền "đang tải" cho ảnh cặp đôi của mọi tấm thiệp — hình nằm ở khối
 * `invitation-photo-loading` trong `globals.css`, file này chỉ báo cho CSS biết
 * tấm nào đã tải xong.
 *
 * **Vì sao phải có JS.** Nền nhấp nháy nằm ngay trên thẻ `<img>`, nên ảnh đặc
 * tải xong là tự che mất nó. Nhưng ảnh trong `photos/` không phải lúc nào cũng
 * đặc: tranh minh hoạ của mẫu (thường ở mẫu Free) có nền
 * trong suốt, và backend không làm phẳng kênh alpha của ảnh khách tải lên. Chỉ
 * CSS thì những tấm đó mang một mảng xám nhấp nháy vĩnh viễn — nên mỗi tấm tải
 * xong (hoặc hỏng) được đánh dấu `data-photo-settled` để tắt hẳn nền đó.
 *
 * **Vì sao bật bằng cờ trên gốc thiệp.** CSS chỉ áp khi gốc có
 * `data-photo-loading`, mà cờ đó do chính effect này gắn. JS chưa chạy hoặc
 * hỏng thì không ảnh nào nhấp nháy mãi — thiệp trở về đúng như trước khi có
 * tính năng này. Đổi lại trước lúc hydrate không có skeleton, và không mất gì:
 * nội dung thiệp còn nằm sau màn mở thiệp, mà nút mở thiệp cũng cần JS.
 *
 * Một trình nghe `load`/`error` ở pha capture trên gốc thiệp thay cho `onLoad`
 * ở từng ảnh: 70 mẫu tự dựng thẻ ảnh theo cách riêng, sửa từng chỗ là đụng vào
 * art direction của cả kho. Sự kiện `load` không nổi bọt nhưng vẫn đi qua tổ
 * tiên ở pha capture.
 */
export function InvitationPhotoLoading() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = markerRef.current?.parentElement;
    if (!root) return;

    const settle = (event: Event) => {
      if (event.target instanceof HTMLImageElement) {
        event.target.setAttribute("data-photo-settled", "");
      }
    };

    // Gắn trình nghe trước rồi mới quét: tấm nào tải xong giữa hai bước này
    // vẫn được bắt ở lượt quét.
    root.addEventListener("load", settle, true);
    root.addEventListener("error", settle, true);
    for (const image of root.querySelectorAll("img")) {
      // `complete` thôi là chưa đủ: tấm đã hiện bản srcset nhỏ mà trình duyệt
      // còn chờ bản lớn hơn thì `complete = false` dù đã có điểm ảnh — và lượt
      // `load` của bản nhỏ đã trôi qua trước khi trình nghe kịp gắn.
      if (image.complete || image.naturalWidth > 0) {
        image.setAttribute("data-photo-settled", "");
      }
    }
    root.setAttribute("data-photo-loading", "");

    return () => {
      root.removeEventListener("load", settle, true);
      root.removeEventListener("error", settle, true);
      root.removeAttribute("data-photo-loading");
    };
  }, []);

  return <span ref={markerRef} hidden />;
}
