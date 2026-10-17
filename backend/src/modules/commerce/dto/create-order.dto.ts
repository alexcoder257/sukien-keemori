import { AcceptedDocumentDto } from '@modules/legal/dto/accepted-document.dto';
import { normalizeCode } from '@modules/vouchers/dto/upsert-voucher.dto';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * Tạo đơn cho một thiệp. `amount` **không** nhận từ client — giá do backend
 * tra bảng giá và chốt tại thời điểm tạo đơn, nếu không thì khách tự khai giá.
 * Chỉ còn một gói nên đơn không mang gói nào.
 */
export class CreateOrderDto {
  @IsUUID()
  cardId: string;

  /** Mã giảm giá khách đã nhập ở hộp thanh toán. Bỏ trống là không dùng mã. */
  @IsOptional()
  @Transform(({ value }) => normalizeCode(value))
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  voucherCode?: string;

  /**
   * Văn bản khách đã tick ở hộp thanh toán (Chính sách thanh toán và hoàn tiền,
   * Điều khoản). Phiên bản do client gửi — thứ cần ghi sổ là chữ người dùng
   * thật sự nhìn thấy. Bỏ trống thì backend vẫn ghi Chính sách thanh toán ở
   * phiên bản hiện hành (bấm thanh toán là chấp thuận).
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => AcceptedDocumentDto)
  acceptedDocuments?: AcceptedDocumentDto[];
}

/** Thử một mã trước khi tạo đơn. Không nhận số tiền từ client. */
export class PreviewVoucherDto {
  @Transform(({ value }) => normalizeCode(value))
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  code: string;
}

/**
 * Xác nhận thanh toán thủ công — đường cứu hộ khi webhook SePay báo hụt. Chỉ
 * admin gọi được và đi vào cùng `markPaid` như webhook.
 */
export class ConfirmPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  gatewayReference?: string;
}
