import { SHOWCASE_KINDS } from '@common/enums/invitation.enum';
import type { ShowcaseKind } from '@common/enums/invitation.enum';
import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Một ô trong dải "Cặp đôi đã tạo thiệp" ở trang chủ.
 *
 * `slug` là slug của một thiệp có thật (`/t/<slug>`) — ô trong dải là link tới
 * thiệp đó. Không kiểm chéo sang `wedding_cards` ở đây: dải này trưng **thiệp
 * demo do mình dựng**, và thiệp demo có thể được seed sau khi hàng trưng bày
 * đã được tạo; ràng buộc cứng chỉ khiến người vận hành không lưu nổi form.
 *
 * `imageSrc` là đường dẫn **tương đối** (`/uploads/...` hoặc `/images/...`),
 * đổi tên miền hay lên CDN thì không phải backfill.
 */
export class CreateCoupleShowcaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  slug: string;

  /** `card` (`/t/<slug>`) hay `template` (`/mau-thiep/<slug>/demo`). */
  @IsOptional()
  @IsIn(SHOWCASE_KINDS)
  kind?: ShowcaseKind;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  names: string;

  /** Nhãn hiển thị (`22/11/2026`), không phải mốc để tính toán. */
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  weddingDate: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^\//, { message: 'Ảnh phải là đường dẫn nội bộ bắt đầu bằng /' })
  imageSrc: string;

  /** Ảnh bìa của card; `null` là suy từ `imageSrc` (xem entity). */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^\//, { message: 'Ảnh phải là đường dẫn nội bộ bắt đầu bằng /' })
  posterSrc?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  imagePosition?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateCoupleShowcaseDto extends PartialType(
  CreateCoupleShowcaseDto,
) {}

/**
 * Thứ tự mới của **cả dải**, id theo đúng thứ tự hiển thị.
 *
 * Gửi cả danh sách chứ không gửi "kéo ô A tới vị trí 3": kéo thả ở CMS đổi vị
 * trí của nhiều ô một lúc, và ghi lại toàn bộ trong một transaction thì không
 * bao giờ còn hai ô trùng số thứ tự như khi sửa tay từng ô.
 */
export class ReorderCoupleShowcasesDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ids: string[];
}
