import type { CSSProperties, ReactElement } from "react";
import type {
  TimelinePalette,
  TimelineVariant,
} from "@/components/invitation/shared/timeline-presets";
import type { TimelineTypography } from "@/components/invitation/shared/timeline-typography";

/** Decorative only: activity/time must carry the meaning in text. No interactive nodes. */
export type TimelineIconDecor = { kind: "icon"; node: ReactElement };
export type TimelineImageDecor = {
  kind: "image";
  src: string;
  fit?: "contain" | "cover";
  /** Image mode always falls back to another image, never an icon. */
  fallbackSrc?: string;
  unoptimized?: boolean;
};
export type TimelineDecor = TimelineIconDecor | TimelineImageDecor;
export type WeddingTimelineItem<D extends TimelineDecor = TimelineDecor> = {
  id: string;
  activity: string;
  startTime?: string;
  endTime?: string;
  decor: D;
};
/** A single media mode for the entire timeline; mixed arrays are rejected. */
export type WeddingTimelineData =
  | {
      title: string;
      decorKind: "icon";
      items: WeddingTimelineItem<TimelineIconDecor>[];
    }
  | {
      title: string;
      decorKind: "image";
      items: WeddingTimelineItem<TimelineImageDecor>[];
    };
export type TimelineClassNames = Partial<
  Record<
    "root" | "title" | "list" | "item" | "decor" | "copy" | "time" | "activity",
    string
  >
>;
export type WeddingTimelineProps = {
  variant: TimelineVariant;
  data: WeddingTimelineData;
  colors?: Partial<TimelinePalette>;
  typography?: TimelineTypography;
  /** CSS length, e.g. "80px"; applies to all item frames and their connectors. */
  decorSize?: CSSProperties["width"];
  classNames?: TimelineClassNames;
  className?: string;
};
