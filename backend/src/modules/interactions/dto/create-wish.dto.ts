import {
  WISH_MAX_MESSAGE_LENGTH,
  WISH_MAX_NAME_LENGTH,
} from '@common/constants/invitation.constants';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Khách mời gửi lời chúc. Không có `approved` ở đây — trạng thái duyệt do
 * backend đặt và chỉ chủ thiệp đổi được.
 */
export class CreateWishDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(WISH_MAX_NAME_LENGTH)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(WISH_MAX_MESSAGE_LENGTH)
  message: string;
}

/**
 * Chủ thiệp đổi trạng thái duyệt của một lời chúc. Một route mang cờ thay vì
 * hai route duyệt/bỏ duyệt: UI có sẵn cả hai chiều ("Duyệt" và "Ẩn khỏi
 * thiệp"), mà cả hai đều là cùng một phép ghi lên cùng một cột.
 */
export class UpdateWishApprovalDto {
  @IsBoolean()
  approved: boolean;
}

/** Thêm mẫu vào danh sách yêu thích. */
export class CreateFavoriteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  templateSlug: string;
}
