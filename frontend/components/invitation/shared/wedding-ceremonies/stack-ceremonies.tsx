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
 * **Editorial** — canh giữa một trục, giờ làm neo.
 *
 * Trật tự đọc là *nhãn → con số → phần còn lại*: tên nghi lễ đứng trên như một
 * kicker chữ hoa giãn rộng, rồi con số giờ rơi xuống ở cỡ lớn nhất khối. Mắt
 * bắt vào con số trước, rồi mới ngược lên đọc nhãn — đó là chỗ khác hẳn bản
 * trước, vốn xếp tên rồi giờ cùng một cỡ nên không có điểm bám nào.
 *
 * Giữa hai nghi lễ là một hoạ tiết trám thay vì khoảng trắng trơn: ba khối chữ
 * canh giữa liên tiếp mà chỉ cách nhau bằng khoảng trống thì đọc ra như một
 * đoạn văn dài, không ra ba mục.
 */
export function StackCeremonies({ data, classNames }: CeremoniesLayoutProps) {
  return (
    <ul
      data-ceremony-part="list"
      className={cn(
        "m-0 grid list-none gap-[var(--ceremony-space-lg)] p-0",
        styles.stackList,
        classNames?.list,
      )}
    >
      {data.items.map((item) => (
        <li
          key={item.id}
          data-ceremony-part="item"
          className={cn(
            "grid justify-items-center gap-[var(--ceremony-space-2xs)]",
            classNames?.item,
          )}
        >
          {/* Giữ màu `ink`: phân hạng với con số giờ đã do **cỡ chữ** lo, hạ
              thêm sắc độ nữa thì nhãn vừa nhỏ vừa nhạt vừa giãn — ba thứ cùng
              làm nó khó đọc. */}
          <CeremonyName className={classNames?.name}>{item.name}</CeremonyName>
          {item.time ? (
            <CeremonyTime
              className={cn(
                "mt-[var(--ceremony-space-2xs)] text-(length:--tpl-h2)",
                classNames?.time,
              )}
            >
              {item.time}
            </CeremonyTime>
          ) : null}
          {item.date ? <CeremonyDate>{item.date}</CeremonyDate> : null}
          {item.venue ? (
            <CeremonyVenue
              className={cn(
                "mt-[var(--ceremony-space-xs)] max-w-[26em]",
                classNames?.venue,
              )}
            >
              {item.venue}
            </CeremonyVenue>
          ) : null}
          {item.note ? (
            <CeremonyNote className="max-w-[26em]">{item.note}</CeremonyNote>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
