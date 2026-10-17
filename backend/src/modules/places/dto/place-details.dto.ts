import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PlaceDetailsDto {
  /** `placeId` lấy từ chính danh sách gợi ý — không phải thứ người dùng gõ. */
  @IsString()
  @MaxLength(255)
  placeId: string;

  /** Cùng token với bước autocomplete thì cả phiên tính tiền một lần. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionToken?: string;
}
