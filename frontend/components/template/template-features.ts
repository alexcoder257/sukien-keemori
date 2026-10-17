import {
  CalendarClock,
  CircleCheck,
  Images,
  Languages,
  Link2,
  MapPin,
  MessageSquareHeart,
  Music4,
  PenLine,
  QrCode,
  Share2,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { WeddingTemplate } from "@/lib/data/templates";

type Feature = { icon: LucideIcon; label: string };

/**
 * Danh sách tính năng của một mẫu — dùng chung cho hộp thoại kho mẫu và trang
 * giới thiệu mẫu. Mọi thiệp có đủ tính năng (một gói duy nhất), nên danh sách
 * chỉ đổi theo **loại** thiệp: "nhiều lễ trong một thiệp" chỉ thiệp cưới có.
 */
export function templateFeatures(
  template: Pick<WeddingTemplate, "kind">,
  features: Dictionary["templates"]["detail"]["features"],
  photosLabel: string,
): Feature[] {
  return [
    { icon: PenLine, label: features.content },
    { icon: Images, label: photosLabel },
    { icon: Link2, label: features.guestLinks },
    { icon: CircleCheck, label: features.rsvp },
    { icon: MessageSquareHeart, label: features.wishes },
    ...(template.kind === "wedding"
      ? [{ icon: CalendarClock, label: features.ceremonies }]
      : []),
    { icon: MapPin, label: features.maps },
    { icon: CalendarClock, label: features.countdown },
    { icon: QrCode, label: features.gift },
    { icon: Music4, label: features.music },
    { icon: Share2, label: features.share },
    { icon: Languages, label: features.locales },
  ];
}
