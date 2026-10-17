/**
 * Chỉ giữ những trường client thật sự gửi lên, để gộp một DTO cập nhật vào
 * entity mà không xoá trắng phần còn lại.
 *
 * Cần hàm này vì `target: ES2023` làm TypeScript khai **mọi** field của class
 * bằng `Object.defineProperty(..., undefined)`. `ValidationPipe` dựng DTO bằng
 * `new UpdateXDto()`, nên một PATCH chỉ gửi `{ a: 1 }` vẫn ra một object có đủ
 * `b: undefined, c: undefined…`. `Object.assign(entity, dto)` chép cả những
 * `undefined` đó lên entity.
 *
 * Database thường không hỏng (TypeORM bỏ qua cột `undefined` khi UPDATE), nên
 * lỗi này im lặng: nó nằm ở **entity trả về**. `SiteSettings` là ca đắt nhất —
 * entity đó được giữ làm bản nhớ, nên lưu số mẫu nổi bật từng xoá luôn thiệp
 * hero và trần lượt xem cho tới khi backend khởi động lại.
 *
 * `null` vẫn đi qua: đó là "gỡ giá trị" có chủ đích, khác với "không gửi".
 */
export function definedFields<T extends object>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
