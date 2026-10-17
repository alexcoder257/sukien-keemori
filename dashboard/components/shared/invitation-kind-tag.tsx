import {
  Cake,
  CalendarDays,
  Gift,
  GraduationCap,
  Heart,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InvitationKind } from "@/constants/invitation-kind";

/**
 * Biểu tượng của từng loại — cùng hình với bước chọn loại và nhãn ở trang khách
 * (`frontend/components/shared/invitation-kind-badge.tsx`), để người vận hành
 * đọc một tấm thiệp ra cùng một loại như khách thấy.
 */
const KIND_ICONS: Record<InvitationKind, LucideIcon> = {
  wedding: Heart,
  birthday: Cake,
  graduation: GraduationCap,
  event: CalendarDays,
  anniversary: Sparkles,
  greeting: Gift,
};

/**
 * Tag loại thiệp. Tag mặc định không màu: preset antd trong CMS đã mang nghĩa
 * (vàng/tím là gói, xanh lá là đã thanh toán, đỏ là lỗi), gán sáu màu nữa cho
 * sáu loại là để mắt đọc nhầm loại thành trạng thái. Phân biệt bằng biểu tượng.
 */
export function InvitationKindTag({
  kind,
  label,
}: {
  kind: InvitationKind;
  label: string;
}) {
  const Icon = KIND_ICONS[kind];
  return (
    <Badge variant="outline" size="sm" className="inline-flex items-center gap-1">
      <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
      {label}
    </Badge>
  );
}
