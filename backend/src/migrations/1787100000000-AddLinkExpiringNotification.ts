import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm loại thông báo `link_expiring` — nhắc chủ thiệp trước khi link chưa
 * thanh toán hết hiệu lực (job ở `src/cronjob/link-expiry.cron.ts`).
 *
 * `down` **không gỡ được giá trị enum**: Postgres không có `ALTER TYPE ... DROP
 * VALUE`, muốn bỏ thì phải dựng type mới rồi chuyển cột sang, mà làm vậy sẽ hỏng
 * mọi hàng đang mang giá trị này. Vì đây là thao tác chỉ thêm và không phá gì,
 * `down` để rỗng là trung thực hơn một đoạn code giả vờ quay lui được.
 */
export class AddLinkExpiringNotification1787100000000 implements MigrationInterface {
  name = 'AddLinkExpiringNotification1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'link_expiring'`,
    );
  }

  public async down(): Promise<void> {
    // Xem ghi chú ở đầu file: cố ý không làm gì.
  }
}
