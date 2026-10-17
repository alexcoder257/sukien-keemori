/**
 * Sáu loại thiệp — **bản sao có chủ đích** của `INVITATION_KINDS` ở
 * `backend/src/common/enums/invitation.enum.ts` (và `frontend/constants/
 * invitation.ts`). Loại nằm trong `content.kind` của thiệp; thiệp cũ không mang
 * khoá này là `wedding`, và backend đã điền sẵn giá trị đó vào mỗi dòng.
 */
export const INVITATION_KINDS = [
  "wedding",
  "birthday",
  "graduation",
  "event",
  "anniversary",
  "greeting",
] as const;
export type InvitationKind = (typeof INVITATION_KINDS)[number];
