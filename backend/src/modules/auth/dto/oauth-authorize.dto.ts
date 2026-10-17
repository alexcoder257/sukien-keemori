import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Phải khớp `locales` của frontend (`frontend/i18n/config.ts`).
const SUPPORTED_LOCALES = ['vi', 'en'];

export class OAuthAuthorizeDto {
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale?: string;

  /**
   * Đường dẫn quay lại sau khi đăng nhập. Chỉ nhận path nội bộ: `//evil.com`
   * cũng là URL tuyệt đối với trình duyệt, nên chặn ngay dấu `/` thứ hai —
   * nếu không đây là một lỗ open redirect.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^\/(?!\/)[^\s]*$/)
  next?: string;
}
