import { cn } from "@/lib/utils";
import { OpeningPaper } from "./opening-paper";
import {
  OpeningNames,
  OpeningInvitation,
  OpeningDate,
} from "./opening-text";
import { nameInitial } from "@/components/invitation/shared/couple-name";
import { InvitationGuestGreeting } from "@/components/invitation/shared/invitation-guest-greeting";
import { OpeningCorners, OpeningDivider } from "./opening-decor";
import { OpeningSeal } from "./opening-seal";
import { OpeningButton } from "./opening-button";
import type { OpeningLayoutProps } from "./wedding-opening.types";
import motion from "./opening-motion.module.css";

export function CeremonyOpening({
  variant,
  data,
  decor,
  customDecor,
  classNames,
  isOpening,
  onOpen,
}: OpeningLayoutProps) {
  const arch = variant === "ceremony-arch";
  const gate = variant === "ceremony-gate";
  const customCorners = decor?.corner !== undefined || customDecor?.corner !== undefined;
  const initials =
    data.monogram ??
    data.coupleNames
      .map(nameInitial)
      .join(" · ");
  return (
    <OpeningPaper
      className={cn(
        arch && "max-w-[460px] rounded-[220px_220px_8px_8px] pt-16",
        gate && "border-y-[6px] border-[var(--opening-accent)] px-10 @max-[421px]:px-6",
        classNames?.paper,
      )}
    >
      <div
        data-opening-part="frame"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-3 -z-1 border border-[color-mix(in_srgb,var(--opening-accent)_55%,transparent)]",
          arch && "inset-4 rounded-[210px_210px_2px_2px] border-[3px] border-double",
          gate && "inset-x-6 inset-y-2.5",
        )}
      />
      <OpeningCorners
        motif={decor?.corner}
        custom={customDecor?.corner}
        hideStart={!customCorners && (arch || gate)}
        hideEnd={!customCorners && gate}
      />
      {gate && (
        <div data-opening-part="gates" aria-hidden="true" className="absolute inset-0 -z-1 flex">
          {["left", "right"].map((side) => (
            <span
              key={side}
              className={cn(
                "w-1/2 border border-[color-mix(in_srgb,var(--opening-accent)_25%,transparent)] bg-[repeating-linear-gradient(90deg,transparent_0_18px,color-mix(in_srgb,var(--opening-accent)_8%,transparent)_18px_19px)]",
                side === "left" ? "origin-left" : "origin-right",
                isOpening && (side === "left" ? motion.gateLeft : motion.gateRight),
              )}
            />
          ))}
        </div>
      )}
      <div data-opening-part="crest" className="flex flex-col items-center gap-3">
        <OpeningSeal className={classNames?.seal} />
        <span
          data-opening-text="monogram"
          className="text-(length:--tpl-caption) tracking-[0.16em] [font-family:var(--opening-font-monogram,var(--template-font-body,Georgia,serif))]"
        >
          {initials}
        </span>
      </div>
      <div data-opening-part="copy" data-opening-copy className="relative z-2 grid w-full gap-5">
        <InvitationGuestGreeting />
        <OpeningNames
          names={data.coupleNames}
          className={cn(
            arch && "[font-family:var(--template-font-accent,Georgia,serif)]",
            classNames?.names,
          )}
        />
        {/* Link riêng đã có khối "Trân trọng kính mời: <tên>" trên tên — lời chào chung ẩn. */}
        {data.guestGreeting ? null : (
          <OpeningInvitation className={classNames?.invitation}>
            {data.labels.invitation}
          </OpeningInvitation>
        )}
        <OpeningDivider motif={decor?.divider ?? "flower"} custom={customDecor?.divider} />
        <OpeningDate className={classNames?.date}>{data.dateLabel}</OpeningDate>
      </div>
      <OpeningButton
        labels={data.labels}
        isOpening={isOpening}
        onOpen={onOpen}
        className={classNames?.action}
      />
    </OpeningPaper>
  );
}
