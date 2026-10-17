import { cn } from "@/lib/utils";
import type {
  WeddingTimelineItem,
  TimelineClassNames,
} from "@/components/invitation/shared/wedding-timeline/wedding-timeline.types";
import styles from "@/components/invitation/shared/wedding-timeline/wedding-timeline.module.css";

export function TimelineCopy({
  item,
  classNames,
}: {
  item: WeddingTimelineItem;
  classNames?: TimelineClassNames;
}) {
  const start = item.startTime?.trim();
  const end = item.endTime?.trim();
  return (
    <div
      data-timeline-part="copy"
      className={cn(styles.copy, classNames?.copy)}
    >
      {start || end ? (
        <p
          data-timeline-part="time"
          className={cn(styles.time, classNames?.time)}
        >
          {start ? <span>{start}</span> : null}
          {start && end ? <span>–</span> : null}
          {end ? <span>{end}</span> : null}
        </p>
      ) : null}
      {item.activity.trim() ? (
        <h3
          data-timeline-part="activity"
          className={cn(styles.activity, classNames?.activity)}
        >
          {item.activity}
        </h3>
      ) : null}
    </div>
  );
}
