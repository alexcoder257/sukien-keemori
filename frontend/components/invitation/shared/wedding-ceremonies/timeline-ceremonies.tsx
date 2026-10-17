import { cn } from "@/lib/utils";
import {
  CeremonyDate,
  CeremonyName,
  CeremonyNote,
  CeremonyTime,
  CeremonyVenue,
} from "./ceremony-item";
import type { CeremoniesLayoutProps } from "./wedding-ceremonies.types";
import styles from "./wedding-ceremonies.module.css";

/**
 * **Cột giờ** — hai cột ăn theo một trục dọc duy nhất.
 *
 * Giờ canh **phải** sát trục, nội dung canh **trái** sát trục. Nhờ vậy mọi con
 * số thẳng hàng ở một mép và mọi tên nghi lễ thẳng hàng ở mép kia, tạo ra hai
 * đường thẳng thị giác mà bản trước không có — bản trước để giờ nằm inline nên
 * mỗi dòng bắt đầu ở một chỗ khác nhau và cột trái lởm chởm.
 *
 * Đây cũng là bố cục duy nhất **không canh giữa**: một trục dọc mà chữ hai bên
 * canh giữa thì trục thành đường trang trí chứ không còn là trục.
 */
export function TimelineCeremonies({ data, classNames }: CeremoniesLayoutProps) {
  return (
    <ol
      data-ceremony-part="list"
      className={cn(
        "m-0 grid list-none grid-cols-[auto_1px_1fr] gap-x-[var(--ceremony-space-sm)] gap-y-[var(--ceremony-space-lg)] p-0 text-start",
        classNames?.list,
      )}
    >
      {data.items.map((item) => (
        <li
          key={item.id}
          data-ceremony-part="item"
          className={cn("col-span-3 grid grid-cols-subgrid", classNames?.item)}
        >
          <div className="grid content-start justify-items-end gap-[var(--ceremony-space-2xs)] text-end">
            {item.time ? (
              <CeremonyTime className={classNames?.time}>
                {item.time}
              </CeremonyTime>
            ) : null}
          </div>
          <span aria-hidden className={styles.railAxis} />
          <div className={`grid content-start justify-items-start gap-[var(--ceremony-space-2xs)] ${styles.timelineCopy}`}>
            <CeremonyName className={classNames?.name}>
              {item.name}
            </CeremonyName>
            {item.date ? <CeremonyDate>{item.date}</CeremonyDate> : null}
            {item.venue ? (
              <CeremonyVenue
                className={cn("mt-[var(--ceremony-space-2xs)]", classNames?.venue)}
              >
                {item.venue}
              </CeremonyVenue>
            ) : null}
            {item.note ? <CeremonyNote>{item.note}</CeremonyNote> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
