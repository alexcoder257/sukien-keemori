import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Giá của **gói thiệp duy nhất**: 899.000 ₫, lưu ở hàng `tier = 'diamond'` của
 * `tier_prices` (cột `tier` là di sản của mô hình Free/Gold/Diamond).
 *
 * - Chưa có hàng `diamond` → tạo mới (không khuyến mãi gói).
 * - Đã có → đặt `price = 899000`, **không** đụng `discount_percent` mà vận hành
 *   đã cấu hình. `repeat_price` (NOT NULL, di sản) cũng đặt bằng giá bán để
 *   không còn giá mua lại nào lệch ra.
 *
 * Hai hàng `free`/`gold` cũ nằm nguyên, không code nào đọc.
 */
export class SinglePackagePrice1795400000000 implements MigrationInterface {
  name = 'SinglePackagePrice1795400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "tier_prices"
         ("tier", "price", "repeat_price", "album_enabled", "album_photo_cap",
          "highlighted", "surface")
       VALUES ('diamond', 899000, 899000, true, 30, false, 'dark')
       ON CONFLICT ("tier") DO UPDATE
         SET "price" = 899000, "repeat_price" = 899000`,
    );
  }

  /** Không hoàn tác được một cách có nghĩa: giá cũ của hàng đã bị ghi đè. */
  public async down(): Promise<void> {
    // No-op có chủ đích.
  }
}
