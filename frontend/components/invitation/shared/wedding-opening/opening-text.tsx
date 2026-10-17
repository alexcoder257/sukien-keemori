import { cn } from "@/lib/utils";
import type { WeddingOpeningData } from "./wedding-opening.types";

type NamesProps = {
  names: WeddingOpeningData["coupleNames"];
  inline?: boolean;
  className?: string;
};

export function OpeningNames({ names, inline = false, className }: NamesProps) {
  return (
    <h2
      data-opening-part="names"
      className={cn(
        "m-0 grid gap-1.5 text-(length:--tpl-h2) leading-[1.25] font-normal [overflow-wrap:anywhere] [font-family:var(--template-font-display,Georgia,serif)]",
        inline && "block text-(length:--tpl-h4)",
        className,
      )}
    >
      <span
        data-opening-text="firstName"
        className="[font-family:var(--opening-font-first-name,inherit)] text-[length:calc(1em*var(--opening-font-first-name-scale,1))]"
      >
        {names[0]}
      </span>
      <em
        data-opening-text="ampersand"
        className={cn(
          "text-(length:--tpl-h4) font-normal [font-family:var(--opening-font-ampersand,var(--template-font-accent,Georgia,serif))]",
          inline && "mx-2",
        )}
      >
        {" "}
        &{" "}
      </em>
      <span
        data-opening-text="secondName"
        className="[font-family:var(--opening-font-second-name,inherit)] text-[length:calc(1em*var(--opening-font-second-name-scale,1))]"
      >
        {names[1]}
      </span>
    </h2>
  );
}

export function OpeningInvitation({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      data-opening-text="invitation"
      className={cn(
        "m-0 text-(length:--tpl-caption) leading-normal tracking-[0.15em] uppercase [font-family:var(--opening-font-invitation,var(--template-font-body,Georgia,serif))]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function OpeningDate({ children, className }: { children: string; className?: string }) {
  return (
    <p
      data-opening-text="date"
      data-opening-copy
      className={cn(
        // Cỡ `small` (16px) chứ không phải `h4`: ngày cưới đứng ngay trên nút mở
        // thiệp, mà màn mở phải nằm gọn trong một khung hình — cỡ h4 đẩy nút
        // xuống dưới mép trên điện thoại thấp. `font-normal` khai thẳng vì vài
        // bộ chữ mẫu nhận weight đậm từ gốc mẫu.
        "m-0 text-(length:--tpl-small) font-normal lining-nums tabular-nums tracking-[0.07em] [font-family:var(--opening-font-date,var(--template-font-display,Georgia,serif))]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function OpeningHeading({ labels }: { labels: WeddingOpeningData["labels"] }) {
  return (
    <h2
      data-opening-text="heading"
      className="m-0 grid text-(length:--tpl-h3) leading-[1.15] font-normal [font-family:var(--opening-font-heading,var(--template-font-display,Georgia,serif))]"
    >
      <span
        data-opening-text="headingAccent"
        className="text-(length:--tpl-display) leading-[1.4] [font-family:var(--opening-font-heading-accent,var(--template-font-accent,Georgia,serif))]"
      >
        {labels.save}
      </span>
      {labels.theDate}
    </h2>
  );
}
