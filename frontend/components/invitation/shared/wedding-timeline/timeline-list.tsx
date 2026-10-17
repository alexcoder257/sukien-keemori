import { cn } from "@/lib/utils";
import { TimelineDecor } from "@/components/invitation/shared/wedding-timeline/timeline-decor";
import { TimelineCopy } from "@/components/invitation/shared/wedding-timeline/timeline-item";
import type { WeddingTimelineProps } from "@/components/invitation/shared/wedding-timeline/wedding-timeline.types";
import styles from "@/components/invitation/shared/wedding-timeline/wedding-timeline.module.css";

/** Keep DOM reading order identical in all layouts; only the grid changes. */
export function TimelineList({
  variant,
  data,
  classNames,
}: Pick<WeddingTimelineProps, "variant" | "data" | "classNames">) {
  return (
    <ol
      data-timeline-part="list"
      role="list"
      className={cn(styles.list, styles[variant], classNames?.list)}
    >
      {data.items.map((item) => (
        <li
          key={item.id}
          data-timeline-part="item"
          className={cn(styles.item, classNames?.item)}
        >
          <TimelineDecor decor={item.decor} className={classNames?.decor} />
          <TimelineCopy item={item} classNames={classNames} />
        </li>
      ))}
    </ol>
  );
}
