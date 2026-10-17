import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm loại thông báo `payment_success` — báo chủ thiệp biết tiền đã về và gói
 * đã được nâng (bắn từ `CommerceService.markPaid`).
 *
 * `down` để rỗng vì Postgres không có `ALTER TYPE ... DROP VALUE`; xem ghi chú
 * đầy đủ ở `1787100000000-AddLinkExpiringNotification.ts`.
 */
export class AddPaymentSuccessNotification1787200000000 implements MigrationInterface {
  name = 'AddPaymentSuccessNotification1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'payment_success'`,
    );
  }

  public async down(): Promise<void> {
    // Xem ghi chú ở đầu file: cố ý không làm gì.
  }
}
