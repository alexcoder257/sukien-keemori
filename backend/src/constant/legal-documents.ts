import type { LegalDocumentType } from '@common/enums/legal-document.enum';

/**
 * Phiên bản đang hiệu lực của từng văn bản pháp lý.
 *
 * Đây là **bản sao có chủ đích** của `LEGAL_DOCUMENTS` trong
 * `frontend/constants/legal.ts` — cùng loại với `apis/http.ts` và
 * `constants/role.ts` mà `CLAUDE.md` đã nói: sửa một bên thì phải sửa nốt bên
 * kia. Chữ của văn bản nằm ở `dictionaries/` của frontend nên phiên bản phải
 * đi cùng chữ; backend chỉ cần biết con số cho **một** trường hợp duy nhất.
 *
 * Trường hợp đó là đăng nhập bằng Google/Facebook: ở đó không có form nào để
 * gửi phiên bản lên, chỉ có một cú chuyển hướng sang nhà cung cấp. Mọi đường
 * còn lại (`POST /auth/register`, `POST /legal/acceptances`) đều ghi **phiên
 * bản client gửi lên**, vì thứ cần ghi lại là chữ người dùng thật sự nhìn
 * thấy, không phải chữ đang chạy trên server lúc request tới.
 */
export const LEGAL_DOCUMENT_VERSIONS: Record<
  Exclude<LegalDocumentType, 'partner_terms'>,
  string
> = {
  terms: '7.0',
  privacy: '5.1',
  payment_refund: '3.1',
  complaints: '1.0',
};
