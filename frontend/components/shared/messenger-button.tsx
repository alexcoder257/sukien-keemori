"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import styles from "./messenger-button.module.css";

/**
 * Mọi trang có một tấm thiệp thật trên màn hình: `/vi/t/abc` (thiệp công khai
 * của một cặp đôi), `/vi/mau-thiep/<slug>/{demo,xem-thu}` và
 * `/vi/editor/<slug>` (khung preview trong editor render nút nhạc thật, không
 * phải ảnh tĩnh).
 *
 * Danh sách này đi theo **nơi nút nhạc xuất hiện**, không theo "trang nào là
 * trang marketing" — nút nhạc nằm trong chính component mẫu thiệp
 * (`invitation-music-toggle`), nên route nào render mẫu là route đó có nó.
 * Thêm một route render thiệp thì phải thêm vào đây.
 */
const INVITATION_SURFACE =
  /^\/[^/]+\/(?:t\/|editor\/|mau-thiep\/[^/]+\/(?:demo|xem-thu)\b)/;

type Props = {
  dict: Dictionary["common"]["support"];
  /** Link fanpage lấy từ `site_settings`; `null` thì không vẽ gì cả. */
  messengerUrl: string | null;
};

/**
 * Logo Messenger. Vẽ tay vì đây là nhãn hiệu, không phải icon giao diện —
 * `lucide` cố ý không mang bộ logo thương hiệu.
 */
export function MessengerIcon({
  className = "size-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 2C6.3 2 2 6.2 2 11.7c0 3 1.4 5.7 3.7 7.5v3.1c0 .4.4.6.7.4l2.7-1.5c.9.2 1.9.4 2.9.4 5.7 0 10-4.2 10-9.9C22 6.2 17.7 2 12 2Zm5.9 7.6-2.8 4.5c-.4.7-1.4.9-2 .4l-2.3-1.7a.6.6 0 0 0-.7 0l-3 2.3c-.4.3-.9-.2-.6-.6l2.8-4.5c.4-.7 1.4-.9 2-.4l2.3 1.7c.2.2.5.2.7 0l3-2.3c.4-.3.9.2.6.6Z" />
    </svg>
  );
}

/**
 * Nút chat Messenger nổi ở góc phải dưới.
 *
 * Xếp **phía trên** nút "lên đầu trang" (`right-6 bottom-6`, cao 48px) thay vì
 * cạnh nó: chồng dọc thì mép phải luôn thẳng hàng, còn xếp ngang thì tới nút
 * thứ ba là đè vào nội dung.
 *
 * Khoảng cách tính theo **cả mặt nút lẫn vòng nhịp sáng**. Mặt hai nút cách
 * nhau 24px (`bottom-24` = 96px, đỉnh nút mũi tên ở 72px) — đủ gần để đọc ra
 * một cụm, không xa tới mức nút chat lơ lửng giữa mép màn hình như lúc còn ở
 * `bottom-28`. Vòng sáng vì vậy chỉ nở tới `scale(1.6)` (vươn ~14px): ở mức
 * `1.9` cũ nó liếm xuống đè lên đỉnh nút mũi tên. Muốn vòng to hơn thì phải
 * đẩy nút lên lại, hai con số này đi cặp.
 *
 * Ba thứ quanh cái nút, mỗi thứ một việc: **nhịp sáng** chạy liên tục để mắt
 * bắt được nó giữa một trang dài (chi tiết trong CSS Module cạnh file này);
 * **bong bóng chữ** hiện khi trỏ vào, vì bản thân logo chỉ nói "Messenger" chứ
 * không nói "hỏi được ở đây"; **nút ×** cho người muốn dẹp nó đi. Không có ×
 * thì thứ duy nhất che góc màn hình vĩnh viễn lại là thứ không tắt được — và
 * người khó chịu với nó sẽ không bấm vào nó, họ chỉ khó chịu.
 *
 * Không render trên **mọi trang có một tấm thiệp chiếm trọn màn hình**:
 * `/t/<slug>` (thiệp khách mời mở ra), `/mau-thiep/<slug>/demo` và
 * `/mau-thiep/<slug>/xem-thu`. Lý do ban đầu chỉ là "mọi thứ thuộc về chủ
 * website ở đó đều là rác trong trải nghiệm khách mời", nhưng ba trang này còn
 * dùng chung một ràng buộc vật lý: **tấm thiệp đã chiếm góc phải dưới rồi** —
 * nút nhạc nền (`invitation-music-toggle.module.css`, `bottom: 1rem + 4rem`)
 * đứng đúng chỗ nút chat, và hai cái đè lên nhau.
 *
 * Đây là chỗ nhường **có chủ đích**: nút nhạc là điều khiển của chính nội dung
 * người ta đang xem, nút chat là của chủ website. Nội dung thắng. Xếp cao thêm
 * nữa cũng không phải lời giải — trang nào không có nhạc thì cái nút lơ lửng
 * giữa mép phải màn hình.
 *
 * `data-app-chrome` lo nốt trường hợp iframe xem thử (xem `globals.css`).
 */
