"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useWeddingOpening } from "@/hooks/use-wedding-opening";
import { OPENING_VARIANTS } from "@/components/invitation/shared/opening-presets";
import { OpeningCover } from "@/components/invitation/shared/wedding-opening/opening-cover";
import { useInvitationGuestGreeting } from "@/components/invitation/shared/invitation-guest-context";
import type { WeddingOpeningProps } from "@/components/invitation/shared/wedding-opening/wedding-opening.types";
import motionStyles from "./wedding-opening/opening-motion.module.css";

export type {
  WeddingOpeningProps,
  WeddingOpeningData,
  WeddingOpeningMotion,
  OpeningClassNames,
} from "@/components/invitation/shared/wedding-opening/wedding-opening.types";
export type {
  OpeningDecor,
  OpeningPalette,
  OpeningMotif,
  OpeningVariant,
} from "@/components/invitation/shared/opening-presets";
export type {
  OpeningTypography,
  OpeningFontCombo,
  OpeningTextRegion,
  OpeningFontValue,
} from "@/components/invitation/shared/opening-typography";

/** OpeningCover (design) + invitation content. Lifecycle lives in useWeddingOpening. */
export function WeddingOpening({
  enabled,
  contained = false,
  durationMs = 1100,
  motion,
  coverClassName,
  contentClassName,
  renderOutside,
  children,
  ...design
}: WeddingOpeningProps) {
  const { phase, opened, contentRef, openInvitation } = useWeddingOpening({
    enabled,
    contained,
    durationMs,
  });
  const transition = motion ?? OPENING_VARIANTS.find((item) => item.id === design.variant)!.motion;
  const style = { "--invitation-opening-duration": `${durationMs}ms` } as CSSProperties;
  // Lời chào riêng của link khách mời thành một dòng **thêm** trên tên cô dâu
  // chú rể; nhãn lời mời chung vẫn đứng dưới tên — xem `invitation-guest-context`.
  const guestGreeting = useInvitationGuestGreeting();
  const data = { ...design.data, guestGreeting };

  return (
    <>
      {phase !== "open" && (
        <div
          data-opening-part="overlay"
          data-opening-phase={phase}
          data-opening-motion={transition}
          data-lenis-prevent-horizontal
          inert={phase === "opening" || undefined}
          style={style}
          className={cn(
            "absolute top-0 left-0 isolate z-50 grid w-full content-stretch overflow-x-clip overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            contained ? "min-h-full" : "min-h-svh",
            motionStyles.cover,
            coverClassName,
          )}
        >
          <OpeningCover {...design} data={data} isOpening={phase === "opening"} onOpen={openInvitation} />
        </div>
      )}
      <div
        ref={contentRef}
        tabIndex={-1}
        data-opening-part="content"
        data-opening-phase={phase}
        aria-hidden={!opened || undefined}
        inert={!opened || undefined}
        style={style}
        className={cn(
          contained ? "min-h-full" : "min-h-svh",
          phase === "closed" && "min-h-0 overflow-hidden opacity-0",
          phase === "closed" && (contained ? "h-full" : "h-svh"),
          motionStyles.content,
          contentClassName,
        )}
      >
        {children}
      </div>
      {renderOutside?.({ opened })}
    </>
  );
}
