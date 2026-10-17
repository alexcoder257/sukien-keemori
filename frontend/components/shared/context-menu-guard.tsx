"use client";

import { useEffect } from "react";

/**
 * Vùng **được phép** giữ menu chuột phải: ô nhập liệu và vùng soạn thảo.
 *
 * Đây là phần bắt buộc của việc chặn chuột phải, không phải sự nhân nhượng:
 * chuột phải trên một ô input là đường **dán** quen thuộc nhất trên desktop,
 * và cũng là đường duy nhất tới gợi ý chính tả cùng menu autofill của trình
 * duyệt. Chặn cả những chỗ đó thì thứ hỏng không phải "kẻ tò mò xem source" mà
 * là cặp đôi đang dán tên nhà hàng vào editor thiệp của chính họ.
 *
 * `[data-allow-context-menu]` là cửa thoát cho những khối sau này cần menu gốc
 * (nhúng bản đồ, khu vực tải tệp) — gắn thuộc tính lên phần tử bao ngoài là đủ,
 * không phải sửa file này.
 */
const ALLOWED_SELECTOR = [
  "input",
  "textarea",
  "select",
  "[contenteditable]:not([contenteditable='false'])",
  "[data-allow-context-menu]",
].join(",");

/**
 * Chặn menu chuột phải trên toàn website.
 *
 * **Đây là rào cản, không phải bảo vệ.** Ai muốn lấy ảnh vẫn còn DevTools, tab
 * mạng và URL trực tiếp của tệp — không có mẹo JavaScript nào đổi được điều đó.
 * Giá trị thật của nó là giảm ma sát của thao tác *tiện tay*: khách xem thiệp
 * lỡ giữ chuột phải trên ảnh cưới thì không có menu "Lưu ảnh" bật ra.
 *
 * Đặt **một** listener duy nhất ở `document` chứ không phải `onContextMenu`
 * rải trên từng phần tử: mọi sự kiện `contextmenu` đều nổi bọt lên tới đây, nên
 * một handler bắt hết cả cây DOM lẫn nội dung dựng sau (modal của Radix portal
 * ra `document.body` cũng nằm trong tầm). Chi phí lúc chạy bằng không cho tới
 * khi người dùng thật sự bấm chuột phải — không state, không re-render, không
 * đụng gì tới đường vẽ khung hình.
 *
 * Không dùng `capture`: pha nổi bọt để component nào cần menu ngữ cảnh riêng
 * (`ContextMenu` của shadcn chẳng hạn) vẫn chạy trước và tự `preventDefault`,
 * và cờ `defaultPrevented` bên dưới giúp ta không gọi đè lần nữa.
 *
 * Trên di động, giữ lâu một ngón trên Android phát ra đúng sự kiện này nên bị
 * chặn theo. iOS thì không — callout của Safari không phải `contextmenu`, đó là
 * việc của `-webkit-touch-callout` trong `globals.css`.
 */
export function ContextMenuGuard() {
  useEffect(() => {
    // Chỉ chặn ở production: bản dev cần chuột phải → "Inspect" để soi DOM.
    // `NODE_ENV` được Next nội suy lúc build nên nhánh này bị loại hẳn khỏi
    // bundle production.
    if (process.env.NODE_ENV !== "production") return;

    const handleContextMenu = (event: MouseEvent) => {
      if (event.defaultPrevented) return;

      const target = event.target;
      if (target instanceof Element && target.closest(ALLOWED_SELECTOR)) return;

      event.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return null;
}
