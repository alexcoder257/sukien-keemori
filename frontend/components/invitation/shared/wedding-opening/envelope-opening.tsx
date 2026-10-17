import { cn } from "@/lib/utils";
import { OpeningPaper } from "./opening-paper";
import {
  OpeningNames,
  OpeningInvitation,
  OpeningDate,
} from "./opening-text";
import { InvitationGuestGreeting } from "@/components/invitation/shared/invitation-guest-greeting";
import { OpeningCorners, OpeningDivider } from "./opening-decor";
import { OpeningEnvelope } from "./opening-envelope";
import { OpeningButton } from "./opening-button";
import type { OpeningLayoutProps } from "./wedding-opening.types";
import materials from "./opening-materials.module.css";

/** Hoa Hẹn / Lá Thư / Dải Lụa: names → invitation → closed envelope → date → button. */
export function EnvelopeOpening({
  variant,
  data,
  decor,
  customDecor,
  classNames,
  isOpening,
  onOpen,
}: OpeningLayoutProps) {
  if (
    variant !== "envelope-botanical" &&
    variant !== "envelope-bouquet" &&
    variant !== "envelope-ribbon"
  )
    return null;
  return (
    <OpeningPaper
      className={cn(
        "min-h-[670px] gap-[22px] overflow-visible px-4 py-8 @max-[421px]:gap-[22px] @max-[421px]:px-4 @max-[421px]:py-8",
        materials.pearlescentPaper,
        classNames?.paper,
      )}
    >
      <OpeningCorners
        motif={decor?.corner ?? "none"}
        custom={customDecor?.corner}
      />
      <div
        data-opening-part="copy"
        data-opening-copy
        className="relative z-2 grid w-full gap-[18px]"
      >
        <InvitationGuestGreeting />
        <OpeningNames
          names={data.coupleNames}
          className={cn(
            "gap-0.5 leading-[1.18] [font-family:var(--template-font-accent,Georgia,serif)]",
            classNames?.names,
          )}
        />
        {/* Link riêng đã có khối "Trân trọng kính mời: <tên>" trên tên — lời chào chung ẩn. */}
        {data.guestGreeting ? null : (
          <OpeningInvitation className={classNames?.invitation}>
            {data.labels.invitation}
          </OpeningInvitation>
        )}
        <OpeningDivider motif={decor?.divider} custom={customDecor?.divider} />
      </div>
      <OpeningEnvelope
        variant={variant}
        isOpening={isOpening}
        classNames={classNames}
        customDecor={customDecor}
      />
      <OpeningDate className={cn("mt-auto", classNames?.date)}>
        {data.dateLabel}
      </OpeningDate>
      <OpeningButton
        labels={data.labels}
        isOpening={isOpening}
        onOpen={onOpen}
        className={classNames?.action}
      />
    </OpeningPaper>
  );
}
