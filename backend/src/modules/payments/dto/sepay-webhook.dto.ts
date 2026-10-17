import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

/**
 * Payload SePay POST về webhook.
 *
 * Cố ý **lỏng** hơn các DTO khác trong dự án: đây không phải input của người
 * dùng mà là hợp đồng của một hệ thống bên ngoài. Siết quá tay thì một trường
 * mới do SePay thêm vào sẽ làm cả webhook trả 400, SePay thử lại 7 lần rồi bỏ
 * cuộc, và tiền của khách về mà thiệp không được nâng gói. Những gì thật sự
 * cần để xử lý thì bắt buộc; phần còn lại tuỳ chọn và vẫn được lưu nguyên trong
 * `rawPayload`.
 */
export class SepayWebhookDto {
  /** Khoá chống lặp — bắt buộc, không có thì không chống trùng được. */
  @IsInt()
  @Type(() => Number)
  id: number;

  @IsString()
  gateway: string;

  @IsString()
  transactionDate: string;

  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  subAccount?: string | null;

  /** `in` = tiền vào, `out` = tiền ra. Chỉ `in` mới có thể là thanh toán. */
  @IsIn(['in', 'out'])
  transferType: 'in' | 'out';

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  transferAmount: number;

  /**
   * Nội dung rút gọn. SePay có thể để trống trường này và chỉ điền
   * `description`, nên cả hai đều tuỳ chọn và service ghép lại rồi mới dò mã.
   */
  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  /** Mã tham chiếu SePay tự bóc từ nội dung — có thì dùng, không thì tự dò. */
  @IsOptional()
  @IsString()
  code?: string | null;

  @IsOptional()
  @IsString()
  referenceCode?: string | null;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  accumulated?: number;
}

/**
 * Ghép tay một giao dịch mồ côi vào một đơn, thao tác của admin ở CMS.
 *
 * Nhận **mã đơn** (8 ký tự khách thấy ở màn chuyển khoản), không phải UUID: đó
 * là thứ người vận hành đọc được từ khách qua điện thoại hay tin nhắn.
 */
export class MatchTransactionDto {
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(4, 20)
  paymentCode: string;
}
