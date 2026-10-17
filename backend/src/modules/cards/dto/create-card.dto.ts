import { INVITATION_KINDS } from '@common/enums/invitation.enum';
import type { InvitationKind } from '@common/enums/invitation.enum';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Tạo thiệp mới. Nội dung **không** truyền ở đây — thiệp mới luôn bắt đầu từ
 * nội dung rỗng do backend dựng, rồi mới PUT nội dung. Nhờ vậy chỉ có một chỗ
 * định nghĩa "thiệp rỗng trông như thế nào".
 *
 * Đường dẫn cũng không: nó luôn do hệ thống sinh (`CardsService.publish`) —
 * người dùng không đặt hay đổi đường dẫn thiệp.
 *
 * Không có khái niệm gói: thiệp nào cũng đủ tính năng (`plan_tier` là cột di
 * sản, luôn ghi `diamond`).
 */
export class CreateCardDto {
  /** Slug trong kho mẫu, hoặc `DEFAULT_TEMPLATE_SLUG` cho mẫu dựng sẵn. */
  @IsString()
  @MaxLength(60)
  templateSlug: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  /**
   * Loại thiệp, chọn ở bước đầu tiên trước khi vào form. Thiếu là `wedding`.
   * Chỉ nhận lúc tạo — sau đó không đổi được (`CardsService.update`).
   */
  @IsOptional()
  @IsIn(INVITATION_KINDS)
  kind?: InvitationKind;
}
