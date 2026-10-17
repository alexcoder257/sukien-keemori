import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gỡ hẳn hai tính năng: **đối tác B2B** và **blog**.
 *
 * `up`, theo thứ tự (khoá ngoại quyết định thứ tự):
 *
 * 1. Mã giảm giá độc quyền của cửa hàng bị **tắt** (`is_active = false`) trước
 *    khi cột `partner_store_id` bị xoá. Mã đó chỉ được phát cho một shop; để
 *    nó thành mã chung (lối `SET NULL` cũ) là mở khoá ưu đãi cho mọi người và
 *    rò doanh thu. Hàng vẫn nằm trong bảng — đơn cũ còn trỏ tới (`voucher_id`).
 *    Sau đó bỏ khoá ngoại, chỉ mục và cột.
 * 2. Tài khoản `partner` về `customer`, rồi dựng lại enum `users_role_enum`
 *    không còn giá trị `partner` (Postgres không xoá được một giá trị enum nên
 *    phải đổi tên enum cũ, tạo enum mới, đổi kiểu cột, xoá enum cũ).
 * 3. Xoá các bảng `partner_stores`, `partner_profiles`, `partner_program_tiers`,
 *    `blog_posts` cùng enum của chúng. Dữ liệu **mất hẳn** — `down` chỉ dựng lại
 *    cấu trúc.
 * 4. Xoá ba số liệu `partner.*` khỏi `site_stats` (khoá đã ra khỏi whitelist
 *    nên CMS không còn sửa được chúng) và hai FAQ về chương trình đối tác.
 *
 * Cố ý **giữ** `partner_terms` / `partner_onboarding` trong enum của
 * `legal_acceptances` và các giá trị `partner.*` của nhật ký: Postgres không xoá
 * được giá trị enum, và hàng cũ còn tham chiếu — cùng tiền lệ với `complaints`.
 *
 * Định nghĩa bảng ở `down` viết thẳng ở đây, không gọi lại migration cũ.
 */
export class RemovePartnersAndBlog1795000000000 implements MigrationInterface {
  name = 'RemovePartnersAndBlog1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Voucher độc quyền: tắt rồi mới gỡ liên kết.
    await queryRunner.query(
      `UPDATE "vouchers" SET "is_active" = false WHERE "partner_store_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP CONSTRAINT IF EXISTS "FK_vouchers_partner_store"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_vouchers_partner_store"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP COLUMN IF EXISTS "partner_store_id"`,
    );

