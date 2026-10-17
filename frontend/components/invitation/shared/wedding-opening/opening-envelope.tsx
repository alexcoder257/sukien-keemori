import { cn } from "@/lib/utils";
import { OpeningArtwork } from "@/components/invitation/shared/opening-artwork";
import type { OpeningVariant } from "@/components/invitation/shared/opening-presets";
import { OpeningSeal } from "./opening-seal";
import type {
  OpeningClassNames,
  OpeningDesignProps,
} from "./wedding-opening.types";
import materials from "./opening-materials.module.css";
import motion from "./opening-motion.module.css";

const generatedArtwork = {
  "envelope-botanical": "envelope-botanical-generated",
  "envelope-bouquet": "envelope-bouquet-generated",
  "envelope-ribbon": "envelope-ribbon-generated",
} as const;

const arrangements = {
  "envelope-botanical": {
    envelope: "w-[94%]",
    left: "top-[12%] -left-[13%] w-[48%]",
    right: "top-[-36%] -right-[11%] w-[48%]",
    seal: "top-[53%] left-1/2 -translate-x-1/2",
  },
  "envelope-bouquet": {
    envelope: "w-[94%]",
    left: "top-[-2%] left-[5%] w-[42%]",
    right: "hidden",
    seal: "top-[53%] left-[54%] -translate-x-1/2",
  },
  "envelope-ribbon": {
    envelope: "w-[94%]",
    left: "top-[-7%] left-[8%] w-[35%]",
    right: "hidden",
    seal: "top-[55%] left-[34%] -translate-x-1/2",
  },
};

type Props = {
  variant: Extract<OpeningVariant, `envelope-${string}`>;
  isOpening: boolean;
  classNames?: OpeningClassNames;
  customDecor?: OpeningDesignProps["customDecor"];
};

/** Closed envelope, seal and two flower placements. No couple photos. */
export function OpeningEnvelope({
  variant,
  isOpening,
  classNames,
  customDecor,
}: Props) {
  const arrangement = arrangements[variant];
  const botanical = variant === "envelope-botanical";
  const bouquet = variant === "envelope-bouquet";
  const ribbon = variant === "envelope-ribbon";
  // The generated envelope artwork is a complete composition (paper, flowers,
  // ribbon and seal). Template-level ornament overrides must not send the
  // shared variants back through the legacy layer-by-layer composition.
  // Supplying a complete custom envelope remains the explicit escape hatch.
  const hasCustomEnvelope = customDecor?.envelope !== undefined;
  const envelopeClassName = cn(
    "relative mt-[42px] mb-[68px] aspect-[1.5] @max-[421px]:mt-10",
    arrangement.envelope,
    classNames?.envelope,
  );

  if (!hasCustomEnvelope) {
    return (
      <div
        data-opening-part="envelope"
        aria-hidden="true"
        className={envelopeClassName}
      >
        <OpeningArtwork
          asset={generatedArtwork[variant]}
          tone="natural"
          className={cn(
            "absolute! inset-0 h-full w-full",
            isOpening && motion.envelope,
          )}
        />
      </div>
    );
  }

  return (
    <div
      data-opening-part="envelope"
      aria-hidden="true"
      className={envelopeClassName}
    >
      {customDecor?.envelope !== undefined ? (
        <div className={cn("absolute inset-0", isOpening && motion.envelope)}>
          {customDecor.envelope}
        </div>
      ) : (
        <OpeningArtwork
          asset="envelope-closed"
          tone="paper"
          className={cn(
            "absolute! inset-0 h-full w-full [clip-path:inset(10.5%_5.5%_11.7%_5.8%)]",
            isOpening && motion.envelope,
          )}
        />
      )}
      {customDecor?.ribbon !== undefined ? (
        customDecor.ribbon
      ) : bouquet ? (
        <>
          <div
            data-opening-part="ribbon"
            className={materials.bouquetRibbon}
          />
          <div data-opening-part="bow" className={materials.bouquetBow}>
            <svg viewBox="0 0 240 210" role="presentation">
              <defs>
                <linearGradient id="opening-bow-satin" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="currentColor" stopOpacity="0.72" />
                  <stop offset="0.25" stopColor="currentColor" />
                  <stop offset="0.48" stopColor="white" stopOpacity="0.24" />
                  <stop offset="0.68" stopColor="currentColor" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0.65" />
                </linearGradient>
              </defs>
              <path
                d="M118 70C88 28 27 18 10 46-7 76 37 106 111 83Z"
                fill="url(#opening-bow-satin)"
              />
              <path
                d="M122 70c30-42 91-52 108-24 17 30-27 60-101 37Z"
                fill="url(#opening-bow-satin)"
              />
              <path
                d="M108 82c-7 36-24 79-49 116l39-17 17 24 11-119Z"
                fill="url(#opening-bow-satin)"
              />
              <path
                d="M132 82c7 36 24 79 49 116l-39-17-17 24-11-119Z"
                fill="url(#opening-bow-satin)"
              />
              <path
                d="M105 66c8-8 22-8 30 0l-3 31c-8 7-16 7-24 0Z"
                fill="url(#opening-bow-satin)"
              />
              <path
                d="M18 49c31 13 60 20 94 24M222 49c-31 13-60 20-94 24M70 190c19-33 31-65 39-98M170 190c-19-33-31-65-39-98"
                fill="none"
                stroke="white"
                strokeOpacity="0.22"
                strokeWidth="3"
              />
            </svg>
          </div>
        </>
      ) : ribbon ? (
        <div data-opening-part="ribbon" className={materials.ribbonCords} />
      ) : null}
      <div
        className={cn(
          "absolute z-6 w-[22%]",
          arrangement.seal,
          ribbon && "w-[20%]",
          // Phong bì riêng của mẫu có nắp ở chỗ khác phong bì dựng sẵn, nên
          // mẫu được dời con dấu mà không đụng vị trí chung của biến thể.
          classNames?.sealSlot,
        )}
      >
        <OpeningSeal
          className={cn("w-full @max-[421px]:w-full", classNames?.seal)}
        >
          {customDecor?.seal}
        </OpeningSeal>
      </div>
      <div
        data-opening-part="flowers-left"
        data-opening-decor
        className={cn(
          "pointer-events-none absolute z-4 -rotate-8",
          bouquet && "z-5",
          arrangement.left,
        )}
      >
        {customDecor?.flowersLeft !== undefined ? (
          customDecor.flowersLeft
        ) : (
          <OpeningArtwork
            asset={ribbon ? "orchid-cascade" : "orchid-hydrangea"}
            tone="botanical"
          />
        )}
      </div>
      {(botanical || customDecor?.flowersRight !== undefined) && (
        <div
          data-opening-part="flowers-right"
          data-opening-decor
          className={cn(
            "pointer-events-none absolute z-4 rotate-5",
            arrangement.right,
          )}
        >
          {customDecor?.flowersRight !== undefined ? (
            customDecor.flowersRight
          ) : (
            <OpeningArtwork asset="orchid-cascade" tone="botanical" />
          )}
        </div>
      )}
    </div>
  );
}