export function MessengerButton({ dict, messengerUrl }: Props) {
  const pathname = usePathname();
  /**
   * Chỉ trong bộ nhớ, cố ý **không** lưu xuống `sessionStorage` hay
   * `localStorage`: bấm × nghĩa là "dẹp nó khỏi màn hình lúc này", không phải
   * "đừng bao giờ cho tôi thấy kênh hỗ trợ nữa". Tải lại trang là nút có mặt
   * trở lại — người tắt nó lúc đang đọc bảng giá vẫn tìm được chỗ hỏi khi họ
   * quay lại lúc sắp trả tiền. Chuyển trang trong app không làm mất lựa chọn
   * đó vì component nằm trong layout và không bị tháo ra giữa chừng.
   */
  const [dismissed, setDismissed] = useState(false);

  if (INVITATION_SURFACE.test(pathname)) return null;
  if (!messengerUrl) return null;
  if (dismissed) return null;

  return (
    <div
      data-app-chrome
      data-floating-action
      // `group` là chốt của cả bong bóng chữ lẫn nút ×; `focus-within` để bàn
      // phím thấy đúng những gì con trỏ thấy.
      className="group fixed right-6 bottom-24 z-40"
    >
      {/* Bong bóng chữ nằm **bên trái** nút và không nhận sự kiện chuột: nó là
          nhãn, không phải đích bấm — trỏ vào nó rồi bấm hụt là một cú bấm mất
          không. `translate-x-2` → `0` cho nó trượt ra từ phía sau cái nút. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 right-full mr-3 -translate-y-1/2",
          "rounded-2xl bg-foreground px-4 py-2.5 whitespace-nowrap",
          "text-small font-medium text-background shadow-lg shadow-black/25",
          "translate-x-2 opacity-0 transition-all duration-300",
          "group-hover:translate-x-0 group-hover:opacity-100",
          "group-focus-within:translate-x-0 group-focus-within:opacity-100",
        )}
      >
        {dict.messenger.cta}
      </span>

      <div className="relative size-12">
        {/* Ba lớp nhịp sáng nằm dưới nút. `-z-10` để chúng không chen vào giữa
            con trỏ và đích bấm. */}
        <span aria-hidden className={cn(styles.halo, "-z-10")} />
        <span aria-hidden className={cn(styles.ring, "-z-10")} />
        <span
          aria-hidden
          className={cn(styles.ring, styles.ringDelayed, "-z-10")}
        />

        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={dict.messenger.label}
          title={dict.messenger.label}
          // Gradient nhận diện của Messenger, đặt thẳng ở đây như `brand-icons.tsx`:
          // đây là màu của nhãn hiệu bên thứ ba, không phải một hue mới của
          // design system, nên nó không được vào `globals.css`.
          style={{
            backgroundImage:
              "radial-gradient(circle at 22% 118%, #00B2FF 12%, #006AFF 42%, #A033FF 72%, #FF5280 92%)",
          }}
          className={cn(
            "relative flex size-12 items-center justify-center rounded-full text-white",
            "shadow-lg shadow-black/25 transition-transform duration-300 hover:scale-105",
            "focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none",
          )}
        >
          <MessengerIcon />
        </a>

        {/* Nút × chỉ hiện khi trỏ vào cụm: để nó hiện thường trực thì cái đầu
            tiên mắt bắt được ở góc màn hình lại là một dấu đóng.

            Vị trí là **nửa trong nửa ngoài** mép nút chat: tâm của nó rơi ngay
            trên đường tròn 48px ở hướng 45°, nên nó đọc ra là một huy hiệu gắn
            vào nút chứ không phải một nút thứ hai lơ lửng cạnh đó.

            Vùng bấm 20px là nhỏ so với chuẩn chạm 44px — có chủ đích: nó đè lên
            chính đích bấm chính, và một vùng đóng rộng tay đặt ở đó là cách bấm
            nhầm. */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={dict.messenger.dismiss}
          title={dict.messenger.dismiss}
          className={cn(
            "absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full",
            "bg-foreground/85 text-background shadow-md backdrop-blur-sm",
            "opacity-0 transition-opacity duration-200 hover:bg-foreground",
            "group-hover:opacity-100 group-focus-within:opacity-100",
            "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none",
          )}
        >
          <X aria-hidden className="size-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
