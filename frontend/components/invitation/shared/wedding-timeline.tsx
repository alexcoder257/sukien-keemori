import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { timelineColorStyle } from "@/components/invitation/shared/timeline-presets";
import { timelineTypography } from "@/components/invitation/shared/timeline-typography";
import type { WeddingTimelineProps } from "@/components/invitation/shared/wedding-timeline/wedding-timeline.types";
import { TimelineList } from "@/components/invitation/shared/wedding-timeline/timeline-list";
import styles from "@/components/invitation/shared/wedding-timeline/wedding-timeline.module.css";

export type {
  WeddingTimelineProps,
  WeddingTimelineData,
  WeddingTimelineItem,
  TimelineDecor,
  TimelineIconDecor,
  TimelineImageDecor,
  TimelineClassNames,
} from "@/components/invitation/shared/wedding-timeline/wedding-timeline.types";
export {
  TIMELINE_VARIANTS,
  TIMELINE_RECOMMENDED_MAX_ITEMS,
  weddingTimelineData,
  timelineColorStyle,
} from "@/components/invitation/shared/timeline-presets";
export type {
  TimelineVariant,
  TimelineDecorSource,
  TimelinePalette,
} from "@/components/invitation/shared/timeline-presets";
export {
  TIMELINE_FONT_COMBOS,
  TIMELINE_FONTS,
  TIMELINE_TEXT_REGIONS,
} from "@/components/invitation/shared/timeline-typography";
export type {
  TimelineTypography,
  TimelineFontCombo,
  TimelineFontValue,
  TimelineTextRegion,
} from "@/components/invitation/shared/timeline-typography";

/** Layout and presentation only; visibility, filtering and decor belong to the caller. */
export function WeddingTimeline({
  variant,
  data,
  colors,
  typography,
  decorSize,
  classNames,
  className,
}: WeddingTimelineProps) {
  if (data.items.some((item) => item.decor?.kind !== data.decorKind)) {
    throw new Error(
      "WeddingTimeline: every item must match the timeline decorKind (icon or image).",
    );
  }
  if (!data.items.length) return null;
  const fonts = timelineTypography(typography);
  return (
    <section
      data-timeline-root
      data-block-typography
      data-variant={variant}
      data-decor-kind={data.decorKind}
      className={cn(styles.root, className)}
    >
      <div
        data-timeline-part="surface"
        className={cn(styles.surface, fonts.className, classNames?.root)}
        style={
          {
            ...timelineColorStyle(colors),
            ...fonts.style,
            ...(decorSize !== undefined
              ? {
                  "--timeline-decor-size":
                    typeof decorSize === "number"
                      ? `${decorSize}px`
                      : decorSize,
                }
              : {}),
            "--timeline-columns": Math.min(data.items.length, 5),
          } as CSSProperties
        }
      >
        {data.title.trim() ? (
          <h2
            data-timeline-part="title"
            className={cn(styles.title, classNames?.title)}
          >
            {data.title}
          </h2>
        ) : null}
        <TimelineList variant={variant} data={data} classNames={classNames} />
      </div>
    </section>
  );
}
