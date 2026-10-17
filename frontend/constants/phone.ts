// Danh sách mã vùng điện thoại — hardcode có chủ đích.
//
// Các thư viện sẵn có (libphonenumber-js, react-phone-number-input) kéo theo
// vài trăm KB metadata chỉ để làm một ô nhập số ở form đăng ký, trong khi thứ
// duy nhất cần là "cờ + mã vùng". Tên quốc gia không nằm ở đây mà lấy từ
// `Intl.DisplayNames` theo locale đang xem, nên thêm một nước không kéo theo
// hai dòng dịch.

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, viết hoa. Cũng là khoá dùng để dựng emoji cờ. */
  iso: string;
  /** Mã vùng, không có dấu `+`. */
  dial: string;
}

/** Mặc định của form: sản phẩm bán ở Việt Nam. */
export const DEFAULT_PHONE_COUNTRY = "VN";

// E.164: tối đa 15 chữ số kể cả mã vùng. Cận dưới lấy 6 cho số nội địa ngắn.
export const PHONE_E164_MAX_DIGITS = 15;
export const PHONE_NATIONAL_MIN_DIGITS = 6;

// Xếp Việt Nam lên đầu, phần còn lại theo khu vực. Danh sách sẽ được sắp lại
// theo tên bản địa lúc hiển thị, trừ mục đầu tiên.
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "VN", dial: "84" },

  // Châu Á – Thái Bình Dương
  { iso: "SG", dial: "65" },
  { iso: "TH", dial: "66" },
  { iso: "MY", dial: "60" },
  { iso: "ID", dial: "62" },
  { iso: "PH", dial: "63" },
  { iso: "KH", dial: "855" },
  { iso: "LA", dial: "856" },
  { iso: "MM", dial: "95" },
  { iso: "BN", dial: "673" },
  { iso: "TL", dial: "670" },
  { iso: "CN", dial: "86" },
  { iso: "HK", dial: "852" },
  { iso: "MO", dial: "853" },
  { iso: "TW", dial: "886" },
  { iso: "JP", dial: "81" },
  { iso: "KR", dial: "82" },
  { iso: "MN", dial: "976" },
  { iso: "IN", dial: "91" },
  { iso: "BD", dial: "880" },
  { iso: "PK", dial: "92" },
  { iso: "LK", dial: "94" },
  { iso: "NP", dial: "977" },
  { iso: "MV", dial: "960" },
  { iso: "AF", dial: "93" },
  { iso: "AU", dial: "61" },
  { iso: "NZ", dial: "64" },
  { iso: "FJ", dial: "679" },
  { iso: "PG", dial: "675" },

  // Bắc Mỹ & Caribe (dùng chung mã +1)
  { iso: "US", dial: "1" },
  { iso: "CA", dial: "1" },
  { iso: "PR", dial: "1" },
  { iso: "DO", dial: "1" },
  { iso: "JM", dial: "1" },

  // Mỹ Latin
  { iso: "MX", dial: "52" },
  { iso: "GT", dial: "502" },
  { iso: "CR", dial: "506" },
  { iso: "PA", dial: "507" },
  { iso: "CU", dial: "53" },
  { iso: "BR", dial: "55" },
  { iso: "AR", dial: "54" },
  { iso: "CL", dial: "56" },
  { iso: "CO", dial: "57" },
  { iso: "PE", dial: "51" },
  { iso: "VE", dial: "58" },
  { iso: "EC", dial: "593" },
  { iso: "BO", dial: "591" },
  { iso: "PY", dial: "595" },
  { iso: "UY", dial: "598" },

  // Châu Âu
  { iso: "GB", dial: "44" },
  { iso: "IE", dial: "353" },
  { iso: "FR", dial: "33" },
  { iso: "DE", dial: "49" },
  { iso: "IT", dial: "39" },
  { iso: "ES", dial: "34" },
  { iso: "PT", dial: "351" },
  { iso: "NL", dial: "31" },
  { iso: "BE", dial: "32" },
  { iso: "LU", dial: "352" },
  { iso: "CH", dial: "41" },
  { iso: "AT", dial: "43" },
  { iso: "SE", dial: "46" },
  { iso: "NO", dial: "47" },
  { iso: "DK", dial: "45" },
  { iso: "FI", dial: "358" },
  { iso: "IS", dial: "354" },
  { iso: "EE", dial: "372" },
  { iso: "LV", dial: "371" },
  { iso: "LT", dial: "370" },
  { iso: "PL", dial: "48" },
  { iso: "CZ", dial: "420" },
  { iso: "SK", dial: "421" },
  { iso: "HU", dial: "36" },
  { iso: "RO", dial: "40" },
  { iso: "BG", dial: "359" },
  { iso: "GR", dial: "30" },
  { iso: "HR", dial: "385" },
  { iso: "SI", dial: "386" },
  { iso: "RS", dial: "381" },
  { iso: "BA", dial: "387" },
  { iso: "ME", dial: "382" },
  { iso: "MK", dial: "389" },
  { iso: "AL", dial: "355" },
  { iso: "MD", dial: "373" },
  { iso: "UA", dial: "380" },
  { iso: "BY", dial: "375" },
  { iso: "RU", dial: "7" },
  { iso: "MT", dial: "356" },
  { iso: "CY", dial: "357" },
  { iso: "MC", dial: "377" },
  { iso: "LI", dial: "423" },
  { iso: "AD", dial: "376" },
  { iso: "SM", dial: "378" },

  // Trung Đông, Trung Á & Kavkaz
  { iso: "TR", dial: "90" },
  { iso: "IL", dial: "972" },
  { iso: "AE", dial: "971" },
  { iso: "SA", dial: "966" },
  { iso: "QA", dial: "974" },
  { iso: "KW", dial: "965" },
  { iso: "BH", dial: "973" },
  { iso: "OM", dial: "968" },
  { iso: "JO", dial: "962" },
  { iso: "LB", dial: "961" },
  { iso: "IQ", dial: "964" },
  { iso: "IR", dial: "98" },
  { iso: "KZ", dial: "7" },
  { iso: "UZ", dial: "998" },
  { iso: "AZ", dial: "994" },
  { iso: "GE", dial: "995" },
  { iso: "AM", dial: "374" },

  // Châu Phi
  { iso: "EG", dial: "20" },
  { iso: "MA", dial: "212" },
  { iso: "DZ", dial: "213" },
  { iso: "TN", dial: "216" },
  { iso: "ZA", dial: "27" },
  { iso: "NG", dial: "234" },
  { iso: "GH", dial: "233" },
  { iso: "KE", dial: "254" },
  { iso: "TZ", dial: "255" },
  { iso: "UG", dial: "256" },
  { iso: "ET", dial: "251" },
];

