import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm `checkout` vào nguồn chấp thuận văn bản pháp lý.
 *
 * Trước đó, khu thanh toán **không nhắc tới Chính sách thanh toán và hoàn tiền
 * ở bất kỳ đâu** — khách bấm "Tiếp tục thanh toán" mà chưa từng được cho biết
 * luật hoàn tiền nào đang áp dụng. Giờ hộp chọn hình thức thanh toán hiện câu
 * chấp thuận kèm đường dẫn, và `CommerceService.createOrder` ghi lại phiên bản
 * văn bản tại đúng thời điểm đó.
 *
 * `ALTER TYPE ... ADD VALUE` chạy được trong transaction từ **Postgres 12**, với
 * ràng buộc là giá trị mới chưa dùng được cho tới khi transaction commit —
 * migration này chỉ thêm giá trị nên không vướng. Không khai
 * `transaction = false` vì TypeORM của dự án đang chạy ở chế độ transaction
 * chung ("all") và sẽ từ chối migration nào tự đổi chế độ.
 *
 * `down` để trống có chủ đích: Postgres không cho xoá một giá trị khỏi enum, và
 * dựng lại cả kiểu thì phải viết lại mọi cột đang dùng nó.
 */
export class AddCheckoutAcceptanceSource1788200000000 implements MigrationInterface {
  name = 'AddCheckoutAcceptanceSource1788200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."legal_acceptances_source_enum" ADD VALUE IF NOT EXISTS 'checkout'`,
    );
  }

  public async down(): Promise<void> {
    // Không revert được — xem chú thích ở đầu file.
  }
}
