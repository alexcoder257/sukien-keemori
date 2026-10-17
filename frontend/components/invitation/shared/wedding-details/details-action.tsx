import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeddingDetailsData } from "./wedding-details.types";

export function DetailsAction({
  action,
  className,
}: {
  action: NonNullable<WeddingDetailsData["action"]>;
  className?: string;
}) {
  return (
    <a
      data-details-part="action"
      href={action.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 text-(length:--tpl-small) tracking-[0.14em] uppercase no-underline transition-opacity hover:opacity-70 [font-family:var(--details-font-action,inherit)]",
        className,
      )}
    >
      {/* Đo bằng `em` để icon co giãn cùng thang `--tpl-*`, không phải khai lại cỡ. */}
      <MapPin aria-hidden className="size-[1.1em]" />
      {action.label}
    </a>
  );
}
