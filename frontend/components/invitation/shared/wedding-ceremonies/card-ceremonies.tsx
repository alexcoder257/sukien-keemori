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
 * **Bảng khắc** — tên nghi lễ nằm *trên* mép trên của khung, hai bên là hai nét
 * kẻ, kiểu chữ khắc trên tấm biển.
 *
 * Bản trước là một hộp bo góc có viền và chữ canh giữa bên trong — trông như
 * card giao diện web chứ không phải một chi tiết in. Ở đây khung chỉ còn hai nét
 * ngang trên và dưới, còn tên nghi lễ ngắt đôi nét trên và ngồi lên chính đường
 * đó; nền chỉ là một lớp phủ rất nhạt để tách khối khỏi giấy.
 *
 * Lưới `auto-fit` theo `min-content`, không phải hai cột cứng: một thiệp có đúng
 * một nghi lễ thì khối đơn độc chiếm nửa bề rộng trông như lỗi dàn trang.
 */
export function CardCeremonies({ data, classNames }: CeremoniesLayoutProps) {
  return (
    <ul
      data-ceremony-part="list"
      className={cn(
        "m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(17rem,100%),1fr))] gap-[var(--ceremony-space-md)] p-0",
        classNames?.list,
      )}
    >
      {data.items.map((item) => (
        <li
          key={item.id}
          data-ceremony-part="item"
          className={cn(
            "grid content-start justify-items-center gap-[var(--ceremony-space-2xs)] px-[var(--ceremony-space-sm)] pt-[var(--ceremony-space-md)] pb-[var(--ceremony-space-sm)]",
            styles.plaque,
            classNames?.item,
          )}
        >
          <CeremonyName
            className={cn(styles.plaqueName, classNames?.name)}
          >
            {item.name}
          </CeremonyName>
          {item.time ? (
            <CeremonyTime className={classNames?.time}>
              {item.time}
            </CeremonyTime>
          ) : null}
          {item.date ? <CeremonyDate>{item.date}</CeremonyDate> : null}
          {item.venue ? (
            <CeremonyVenue
              className={cn("mt-[var(--ceremony-space-xs)]", classNames?.venue)}
            >
              {item.venue}
            </CeremonyVenue>
          ) : null}
          {item.note ? <CeremonyNote>{item.note}</CeremonyNote> : null}
        </li>
      ))}
    </ul>
  );
}
