import { DEFAULT_TEMPLATE_SLUG } from '@common/constants/invitation.constants';
import { definedFields } from '@common/utils/defined-fields';
import type { Paginated } from '@common/dto/pagination.dto';
import { RevalidateService } from '@common/revalidate/revalidate.service';
import { CACHE_TAGS } from '@constant/cache-tags';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { SettingsService } from '@modules/settings/settings.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { vietnamDate } from '@common/utils/vietnam-date';
import {
  TemplateRepository,
  TemplateViewRepository,
} from './catalog.repository';
import { QueryAdminTemplatesDto } from './dto/query-admin-templates.dto';
import { QueryTemplatesDto } from './dto/query-templates.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import type { TemplateViewKind } from './template-daily-view.entity';
import { Template } from './template.entity';

/**
 * Phần của một mẫu mà thiệp cần biết: cấp thiết kế, ô ảnh, tên để hiện ở
 * "Thiệp của tôi". Mẫu trong kho và mẫu dựng sẵn cùng một hình dạng này.
 */
export type CardTemplate = Pick<
  Template,
  'slug' | 'name' | 'tier' | 'kind' | 'photoSlots'
>;

/**
 * Mẫu dựng sẵn cho mọi loại thiệp (`DEFAULT_TEMPLATE_SLUG`). Cấp thiết kế Free,
 * không ô ảnh — đúng luật "mẫu Free 0 ô" của `docs/business-model.md`; album
 * thì thiệp nào cũng có.
 */
