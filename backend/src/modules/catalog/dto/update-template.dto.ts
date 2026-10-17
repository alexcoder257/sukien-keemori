import {
  PHOTO_SLOT_KEYS,
  TEMPLATE_CATEGORIES,
  TEMPLATE_TAGS,
} from '@common/enums/invitation.enum';
import type {
  PhotoSlotKey,
  TemplateCategory,
  TemplateTag,
} from '@common/enums/invitation.enum';
import { TIERS } from '@common/enums/tier.enum';
import type { Tier } from '@common/enums/tier.enum';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Admin chỉnh metadata của mẫu. `slug` **không** nằm ở đây: nó là khoá nối tới
 * component và thư mục ảnh phía frontend, đổi được thì thiệp cũ mất mẫu.
 */
export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(TIERS)
  tier?: Tier;

  @IsOptional()
  @IsArray()
  @IsIn(TEMPLATE_CATEGORIES, { each: true })
  categories?: TemplateCategory[];

  @IsOptional()
  @IsArray()
  @IsIn(TEMPLATE_TAGS, { each: true })
  tags?: TemplateTag[];

  @IsOptional()
  @IsArray()
  @IsIn(PHOTO_SLOT_KEYS, { each: true })
  photoSlots?: PhotoSlotKey[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  imagePosition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageSrc?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  featuredOnHome?: boolean;

  @IsOptional()
  @IsInt()
  homepageOrder?: number;
}

/**
 * Đặt lại **cả dải** mẫu trang chủ trong một lần gọi, theo đúng thứ tự gửi lên.
 * Không dùng `PATCH` từng mẫu: màn trang chủ sửa một danh sách có thứ tự, mà
 * gửi từng mẫu một thì giữa chừng dải hiện ra sai thứ tự hoặc thừa mẫu.
 */
export class SetHomepageTemplatesDto {
  @IsArray()
  @IsString({ each: true })
  slugs: string[];
}
