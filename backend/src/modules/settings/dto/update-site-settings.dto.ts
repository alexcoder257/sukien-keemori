import { SHOWCASE_KINDS } from '@common/enums/invitation.enum';
import type { ShowcaseKind } from '@common/enums/invitation.enum';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Cập nhật cấu hình vận hành. Mọi trường đều tuỳ chọn — CMS gửi đúng thứ vừa
 * đổi, không bắt gửi lại nguyên khối.
 */
export class UpdateSiteSettingsDto {
  /** Trần 24: dải trang chủ dài hơn thế thì không ai cuộn hết. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  homepageTemplateCount?: number;

  /**
   * Link Messenger của fanpage. Ô trống trong CMS gửi lên chuỗi rỗng — quy về
   * `null` để "xoá cấu hình" là một hành động làm được, chứ không phải một
   * chuỗi rỗng nằm lại trong DB rồi frontend phải tự đoán.
   *
   * `@ValidateIf` bỏ qua `IsUrl` đúng ở nhánh `null` đó; mọi giá trị khác vẫn
   * phải là URL thật vì nó đi thẳng vào `href` của người dùng.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(255)
  messengerUrl?: string | null;

  /**
   * Slug thiệp mẫu cho nút "Xem thiệp mẫu" ở trang chủ. Cùng lối quy chuỗi rỗng
   * về `null` như `messengerUrl`: bỏ trống là gỡ cấu hình, không phải lưu một
   * chuỗi rỗng rồi để frontend tự đoán.
   *
   * Không kiểm chéo thiệp có tồn tại hay không — CMS chọn từ danh sách thiệp
   * đã xuất bản nên giá trị sai chỉ đến từ việc gọi API tay, và hệ quả xấu nhất
   * là một nút dẫn tới trang 404 của chính mình.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(60)
  demoCardSlug?: string | null;

  /** `demoCardSlug` là thiệp hay là mẫu — xem `SHOWCASE_KINDS`. */
  @IsOptional()
  @IsIn(SHOWCASE_KINDS)
  demoCardKind?: ShowcaseKind;

  /**
   * Ba kênh mạng xã hội ở chân trang. Cùng luật với `messengerUrl`: chuỗi rỗng
   * về `null` (gỡ biểu tượng), còn lại phải là URL http(s) thật — giá trị này
   * đi thẳng vào `href` trên mọi trang khách, nên chặn `javascript:` ở đây.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(255)
  facebookUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(255)
  instagramUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(255)
  tiktokUrl?: string | null;

  /**
   * Số Zalo. Bỏ khoảng trắng, dấu chấm, gạch ngang trước khi kiểm — người vận
   * hành hay dán số đã nhóm sẵn (`0358 465 162`). Chỉ nhận số di động/cố định
   * nội địa 10 chữ số: con số này dựng thành `https://zalo.me/<số>`, và một
   * số sai định dạng là một link mở ra "không tìm thấy tài khoản".
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const digits = value.replace(/[\s.-]/g, '');
    return digits === '' ? null : digits;
  })
  @ValidateIf((_, value) => value !== null)
  @Matches(/^0\d{9}$/)
  zaloPhone?: string | null;

  /** Email ở chân trang — thành `mailto:` nên phải là địa chỉ hợp lệ. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @ValidateIf((_, value) => value !== null)
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string | null;
}