const DEFAULT_CARD_TEMPLATE: CardTemplate = {
  slug: DEFAULT_TEMPLATE_SLUG,
  name: 'Mẫu mặc định',
  tier: 'free',
  // Mẫu dựng sẵn tự đổi bố cục theo loại thiệp, nên nó là mẫu duy nhất ghép
  // được với mọi loại — `CardsService` bỏ qua phép kiểm loại cho slug này.
  kind: 'wedding',
  photoSlots: [],
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly settingsService: SettingsService,
    private readonly revalidateService: RevalidateService,
    private readonly templateViewRepository: TemplateViewRepository,
  ) {}

  /**
   * Ghi một lượt xem mẫu từ trang khách. Slug lạ hay mẫu chưa xuất bản thì
   * repository tự bỏ qua; đây là số liệu phụ nên không ném lỗi nào ra ngoài.
   */
  async recordTemplateView(slug: string, kind: TemplateViewKind) {
    if (slug.length > 60) return;
    await this.templateViewRepository.record(
      vietnamDate(new Date()),
      slug,
      kind,
    );
  }

  /** Tổng lượt xem theo mẫu từ ngày `sinceDay`, kèm ngày bắt đầu có số liệu. */
  async templateViewTotals(sinceDay: string | null) {
    const [rows, firstDay] = await Promise.all([
      this.templateViewRepository.sumBySlug(sinceDay),
      this.templateViewRepository.firstDay(),
    ]);
    return { rows, firstDay };
  }

  /**
   * Kho mẫu công khai. Lọc `category` và `color` làm ở tầng service chứ không ở
   * DB: đó là mảng giao nhau trên một tập nhỏ (vài chục mẫu), viết ở SQL chỉ
   * đổi lấy một câu query khó đọc.
   *
   * Hai phép lọc cố ý khác nhau. Phong cách là OR — chọn "cổ điển" và "hiện
   * đại" là đang hỏi "cho xem cả hai kiểu". Màu là AND — mỗi mẫu có đúng một
   * màu nền và một màu concept, nên chọn "trắng" + "xanh lá" là đang tả một
   * tấm thiệp, và OR ở đây sẽ trả gần hết kho vì nền trắng chiếm đa số.
   */
  async findTemplates(query: QueryTemplatesDto): Promise<Template[]> {
    const templates = await this.templateRepository.findPublished(query.tier);
    const filtered = templates.filter(
      (template) =>
        (!query.category?.length ||
          template.categories.some((category) =>
            query.category?.includes(category),
          )) &&
        (query.color ?? []).every((color) =>
          template.colorTones.includes(color),
        ),
    );
    return query.limit ? filtered.slice(0, query.limit) : filtered;
  }

  async findTemplateBySlug(slug: string): Promise<Template> {
    const template = await this.templateRepository.findBySlug(slug);
    if (!template) {
      throw new NotFoundException(ERROR_MESSAGES.CATALOG.TEMPLATE_NOT_FOUND);
    }
    return template;
  }

  /**
   * Mẫu của một thiệp: mẫu trong kho, hoặc mẫu dựng sẵn khi slug là
   * `DEFAULT_TEMPLATE_SLUG`. Chỉ dùng cho **thiệp** (tạo, đổi mẫu, ô ảnh) —
   * kho mẫu, trang mẫu và "tim" đi qua `findTemplateBySlug`, nên mẫu dựng sẵn
   * không bao giờ hiện ở đó và không "tim" được.
   */
  async findCardTemplate(slug: string): Promise<CardTemplate> {
    // Bản sao: người gọi giữ được kết quả mà không sửa nhầm hằng số dùng chung.
    if (slug === DEFAULT_TEMPLATE_SLUG) {
      return { ...DEFAULT_CARD_TEMPLATE, photoSlots: [] };
    }
    return this.findTemplateBySlug(slug);
  }

  /** Nhánh admin: cả mẫu chưa xuất bản, để màn quản lý tag thấy đủ kho. */
  async findAllTemplates(
    query: QueryAdminTemplatesDto,
  ): Promise<Paginated<Template>> {
    const [items, total] = await this.templateRepository.findAllPaged(query);
    return { items, total };
  }

  /**
   * Dải mẫu trang chủ: *mẫu nào* và *thứ tự* do cờ `featuredOnHome` +
   * `homepageOrder`. Mẫu đã chọn thì hiện **đủ**, không cắt theo số ô: CMS từng
   * có ô "Số ô hiển thị" riêng, và chọn 15 mẫu mà đặt 6 ô thì 9 mẫu cuối im lặng
   * không lên trang — chọn là hiện, bỏ chọn là ra.
   *
   * `site_settings.homepageTemplateCount` chỉ còn quyết định nhánh dự phòng:
   * chưa chọn mẫu nào thì lấy chừng ấy mẫu đầu kho — trang chủ không bao giờ
   * được trống chỉ vì vận hành chưa vào CMS bấm chọn.
   */
  async findHomepageTemplates(): Promise<Template[]> {
    const featured = await this.templateRepository.findFeaturedOnHome();
    if (featured.length) return featured;

    const { homepageTemplateCount } = await this.settingsService.find();
    const published = await this.templateRepository.findPublished();
    return published.slice(0, homepageTemplateCount);
  }

  async updateTemplate(
    slug: string,
    dto: UpdateTemplateDto,
  ): Promise<Template> {
    const template = await this.findTemplateBySlug(slug);
    Object.assign(template, definedFields(dto));
    const saved = await this.templateRepository.save(template);
    this.revalidateService.ping([CACHE_TAGS.templates]);
    return saved;
  }

  /**
   * Đặt lại toàn bộ dải trang chủ. Mẫu không nằm trong danh sách bị hạ cờ, mẫu
   * trong danh sách nhận `homepageOrder` theo đúng vị trí gửi lên.
   */
  async setHomepageTemplates(slugs: string[]): Promise<Template[]> {
    const [templates] = await this.templateRepository.findAllPaged({});
    const unknown = slugs.filter(
      (slug) => !templates.some((template) => template.slug === slug),
    );
    if (unknown.length) {
      throw new NotFoundException(ERROR_MESSAGES.CATALOG.TEMPLATE_NOT_FOUND);
    }

    for (const template of templates) {
      const position = slugs.indexOf(template.slug);
      template.featuredOnHome = position !== -1;
      template.homepageOrder = position === -1 ? 0 : position;
    }
    await this.templateRepository.save(templates);
    this.revalidateService.ping([CACHE_TAGS.templates]);
    return this.findHomepageTemplates();
  }
}
