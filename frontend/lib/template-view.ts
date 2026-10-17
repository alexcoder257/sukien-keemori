import { recordTemplateView, type TemplateViewKind } from "@/apis/template-view";

const STORAGE_PREFIX = "template-view";

/**
 * Báo một lượt xem mẫu, **tối đa một lần mỗi ngày** cho mỗi mẫu và mỗi loại
 * trên trình duyệt này — cùng cách `VisitBeacon` đếm khách trong ngày. Mở đi
 * mở lại một mẫu, hay đóng hộp thoại rồi mở lại, không thổi phồng con số.
 *
 * `localStorage` bị chặn (chế độ riêng tư) thì vẫn báo: đếm dư một chút còn
 * hơn mất hẳn lượt xem của nhóm người đó.
 */
export function reportTemplateView(slug: string, kind: TemplateViewKind) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${STORAGE_PREFIX}:${kind}:${slug}`;
  try {
    if (window.localStorage.getItem(key) === today) return;
    window.localStorage.setItem(key, today);
  } catch {
    // Không đọc/ghi được localStorage: vẫn báo, xem ghi chú ở trên.
  }
  recordTemplateView(slug, kind);
}
