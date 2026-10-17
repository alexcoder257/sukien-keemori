import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đưa kho mẫu của một database **đang chạy** lên ngang danh sách mẫu trong
 * code. Mẫu nào đã có thì không đụng tới; mẫu nào thiếu thì chèn vào cuối.
 *
 * Đây là migration đầu tiên của một luật mới, nên phần vì sao quan trọng hơn
 * phần nó làm gì.
 *
 * Trước migration này, đường duy nhất đưa mẫu mới lên production là chạy
 * `npm run seed` từ máy dev. Seed **không có khái niệm "đã chạy rồi"**: nó áp
 * toàn bộ file đang nằm trên máy đang gõ lệnh, nên một laptop có seed cũ kéo
 * production lùi lại mà không có gì cản — và ở chế độ mặc định `seedContent`
 * còn **xoá** blog cùng dải trang chủ. Migration thì có bảng `migrations` theo
 * dõi, chạy đúng một lần, và chạy trong pipeline deploy chứ không từ laptop.
 *
 * Từ nay kho mẫu có hai đường, cho hai loại database:
 *
 * - Database dựng từ số 0 (dev, CI, staging mới) → `npm run seed`.
 * - Database đang có dữ liệu thật → một migration như file này.
 *
 * **Chỉ ba cột được đụng tới ở đây và ở mọi migration kho mẫu sau này**: những
 * gì suy ra được từ component và thư mục ảnh (`name`, `photo_slots`,
 * `image_position`, `image_src`). `tier`, `categories`, `tags`,
 * `is_published`, `sort_order`, `featured_on_home` và `homepage_order` thuộc
 * **CMS** — admin sửa chúng qua `UpdateTemplateDto`, và một migration ghi đè
 * lên đó là tự tay dựng lại đúng cái bug vừa diệt, chỉ khác là lần này nó nằm
 * trong một file trông chính thống hơn. Với mẫu **mới** thì giá trị ở đây chỉ
 * là điểm xuất phát, admin đổi lúc nào cũng được.
 *
 * Ba chi tiết kỹ thuật đáng giữ:
 *
 * - Dữ liệu viết **thẳng** trong file, không `import` từ `seeders/data/`.
 *   Migration là một lát cắt đông cứng của thời gian, còn `TEMPLATE_SEEDS` thì
 *   còn đang được sửa; nối hai thứ lại là để ý nghĩa của migration cũ đổi ngược
 *   về quá khứ, và một DB dựng lại từ đầu sẽ ra kết quả khác DB đã chạy tuần
 *   trước. Trùng lặp với file seed ở đây là có chủ đích.
 * - `sort_order` lấy `MAX + ROW_NUMBER()` chứ không phải vị trí trong mảng:
 *   thứ tự kho mẫu là thứ khách đang nhìn thấy và là thứ admin đã xếp tay.
 *   Mẫu mới xếp vào cuối, không đẩy mẫu nào sang chỗ khác.
 * - `WHERE NOT EXISTS` là thứ quyết định mẫu nào được chèn (và giữ cho
 *   `ROW_NUMBER()` chỉ đếm hàng mới). `ON CONFLICT` chỉ là lớp chặn đua giữa
 *   hai tiến trình cùng chạy migration.
 *
 * `down` cố ý **không làm gì** — xem ghi chú ở dưới.
 */
