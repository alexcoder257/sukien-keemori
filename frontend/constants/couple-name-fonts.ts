import {
  arcittyaBegatri,
  beVietnamPro,
  beyondPerfection,
  charm,
  charmonman,
  cormorant,
  cormorantSc,
  ebGaramond,
  grenzeGotisch,
  greatVibes,
  hastegi,
  lora,
  momoSignature,
  newsreader,
  playfairDisplay,
  prata,
  spectral,
  storyScript,
  uvnHoaTay,
} from "@/assets/fonts";

/**
 * Vốn từ về **font đặt tên cô dâu chú rể**, dùng chung cho trang đối chiếu
 * `/design-system/fonts` và cho phần chọn font của màn mở thiệp.
 *
 * Vì sao là một registry chứ không phải mỗi chỗ tự import: font dùng cho tên là
 * thứ **đổi được lúc chạy**, nên mọi ứng viên phải được khai `@font-face` sẵn.
 * Gom về một chỗ thì danh sách hiện ra trong UI và danh sách thật sự tải được
 * luôn là một — thêm một họ chữ chỉ sửa đúng file này.
 *
 * Mọi font ở đây đều `preload: false`, nên khai báo chỉ sinh CSS; file `.woff2`
 * chỉ tải khi có chữ thật sự dùng tới.
 */

/** Vai thị giác, không phải phân loại kỹ thuật của font. */
export type CoupleNameFontStyle =
  | "calligraphy"
  | "signature"
  | "serif-display"
  | "sans"
  | "blackletter";

export type CoupleNameFont = {
  id: string;
  label: string;
  /** CSS font-family đầy đủ, luôn kèm fallback. */
  family: string;
  /** Class biến của `next/font`, phải gắn lên phần tử bao ngoài. */
  variable: string;
  style: CoupleNameFontStyle;
  /**
   * `false` = file font **thiếu dấu tiếng Việt**. Không phải cảnh báo mỹ thuật:
   * trình duyệt sẽ rơi về font fallback ở đúng những chữ có dấu, nên một cái tên
   * ra hai kiểu chữ. Xem `VIETNAMESE_STRESS_TEST`.
   */
  vietnamese: boolean;
  /**
   * Độ nhô thêm của dấu, tính bằng **% em**: chênh lệch chiều cao giữa `ấ` và
   * `a` trong chính file font. Đo bằng fontTools, không phải cảm nhận.
   *
   * Đây là con số quyết định `line-height` cho tên hai dòng: Playfair nhô 53%
   * nên dấu `Ấ` chạm dòng trên nếu để leading chặt, còn Hastegi chỉ 23% nên nó
   * gọn nhưng dấu cũng sát thân chữ hơn.
   */
  headroom: number;
  /**
   * Hệ số cỡ chữ so với các font khác cùng bậc. Chữ thư pháp có thân chữ
   * (x-height) nhỏ hơn hẳn serif ở cùng `font-size`, nên để 1 cho tất cả thì
   * bảng đối chiếu nói dối về tương quan lớn/nhỏ.
   */
  scale: number;
};

/**
 * Chuỗi thử dấu. Gom đúng những tổ hợp hay thiếu nhất ở font ngoại: nguyên âm
 * có móc (`ư` `ơ` `ă` `â`), `đ`, và nguyên âm đã có mũ lại chồng thêm dấu
 * thanh (`ấ` `ệ` `ộ` `ữ`) — chỗ này mới là chỗ font ngoại gãy, không phải `à`.
 */
export const VIETNAMESE_STRESS_TEST = "Đường Ấm Ệ Ộ Ữ Ỹ ăâđêôơư ấầẩẫậ ừữựỷỹ";

