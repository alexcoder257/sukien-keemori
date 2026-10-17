import { cn } from "@/lib/utils";
import type { DetailsVariant } from "@/components/invitation/shared/details-presets";
import type { DetailsFamilySide } from "./wedding-details.types";
import styles from "./wedding-details.module.css";

/**
 * Một nhà — nhãn, tên bố mẹ, địa chỉ.
 *
 * Là **flex item** của `DetailsFamilies`, và bề rộng nội dung của nó chính là
 * thứ quyết định hai nhà đứng cạnh nhau hay xuống hàng: flex item mặc định
 * `min-width: auto` nên không co xuống dưới bề rộng nội dung không ngắt được.
 */
export function DetailsSide({
  side,
  variant,
  className,
}: {
  side: DetailsFamilySide;
  variant: DetailsVariant;
  className?: string;
}) {
  const formal = variant === "formal";
  return (
    <div
      data-details-part="side"
      className={cn(
        "relative grid flex-[1_1_40%] content-start gap-1",
        formal && `px-[var(--details-space-sm)] ${styles.formalSide}`,
        className,
      )}
    >
      <p
        data-details-text="sideLabel"
        className={cn(
          "m-0 uppercase [font-family:var(--details-font-side-label,inherit)]",
          formal
            ? "mb-[var(--details-space-2xs)] text-(length:--tpl-caption) tracking-[0.16em] text-[var(--details-muted,currentColor)]"
            : "text-(length:--tpl-small) font-bold tracking-[0.1em]",
          variant === "modern" &&
            "text-(length:--tpl-h4) tracking-normal normal-case",
        )}
      >
        {side.label}
      </p>
      {side.parents.map((parent) => (
        <DetailsParentName key={parent} formal={formal}>
          {parent}
        </DetailsParentName>
      ))}
      {side.address ? (
        <p
          data-details-text="sideAddress"
          className={cn(
            "m-0 text-(length:--tpl-caption) text-[var(--details-faint,currentColor)] [font-family:var(--details-font-parent-name,inherit)]",
            formal && "mt-[var(--details-space-2xs)]",
          )}
        >
          {side.address}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Một dòng "Ông <tên>".
 *
 * `whitespace-nowrap` cho **cả dòng** kể cả tiền tố: giữ mỗi tên liền khối mà
 * vẫn cho ngắt sau "Ông" thì được một dòng chỉ có chữ "Ông" — xấu hơn cả bẻ
 * tên. Cả dòng không ngắt biến nó thành đơn vị đo của flex ở `DetailsFamilies`,
 * nên chỗ nhường lại là bố cục chứ không phải chữ.
 */
function DetailsParentName({
  children,
  formal,
}: {
  children: string;
  formal: boolean;
}) {
  return (
    <p
      data-details-text="parentName"
      className={cn(
        "m-0 text-(length:--tpl-small) leading-[1.5] whitespace-nowrap [font-family:var(--details-font-parent-name,inherit)]",
        formal && "leading-[1.45] font-bold",
      )}
    >
      {children}
    </p>
  );
}
