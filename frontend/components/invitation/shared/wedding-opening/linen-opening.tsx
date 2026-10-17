import { cn } from "@/lib/utils";
import { OpeningArtwork } from "@/components/invitation/shared/opening-artwork";
import { OpeningPaper } from "./opening-paper";
import {
  OpeningNames,
  OpeningInvitation,
  OpeningDate,
  OpeningHeading,
} from "./opening-text";
import { InvitationGuestGreeting } from "@/components/invitation/shared/invitation-guest-greeting";
import { OpeningCorners, OpeningDivider } from "./opening-decor";
import { OpeningSeal } from "./opening-seal";
import { OpeningButton } from "./opening-button";
import type { OpeningLayoutProps } from "./wedding-opening.types";
import motion from "./opening-motion.module.css";

export function LinenOpening({
  variant,
  data,
  decor,
  customDecor,
  classNames,
  isOpening,
  onOpen,
}: OpeningLayoutProps) {
  const vellum = variant === "linen-vellum";
  const pressed = variant === "linen-pressed";
  return (
    <OpeningPaper
      className={cn(
        "min-h-[660px] max-w-[520px] items-start px-9 pt-12 text-left @max-[421px]:min-h-[650px] @max-[421px]:p-6 @max-[421px]:pt-8",
        pressed &&
          "items-center border-10 border-[var(--opening-paper)] text-center outline outline-[color-mix(in_srgb,var(--opening-accent)_25%,transparent)]",
        classNames?.paper,
      )}
    >
      <OpeningCorners motif={decor?.corner ?? "none"} custom={customDecor?.corner} />
      {!pressed && (
        <div
          data-opening-part="fold"
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 right-0 left-[68%] -z-1 origin-right border-l border-[color-mix(in_srgb,var(--opening-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--opening-paper)_75%,transparent)] shadow-[-8px_0_14px_var(--opening-shadow)]",
            vellum &&
              "pointer-events-none left-[48%] z-2 bg-[color-mix(in_srgb,var(--opening-paper)_42%,transparent)] shadow-[-1px_0_12px_var(--opening-shadow)]",
            isOpening && motion.gateRight,
          )}
        />
      )}
      <div
        data-opening-part="flowers"
        data-opening-decor
        className={cn(
          "pointer-events-none absolute -right-1 bottom-[90px] z-1 w-[44%]",
          vellum && "right-0 bottom-[70px] w-[55%]",
          pressed && "right-[3%] bottom-20 w-[36%] rotate-12 opacity-60",
        )}
      >
        {customDecor?.flowersRight === undefined ? (
          <OpeningArtwork asset="orchid-cascade" tone="botanical" />
        ) : customDecor.flowersRight}
      </div>
      <div
        className={cn(
          "absolute right-[calc(32%-45px)] bottom-[188px] z-3 rotate-10",
          vellum && "right-[calc(52%-45px)]",
          pressed && "relative right-auto bottom-auto order-2 mt-4",
        )}
      >
        <OpeningSeal className={classNames?.seal}>{customDecor?.seal}</OpeningSeal>
      </div>
      <div
        data-opening-part="copy"
        data-opening-copy
        className={cn(
          "relative z-2 grid w-[74%] gap-6 @max-[421px]:w-[78%]",
          pressed && "w-full @max-[421px]:w-full",
        )}
      >
        <OpeningHeading labels={data.labels} />
        <InvitationGuestGreeting />
        <OpeningNames names={data.coupleNames} inline className={classNames?.names} />
        {/* Link riêng đã có khối "Trân trọng kính mời: <tên>" trên tên — lời chào chung ẩn. */}
        {data.guestGreeting ? null : (
          <OpeningInvitation className={classNames?.invitation}>
            {data.labels.invitation}
          </OpeningInvitation>
        )}
        <OpeningDivider motif={decor?.divider} custom={customDecor?.divider} />
        <OpeningDate className={classNames?.date}>
          {data.dateLabel}
        </OpeningDate>
      </div>
      <OpeningButton
        labels={data.labels}
        isOpening={isOpening}
        onOpen={onOpen}
        className={cn("mt-auto self-center", pressed && "order-3", classNames?.action)}
      />
    </OpeningPaper>
  );
}
