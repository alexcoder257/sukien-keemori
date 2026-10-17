import type { CSSProperties, ReactElement } from "react";
import type { TimelineItem } from "@/lib/schemas/invitation";
import type {
  TimelineImageDecor,
  WeddingTimelineData,
} from "@/components/invitation/shared/wedding-timeline/wedding-timeline.types";

export const TIMELINE_VARIANTS = [
  "horizontal",
  "vertical",
  "alternating",
] as const;
export type TimelineVariant = (typeof TIMELINE_VARIANTS)[number];
/** Design guidance, not a schema limit. Never discard items beyond this number. */
export const TIMELINE_RECOMMENDED_MAX_ITEMS = 5;
export type TimelinePalette = {
  ink: string;
  muted: string;
  accent: string;
  rule: string;
  surface: string;
};
export function timelineColorStyle(
  colors?: Partial<TimelinePalette>,
): CSSProperties {
  return Object.fromEntries(
    Object.entries(colors ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [`--timeline-${key}`, value]),
  ) as CSSProperties;
}

/** Select once for the whole timeline; each resolver only returns that media type. */
export type TimelineDecorSource =
  | {
      kind: "icon";
      resolve: (item: TimelineItem, index: number) => ReactElement;
    }
  | {
      kind: "image";
      resolve: (
        item: TimelineItem,
        index: number,
      ) => Omit<TimelineImageDecor, "kind">;
    };

/** Consume already-filtered invitationBlocks.timelineItems. Decor stays in the template. */
export function weddingTimelineData(
  items: readonly TimelineItem[],
  title: string,
  source: TimelineDecorSource,
): WeddingTimelineData {
  const content = (item: TimelineItem, index: number) => ({
    id: `timeline-${index}`,
    activity: item.activity,
    startTime: item.startTime.trim() || undefined,
    endTime: item.endTime.trim() || undefined,
  });
  if (source.kind === "icon")
    return {
      title,
      decorKind: "icon",
      items: items.map((item, index) => ({
        ...content(item, index),
        decor: { kind: "icon", node: source.resolve(item, index) },
      })),
    };
  return {
    title,
    decorKind: "image",
    items: items.map((item, index) => ({
      ...content(item, index),
      decor: { ...source.resolve(item, index), kind: "image" },
    })),
  };
}
