import { LEGAL_DOCUMENT_TYPES } from '@common/enums/legal-document.enum';
import type { LegalDocumentType } from '@common/enums/legal-document.enum';
import { IsIn, IsString, Matches } from 'class-validator';

/**
 * Một cặp "văn bản + phiên bản" mà client khai là đã chấp thuận.
 *
 * Phiên bản do client gửi lên chứ không do backend tự điền, và đó là chủ đích:
 * thứ cần ghi lại là chữ **người dùng thật sự nhìn thấy**, không phải chữ đang
 * chạy trên server lúc request tới. Hai giá trị lệch nhau đúng vào lúc vừa
 * deploy một bản legal mới trong khi có người đang mở dở form đăng ký.
 */
export class AcceptedDocumentDto {
  @IsIn(LEGAL_DOCUMENT_TYPES)
  type: LegalDocumentType;

  @IsString()
  @Matches(/^\d+\.\d+$/, { message: 'Phiên bản văn bản không hợp lệ' })
  version: string;
}
