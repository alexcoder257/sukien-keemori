import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm cột màu chủ đạo cho kho mẫu và điền cho 67 mẫu đang có.
 *
 * `color_tones` là cột **code làm chủ** (cùng nhóm với `name`, `photo_slots`):
 * màu chốt lúc dựng mẫu và không có trong `UpdateTemplateDto`, nên ghi bằng
 * `UPDATE ... WHERE slug` ở đây là đúng luật "Kho mẫu và migration" trong
 * `CLAUDE.md`. Dữ liệu viết thẳng trong file, không `import` từ seed.
 *
 * CHECK chỉ chặn **trần** 2 màu, không chặn sàn: slug nào có trên database mà
 * không nằm trong danh sách dưới đây sẽ giữ `{}` thay vì làm hỏng cả lượt
 * deploy. Sàn 1 màu được giữ ở test của file seed.
 */
export class AddTemplateColorTones1791100000000 implements MigrationInterface {
  name = 'AddTemplateColorTones1791100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."templates_color_tones_enum" AS ENUM('red', 'pink', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'black', 'white')`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ADD "color_tones" "public"."templates_color_tones_enum" array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(`
      UPDATE "templates" AS t
      SET "color_tones" = v."tones"::"public"."templates_color_tones_enum"[]
      FROM (VALUES
        ('ai-tinh', '{red,white}'),
        ('bach-mai', '{white}'),
        ('bang-lam', '{blue,white}'),
        ('ca-phe', '{black,brown}'),
        ('cam-tu', '{blue}'),
        ('co-dien', '{white,brown}'),
        ('da-khuc', '{white,blue}'),
        ('da-kim', '{blue,yellow}'),
        ('da-lan', '{blue,white}'),
        ('dao-hoa', '{pink,white}'),
        ('dao-pho', '{white,brown}'),
        ('do-burgundy', '{red,white}'),
        ('do-tham', '{red,pink}'),
        ('do-truyen-thong', '{red}'),
        ('ha-noi-xua', '{brown}'),
        ('hai-lam', '{blue,white}'),
        ('hanh-trinh', '{blue,white}'),
        ('hoa-anh', '{pink,white}'),
        ('hoa-cam-tu-cau', '{blue,white}'),
        ('hoa-cuc', '{blue,white}'),
        ('hoa-hong', '{pink}'),
        ('hoa-ly', '{white,green}'),
        ('hoa-tulip', '{pink}'),
        ('hong-tien', '{white,pink}'),
        ('hong-uyen', '{pink}'),
        ('hong-vien', '{white,pink}'),
        ('hy-sac', '{yellow,green}'),
        ('khuynh-diep', '{white,green}'),
        ('kim-sa', '{white,yellow}'),
        ('lam-cuc', '{blue}'),
        ('lan-trang', '{white,green}'),
        ('lo-lo-chai', '{pink,green}'),
        ('long-phung', '{red,white}'),
        ('luc-ly', '{green,black}'),
        ('man-chin', '{white}'),
        ('moc-duyen', '{white,red}'),
        ('moc-lan', '{white,blue}'),
        ('moc-yen', '{white,orange}'),
        ('nang-hen', '{brown,white}'),
        ('nang-xanh', '{white,blue}'),
        ('net-thuong', '{white,brown}'),
        ('ngoc-bich', '{green,yellow}'),
        ('ngoc-diep', '{green,orange}'),
        ('phong-thu', '{white,brown}'),
        ('rung-hoa', '{brown,white}'),
        ('san-ho', '{orange,blue}'),
        ('sen-trang', '{white,black}'),
        ('sen-viet', '{green,red}'),
        ('son-hy', '{red,white}'),
        ('song', '{white,blue}'),
        ('su-lam', '{white,blue}'),
        ('tham-luc', '{green,white}'),
        ('thanh-su', '{white,blue}'),
        ('thien-thanh', '{green,white}'),
        ('thu-hong', '{pink,white}'),
        ('thuy-mac', '{white,pink}'),
        ('ti-hon', '{white,red}'),
        ('tin-vui', '{white,red}'),
        ('tinh-ca', '{white,red}'),
        ('tinh-khoi', '{white,blue}'),
        ('tram-nam', '{brown,red}'),
        ('trau-cau', '{white,green}'),
        ('tu-ngoc', '{purple}'),
        ('vom-nga', '{green,white}'),
        ('vuon-hen', '{white,green}'),
        ('vuon-hoa', '{green,white}'),
        ('xich-duyen', '{red,white}')
      ) AS v("slug", "tones")
      WHERE t."slug" = v."slug"
    `);
    await queryRunner.query(
      `ALTER TABLE "templates" ADD CONSTRAINT "CHK_templates_color_tones_max" CHECK (cardinality("color_tones") <= 2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "templates" DROP CONSTRAINT "CHK_templates_color_tones_max"`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" DROP COLUMN "color_tones"`,
    );
    await queryRunner.query(`DROP TYPE "public"."templates_color_tones_enum"`);
  }
}
