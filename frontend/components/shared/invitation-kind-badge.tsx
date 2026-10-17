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
import type { InvitationKind } from "@/constants/invitation";
import { cn } from "@/lib/utils";

/**
 * Biểu tượng theo nghĩa của loại, khoá theo loại chứ không theo vị trí. Một
 * nguồn cho mọi nơi vẽ loại thiệp (bước chọn loại, nhãn trên thiệp đã tạo,
 * đầu form editor) để cùng một loại luôn mang cùng một hình.
 */
export const INVITATION_KIND_ICONS: Record<InvitationKind, LucideIcon> = {
  wedding: Heart,
  birthday: Cake,
  graduation: GraduationCap,
  event: CalendarDays,
  anniversary: Sparkles,
  greeting: Gift,
};

/**
 * Nhãn loại của một thiệp đã tạo. Viền mảnh, chữ thường. Phân biệt bằng biểu tượng chứ không bằng màu: mỗi loại một
 * hue là sáu màu mới ngoài bảng 7 màu thương hiệu.
 */
export function InvitationKindBadge({
  kind,
  label,
  className,
}: {
  kind: InvitationKind;
  label: string;
  className?: string;
}) {
  const Icon = INVITATION_KIND_ICONS[kind];
  return (
    <Badge variant="outline" size="sm" className={cn("gap-1.5", className)}>
      <Icon aria-hidden strokeWidth={1.5} />
      {label}
    </Badge>
  );
}
