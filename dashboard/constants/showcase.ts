/**
 * Một ô trưng bày trên trang chủ trỏ tới thiệp nào — **bản sao có chủ đích** của
 * `SHOWCASE_KINDS` ở `backend/src/common/enums/invitation.enum.ts`, cùng quy ước
 * với `constants/role.ts` (xem `CLAUDE.md`).
 *
 * - `card`: một thiệp có thật → `/t/<slug>`.
 * - `template`: bản demo của một mẫu trong kho → `/mau-thiep/<slug>/demo`.
 *
 * Lưu `kind` thay vì suy từ slug: hai bảng khác nhau và không có gì cấm một mẫu
 * trùng slug với một thiệp.
 */
export const SHOWCASE_KINDS = ["card", "template"] as const;
export type ShowcaseKind = (typeof SHOWCASE_KINDS)[number];
