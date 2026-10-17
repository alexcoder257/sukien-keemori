import { BaseEntity } from '@configuration/base-entity/base.entity';
import {
  LEGAL_ACCEPTANCE_SOURCES,
  LEGAL_DOCUMENT_TYPES,
} from '@common/enums/legal-document.enum';
import type {
  LegalAcceptanceSource,
  LegalDocumentType,
} from '@common/enums/legal-document.enum';
import { User } from '@modules/user/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

/**
 * Một lần người dùng chấp thuận một **phiên bản cụ thể** của một văn bản pháp
 * lý.
 *
 * Bảng này là **sổ, không phải trạng thái**: bản ghi không bao giờ được sửa hay
 * xoá. Khi Điều khoản lên 2.0, hàng "user A chấp thuận 1.0" phải còn nguyên —
 * câu hỏi mà bên pháp chế sẽ hỏi là "lúc đăng ký người này đã đồng ý với chữ
 * nào", và ghi đè bản cũ là câu trả lời duy nhất không lấy lại được.
 *
 * Vì thế khoá duy nhất là bộ ba `(user, document, version)` chứ không phải
 * `(user, document)`: mỗi phiên bản một hàng, chấp thuận lại cùng phiên bản thì
 * không sinh hàng mới.
 *
 * **Không lưu IP hay user-agent.** Chúng là dữ liệu cá nhân, và Chính sách bảo
 * mật hiện tại không mô tả việc lưu chúng cho mục đích này. Muốn thêm thì phải
 * sửa Chính sách bảo mật trước, không phải sửa bảng trước.
 */
@Entity('legal_acceptances')
@Unique('uq_legal_acceptances_user_doc_version', [
  'userId',
  'documentType',
  'documentVersion',
])
export class LegalAcceptance extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /**
   * Xoá tài khoản thật (người dùng tự xoá ở `AuthService.deleteAccount`) thì
   * sổ chấp thuận đi theo: giữ lại một hàng trỏ vào tài khoản không còn tồn
   * tại là giữ dữ liệu cá nhân mà không còn mục đích nào.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: LEGAL_DOCUMENT_TYPES,
  })
  documentType: LegalDocumentType;

  /** Phiên bản đúng như hiển thị trên trang lúc đó, ví dụ `2.0`. */
  @Column({ name: 'document_version', type: 'varchar', length: 16 })
  documentVersion: string;

  @Column({
    type: 'enum',
    enum: LEGAL_ACCEPTANCE_SOURCES,
    default: 'register',
  })
  source: LegalAcceptanceSource;

  /**
   * Cột riêng thay vì mượn `createdAt`: `createdAt` nói bản ghi được ghi lúc
   * nào, còn cột này nói người dùng đồng ý lúc nào. Hai mốc trùng nhau hôm nay,
   * nhưng một lần backfill dữ liệu cũ là chúng tách ra vĩnh viễn.
   */
  @Column({ name: 'accepted_at', type: 'timestamptz' })
  acceptedAt: Date;
}