export const COUPLE_NAME_FONTS: readonly CoupleNameFont[] = [
  {
    id: "great-vibes",
    label: "Great Vibes",
    family: "var(--font-great-vibes), cursive",
    variable: greatVibes.variable,
    style: "calligraphy",
    vietnamese: true,
    headroom: 24.5,
    scale: 1,
  },
  {
    id: "uvn-hoa-tay",
    label: "UVN Hoa Tay",
    family: "var(--font-uvn-hoa-tay), cursive",
    variable: uvnHoaTay.variable,
    style: "calligraphy",
    vietnamese: true,
    headroom: 27.3,
    scale: 1,
  },
  {
    id: "charmonman",
    label: "Charmonman",
    family: "var(--font-charmonman), cursive",
    variable: charmonman.variable,
    style: "calligraphy",
    vietnamese: true,
    headroom: 36.1,
    scale: 1,
  },
  {
    id: "arcittya-begatri",
    label: "Arcittya Begatri",
    family: "var(--font-arcittya-begatri), cursive",
    variable: arcittyaBegatri.variable,
    style: "calligraphy",
    vietnamese: true,
    headroom: 11.6,
    scale: 1.1,
  },
  {
    id: "hastegi",
    label: "Hastegi",
    family: "var(--font-hastegi), Georgia, serif",
    variable: hastegi.variable,
    style: "serif-display",
    vietnamese: true,
    headroom: 22.9,
    scale: 1,
  },
  {
    id: "beyond-perfection",
    label: "Beyond Perfection",
    family: "var(--font-beyond-perfection), cursive",
    variable: beyondPerfection.variable,
    style: "calligraphy",
    vietnamese: false,
    headroom: 0,
    scale: 0.75,
  },
  {
    id: "momo-signature",
    label: "Momo Signature",
    family: "var(--font-momo-signature), cursive",
    variable: momoSignature.variable,
    style: "signature",
    vietnamese: true,
    headroom: 38.4,
    scale: 0.85,
  },
  {
    id: "story-script",
    label: "Story Script",
    family: "var(--font-story-script), cursive",
    variable: storyScript.variable,
    style: "signature",
    vietnamese: true,
    headroom: 34.7,
    scale: 0.95,
  },
  {
    id: "charm",
    label: "Charm",
    family: "var(--font-charm), cursive",
    variable: charm.variable,
    style: "signature",
    vietnamese: true,
    headroom: 36.5,
    scale: 1,
  },
  {
    id: "cormorant",
    label: "Cormorant",
    family: "var(--font-cormorant), Georgia, serif",
    variable: cormorant.variable,
    style: "serif-display",
    vietnamese: true,
    headroom: 24.7,
    scale: 1,
  },
  {
    id: "cormorant-sc",
    label: "Cormorant SC",
    family: "var(--font-cormorant-sc), Georgia, serif",
    variable: cormorantSc.variable,
    style: "serif-display",
    vietnamese: true,
    headroom: 23.5,
    scale: 1,
  },
  {
    id: "prata",
    label: "Prata",
    family: "var(--font-prata), Georgia, serif",
    variable: prata.variable,
    style: "serif-display",
    vietnamese: true,
    headroom: 35.5,
    scale: 0.9,
  },
  {
    id: "playfair-display",
    label: "Playfair Display",
    family: "var(--font-playfair), Georgia, serif",
    variable: playfairDisplay.variable,
    style: "serif-display",
    vietnamese: true,
    headroom: 53.5,
    scale: 0.92,
  },
  {
    id: "eb-garamond",
    label: "EB Garamond",
    family: "var(--font-eb-garamond), Georgia, serif",
    variable: ebGaramond.variable,
    style: "serif-display",
    vietnamese: true,
    headroom: 31.1,
    scale: 1,
  },
  {
    id: "newsreader",
    label: "Newsreader",
    family: "var(--font-newsreader), Georgia, serif",
    variable: newsreader.variable,
    style: "serif-display",
    vietnamese: true,
    headroom: 31.2,
    scale: 0.95,
  },
  {
    id: "spectral",
    label: "Spectral",
    family: "var(--font-spectral), Georgia, serif",
    variable: spectral.variable,
    style: "serif-display",
    vietnamese: true,
    headroom: 32.0,
    scale: 0.9,
  },
  {
    id: "lora",
    label: "Lora",
    family: "var(--font-lora), Georgia, serif",
    variable: lora.variable,
    style: "serif-display",
    vietnamese: true,
    headroom: 32.7,
    scale: 0.9,
  },
  {
    id: "grenze-gotisch",
    label: "Grenze Gotisch",
    family: "var(--font-grenze-gotisch), Georgia, serif",
    variable: grenzeGotisch.variable,
    style: "blackletter",
    vietnamese: true,
    headroom: 31.5,
    scale: 1,
  },
  {
    id: "be-vietnam-pro",
    label: "Be Vietnam Pro",
    family: "var(--font-be-vietnam-pro), sans-serif",
    variable: beVietnamPro.variable,
    style: "sans",
    vietnamese: true,
    headroom: 36.2,
    scale: 0.85,
  },
];

/** Thứ tự trình bày: thư pháp trước, giao diện sau — đúng thứ tự cần khi chọn. */
export const COUPLE_NAME_FONT_STYLES: readonly CoupleNameFontStyle[] = [
  "calligraphy",
  "signature",
  "serif-display",
  "blackletter",
  "sans",
];

export const COUPLE_NAME_FONT_VARIABLES = COUPLE_NAME_FONTS.map(
  (font) => font.variable,
).join(" ");
