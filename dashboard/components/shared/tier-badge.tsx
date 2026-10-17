import { Badge } from "@/components/ui/badge";
import type { Tier } from "@/constants/tier";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Nhãn cấp thiết kế của **mẫu** thiệp (Free · Gold · Diamond). Không phải gói
 * của thiệp: site chỉ bán một gói thiệp custom.
 */
export function TierBadge({
  tier,
  dict,
  size = "sm",
  className,
}: {
  tier: Tier;
  dict: Dictionary["common"]["tier"];
  size?: "xs" | "sm" | "default";
  /** Chỉnh lại màu khi badge nằm trên bề mặt đảo tông (ví dụ thẻ giá nền tối). */
  className?: string;
}) {
  return (
    <Badge variant={tier} size={size} className={className}>
      {dict[tier]}
    </Badge>
  );
}
