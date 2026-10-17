/**
 * Thuộc tính metadata của mẫu thiệp mà CMS chỉnh được — bản sao có chủ đích của
 * `backend/src/common/enums/invitation.enum.ts`.
 *
 * Chỉ chép **danh sách giá trị hợp lệ**, không chép luật nghiệp vụ đi kèm: bao
 * nhiêu ô ảnh cho mỗi gói là chuyện của thiệp và sống ở backend, CMS chỉ cần
 * biết những giá trị nào được phép chọn. Đổi enum ở backend thì sửa nốt ở đây.
 */
export const TEMPLATE_CATEGORIES = [
  "luxury",
  "modern",
  "classic",
  "minimal",
  "traditional",
  "formal",
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

/**
 * Màu chủ đạo của mẫu — **chỉ để hiển thị**. Cột này code làm chủ: màu chốt
 * lúc dựng mẫu và backend không nhận nó qua `UpdateTemplateDto`, nên CMS không
 * có ô sửa. Mã hex là màu đại diện của cả họ màu, cùng bảng với
 * `frontend/constants/invitation.ts` (`TEMPLATE_COLOR_SWATCHES`).
 */
export const TEMPLATE_COLORS = [
  "red",
  "pink",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "brown",
  "black",
  "white",
] as const;
export type TemplateColor = (typeof TEMPLATE_COLORS)[number];

export const TEMPLATE_COLOR_SWATCHES = {
  red: "#b3261e",
  pink: "#e8a0b4",
  orange: "#e07a4f",
  yellow: "#d9b44a",
  green: "#5f8a5a",
  blue: "#3f6aa8",
  purple: "#8e6bb8",
  brown: "#7a5536",
  black: "#1c1c1c",
  white: "#f6f1e7",
} as const satisfies Record<TemplateColor, string>;

export const TEMPLATE_TAGS = ["hot", "new"] as const;
export type TemplateTag = (typeof TEMPLATE_TAGS)[number];

/**
 * Bản sao của `CARD_STATUSES` ở backend. Chỉ còn hai trạng thái: `draft` và
 * `paid` — "Đã xuất bản" (thiệp custom đã kích hoạt, link vĩnh viễn). Hai giá
 * trị cũ `free`/`unpaid` được migration backend chuyển hết sang `paid`.
 */
export const CARD_STATUSES = ["draft", "paid"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];
