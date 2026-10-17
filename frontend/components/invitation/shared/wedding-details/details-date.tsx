import { cn } from "@/lib/utils";
import type { DetailsVariant } from "@/components/invitation/shared/details-presets";
import type { WeddingDetailsData } from "./wedding-details.types";
import styles from "./wedding-details.module.css";

/**
 * Dải ngày. Ba bố cục dùng chung **một cây DOM** — tháng → số → năm — và chỉ
 * khác nhau ở cách xếp chỗ. Nếu mỗi bố cục dựng một cây riêng thì ba chỗ cùng
 * phải biết cách ghép ngày, và đó là chỗ sai lệch bắt đầu.
 *
 * Cỡ số ngày có **hai mẫu tham chiếu mâu thuẫn nhau**: `font-1`/`font-2` trong
 * `docs/shares/combo-font/` cho tỉ lệ số/đơn vị 3,5–3,7 lần, còn mẫu thiệp thật
 * gọn hơn cho 1,95 lần. Bản được chọn là mẫu thứ hai — ở tỉ lệ 3,5 lần con số
 * nuốt mất dải ngày, và hairline của Cormorant giãn to lên thì mảnh đến mức
 * trông xộc xệch chứ không sang. `font-weight: 500` là nửa còn lại của việc đó:
 * Cormorant SC ở weight 400 và cỡ lớn có nét thanh gần như biến mất.
 */
export function DetailsDate({
  date,
  variant,
  className,
}: {
  date: NonNullable<WeddingDetailsData["date"]>;
  variant: DetailsVariant;
  className?: string;
}) {
  const unit = "[font-family:var(--details-font-date-unit,inherit)]";
  const number = cn(
    "font-normal text-[var(--details-accent,currentColor)] [font-family:var(--details-font-date-number,inherit)]",
    variant === "classic" && "text-(length:--tpl-h1) leading-none font-medium",
    variant === "formal" &&
      "col-start-1 row-span-2 row-start-1 border-e border-[var(--details-rule,currentColor)] pe-[var(--details-space-sm)] text-(length:--tpl-h1)",
    variant === "modern" && "text-(length:--tpl-h1) leading-[0.8]",
  );

  return (
    <p
      data-details-part="date"
      className={cn(
        "m-0 grid items-center justify-items-center",
        styles.dateRow,
        variant === "classic" &&
          "w-full max-w-[30em] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-[0.6em]",
        variant === "formal" &&
          "w-auto grid-cols-[auto_auto] justify-center gap-x-[var(--details-space-sm)]",
        variant === "modern" &&
          "w-full max-w-[30em] grid-cols-3 border-y border-[var(--details-rule,currentColor)] py-[0.5em]",
        className,
      )}
    >
      <span
        data-details-text="dateUnit"
        className={cn(
          "tracking-[0.08em] whitespace-nowrap uppercase",
          unit,
          variant === "classic" && `text-(length:--tpl-lead) ${styles.classicUnit}`,
          /* Vị trí đặt tường minh: cây DOM là tháng → số → năm cho cả ba bố cục,
             nên ở đây phải kéo hai ô đơn vị về cùng một cột. */
          variant === "formal" && "col-start-2 row-start-1 justify-self-start text-(length:--tpl-lead)",
          variant === "modern" && `text-(length:--tpl-lead) px-[0.75em] ${styles.modernUnit}`,
        )}
      >
        {date.month}
      </span>
      <span data-details-text="dateNumber" className={number}>
        {date.day}
      </span>
      <span
        data-details-text="dateUnit"
        className={cn(
          "tracking-[0.08em] whitespace-nowrap uppercase",
          unit,
          variant === "classic" && `text-(length:--tpl-lead) ${styles.classicUnit}`,
          variant === "formal" &&
            "col-start-2 row-start-2 justify-self-start text-(length:--tpl-body) text-[var(--details-muted,currentColor)]",
          variant === "modern" && `text-(length:--tpl-lead) px-[0.75em] ${styles.modernUnit}`,
        )}
      >
        {date.year}
      </span>
    </p>
  );
}
