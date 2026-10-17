import type { CSSProperties } from "react";
import {
  CEREMONIES_FONT_COMBOS,
  CEREMONIES_FONTS,
  ceremoniesTypography,
} from "@/components/invitation/shared/ceremonies-typography";
import type {
  CeremoniesFontCombo,
  CeremoniesFontValue,
} from "@/components/invitation/shared/ceremonies-typography";

export const TIMELINE_FONTS = CEREMONIES_FONTS;
export const TIMELINE_TEXT_REGIONS = ["title", "time", "activity"] as const;
export type TimelineTextRegion = (typeof TIMELINE_TEXT_REGIONS)[number];
export type TimelineFontValue = CeremoniesFontValue;
export type TimelineFontCombo = CeremoniesFontCombo;
export const TIMELINE_FONT_COMBOS = Object.fromEntries(
  Object.entries(CEREMONIES_FONT_COMBOS).map(([id, fonts]) => [
    id,
    {
      title: fonts.title,
      time: fonts.time,
      activity: fonts.venue,
    },
  ]),
) as Record<TimelineFontCombo, Record<TimelineTextRegion, TimelineFontValue>>;
export type TimelineTypography = {
  combo?: TimelineFontCombo;
  regions?: Partial<Record<TimelineTextRegion, TimelineFontValue>>;
};

/** Share registered fonts with ceremonies; expose only timeline's own text regions/tokens. */
export function timelineTypography(typography?: TimelineTypography) {
  const fonts = {
    ...(typography?.combo ? TIMELINE_FONT_COMBOS[typography.combo] : {}),
  };
  for (const region of TIMELINE_TEXT_REGIONS) {
    const override = typography?.regions?.[region]?.trim();
    if (override) fonts[region] = override;
  }
  const resolved = ceremoniesTypography({
    regions: {
      title: fonts.title,
      time: fonts.time,
      name: fonts.activity,
    },
  });
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(resolved.style)) {
    style[
      key
        .replace("--ceremony-font-", "--timeline-font-")
        .replace("-name", "-activity")
    ] = String(value);
  }
  return { className: resolved.className, style: style as CSSProperties };
}
