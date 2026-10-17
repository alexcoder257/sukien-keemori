import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1786375460013 implements MigrationInterface {
  name = 'InitSchema1786375460013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'partner', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer', "full_name" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "refresh_token_hash" character varying(255), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "token_hash" character varying(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_91185d86d5d7557b19abbb2868" ON "password_reset_tokens"  ("token_hash") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wedding_cards_template_tier_enum" AS ENUM('free', 'gold', 'diamond')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wedding_cards_plan_tier_enum" AS ENUM('free', 'gold', 'diamond')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wedding_cards_status_enum" AS ENUM('draft', 'unpaid', 'paid')`,
    );
    await queryRunner.query(
      `CREATE TABLE "wedding_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "owner_id" uuid NOT NULL, "slug" character varying(60) NOT NULL, "title" character varying(160) NOT NULL, "template_slug" character varying(60) NOT NULL, "template_tier" "public"."wedding_cards_template_tier_enum" NOT NULL, "plan_tier" "public"."wedding_cards_plan_tier_enum" NOT NULL DEFAULT 'free', "status" "public"."wedding_cards_status_enum" NOT NULL DEFAULT 'draft', "content" jsonb NOT NULL, "view_count" integer NOT NULL DEFAULT '0', "published_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_36560661a14232d405f4cc19bc0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32cae131248b9f212cdd2ed6c1" ON "wedding_cards"  ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f74c9f2dc7959c2e04a53b848f" ON "wedding_cards"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."templates_tier_enum" AS ENUM('free', 'gold', 'diamond')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."templates_categories_enum" AS ENUM('luxury', 'modern', 'classic', 'minimal', 'traditional', 'formal')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."templates_tags_enum" AS ENUM('hot', 'new')`,
    );
    await queryRunner.query(
      `CREATE TABLE "templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(60) NOT NULL, "name" character varying(120) NOT NULL, "tier" "public"."templates_tier_enum" NOT NULL, "categories" "public"."templates_categories_enum" array NOT NULL DEFAULT '{}', "tags" "public"."templates_tags_enum" array NOT NULL DEFAULT '{}', "photo_slots" character varying(20) array NOT NULL DEFAULT '{}', "image_position" character varying(20) NOT NULL DEFAULT '50% 50%', "image_src" character varying(255), "is_published" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_996873c57c54937eba59605def" ON "templates"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tier_prices_tier_enum" AS ENUM('free', 'gold', 'diamond')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tier_prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tier" "public"."tier_prices_tier_enum" NOT NULL, "price" integer NOT NULL, "repeat_price" integer NOT NULL, "points" integer NOT NULL DEFAULT '0', "repeat_points" integer NOT NULL DEFAULT '0', "album_enabled" boolean NOT NULL DEFAULT false, "album_photo_cap" integer NOT NULL DEFAULT '0', "highlighted" boolean NOT NULL DEFAULT false, "surface" character varying(10) NOT NULL DEFAULT 'plain', CONSTRAINT "PK_451762cb7605d1e7626ae3f2a0e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cad14c94f9f3105cdd3f9f5b1f" ON "tier_prices"  ("tier") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_tier_enum" AS ENUM('free', 'gold', 'diamond')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'paid', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_payment_method_enum" AS ENUM('vnd', 'points')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "card_id" uuid NOT NULL, "tier" "public"."orders_tier_enum" NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "payment_method" "public"."orders_payment_method_enum" NOT NULL, "amount" integer NOT NULL, "is_repeat_purchase" boolean NOT NULL DEFAULT false, "paid_at" TIMESTAMP WITH TIME ZONE, "gateway_reference" character varying(120), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a922b820eeef29ac1c6800e826" ON "orders"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65a62e867c55b454db0297bac8" ON "orders"  ("card_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."blog_posts_category_enum" AS ENUM('experience', 'guide', 'trend')`,
    );
    await queryRunner.query(
      `CREATE TABLE "blog_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(120) NOT NULL, "category" "public"."blog_posts_category_enum" NOT NULL, "title" character varying(255) NOT NULL, "excerpt" character varying(500) NOT NULL, "reading_minutes" integer NOT NULL DEFAULT '5', "published_at" date NOT NULL, "author" character varying(120) NOT NULL, "cover_src" character varying(255) NOT NULL, "cover_position" character varying(30) NOT NULL DEFAULT 'center', "featured" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT true, "body" jsonb NOT NULL, CONSTRAINT "PK_dd2add25eac93daefc93da9d387" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5b2818a2c45c3edb9991b1c7a5" ON "blog_posts"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7e72042fa7d82c6586b9d745ce" ON "blog_posts"  ("published_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "couple_showcases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(60) NOT NULL, "names" character varying(120) NOT NULL, "wedding_date" character varying(30) NOT NULL, "image_src" character varying(255) NOT NULL, "image_position" character varying(30) NOT NULL DEFAULT 'center', "sort_order" integer NOT NULL DEFAULT '0', "is_published" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_469c630eb8a42d4c13bd23235b1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5620fe161b3c43669288477c80" ON "couple_showcases"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "faqs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "question_vi" character varying(500) NOT NULL, "answer_vi" text NOT NULL, "question_en" character varying(500) NOT NULL, "answer_en" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_published" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_2ddf4f2c910f8e8fa2663a67bf0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "site_stats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "key" character varying(60) NOT NULL, "value" numeric(12,2) NOT NULL, CONSTRAINT "PK_c72e9f3dca62d94f36a90bdf11c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a317a9e3ffebd86381fc85ba3b" ON "site_stats"  ("key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "testimonials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "author" character varying(120) NOT NULL, "rating" smallint NOT NULL DEFAULT '5', "quote" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_published" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_63b03c608bd258f115a0a4a1060" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "template_slug" character varying(60) NOT NULL, CONSTRAINT "UQ_c5da19433531e2ccfdefddc96dd" UNIQUE ("user_id", "template_slug"), CONSTRAINT "PK_890818d27523748dd36a4d1bdc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_35a6b05ee3b624d0de01ee5059" ON "favorites"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "template_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "template_slug" character varying(60) NOT NULL, "rating" smallint NOT NULL, "comment" character varying(500), CONSTRAINT "UQ_7b9cfb8ede4e278405285c71bb5" UNIQUE ("user_id", "template_slug"), CONSTRAINT "CHK_cd87818745ce35cb9e816b8de0" CHECK ("rating" BETWEEN 1 AND 5), CONSTRAINT "PK_aefb1377886b5ecda896b2c8dab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9968de5f61abd0572fdd13f688" ON "template_reviews"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f450c246e0fd456b80869c312" ON "template_reviews"  ("template_slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."partner_profiles_kind_enum" AS ENUM('studio', 'planner', 'venue', 'print')`,
    );
    await queryRunner.query(
      `CREATE TABLE "partner_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(60) NOT NULL, "name" character varying(160) NOT NULL, "kind" "public"."partner_profiles_kind_enum" NOT NULL, "city" character varying(80) NOT NULL, "invitations" integer NOT NULL DEFAULT '0', "since" integer NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_published" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_caa6b6dea1829172f81e0d128b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b6cb231f733e99ffaa4c083d16" ON "partner_profiles"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "wishes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "card_id" uuid NOT NULL, "name" character varying(60) NOT NULL, "message" character varying(500) NOT NULL, "approved" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9c08d144e42ca0aa37a024597ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea3ea9910b07cfe10df30f6751" ON "wishes"  ("card_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."partner_program_tiers_key_enum" AS ENUM('basic', 'growth', 'studio')`,
    );
    await queryRunner.query(
      `CREATE TABLE "partner_program_tiers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "key" "public"."partner_program_tiers_key_enum" NOT NULL, "points" integer NOT NULL, "discount" integer NOT NULL, "highlighted" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_9f4a29d5d58ac194630e6a66a67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a732217254fc5538537db87b8b" ON "partner_program_tiers"  ("key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "partner_stores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(160) NOT NULL, "contact_name" character varying(120) NOT NULL, "phone" character varying(30) NOT NULL, "user_id" uuid NOT NULL, "points" integer NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_26c905ea684a33bd60f3598316" UNIQUE ("user_id"), CONSTRAINT "PK_53ffc2d1b0a6597a4f668ac027c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_26c905ea684a33bd60f3598316" ON "partner_stores"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "todos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "title" character varying(255) NOT NULL, "description" text, "is_completed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_ca8cafd59ca6faaf67995344225" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" ADD CONSTRAINT "FK_32cae131248b9f212cdd2ed6c12" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_65a62e867c55b454db0297bac84" FOREIGN KEY ("card_id") REFERENCES "wedding_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_reviews" ADD CONSTRAINT "FK_9968de5f61abd0572fdd13f6884" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishes" ADD CONSTRAINT "FK_ea3ea9910b07cfe10df30f67510" FOREIGN KEY ("card_id") REFERENCES "wedding_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "partner_stores" ADD CONSTRAINT "FK_26c905ea684a33bd60f3598316d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "partner_stores" DROP CONSTRAINT "FK_26c905ea684a33bd60f3598316d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishes" DROP CONSTRAINT "FK_ea3ea9910b07cfe10df30f67510"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_reviews" DROP CONSTRAINT "FK_9968de5f61abd0572fdd13f6884"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_65a62e867c55b454db0297bac84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wedding_cards" DROP CONSTRAINT "FK_32cae131248b9f212cdd2ed6c12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`,
    );
    await queryRunner.query(`DROP TABLE "todos"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26c905ea684a33bd60f3598316"`,
    );
    await queryRunner.query(`DROP TABLE "partner_stores"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a732217254fc5538537db87b8b"`,
    );
    await queryRunner.query(`DROP TABLE "partner_program_tiers"`);
    await queryRunner.query(
      `DROP TYPE "public"."partner_program_tiers_key_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ea3ea9910b07cfe10df30f6751"`,
    );
    await queryRunner.query(`DROP TABLE "wishes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b6cb231f733e99ffaa4c083d16"`,
    );
    await queryRunner.query(`DROP TABLE "partner_profiles"`);
    await queryRunner.query(`DROP TYPE "public"."partner_profiles_kind_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0f450c246e0fd456b80869c312"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9968de5f61abd0572fdd13f688"`,
    );
    await queryRunner.query(`DROP TABLE "template_reviews"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_35a6b05ee3b624d0de01ee5059"`,
    );
    await queryRunner.query(`DROP TABLE "favorites"`);
    await queryRunner.query(`DROP TABLE "testimonials"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a317a9e3ffebd86381fc85ba3b"`,
    );
    await queryRunner.query(`DROP TABLE "site_stats"`);
    await queryRunner.query(`DROP TABLE "faqs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5620fe161b3c43669288477c80"`,
    );
    await queryRunner.query(`DROP TABLE "couple_showcases"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7e72042fa7d82c6586b9d745ce"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b2818a2c45c3edb9991b1c7a5"`,
    );
    await queryRunner.query(`DROP TABLE "blog_posts"`);
    await queryRunner.query(`DROP TYPE "public"."blog_posts_category_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65a62e867c55b454db0297bac8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a922b820eeef29ac1c6800e826"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_tier_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cad14c94f9f3105cdd3f9f5b1f"`,
    );
    await queryRunner.query(`DROP TABLE "tier_prices"`);
    await queryRunner.query(`DROP TYPE "public"."tier_prices_tier_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_996873c57c54937eba59605def"`,
    );
    await queryRunner.query(`DROP TABLE "templates"`);
    await queryRunner.query(`DROP TYPE "public"."templates_tags_enum"`);
    await queryRunner.query(`DROP TYPE "public"."templates_categories_enum"`);
    await queryRunner.query(`DROP TYPE "public"."templates_tier_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f74c9f2dc7959c2e04a53b848f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32cae131248b9f212cdd2ed6c1"`,
    );
    await queryRunner.query(`DROP TABLE "wedding_cards"`);
    await queryRunner.query(`DROP TYPE "public"."wedding_cards_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."wedding_cards_plan_tier_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wedding_cards_template_tier_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_91185d86d5d7557b19abbb2868"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
