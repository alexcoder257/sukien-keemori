"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  OPENING_PALETTES,
  OPENING_VARIANTS,
  openingColorStyle,
} from "@/components/invitation/shared/opening-presets";
import { openingTypography } from "@/components/invitation/shared/opening-typography";
import { OpeningAmbient } from "./opening-decor";
import { CeremonyOpening } from "./ceremony-opening";
import { EnvelopeOpening } from "./envelope-opening";
import { LinenOpening } from "./linen-opening";
import type { OpeningLayoutProps } from "./wedding-opening.types";

const layouts = { ceremony: CeremonyOpening, envelope: EnvelopeOpening, linen: LinenOpening };

/** Select one concept layout; thumbnails use this view without the lifecycle. */
export function OpeningCover(props: OpeningLayoutProps) {
  const { variant, colors, typography, classNames } = props;
  const concept = OPENING_VARIANTS.find((item) => item.id === variant)!.concept;
  const Layout = layouts[concept];
  const fonts = openingTypography(typography);
  return (
    <div
      data-opening-part="scene"
      data-concept={concept}
      data-variant={variant}
      data-state={props.isOpening ? "opening" : "closed"}
      className={cn(
        "relative isolate grid min-h-[inherit] w-full place-items-center overflow-clip px-6 py-8 @max-[421px]:px-4 @max-[421px]:py-6",
        "bg-[var(--opening-background)] text-[var(--opening-ink)] [font-family:var(--template-font-body,Georgia,serif)]",
        "motion-reduce:[&_*]:animate-none! motion-reduce:[&_*]:transition-none!",
        fonts.className,
        classNames?.scene,
      )}
      style={
        {
          ...openingColorStyle({ ...OPENING_PALETTES[concept], ...colors }),
          ...fonts.style,
          "--opening-shadow": "color-mix(in srgb, var(--opening-ink) 18%, transparent)",
        } as CSSProperties
      }
    >
      <OpeningAmbient motif={props.decor?.ambient} custom={props.customDecor?.ambient} />
      <Layout {...props} />
    </div>
  );
}
