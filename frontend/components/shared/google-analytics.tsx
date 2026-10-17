"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Trang thiệp công khai: `/{locale}/t/{slug}`.
 *
 * Slug được dựng từ **tên thật của cô dâu chú rể** (`tuan-anh-nhu-binh-adec`),
 * nên gửi đường dẫn đó sang Google là đưa dữ liệu cá nhân của khách hàng cho
 * bên thứ ba — điều khoản của Google Analytics cấm thẳng, và Chính sách bảo mật
 * của mình cũng không hứa như vậy. Trang thiệp lại đã có phép đếm riêng
 * (`card_views` + `visitor_id`, phục vụ trần 15 lượt xem), nên GA ở đó không
 * thêm thông tin gì mà chỉ thêm rủi ro.
 */
const INVITATION_PATH = /^\/[^/]+\/t\//;

/**
 * Lượt xem đầu tiên đã được `gtag('config')` gửi hay chưa.
 *
 * Để ở **cấp module** chứ không phải `useRef`: component bị unmount mỗi khi
 * người dùng bước vào một trang thiệp và mount lại khi họ bước ra, mà
 * `next/script` không chạy lại script đã nạp — nên lần mount thứ hai không có
 * `config` nào gửi hộ nữa. Một `useRef` mới tinh sẽ tưởng đó vẫn là lần đầu và
 * nuốt mất lượt xem đó.
 */
let hasSentFirstView = false;

/**
 * Google Analytics 4.
 *
 * Không khai `NEXT_PUBLIC_GA_ID` thì component trả `null` — dev và preview
 * không nạp gtag, không đặt cookie, và số liệu production không lẫn traffic của
 * chính mình.
 *
 * Ba quyết định ở đây:
 *
 * 1. `strategy="afterInteractive"`, khác hai script `beforeInteractive` trong
 *    `layout.tsx`. Chúng phải chạy trước lần vẽ đầu để tránh nháy chữ; GA thì
 *    không, và đặt sớm là chèn một request bên thứ ba vào đường tới first paint.
 *
 * 2. Lượt xem đầu do `gtag('config')` gửi, lượt sau do effect gửi. Next điều
 *    hướng mềm nên gtag không tự thấy trang đổi; để mặc định thì chỉ trang đầu
 *    tiên được ghi. Đo lường nâng cao của GA có mục "Thay đổi trang" bù được,
 *    nhưng bật cả hai là mỗi lần chuyển trang đếm thành hai lượt — nên **tắt
 *    "Thay đổi trang" trong Đo lường nâng cao** ở giao diện GA và chốt ở đây.
 *
 * 3. Trang thiệp không nạp script và không gửi lượt nào (xem `INVITATION_PATH`).
 *    Khách mời đi thẳng từ link chia sẻ nên gần như luôn rơi vào nhánh này;
 *    trường hợp còn lại là chủ thiệp bấm xem thử từ trong app, lúc đó gtag đã
 *    nằm sẵn trên window nhưng không lượt nào mang URL thiệp được gửi đi.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const isInvitation = INVITATION_PATH.test(pathname);
  const enabled = Boolean(GA_ID) && !isInvitation;

  useEffect(() => {
    if (!enabled) return;
    if (!hasSentFirstView) {
      hasSentFirstView = true;
      return;
    }
    window.gtag?.("event", "page_view", {
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, enabled]);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="ga-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
