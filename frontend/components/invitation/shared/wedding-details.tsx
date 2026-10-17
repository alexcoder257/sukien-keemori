import { cn } from "@/lib/utils";
import { DetailsSurface } from "@/components/invitation/shared/wedding-details/details-surface";
import type { WeddingDetailsProps } from "@/components/invitation/shared/wedding-details/wedding-details.types";

export type {
  WeddingDetailsProps,
  WeddingDetailsData,
  DetailsFamilySide,
  DetailsClassNames,
} from "@/components/invitation/shared/wedding-details/wedding-details.types";
export type {
  DetailsVariant,
  DetailsPalette,
} from "@/components/invitation/shared/details-presets";
export {
  DETAILS_VARIANTS,
  detailsColorStyle,
  weddingDetailsData,
} from "@/components/invitation/shared/details-presets";
export type {
  DetailsTypography,
  DetailsFontCombo,
  DetailsTextRegion,
  DetailsFontValue,
} from "@/components/invitation/shared/details-typography";

/**
 * Khối "thông tin lễ cưới" — hai gia đình, tên cặp đôi, giờ, ngày, nơi tổ chức
 * và nút chỉ đường. Đây là phần **mọi** tấm thiệp đều có, và là phần bốn ảnh
 * trong `docs/shares/combo-font/` cùng vẽ, chỉ khác cách bày.
 *
 * Ba trục tách rời nhau, và đó là toàn bộ ý tưởng của component:
 *
 * - **Bố cục** (`variant`) — ba cách bày, xem `DETAILS_VARIANTS`.
 * - **Font** (`typography`) — combo đặt nền, từng vùng chữ đè lên được.
 * - **Màu** (`colors`) — năm vai; bỏ trống thì mọi thứ theo `currentColor`, nên
 *   một mẫu chưa khai màu vẫn ra đúng tông của khối bao quanh.
 *
 * Đổi bố cục không kéo theo đổi font, và một mẫu dùng lại bố cục của mẫu khác
 * vẫn giữ nguyên bảng màu của mình.
 *
 * Nội dung vào bằng `data` — chuỗi đã dựng sẵn, không phải `content` thô — nên
 * khối vẽ được cả thumbnail và trang demo mà không cần một `InvitationContent`
 * giả. `weddingDetailsData()` lo phần dựng đó.
 */
export function WeddingDetails({ className, ...design }: WeddingDetailsProps) {
  return (
    <section data-details-root data-block-typography className={cn("w-full", className)}>
      <DetailsSurface {...design} />
    </section>
  );
}