/** Emoji cờ dựng từ mã ISO — không cần nhúng ảnh cờ vào bundle. */
export function countryFlagEmoji(iso: string): string {
  return String.fromCodePoint(
    ...iso
      .toUpperCase()
      .split("")
      .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65),
  );
}

export function findPhoneCountry(iso: string): PhoneCountry {
  return (
    PHONE_COUNTRIES.find((country) => country.iso === iso) ?? PHONE_COUNTRIES[0]
  );
}

/** Chỉ giữ chữ số — người dùng hay gõ kèm khoảng trắng, dấu chấm, ngoặc. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Ghép thành E.164 để lưu: `+84912345678`. Bỏ số 0 dẫn đầu vì đó là trunk
 * prefix nội địa, không thuộc số quốc tế.
 */
export function toE164(dial: string, national: string): string {
  return `+${dial}${phoneDigits(national).replace(/^0+/, "")}`;
}

/**
 * Tách một số đã lưu thành `{ country, national }` để đổ ngược vào form. Khớp
 * mã vùng dài nhất trước (+1 vs +1x không tồn tại, nhưng +7 vs +84 thì có), và
 * khi nhiều nước dùng chung một mã (+1, +7) thì lấy nước đứng đầu danh sách —
 * không có cách nào đoán đúng hơn từ chuỗi số.
 *
 * Số không nhận ra được (thiếu `+`, mã vùng lạ) trả về nguyên văn phần số với
 * quốc gia mặc định, để người dùng thấy đúng thứ đang lưu và tự sửa.
 */
export function parseE164(value: string | null | undefined): {
  country: string;
  national: string;
} {
  const raw = (value ?? "").trim();
  if (!raw.startsWith("+")) {
    return { country: DEFAULT_PHONE_COUNTRY, national: phoneDigits(raw) };
  }
  const digits = phoneDigits(raw);
  const match = PHONE_COUNTRIES.filter((country) =>
    digits.startsWith(country.dial),
  ).sort((a, b) => b.dial.length - a.dial.length)[0];
  if (!match) return { country: DEFAULT_PHONE_COUNTRY, national: digits };
  return { country: match.iso, national: digits.slice(match.dial.length) };
}
