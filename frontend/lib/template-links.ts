import {
  INVITATION_KIND_QUERY_PARAM,
  INVITATION_KIND_SLUGS,
  type InvitationKind,
} from "@/constants/invitation";
import type { Locale } from "@/i18n/config";

/**
 * Lối vào editor để dựng một thiệp mới trên mẫu này. Mẫu khác thiệp cưới mang
 * thêm `?loai`, cùng dạng với đường dẫn editor tự dựng (`editorPath` trong
 * `invitation-editor.tsx`) — trang editor vẫn suy được loại từ chính mẫu, nhưng
 * nháp được khoá theo cả mẫu lẫn loại.
 */
export function templateEditorHref(
  locale: Locale,
  template: { slug: string; kind: InvitationKind },
): string {
  const base = `/${locale}/editor/${template.slug}`;
  return template.kind === "wedding"
    ? base
    : `${base}?${INVITATION_KIND_QUERY_PARAM}=${INVITATION_KIND_SLUGS[template.kind]}`;
}
