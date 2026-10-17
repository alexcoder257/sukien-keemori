import { API_BASE_URL } from "./config";

/** `open`: mở xem mẫu (hộp thoại hoặc trang mẫu). `demo`: mở bản thiệp đầy đủ. */
export type TemplateViewKind = "open" | "demo";

/**
 * Báo backend một lượt xem mẫu — số liệu cho màn "Mẫu xem nhiều" của CMS.
 * Không gửi định danh nào; lỗi mạng im lặng bỏ qua vì đây là số liệu phụ, không
 * được làm hỏng trải nghiệm của người đang chọn mẫu.
 */
export function recordTemplateView(slug: string, kind: TemplateViewKind) {
  void fetch(
    `${API_BASE_URL}/templates/${encodeURIComponent(slug)}/views`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
      keepalive: true,
    },
  ).catch(() => {});
}
