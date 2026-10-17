import { cn } from "@/lib/utils";
import { CeremoniesSurface } from "@/components/invitation/shared/wedding-ceremonies/ceremonies-surface";
import type { WeddingCeremoniesProps } from "@/components/invitation/shared/wedding-ceremonies/wedding-ceremonies.types";

export type {
  WeddingCeremoniesProps,
  WeddingCeremoniesData,
  WeddingCeremonyItem,
  CeremoniesClassNames,
} from "@/components/invitation/shared/wedding-ceremonies/wedding-ceremonies.types";
export type {
  CeremoniesVariant,
  CeremoniesPalette,
} from "@/components/invitation/shared/ceremonies-presets";
export {
  CEREMONIES_VARIANTS,
  ceremoniesColorStyle,
  weddingCeremoniesData,
} from "@/components/invitation/shared/ceremonies-presets";
export type {
  CeremoniesTypography,
  CeremoniesFontCombo,
  CeremoniesTextRegion,
  CeremoniesFontValue,
} from "@/components/invitation/shared/ceremonies-typography";

/**
 * Khối **nghi lễ** — một thiệp hỗ trợ nhiều nghi lễ, mỗi nghi lễ có tên, giờ,
 * địa điểm và ghi chú riêng.
 *
 * Cùng ba trục tách rời như `WeddingDetails`:
 *
 * - **Bố cục** (`variant`) — `stack`, `timeline`, `card`; xem `CEREMONIES_VARIANTS`.
 * - **Font** (`typography`) — combo đặt nền, từng vùng chữ đè lên được. Tên combo
 *   trùng với bên details để một mẫu chọn cùng id cho cả hai khối.
 * - **Màu** (`colors`) — sáu vai; bỏ trống thì mọi thứ theo `currentColor`.
 *
 * Trả về `null` khi không có nghi lễ nào đã nhập: schema bắt buộc mảng có ít
 * nhất một phần tử, nên thiệp mới tạo luôn mang sẵn một nghi lễ rỗng.
 */
export function WeddingCeremonies({
  className,
  ...design
}: WeddingCeremoniesProps) {
  if (design.data.items.length === 0) return null;
  return (
    <section data-ceremonies-root data-block-typography className={cn("w-full", className)}>
      <CeremoniesSurface {...design} />
    </section>
  );
}
