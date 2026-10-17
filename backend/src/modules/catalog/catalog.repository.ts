import { Tier } from '@common/enums/tier.enum';
import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import type { QueryAdminTemplatesDto } from './dto/query-admin-templates.dto';
import {
  TemplateDailyView,
  type TemplateViewKind,
} from './template-daily-view.entity';
import { Template } from './template.entity';

@Injectable()
export class TemplateRepository extends Repository<Template> {
  constructor(private readonly dataSource: DataSource) {
    super(Template, dataSource.createEntityManager());
  }

  /**
   * Kho mẫu công khai theo thứ tự hiển thị. Lọc tier ở DB thay vì ở service vì
   * kho mẫu là danh sách dài và trang kho mẫu luôn lọc.
   */
  findPublished(tiers?: Tier[]): Promise<Template[]> {
    return this.find({
      where: tiers?.length
        ? { isPublished: true, tier: In(tiers) }
        : { isPublished: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Tra theo slug **không** lọc `isPublished`: thiệp đang dùng một mẫu vừa bị
   * gỡ khỏi kho vẫn phải render được.
   */
  findBySlug(slug: string): Promise<Template | null> {
    return this.findOne({ where: { slug } });
  }

  /**
   * Nhánh admin: gồm cả mẫu chưa xuất bản.
   *
   * `limit` để trống là lấy hết — ô chọn thiệp và form "mẫu trên trang chủ"
   * cần cả kho trong một lượt, xem `PaginationDto`.
   */
  findAllPaged(query: QueryAdminTemplatesDto): Promise<[Template[], number]> {
    const builder = this.createQueryBuilder('template')
      .orderBy('template.sortOrder', 'ASC')
      .addOrderBy('template.createdAt', 'ASC')
      .take(query.limit)
      .skip(query.offset);

    if (query.tier) {
      builder.andWhere('template.tier = :tier', { tier: query.tier });
    }
    if (query.q) {
      // `unaccent` không có sẵn nên so bằng ILIKE trên cả tên lẫn slug: slug đã
      // là bản không dấu của tên, nên gõ "thuy mac" vẫn ra "Thuỷ Mặc".
      builder.andWhere('(template.name ILIKE :q OR template.slug ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    return builder.getManyAndCount();
  }

  /**
   * Dải mẫu trên trang chủ. Vẫn lọc `isPublished`: gỡ một mẫu khỏi kho mà quên
   * bỏ cờ trang chủ thì trang chủ không được phép dẫn vào ngõ cụt.
   */
  findFeaturedOnHome(): Promise<Template[]> {
    return this.find({
      where: { isPublished: true, featuredOnHome: true },
      order: { homepageOrder: 'ASC', sortOrder: 'ASC' },
    });
  }
}

@Injectable()
export class TemplateViewRepository extends Repository<TemplateDailyView> {
  constructor(private readonly dataSource: DataSource) {
    super(TemplateDailyView, dataSource.createEntityManager());
  }

  /**
   * Cộng một lượt vào hàng (ngày, mẫu) bằng **một** câu lệnh: chèn nếu chưa có,
   * cộng dồn nếu đã có — nhiều khách mở cùng mẫu một lúc không nuốt lượt của
   * nhau. `SELECT ... FROM templates` lọc luôn slug: route này công khai, slug
   * bịa hay mẫu chưa xuất bản thì không ghi gì, bảng không phình bằng rác.
   */
  async record(day: string, slug: string, kind: TemplateViewKind) {
    const column = kind === 'demo' ? 'demo_views' : 'open_views';
    await this.query(
      `INSERT INTO "template_daily_views" ("day", "template_slug", "${column}")
       SELECT $1, "slug", 1 FROM "templates" WHERE "slug" = $2 AND "is_published"
       ON CONFLICT ("day", "template_slug")
       DO UPDATE SET "${column}" = "template_daily_views"."${column}" + 1,
                     "updated_at" = now()`,
      [day, slug],
    );
  }

  /** Tổng lượt xem theo mẫu từ ngày `sinceDay` (`null` là từ trước tới nay). */
  async sumBySlug(
    sinceDay: string | null,
  ): Promise<{ templateSlug: string; openViews: number; demoViews: number }[]> {
    const query = this.createQueryBuilder('view')
      .select('view.template_slug', 'templateSlug')
      .addSelect('SUM(view.open_views)::int', 'openViews')
      .addSelect('SUM(view.demo_views)::int', 'demoViews')
      .groupBy('view.template_slug');
    if (sinceDay) query.where('view.day >= :sinceDay', { sinceDay });
    return query.getRawMany();
  }

  /** Ngày đầu tiên có số liệu — để CMS nói rõ "đếm từ ngày nào". */
  async firstDay(): Promise<string | null> {
    const row = await this.createQueryBuilder('view')
      .select('MIN(view.day)::text', 'day')
      .getRawOne<{ day: string | null }>();
    return row?.day ?? null;
  }
}
