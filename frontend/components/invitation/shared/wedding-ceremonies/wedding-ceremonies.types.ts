import type {
  CeremoniesPalette,
  CeremoniesVariant,
} from "@/components/invitation/shared/ceremonies-presets";
import type { CeremoniesTypography } from "@/components/invitation/shared/ceremonies-typography";

/**
 * Nội dung khối nghi lễ, đã **dựng sẵn thành chuỗi** — cùng hợp đồng với
 * `WeddingDetailsData`. Component không nhận `content` thô lẫn `dict`: tên nghi
 * lễ (kể cả `customKind`), giờ đã format và link bản đồ đều do
 * `weddingCeremoniesData` lo trước.
 */
export type WeddingCeremoniesData = {
  title: string;
  items: WeddingCeremonyItem[];
};

/**
 * Đúng bốn trường của form "Lễ cưới (nghi lễ)" trong editor: loại nghi lễ, ngày
 * giờ, địa điểm, lời thông báo. Không hơn.
 *
 * Ba trường sau đều tuỳ chọn ở tầng trình bày kể cả khi form đánh dấu bắt buộc:
 * thiệp đang soạn dở vẫn phải xem trước được, và **ô nào trống thì phần đó
 * không vẽ ra** thay vì để lại một dòng rỗng.
 */
export type WeddingCeremonyItem = {
  /** Ổn định theo vị trí + loại; nghi lễ không có id riêng trong schema. */
  id: string;
  /** Nhãn loại nghi lễ, hoặc `customKind` nếu loại là `other`. */
  name: string;
  /**
   * Giờ và ngày **tách rời**, dù form gộp chúng vào một ô `dateTime`.
   *
   * Gộp lại thành một chuỗi "08:00 · 14/11/2026" thì cả cụm buộc phải mang cùng
   * một cỡ và một sắc độ — mà giờ là thứ khách mời phải nhớ, còn ngày là thứ
   * xác nhận. Tách ra mới xếp được hai hạng khác nhau, và đó là toàn bộ lý do
   * trường này không phải một chuỗi.
   */
  time?: string;
  date?: string;
  venue?: string;
  note?: string;
};

/** Tailwind đè lên từng phần nhìn thấy được; autocomplete liệt kê các slot. */
export type CeremoniesClassNames = Partial<
  Record<"root" | "title" | "list" | "item" | "name" | "time" | "venue", string>
>;

export type CeremoniesDesignProps = {
  variant: CeremoniesVariant;
  data: WeddingCeremoniesData;
  colors?: Partial<CeremoniesPalette>;
  typography?: CeremoniesTypography;
  classNames?: CeremoniesClassNames;
};

export type WeddingCeremoniesProps = CeremoniesDesignProps & {
  className?: string;
};

/** Hợp đồng nội bộ mà ba bố cục cùng thực hiện. */
export type CeremoniesLayoutProps = CeremoniesDesignProps;
