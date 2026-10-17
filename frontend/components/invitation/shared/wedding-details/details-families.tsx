import { cn } from "@/lib/utils";
import type { DetailsVariant } from "@/components/invitation/shared/details-presets";
import { DetailsSide } from "./details-side";
import type { DetailsFamilySide } from "./wedding-details.types";

/**
 * Hai gia đình.
 *
 * **Flex-wrap, không phải lưới hai cột** — đây là điểm mấu chốt. Lưới
 * `minmax(0, 1fr)` cho phép bóp cột xuống tận 0, nên tên dài hơn nửa bề rộng thì
 * chữ phải nhường: tên bị bẻ đôi, hoặc tiền tố "Ông" bị bỏ lại một mình. Flex
 * item mặc định `min-width: auto`, tức **không co xuống dưới bề rộng nội dung
 * không ngắt được**; hết chỗ thì cả nhà thứ hai xuống hàng nguyên khối.
 *
 * Nhờ vậy quyết định "hai cột hay một cột" do **độ dài tên thật** định đoạt,
 * không phải một ngưỡng `@container` đoán trước. Không có ngưỡng nào để chỉnh
 * sai, và không tên nào bị bẻ đôi.
 */
export function DetailsFamilies({
  sides,
  variant,
  className,
}: {
  sides: DetailsFamilySide[];
  variant: DetailsVariant;
  className?: string;
}) {
  if (sides.length === 0) return null;
  return (
    <div
      data-details-part="families"
      className={cn(
        "flex w-full max-w-[34em] flex-wrap justify-center",
        variant === "formal"
          ? "gap-[var(--details-space-xs)]"
          : "gap-[var(--details-space-sm)]",
        className,
      )}
    >
      {sides.map((side) => (
        <DetailsSide key={side.key} side={side} variant={variant} />
      ))}
    </div>
  );
}
