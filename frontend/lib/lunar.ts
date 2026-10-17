/**
 * Đổi ngày dương sang ngày âm lịch Việt Nam (thuật toán Hồ Ngọc Đức).
 *
 * Thiệp cưới Việt luôn in kèm ngày âm — đó là ngày họ hàng lớn tuổi tra lại khi
 * xem giờ, nên nó phải được **tính** chứ không phải một ô người dùng gõ tay:
 * gõ tay thì sai một con số là sai vĩnh viễn trên một cái link không đổi được.
 *
 * Múi giờ chốt ở +7 chứ không lấy theo máy người xem, cùng lý do với
 * `WEDDING_UTC_OFFSET`: ngày âm của đám cưới là ngày âm tại nơi tổ chức.
 */

/** Múi giờ dùng để chốt mốc nửa đêm khi quy đổi. */
const TIME_ZONE = 7;

const CAN = [
  "Giáp",
  "Ất",
  "Bính",
  "Đinh",
  "Mậu",
  "Kỷ",
  "Canh",
  "Tân",
  "Nhâm",
  "Quý",
];
const CHI = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
];

const PI = Math.PI;
const int = Math.floor;

/** Số ngày Julius của một ngày dương lịch. */
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = int((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    int((153 * m + 2) / 5) +
    365 * y +
    int(y / 4) -
    int(y / 100) +
    int(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + int((153 * m + 2) / 5) + 365 * y + int(y / 4) - 32083;
  }
  return jd;
}

/** Ngày sóc thứ `k` tính từ 1900-01-01. */
function getNewMoonDay(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let c1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  c1 = c1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  c1 = c1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  c1 = c1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  c1 = c1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  c1 = c1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  c1 = c1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 +
        0.000839 * T +
        0.0002261 * T2 -
        0.00000845 * T3 -
        0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return int(jd1 + c1 - deltat + 0.5 + TIME_ZONE / 24);
}

/** Kinh độ mặt trời tại `jdn`, tính theo bậc 30° (0..11). */
function getSunLongitude(jdn: number): number {
  const T = (jdn - 2451545.5 - TIME_ZONE / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let dl = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  dl += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let l = (L0 + dl) * dr;
  l -= PI * 2 * int(l / (PI * 2));
  return int((l / PI) * 6);
}

/** Ngày bắt đầu tháng 11 âm của năm `yy`. */
function getLunarMonth11(yy: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = int(off / 29.530588853);
  const nm = getNewMoonDay(k);
  return getSunLongitude(nm) >= 9 ? getNewMoonDay(k - 1) : nm;
}

/** Vị trí tháng nhuận trong năm âm bắt đầu tại `a11`. */
function getLeapMonthOffset(a11: number): number {
  const k = int((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let i = 1;
  let last = 0;
  let arc = getSunLongitude(getNewMoonDay(k + i));
  do {
    last = arc;
    i += 1;
    arc = getSunLongitude(getNewMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

export type LunarDate = {
  day: number;
  month: number;
  year: number;
  /** Tháng nhuận: hiển thị kèm chữ "nhuận" nếu cần. */
  leap: boolean;
  /** Can chi của năm âm, ví dụ `Ất Tỵ`. */
  canChi: string;
};

/** Can chi của một năm âm lịch. */
export function lunarYearCanChi(lunarYear: number): string {
  return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
}

/** Ngày dương (theo lịch địa phương của `date`) → ngày âm lịch Việt Nam. */
export function solarToLunar(
  day: number,
  month: number,
  year: number,
): LunarDate {
  const dayNumber = jdFromDate(day, month, year);
  const k = int((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k);

  let a11 = getLunarMonth11(year);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = year;
    a11 = getLunarMonth11(year - 1);
  } else {
    lunarYear = year + 1;
    b11 = getLunarMonth11(year + 1);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = int((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: lunarLeap,
    canChi: lunarYearCanChi(lunarYear),
  };
}

/** Ngày dương dạng số, không kèm giờ hay múi giờ. */
export type SolarDate = { day: number; month: number; year: number };

/**
 * Ngày âm lịch Việt Nam → ngày dương. `null` khi ngày đó không tồn tại (tháng
 * thiếu không có ngày 30, hoặc năm đó không có tháng nhuận đã chọn).
 *
 * Không có công thức đảo trực tiếp, nên dò từng ngày bằng chính `solarToLunar`:
 * năm âm `year` bắt đầu sau ngày 1/1 dương của năm `year` và kết thúc trước
 * cuối tháng 2 năm sau, nên 425 ngày tính từ 1/1 phủ trọn nó. Cách dò chậm hơn
 * một công thức nhưng không thể lệch khỏi chiều xuôi — hai chiều luôn khớp
 * nhau, và chiều xuôi là thứ đã in trên thiệp của khách.
 */
export function lunarToSolar(
  day: number,
  month: number,
  year: number,
  leap = false,
): SolarDate | null {
  const start = Date.UTC(year, 0, 1);
  for (let offset = 0; offset < 425; offset++) {
    const date = new Date(start + offset * 86_400_000);
    const solar = {
      day: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
      year: date.getUTCFullYear(),
    };
    const lunar = solarToLunar(solar.day, solar.month, solar.year);
    if (
      lunar.year === year &&
      lunar.month === month &&
      lunar.day === day &&
      lunar.leap === leap
    ) {
      return solar;
    }
  }
  return null;
}