    // 2. Quyền `partner` biến mất khỏi enum.
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'customer' WHERE "role" = 'partner'`,
    );
    await this.recreateUserRoleEnum(queryRunner, ['customer']);

    // 3. Các bảng. CASCADE cho `partner_stores`: phòng khi còn một khoá ngoại
    //    sót từ bảng đã gỡ ở nơi khác.
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_stores" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_program_tiers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_posts"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."partner_stores_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."partner_profiles_kind_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."partner_program_tiers_key_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."blog_posts_category_enum"`,
    );

    // 4. Số liệu và FAQ của phần đã gỡ.
    await queryRunner.query(
      `DELETE FROM "site_stats" WHERE "key" IN ('partner.partners', 'partner.invitations', 'partner.cities')`,
    );
    await queryRunner.query(
      `DELETE FROM "faqs" WHERE "question_vi" IN ('Cửa hàng cưới có gói riêng không?', 'Làm sao trở thành đối tác?')`,
    );
  }

  /**
   * Dựng lại **cấu trúc** (không có dữ liệu): bảng, enum, khoá ngoại, cột
   * `vouchers.partner_store_id`, giá trị enum `partner`. Voucher đã bị tắt ở
   * `up` vẫn tắt; FAQ và số liệu đã xoá không được khôi phục.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'partner')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);

    await queryRunner.query(
      `CREATE TYPE "public"."blog_posts_category_enum" AS ENUM('experience', 'guide', 'trend')`,
    );
    await queryRunner.query(`
      CREATE TABLE "blog_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "slug" character varying(120) NOT NULL,
        "category" "public"."blog_posts_category_enum" NOT NULL,
        "title" character varying(255) NOT NULL,
        "excerpt" character varying(500) NOT NULL,
        "reading_minutes" integer NOT NULL DEFAULT '5',
        "published_at" date NOT NULL,
        "author" character varying(120) NOT NULL,
        "cover_src" character varying(255) NOT NULL,
        "cover_position" character varying(30) NOT NULL DEFAULT 'center',
        "featured" boolean NOT NULL DEFAULT false,
        "is_published" boolean NOT NULL DEFAULT true,
        "body" jsonb NOT NULL,
        "title_en" character varying(255),
        "excerpt_en" character varying(500),
        "body_en" jsonb,
        CONSTRAINT "PK_dd2add25eac93daefc93da9d387" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_blog_posts_english_complete"
          CHECK (("title_en" IS NULL) = ("excerpt_en" IS NULL) AND ("title_en" IS NULL) = ("body_en" IS NULL))
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5b2818a2c45c3edb9991b1c7a5" ON "blog_posts" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7e72042fa7d82c6586b9d745ce" ON "blog_posts" ("published_at")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."partner_profiles_kind_enum" AS ENUM('studio', 'planner', 'venue', 'print')`,
    );
    await queryRunner.query(`
      CREATE TABLE "partner_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "slug" character varying(60) NOT NULL,
        "name" character varying(160) NOT NULL,
        "kind" "public"."partner_profiles_kind_enum" NOT NULL,
        "city" character varying(80) NOT NULL,
        "invitations" integer NOT NULL DEFAULT '0',
        "since" integer NOT NULL,
        "sort_order" integer NOT NULL DEFAULT '0',
        "is_published" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_caa6b6dea1829172f81e0d128b7" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b6cb231f733e99ffaa4c083d16" ON "partner_profiles" ("slug")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."partner_program_tiers_key_enum" AS ENUM('basic', 'growth', 'studio')`,
    );
    await queryRunner.query(`
      CREATE TABLE "partner_program_tiers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "key" "public"."partner_program_tiers_key_enum" NOT NULL,
        "discount" integer NOT NULL,
        "highlighted" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_9f4a29d5d58ac194630e6a66a67" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a732217254fc5538537db87b8b" ON "partner_program_tiers" ("key")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."partner_stores_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(`
      CREATE TABLE "partner_stores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying(160) NOT NULL,
        "contact_name" character varying(120) NOT NULL,
        "phone" character varying(30) NOT NULL,
        "user_id" uuid NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "status" "public"."partner_stores_status_enum" NOT NULL DEFAULT 'pending',
        "rejection_reason" character varying(500),
        "reviewed_at" TIMESTAMP WITH TIME ZONE,
        "message" character varying(1000),
        "address" character varying(255) NOT NULL DEFAULT '',
        "social_url" character varying(500) NOT NULL DEFAULT '',
        "description" character varying(300) NOT NULL DEFAULT '',
        "image_url" character varying(500),
        CONSTRAINT "REL_26c905ea684a33bd60f3598316" UNIQUE ("user_id"),
        CONSTRAINT "PK_53ffc2d1b0a6597a4f668ac027c" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_26c905ea684a33bd60f3598316" ON "partner_stores" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab3cf45ec402f9b4cb4a850bc3" ON "partner_stores" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD CONSTRAINT "FK_26c905ea684a33bd60f3598316d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "partner_store_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vouchers_partner_store" ON "vouchers" ("partner_store_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD CONSTRAINT "FK_vouchers_partner_store" FOREIGN KEY ("partner_store_id") REFERENCES "partner_stores"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  private async recreateUserRoleEnum(
    queryRunner: QueryRunner,
    values: string[],
  ): Promise<void> {
    const list = values.map((value) => `'${value}'`).join(', ');
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM(${list})`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
  }
}
