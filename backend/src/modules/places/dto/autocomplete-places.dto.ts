import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

/**
 * Tối thiểu 3 ký tự: dưới ngưỡng đó gợi ý gần như vô nghĩa mà vẫn tính tiền.
 * Frontend cũng chặn ở cùng con số, nhưng ràng buộc thật phải nằm ở backend —
 * client là thứ sửa được.
 */
export class AutocompletePlacesDto {
  @IsString()
  @Length(3, 200)
  q: string;

  /**
   * UUID do client sinh cho một phiên gõ. Google gộp cả chuỗi gõ và lần chọn
   * cuối vào một session để tính tiền, nên thiếu nó thì mỗi phím là một lượt
   * tính tiền riêng. Không tin được nên chỉ giới hạn độ dài, không ép định
   * dạng: token hỏng chỉ làm hoá đơn đắt hơn, không phải lỗ hổng.
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionToken?: string;
}
