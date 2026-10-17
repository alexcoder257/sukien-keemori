import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gộp mọi gói thiệp về **một gói custom duy nhất** (thanh toán ngoài hệ
 * thống): không còn Free/Gold/Diamond, dùng thử 3 ngày hay trần người xem.
 *
 * - `plan_tier` thành `diamond` ở mọi hàng — cột di sản, nhưng đặt đủ quyền để
 *   mọi phép kiểm còn sót lại đều qua.
 * - Thiệp `free`/`unpaid` (đã xuất bản) thành `paid`: link vĩnh viễn, bỏ hạn
 *   (`expires_at = NULL`). `paid_at` lấp bằng ngày xuất bản (hoặc hôm nay) để
 *   có mốc cho luật khoá tên cô dâu chú rể 15 ngày — hàng đã có `paid_at` thì
 *   giữ nguyên.
 *
 * Không đụng bảng/cột nào khác: `orders`, `payment_transactions`, `vouchers`,
 * `tier_prices`, `expenses`, `site_settings.unpaid_*`... vẫn nằm nguyên trong
 * database nhưng không còn code dùng. Hai giá trị enum `free`/`unpaid` cũng ở
 * lại vì Postgres không xoá được giá trị enum.
 */
export class CollapseCardPlans1795300000000 implements MigrationInterface {
  name = 'CollapseCardPlans1795300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // So sánh qua `::text` để không phụ thuộc vào việc enum đã được nạp chưa.
    await queryRunner.query(
      `UPDATE "wedding_cards"
          SET "status" = 'paid',
              "expires_at" = NULL,
              "paid_at" = COALESCE("paid_at", "published_at", now())
        WHERE "status"::text IN ('free', 'unpaid')`,
    );
    await queryRunner.query(
      `UPDATE "wedding_cards" SET "plan_tier" = 'diamond'`,
    );
  }

  /**
   * Không hoàn tác được một cách có nghĩa: sau `up` không còn dấu vết nào cho
   * biết hàng nào từng là `free`/`unpaid` hay mang gói nào, nên `down` cố ý
   * không làm gì thay vì đoán.
   */
  public async down(): Promise<void> {
    // No-op có chủ đích — xem ghi chú ở trên.
  }
}
