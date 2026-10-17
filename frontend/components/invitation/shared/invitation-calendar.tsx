import { Heart } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  /** Ngày cưới đã parse được — ô tương ứng trong tháng sẽ được đánh dấu. */
  date: Date;
  monthOnly?: boolean;
  weekStartsOn?: 0 | 1;
  locale: Locale;
  dict: Dictionary["invitation"]["sections"]["countdown"]["calendar"];
};

/** Số ngày của tháng chứa `date`. */
function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Lịch tháng chứa ngày cưới, tuần bắt đầu từ Chủ nhật. Chỉ để nhắc lại ngày —
 * không có tương tác, không đổi tháng.
 *
 * Dùng chung cho mọi mẫu thiệp: toàn bộ màu lấy từ token ngữ nghĩa nên mẫu nào
 * bọc ngoài thì lịch ăn theo tông của mẫu đó.
 */
export function InvitationCalendar({
  date,
  locale,
  dict,
  monthOnly = false,
  weekStartsOn = 0,
}: Props) {
  const intlLocale = locale === "vi" ? "vi-VN" : "en-US";
  const monthLabel = date.toLocaleDateString(intlLocale, {
    month: "long",
    year: monthOnly ? undefined : "numeric",
  });

  const weddingDay = date.getDate();
  const leading =
    (new Date(date.getFullYear(), date.getMonth(), 1).getDay() -
      weekStartsOn +
      7) %
    7;
  const weekdays = [
    ...dict.weekdays.slice(weekStartsOn),
    ...dict.weekdays.slice(0, weekStartsOn),
  ];
  const total = daysInMonth(date);

  // Lưới phẳng gồm ô trống đầu tháng + các ngày, cắt thành từng tuần 7 ô.
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7),
  );

  return (
    <table className="mx-auto w-full max-w-md table-fixed border-separate border-spacing-y-1">
      <caption className="mb-4 text-caption tracking-[0.2em] text-muted-foreground uppercase">
        {monthLabel}
      </caption>
      <thead>
        <tr>
          {weekdays.map((weekday) => (
            <th
              key={weekday}
              scope="col"
              className="pb-2 text-caption font-medium text-muted-foreground"
            >
              {weekday}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, weekIndex) => (
          <tr key={weekIndex}>
            {week.map((day, dayIndex) => (
              <td key={dayIndex} className="text-center align-middle">
                {day === null ? (
                  <span className="sr-only">&nbsp;</span>
                ) : day === weddingDay ? (
                  <span className="relative inline-flex size-9 items-center justify-center">
                    {/* Nét và ruột của trái tim là hai token tách rời: mẫu
                        nào muốn trái tim rỗng chỉ cần đặt `--calendar-accent-fill`
                        về `transparent`. Mặc định fill rơi về màu nét nên các
                        mẫu đang dùng trái tim đặc không phải khai gì thêm. */}
                    <Heart
                      aria-hidden
                      data-calendar-heart
                      className="absolute size-10 fill-[var(--calendar-accent-fill,var(--calendar-accent))] text-[var(--calendar-accent)] [stroke-width:var(--calendar-heart-stroke,2)]"
                    />
                    {/* Trọng tâm thị giác của trái tim nằm cao hơn tâm hình
                        học, nên số phải nhích lên mới trông nằm giữa. */}
                    <span
                      data-calendar-wedding-day
                      className="relative -mt-0.5 text-small font-medium text-[var(--calendar-accent-foreground)] tabular-nums"
                    >
                      {day}
                    </span>
                    <span className="sr-only">{dict.weddingDay}</span>
                  </span>
                ) : (
                  <span className="inline-flex size-9 items-center justify-center text-small text-foreground/70 tabular-nums">
                    {day}
                  </span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
