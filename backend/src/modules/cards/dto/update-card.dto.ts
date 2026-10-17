import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { InvitationContentDto } from './invitation-content.dto';

/**
 * Lưu thiệp. `content` gửi **nguyên khối** chứ không patch từng field: editor
 * giữ toàn bộ form trong bộ nhớ nên bản gửi lên luôn là bản đầy đủ, và ghi
 * nguyên khối thì không có trạng thái nửa vời trong cột JSONB.
 */
export class UpdateCardDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvitationContentDto)
  content?: InvitationContentDto;
}

/**
 * Đổi mẫu. Tách khỏi `UpdateCardDto` vì đây là thao tác có luật riêng: **nội dung phải được giữ nguyên**
 * kể cả ảnh của ô mà mẫu mới không có (`docs/business-model.md` mục 4).
 */
export class ChangeTemplateDto {
  @IsString()
  @MaxLength(60)
  templateSlug: string;
}
