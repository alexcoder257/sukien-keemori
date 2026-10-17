import {
  GUEST_TOKEN_MAX_LENGTH,
  RSVP_MAX_PARTY_SIZE,
  RSVP_NAME_MAX_LENGTH,
} from '@common/constants/invitation.constants';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Khách gửi xác nhận tham dự.
 *
 * `partySize` luôn phải hợp lệ kể cả khi `attending = false` — form gửi nguyên
 * giá trị của ô số người — và service hạ nó về `0`. Bắt client gửi `0` riêng cho
 * nhánh "không đi" chỉ là thêm một chỗ để hai bên lệch nhau.
 *
 * `guestToken` là mã trong link mời riêng. Không có hay không khớp thì phản hồi
 * ghi như từ link chung — không ném lỗi, cùng luật hỏng mềm với lời chào.
 */
export class CreateRsvpDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(RSVP_NAME_MAX_LENGTH)
  name: string;

  @IsBoolean()
  attending: boolean;

  @IsInt()
  @Min(1)
  @Max(RSVP_MAX_PARTY_SIZE)
  partySize: number;

  @IsOptional()
  @IsString()
  @MaxLength(GUEST_TOKEN_MAX_LENGTH)
  guestToken?: string;
}
