import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { OpeningArtwork } from "@/components/invitation/shared/opening-artwork";

/** Paper surface and texture. Each concept supplies its own layout classes. */
export function OpeningPaper({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <article
      data-opening-part="paper"
      data-opening-surface
      className={cn(
        "relative isolate flex w-full max-w-[620px] flex-col items-center gap-6 overflow-hidden bg-[var(--opening-paper)] px-8 pt-10 pb-8 text-center shadow-[0_24px_70px_var(--opening-shadow)]",
        "@max-[421px]:gap-5 @max-[421px]:px-[22px] @max-[421px]:pt-8 @max-[421px]:pb-7",
        className,
      )}
    >
      <OpeningArtwork
        asset="cotton-paper"
        tone="paper"
        className="absolute! inset-0 -z-2 h-full w-full opacity-18 [&_img]:object-cover"
      />
      {children}
    </article>
  );
}
