/**
 * Chuyển đổi giữa `Date` của date picker và chuỗi ngày/giờ lưu trong nội dung
 * thiệp. Mỗi block giữ đúng định dạng cũ để phần hiển thị thiệp không phải đổi:
 *
 * - `reception.date` : `22/11/2026`
 * - `ceremonies[].dateTime`           : `10:00 · 22/11/2026`
 * - `countdown.weddingDate`           : ISO kèm offset, xem `WEDDING_UTC_OFFSET`
 * - các trường giờ                    : `18:30`
 */

/** Dấu phân cách giữa giờ và ngày trong `ceremonies[].dateTime`. */
const DATE_TIME_SEPARATOR = " · ";

/**
 * Giờ cưới là giờ Việt Nam, không phải giờ máy người xem: khách ở múi giờ khác
 * vẫn phải thấy đồng hồ đếm ngược về đúng thời khắc tại nơi tổ chức.
 */
export const WEDDING_UTC_OFFSET = "+07:00";

const pad = (value: number) => String(value).padStart(2, "0");

/** `Date` → `22/11/2026`. */
export function formatDateValue(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** `22/11/2026` → `Date`; chuỗi không đúng dạng trả về `undefined`. */
export function parseDateValue(value: string): Date | undefined {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return undefined;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Chặn ngày tràn tháng (`31/02/2026` sẽ thành 03/03 nếu không kiểm tra).
  return date.getDate() === Number(day) ? date : undefined;
}

/** `10:00 · 22/11/2026` → `{ date, time }`. */
export function parseDateTimeValue(value: string): {
  date: Date | undefined;
  time: string;
} {
  const [time = "", date = ""] = value.split(DATE_TIME_SEPARATOR);
  return { date: parseDateValue(date), time: time.trim() };
}

/**
 * Ngày in ngoài bìa thiệp, dạng `22/11/2026`. Đọc mốc đếm ngược trước — đó là
 * ngày cưới, như đa số mẫu vẫn làm — còn ngày tiệc có thể là hôm khác (nhà gái
 * đãi cơm ngày 24, cưới chính ngày 25). Mốc đếm ngược trống thì rơi về ngày
 * tiệc. Lấy thẳng phần ngày của chuỗi ISO: editor lưu kèm `+07:00` nên đó đã
 * là ngày theo giờ Việt Nam, không qua `Date` để khỏi lệch theo múi giờ máy chủ.
 */
export function coverDateValue(content: {
  countdown: { weddingDate: string };
  reception: { date: string };
}): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(
    content.countdown.weddingDate.trim(),
  );
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : content.reception.date;
}
