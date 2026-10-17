import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đơn hàng **sống lâu hơn** tài khoản và thiệp đã sinh ra nó.
 *
 * Trước migration này cả `user_id` lẫn `card_id` đều `ON DELETE CASCADE`, nên
 * người dùng tự xoá tài khoản là xoá sạch mọi đơn họ từng trả — trái với Chính
 * sách bảo mật mục 12 đang đăng công khai ("đơn hàng và giao dịch thanh toán
 * không bị xoá theo") và làm hổng chính chứng từ mà luật kế toán bắt giữ.
 *
 * **Phải đổi cả hai cột, không phải chỉ `user_id`.** Xoá tài khoản cascade sang
 * `wedding_cards`, mà `card_id` cascade tiếp sang `orders` — gỡ mỗi `user_id`
 * thì đơn vẫn biến mất theo đường vòng. Cùng lý do đó, luật "thiệp không gia
 * hạn thì xoá vĩnh viễn" cũng sẽ cuốn đơn đi nếu không có bước này.
 *
 * Đơn mất chủ vẫn tự đọc được: `tier`, `amount`, `list_amount`,
 * `discount_amount`, `voucher_code`, `payment_code`, `paid_at` đều đã chốt giá
 * trị ngay trên hàng. Cố ý **không** thêm cột ảnh chụp email — giữ đơn là để
 * đối soát tiền, không phải để lưu lại danh tính người đã yêu cầu được xoá.
 *
 * `payment_transactions.order_id` vốn đã là `SET NULL` từ đầu, nên sổ cái
 * webhook không cần đụng tới.
 */
export class KeepOrdersOnDelete1788900000000 implements MigrationInterface {
  name = 'KeepOrdersOnDelete1788900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_65a62e867c55b454db0297bac84"`,
    );

    // Cột phải nullable trước khi khoá ngoại được phép `SET NULL`.
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "card_id" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_65a62e867c55b454db0297bac84" FOREIGN KEY ("card_id") REFERENCES "wedding_cards"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  /**
   * `down` **không khôi phục được `NOT NULL`** nếu đã có đơn mất chủ: quay lại
   * ràng buộc cũ sẽ vấp chính những hàng mà migration này sinh ra để giữ lại.
   * Vì vậy nó chỉ trả khoá ngoại về `CASCADE` và để cột nullable — đủ để lăn
   * ngược một lần deploy hỏng, không giả vờ dựng lại trạng thái cũ.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_65a62e867c55b454db0297bac84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_65a62e867c55b454db0297bac84" FOREIGN KEY ("card_id") REFERENCES "wedding_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
