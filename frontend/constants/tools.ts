/**
 * Công cụ miễn phí ở `/[locale]/cong-cu/*`.
 *
 * Danh sách này là nguồn duy nhất cho trang tổng hợp, sitemap, chân trang và
 * khối "Công cụ khác" ở cuối mỗi trang công cụ. Đường dẫn giữ tiếng Việt ở cả
 * hai locale, giống `/bang-gia` và `/huong-dan`.
 */
export const TOOLS_PATH = "/cong-cu";

export const TOOLS = [
  { key: "lunar", slug: "doi-ngay-am-duong" },
  { key: "tables", slug: "tinh-so-ban-tiec-cuoi" },
  { key: "qr", slug: "tao-ma-qr" },
] as const;

export type ToolKey = (typeof TOOLS)[number]["key"];

export function toolPath(key: ToolKey): string {
  const tool = TOOLS.find((item) => item.key === key);
  return `${TOOLS_PATH}/${tool?.slug ?? ""}`;
}
