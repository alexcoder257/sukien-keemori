import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { STAGED_PHOTO_KINDS } from '../staged-photo.entity';
import type { StagedPhotoKind } from '../staged-photo.entity';
import {
  ALLOWED_MIME_TYPES,
  MAX_PHOTOS_PER_BATCH,
  MAX_UPLOAD_BYTES,
} from '../storage.constants';

export class RequestUploadItemDto {
  @IsIn(STAGED_PHOTO_KINDS)
  kind: StagedPhotoKind;

  /**
   * Định dạng client **khai**. Chỉ để chọn đúng `Content-Type` ký vào URL và từ
   * chối sớm; kiểm thật là bước giải mã ở worker.
   */
  @IsIn(ALLOWED_MIME_TYPES)
  contentType: string;

  /** Như trên: số client khai, bước báo xong mới đo cỡ thật. */
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  size: number;
}

/** Xin chỗ gửi cho **cả lô** ảnh vừa chọn trong một request. */
export class RequestUploadsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PHOTOS_PER_BATCH)
  @ValidateNested({ each: true })
  @Type(() => RequestUploadItemDto)
  items: RequestUploadItemDto[];
}

export class StagedPhotoIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PHOTOS_PER_BATCH)
  @IsUUID('4', { each: true })
  ids: string[];
}

export class ClaimStagedPhotosDto extends StagedPhotoIdsDto {
  @IsUUID('4')
  cardId: string;
}
