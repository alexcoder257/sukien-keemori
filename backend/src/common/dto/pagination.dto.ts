import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Tham số phân trang dùng chung cho các route danh sách của khu quản trị.
 *
 * **`limit` để trống nghĩa là lấy hết**, không phải một giá trị mặc định ngầm.
 * Cùng một route phục vụ hai nhu cầu khác nhau: bảng trong CMS lật từng trang,
 * còn ô chọn thiệp và form "mẫu trên trang chủ" cần cả kho trong một lượt để
 * chọn và sắp thứ tự. Đặt mặc định 20 ở đây thì hai chỗ sau âm thầm mất dữ
 * liệu mà không có lỗi nào nổi lên.
 *
 * Trần 200: đủ cho mọi bảng trong CMS, và nó là hàng rào chống một request
 * `limit=100000` kéo cả bảng vào bộ nhớ.
 */
export class PaginationDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === undefined ? undefined : Number(value),
  )
  @IsInt()
  @Min(0)
  offset?: number;
}

/**
 * Hình dạng trả về của mọi route danh sách có phân trang.
 *
 * `total` là **tổng số hàng khớp bộ lọc**, không phải số hàng trong trang này —
 * bảng ở CMS cần nó để vẽ thanh phân trang và để nói "Tổng N mục".
 */
export interface Paginated<T> {
  items: T[];
  total: number;
}
