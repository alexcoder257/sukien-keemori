import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

// Locale được dùng để dựng link trong email trỏ đúng ngôn ngữ người dùng.
const SUPPORTED_LOCALES = ['vi', 'en'] as const;

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  // Token reCAPTCHA v2 từ frontend. Optional ở tầng DTO để môi trường dev
  // chưa cấu hình captcha vẫn chạy được; CaptchaService mới là nơi bắt buộc
  // khi RECAPTCHA_SECRET_KEY đã được set.
  @IsOptional()
  @IsString()
  captchaToken?: string;

  // true khi request đến từ nút "Gửi lại" — bước này đã bị chặn spam bằng
  // cooldown 60s + trần 3 lần/giờ theo email (canSendResetEmail) và throttle
  // theo IP, nên bỏ qua captcha để đỡ bắt người dùng tick lại mỗi lần gửi lại.
  @IsOptional()
  @IsBoolean()
  isResend?: boolean;

  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale?: (typeof SUPPORTED_LOCALES)[number];
}
