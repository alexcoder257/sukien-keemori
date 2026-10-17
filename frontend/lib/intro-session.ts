/**
 * Trạng thái màn mở đầu homepage ("The Invitation Reveal").
 *
 * `full`  — lần đầu trong phiên: chạy trọn cảnh ~4.15s, có thể bỏ qua bằng cuộn.
 * `short` — quay lại trong cùng phiên: chỉ hé màn ~600ms, không lặp lại cảnh.
 */
export type IntroMode = "full" | "short";

export const INTRO_SESSION_KEY = "tco:intro-seen";

/** Gỡ cờ sau ngần này nếu JS chết giữa chừng, để nội dung không kẹt ở opacity 0. */
const FAILSAFE_MS = 5500;

/**
 * Script chạy đồng bộ ở đầu `<body>`, chốt giá trị `data-intro` đã có sẵn
 * trong HTML server.
 *
 * Phải là script inline chứ không phải effect của React: nếu đợi tới lúc
 * hydrate mới quyết định, trình duyệt đã kịp vẽ hero một frame rồi mới bị lớp
 * loader phủ lên — đúng kiểu nháy mà cả cảnh này sinh ra để tránh.
 *
 * `<html>` bắt đầu bằng `data-intro="pending"`, nên lớp mở đầu đã che hero từ
 * chính response HTML, trước khi bất kỳ JavaScript nào được tải. Script thuần
 * này phải là node đầu tiên trong `<body>` để trình duyệt chạy ngay khi parse:
 * `next/script` với `beforeInteractive` vẫn không bảo đảm chặn lần vẽ đầu.
 *
 * Đổi lại, script chạy trên mọi trang của locale nên phải tự kiểm tra đường
 * dẫn và gỡ `pending` ngay trên route khác; nếu để cờ lọt qua, các quy tắc trong
 * `globals.css` sẽ ẩn nhầm header và mọi `[data-reveal-item]` của trang đó.
 *
 * Người bật `prefers-reduced-motion` không được gắn cờ: không có `data-intro`
 * thì mọi quy tắc ẩn trong `globals.css` đều không khớp, nên họ thấy trang
 * ngay lập tức và không phụ thuộc vào việc GSAP có tải được hay không.
 *
 * `sessionStorage` bọc try/catch vì trình duyệt chặn storage của bên thứ ba sẽ
 * ném lỗi ngay khi đọc; lúc đó cứ chạy cảnh đầy đủ.
 */
export function introBootstrapScript(homePath: string): string {
  return `(function(){var d=document.documentElement;try{if(location.pathname.replace(/\\/+$/,"")!==${JSON.stringify(
    homePath.replace(/\/+$/, ""),
  )}){delete d.dataset.intro;return}if(matchMedia("(prefers-reduced-motion: reduce)").matches){delete d.dataset.intro;return}var s=null;try{s=sessionStorage.getItem(${JSON.stringify(
    INTRO_SESSION_KEY,
  )})}catch(e){}d.dataset.intro=s?"short":"full";setTimeout(function(){delete d.dataset.intro},${FAILSAFE_MS})}catch(e){delete d.dataset.intro}})()`;
}

/** Đọc chế độ mà script inline đã chốt. `null` = không có JS hoặc đã chạy xong. */
export function readIntroMode(): IntroMode | null {
  const value = document.documentElement.dataset.intro;
  return value === "full" || value === "short" ? value : null;
}

/**
 * Gỡ `pending` còn sót lại, và **chỉ** `pending`.
 *
 * `pending` là trạng thái của response HTML, chỉ sống cho tới khi script đồng
 * bộ đầu `<body>` chốt lại — nên khi JavaScript của app đã chạy thì nó không
 * còn là giá trị hợp lệ. Nó vẫn xuất hiện được vì `data-intro="pending"` là
 * thuộc tính do JSX của root layout dựng: **đổi ngôn ngữ là đổi segment
 * `[locale]`**, React render lại `<html>` và đặt lại thuộc tính đó, còn thẻ
 * `<script>` bootstrap thì React không bao giờ chạy ở client (chính cảnh báo
 * "Encountered a script tag while rendering React component" trên console).
 *
 * Hệ quả nếu để sót: `[data-intro] header` và `[data-intro] [data-app-chrome]`
 * trong `globals.css` ẩn header, nút chat, nút lên đầu trang và con trỏ tuỳ
 * biến trên **mọi** route sau khi chuyển ngôn ngữ.
 *
 * Không đụng tới `full`/`short`: hai giá trị đó là cảnh đang thật sự chạy và
 * `completeIntro` mới là chỗ kết thúc chúng.
 */
export function clearPendingIntro() {
  if (document.documentElement.dataset.intro === "pending") {
    delete document.documentElement.dataset.intro;
  }
}

/** Kết thúc màn mở: gỡ cờ CSS và đánh dấu phiên đã xem. */
export function completeIntro() {
  delete document.documentElement.dataset.intro;
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    // Storage bị chặn — phiên sau sẽ chạy lại cảnh đầy đủ, chấp nhận được.
  }
}