export class SyncTemplateCatalog1789100000000 implements MigrationInterface {
  name = 'SyncTemplateCatalog1789100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "templates" (
        "slug", "name", "tier", "categories", "tags",
        "photo_slots", "image_position", "image_src", "sort_order"
      )
      SELECT
        v."slug",
        v."name",
        v."tier"::"public"."templates_tier_enum",
        v."categories"::"public"."templates_categories_enum"[],
        v."tags"::"public"."templates_tags_enum"[],
        v."photo_slots"::character varying(20)[],
        v."image_position",
        v."image_src",
        COALESCE((SELECT MAX("sort_order") FROM "templates"), -1)
          + ROW_NUMBER() OVER (ORDER BY v."ord")
      FROM (VALUES
        (1, 'lan-trang', 'Lan Trắng', 'diamond', '{classic,minimal}', '{new}', '{cover,couple,groom,bride,story,closing}', '50% 0%', '/images/templates/lan-trang/thumbnail.avif'),
        (2, 'nang-hen', 'Nắng Hẹn', 'diamond', '{classic,luxury}', '{new}', '{cover,couple,story,closing}', '50% 0%', '/images/templates/nang-hen/thumbnail.avif'),
        (3, 'tin-vui', 'Tin Vui', 'diamond', '{classic,modern}', '{hot,new}', '{cover,couple,groom,bride,story,closing}', '100% 0%', '/images/templates/tin-vui/thumbnail.avif'),
        (4, 'moc-lan', 'Mộc Lan', 'free', '{minimal,modern}', '{new}', '{}', '0% 100%', '/images/templates/moc-lan/thumbnail.avif'),
        (5, 'phong-thu', 'Phong Thư', 'gold', '{classic,formal}', '{}', '{couple,story,closing}', '100% 100%', '/images/templates/phong-thu/thumbnail.avif'),
        (6, 'khuynh-diep', 'Khuynh Diệp', 'gold', '{minimal,classic}', '{}', '{cover,couple}', '0% 0%', '/images/templates/khuynh-diep/thumbnail.avif'),
        (7, 'hanh-trinh', 'Hành Trình', 'gold', '{modern,formal}', '{new}', '{cover,couple,groom,bride,story}', '100% 0%', '/images/templates/hanh-trinh/thumbnail.avif'),
        (8, 'ti-hon', 'Tí Hon', 'free', '{modern,minimal}', '{}', '{}', '0% 100%', '/images/templates/ti-hon/thumbnail.avif'),
        (9, 'thuy-mac', 'Thuỷ Mặc', 'diamond', '{classic,traditional}', '{new}', '{cover,couple,story,closing}', '100% 100%', '/images/templates/thuy-mac/thumbnail.avif'),
        (10, 'ngoc-bich', 'Ngọc Bích', 'gold', '{luxury,classic}', '{new}', '{cover,couple,story}', '0% 0%', '/images/templates/ngoc-bich/thumbnail.avif'),
        (11, 'man-chin', 'Mận Chín', 'diamond', '{traditional,luxury}', '{hot}', '{couple,story}', '0% 100%', '/images/templates/man-chin/thumbnail.avif'),
        (12, 'bach-mai', 'Bạch Mai', 'free', '{classic,minimal}', '{}', '{}', '100% 100%', '/images/templates/bach-mai/thumbnail.avif'),
        (13, 'lam-cuc', 'Lam Cúc', 'diamond', '{modern,minimal}', '{}', '{cover,couple,story,closing}', '50% 50%', '/images/templates/lam-cuc/thumbnail.avif'),
        (14, 'su-lam', 'Sứ Lam', 'diamond', '{classic,formal}', '{new,hot}', '{}', '50% 50%', '/images/templates/su-lam/thumbnail.avif'),
        (15, 'vuon-hen', 'Vườn Hẹn', 'gold', '{classic,minimal}', '{new}', '{cover,closing}', '50% 50%', '/images/templates/vuon-hen/thumbnail.avif'),
        (16, 'nang-xanh', 'Nắng Xanh', 'gold', '{modern,minimal}', '{new}', '{cover}', '50% 50%', '/images/templates/nang-xanh/thumbnail.avif'),
        (17, 'net-thuong', 'Nét Thương', 'gold', '{modern,minimal}', '{new}', '{cover,closing}', '50% 50%', '/images/templates/net-thuong/thumbnail.avif'),
        (18, 'hong-vien', 'Hồng Viên', 'gold', '{luxury,classic}', '{new}', '{cover,couple,bride,story,closing}', '50% 35%', '/images/templates/hong-vien/thumbnail.avif'),
        (19, 'hong-tien', 'Hồng Tiên', 'gold', '{luxury,classic}', '{new}', '{cover}', '50% 50%', '/images/templates/hong-tien/thumbnail.avif'),
        (20, 'vom-nga', 'Vòm Ngà', 'free', '{classic,formal}', '{new}', '{}', '50% 50%', '/images/templates/vom-nga/thumbnail.avif'),
        (21, 'hai-lam', 'Hải Lam', 'diamond', '{modern,minimal}', '{hot}', '{cover,couple,groom,bride,story,closing}', '50% 50%', '/images/templates/hai-lam/thumbnail.avif'),
        (22, 'thien-thanh', 'Thiên Thanh', 'gold', '{classic,formal}', '{new}', '{cover,couple,story}', '50% 50%', '/images/templates/thien-thanh/thumbnail.avif'),
        (23, 'da-khuc', 'Dạ Khúc', 'free', '{luxury,modern}', '{new}', '{}', '50% 50%', '/images/templates/da-khuc/thumbnail.avif'),
        (24, 'moc-yen', 'Mộc Yến', 'free', '{modern,minimal}', '{new}', '{}', '50% 50%', '/images/templates/moc-yen/thumbnail.avif'),
        (25, 'da-kim', 'Dạ Kim', 'gold', '{luxury,formal}', '{new}', '{cover,couple,story}', '50% 42%', '/images/templates/da-kim/thumbnail.avif'),
        (26, 'hoa-anh', 'Hoa Anh', 'free', '{classic,luxury}', '{new}', '{}', '50% 50%', '/images/templates/hoa-anh/thumbnail.avif'),
        (27, 'dao-hoa', 'Đào Hoa', 'diamond', '{traditional,classic}', '{new,hot}', '{}', '50% 42%', '/images/templates/dao-hoa/thumbnail.avif'),
        (28, 'hy-sac', 'Hỷ Sắc', 'diamond', '{classic,formal}', '{new}', '{couple,groom,bride,story}', '50% 38%', '/images/templates/hy-sac/thumbnail.avif'),
        (29, 'ngoc-diep', 'Ngọc Diệp', 'free', '{modern,minimal}', '{new}', '{}', '50% 50%', '/images/templates/ngoc-diep/thumbnail.avif'),
        (30, 'tu-ngoc', 'Tử Ngọc', 'free', '{traditional,luxury}', '{new}', '{}', '50% 38%', '/images/templates/tu-ngoc/thumbnail.avif'),
        (31, 'son-hy', 'Sơn Hỷ', 'free', '{traditional,formal}', '{new}', '{}', '50% 50%', '/images/templates/son-hy/thumbnail.avif'),
        (32, 'kim-sa', 'Kim Sa', 'free', '{luxury,formal}', '{new}', '{}', '50% 42%', '/images/templates/kim-sa/thumbnail.avif'),
        (33, 'rung-hoa', 'Rừng Hoa', 'free', '{classic,formal}', '{new}', '{}', '50% 50%', '/images/templates/rung-hoa/thumbnail.avif'),
        (34, 'tinh-khoi', 'Tình Khôi', 'gold', '{modern,minimal}', '{new}', '{cover}', '50% 44%', '/images/templates/tinh-khoi/thumbnail.avif'),
        (35, 'luc-ly', 'Lục Ly', 'diamond', '{classic,formal}', '{new,hot}', '{cover}', '50% 50%', '/images/templates/luc-ly/thumbnail.avif'),
        (36, 'long-phung', 'Long Phụng', 'free', '{traditional,formal}', '{new}', '{}', '50% 42%', '/images/templates/long-phung/thumbnail.avif'),
        (37, 'xich-duyen', 'Xích Duyên', 'free', '{traditional,modern}', '{new}', '{}', '50% 50%', '/images/templates/xich-duyen/thumbnail.avif'),
        (38, 'hong-uyen', 'Hồng Uyên', 'free', '{traditional,classic}', '{new}', '{}', '50% 42%', '/images/templates/hong-uyen/thumbnail.avif'),
        (39, 'trau-cau', 'Trầu Cau', 'diamond', '{traditional,formal}', '{new,hot}', '{}', '50% 50%', '/images/templates/trau-cau/thumbnail.avif'),
        (40, 'thanh-su', 'Thanh Sử', 'gold', '{classic,minimal}', '{new}', '{couple,story}', '50% 34%', '/images/templates/thanh-su/thumbnail.avif'),
        (41, 'tham-luc', 'Thẫm Lục', 'diamond', '{classic,formal}', '{new,hot}', '{cover,couple,story}', '50% 38%', '/images/templates/tham-luc/thumbnail.avif'),
        (42, 'tinh-ca', 'Tình Ca', 'diamond', '{classic,modern}', '{new}', '{couple,story}', '50% 0%', '/images/templates/tinh-ca/thumbnail.avif'),
        (43, 'ai-tinh', 'Ái Tình', 'free', '{classic,modern}', '{new}', '{}', '50% 50%', '/images/templates/ai-tinh/thumbnail.avif'),
        (44, 'moc-duyen', 'Mộc Duyên', 'diamond', '{classic,formal}', '{new}', '{groom,bride}', '50% 34%', '/images/templates/moc-duyen/thumbnail.avif'),
        (45, 'da-lan', 'Dạ Lan', 'free', '{luxury,modern}', '{new}', '{}', '50% 50%', '/images/templates/da-lan/thumbnail.avif'),
        (46, 'cam-tu', 'Cẩm Tú', 'free', '{luxury,modern}', '{new}', '{}', '50% 50%', '/images/templates/cam-tu/thumbnail.avif'),
        (47, 'do-tham', 'Đỏ Thắm', 'free', '{luxury,classic}', '{new}', '{}', '50% 50%', '/images/templates/do-tham/thumbnail.avif'),
        (48, 'san-ho', 'San Hô', 'gold', '{luxury,formal}', '{new}', '{cover,couple,story}', '50% 50%', '/images/templates/san-ho/thumbnail.avif'),
        (49, 'thu-hong', 'Thu Hồng', 'gold', '{classic,luxury}', '{new}', '{couple,story,closing}', '50% 50%', '/images/templates/thu-hong/thumbnail.avif'),
        (50, 'bang-lam', 'Băng Lam', 'gold', '{luxury,formal}', '{new}', '{cover}', '50% 50%', '/images/templates/bang-lam/thumbnail.avif')
      ) AS v(
        "ord", "slug", "name", "tier", "categories", "tags",
        "photo_slots", "image_position", "image_src"
      )
      WHERE NOT EXISTS (
        SELECT 1 FROM "templates" t WHERE t."slug" = v."slug"
      )
      ON CONFLICT ("slug") DO NOTHING
    `);
  }

  /**
   * Không có `down`, và đây là quyết định chứ không phải chỗ bỏ trống.
   *
   * Migration này chèn mẫu mà không biết mẫu nào vốn đã có sẵn, nên một
   * `DELETE` theo danh sách slug ở trên sẽ xoá cả mẫu đã nằm trong DB từ trước.
   * Mà xoá một mẫu thì mọi thiệp đang trỏ vào `template_slug` đó mất mặt thiệp
   * — thiệp cưới là link vĩnh viễn, khách mời mở không được thì không ai báo lại
   * cho cặp đôi.
   *
   * Cần gỡ một mẫu cụ thể thì viết một migration riêng cho đúng mẫu đó, sau khi
   * đã kiểm không còn thiệp nào dùng — đúng lối `RemoveHyBaoTemplate` đã làm.
   */
  public async down(): Promise<void> {
    // no-op
  }
}
