"use client";

import type { ComponentProps } from "react";
import { cormorant, uvnHoaTay } from "@/assets/fonts";
import { cn } from "@/lib/utils";
import {
  useInvitationGuest,
  useInvitationGuestGreeting,
} from "./invitation-guest-context";

/**
 * Lời chào chung trên màn bìa ("Trân trọng kính mời") — `<p>` của chính mẫu,
 * giữ nguyên class và thuộc tính mẫu truyền vào.
 *
 * Link mời riêng đã có khối "Trân trọng kính mời: <tên>" ngay trên tên cô dâu
 * chú rể, nên lời chào chung **ẩn hẳn**: hai câu mời trên cùng một tấm bìa là
 * nói hai lần một việc. Link chung thì vẽ y như một thẻ `<p>` bình thường.
 */
export function InvitationCoverGreeting(props: ComponentProps<"p">) {
  const guest = useInvitationGuest();
  if (guest) return null;
  return <p {...props} />;
}

/**
 * Khối lời mời riêng trên màn bìa — chỉ có ở link mời riêng:
 *
 *   TRÂN TRỌNG KÍNH MỜI:
 *   Anh Hoàng Dương
 *   ────────────────
 *
 * Nhãn in hoa **luôn** bằng Cormorant; tên khách **luôn** bằng UVN Hoa Tay ở
 * mọi mẫu — nét viết tay như tên được điền bằng bút lên thiệp giấy, nên nó
 * không đi theo font trang trí của từng mẫu (một phần ba kho mẫu không có chữ
 * viết tay nào). Kẻ một đường mảnh dưới tên như dòng điền tên. Màu đi theo
 * `currentColor` nên tự khớp màu chữ của từng mẫu.
 *
 * Luật bố cục của mọi mẫu: đặt **ngay trên** tên cô dâu chú rể, và lời chào
 * chung thì bọc bằng `InvitationCoverGreeting` để nó ẩn đi. Link chung thì
 * component này không vẽ gì, bố cục mặc định của mẫu không đổi một điểm ảnh.
 *
 * Là client component riêng thay vì để mẫu tự gọi hook: bìa của vài mẫu (như
 * `classic`) là server component, còn cách này đặt được ở bất kỳ đâu. Mẫu cần
 * chỉnh thì truyền `className` từ CSS Module của chính nó.
 */
export function InvitationGuestGreeting({ className, as = "div" }: { className?: string; as?: "div" | "span" }) {
  const label = useInvitationGuestGreeting();
  const guest = useInvitationGuest();
  if (!guest) return null;
  const Root = as;
  const Line = as === "span" ? "span" : "p";

  return (
    <Root
      data-invitation-guest
      className={cn(
        // Biến font gắn ngay trên khối: `TemplateTypography` chỉ nạp font mà
        // chính mẫu khai, nên ở mẫu không dùng Cormorant hay Hoa Tay thì hai
        // biến đó không tồn tại trong cây DOM.
        cormorant.variable,
        uvnHoaTay.variable,
        "mx-auto grid w-full max-w-[20rem] justify-items-center gap-1 text-center",
        className,
      )}
    >
      {label ? (
        <Line
          className="m-0 text-(length:--tpl-caption) leading-snug tracking-[0.08em] uppercase"
          // Inline cùng lý do với tên khách bên dưới: CSS Module của mẫu khai
          // `font-family` cho `p` trong thẻ bìa với độ ưu tiên cao hơn utility.
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          {label}
        </Line>
      ) : null}
      {/* Cặp cỡ chữ đã chốt: nhãn ở đáy thang (`--tpl-caption`, 14px) thì tên
          đi với `--tpl-lead` (20px) — đủ tách vai nhãn/tên mà không tranh sự
          chú ý với tên cô dâu chú rể ngay bên dưới, và không đẩy nút "Mở thiệp"
          xuống dưới mép màn hình ở thẻ bìa khung cố định. */}
      {/* Không đệm dưới và dòng thấp (1.1): UVN Hoa Tay có khoảng trống trên
          dưới chữ rất lớn, để `leading-snug` cộng đệm là đường kẻ trôi xa khỏi
          tên. Nét chữ vượt khỏi chiều cao dòng vẫn vẽ ra, không bị cắt. */}
      <Line className="m-0 w-full border-b border-current/40 pb-0 text-(length:--tpl-lead) leading-[1.1] font-normal [overflow-wrap:anywhere]"
        // Inline chứ không phải class: CSS Module của nhiều mẫu khai
        // `font-family` cho mọi `p` trong thẻ bìa với độ ưu tiên cao hơn một
        // utility, và tên khách phải là Hoa Tay ở **mọi** mẫu.
        style={{ fontFamily: "var(--font-uvn-hoa-tay), cursive" }}
      >
        {guest.name}
      </Line>
    </Root>
  );
}
