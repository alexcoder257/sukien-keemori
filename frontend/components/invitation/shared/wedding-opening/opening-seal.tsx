import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { OpeningArtwork } from "@/components/invitation/shared/opening-artwork";

export function OpeningSeal({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <span
      data-opening-part="seal"
      data-opening-emblem
      aria-hidden="true"
      className={cn(
        "relative block aspect-square w-[90px] [filter:drop-shadow(0_4px_4px_var(--opening-shadow))] @max-[421px]:w-20",
        className,
      )}
    >
      {children === undefined ? <OpeningArtwork asset="wax-seal" tone="seal" /> : children}
    </span>
  );
}
