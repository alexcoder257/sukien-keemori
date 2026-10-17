export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * `YYYY-MM-DD` của một thời điểm theo giờ Việt Nam. Ngày cưới trong thiệp và
 * các bảng gộp theo ngày đều tính theo múi này; dùng ngày UTC thì mọi thứ xảy
 * ra trước 7 giờ sáng bị tính sang hôm trước.
 */
export function vietnamDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
