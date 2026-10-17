import { definedFields } from '@common/utils/defined-fields';
import type { PaginationDto, Paginated } from '@common/dto/pagination.dto';
import { CACHE_TAGS } from '@constant/cache-tags';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { RevalidateService } from '@common/revalidate/revalidate.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CoupleShowcaseRepository,
  FaqRepository,
  SiteStatRepository,
} from './content.repository';
import { CoupleShowcase } from './couple-showcase.entity';
import { UpdateSiteStatsDto } from './dto/update-site-stats.dto';
import { CreateFaqDto, UpdateFaqDto } from './dto/upsert-faq.dto';
import {
  CreateCoupleShowcaseDto,
  UpdateCoupleShowcaseDto,
} from './dto/upsert-couple-showcase.dto';
import { Faq } from './faq.entity';
import { SITE_STAT_KEYS, type SiteStatKey } from './site-stat.entity';

/** Ngôn ngữ giao diện. FAQ là text giao diện nên phải chọn theo cái này. */
export type ContentLocale = 'vi' | 'en';

/** FAQ đã chọn ngôn ngữ — frontend không bao giờ thấy cột của ngôn ngữ kia. */
export interface FaqView {
  id: string;
  question: string;
  answer: string;
}

/** Số liệu marketing, trả về dạng map cho gọn: `{ "home.rating": 4.9 }`. */
export type SiteStats = Record<string, number>;

/** Một dòng số liệu ở màn CMS — dạng mảng vì form cần giữ thứ tự các ô. */
export interface SiteStatView {
  key: SiteStatKey;
  value: number;
}

@Injectable()
export class ContentService {
  constructor(
    private readonly faqRepository: FaqRepository,
    private readonly coupleShowcaseRepository: CoupleShowcaseRepository,
    private readonly siteStatRepository: SiteStatRepository,
    private readonly revalidateService: RevalidateService,
  ) {}

  /** Chỉ trả cột của đúng ngôn ngữ đang xem — xem ghi chú trong `Faq`. */
  async findFaqs(locale: ContentLocale): Promise<FaqView[]> {
    const faqs = await this.faqRepository.findPublished();
    return faqs.map((faq) => ({
      id: faq.id,
      question: locale === 'en' ? faq.questionEn : faq.questionVi,
      answer: locale === 'en' ? faq.answerEn : faq.answerVi,
    }));
  }

  /**
   * Trang chủ và trang hướng dẫn dựng khối FAQ từ dữ liệu Next đã cache. Gom
   * vào một hàm thay vì rải ra ba mutation vì đây là "chỗ duy nhất biết FAQ
   * vừa đổi" — thêm một loại cache nữa thì cũng chỉ sửa một hàm.
   */
  private invalidateFaqCaches(): void {
    this.revalidateService.ping([CACHE_TAGS.faq]);
  }

  findCoupleShowcases(): Promise<CoupleShowcase[]> {
    return this.coupleShowcaseRepository.findPublished();
  }

  /**
   * Postgres trả `numeric` dưới dạng chuỗi để không mất chính xác. Ép về
   * `number` ngay ở đây: frontend dùng những con số này để định dạng hiển thị,
   * và một chuỗi lọt qua sẽ hỏng ở `toLocaleString` chứ không báo lỗi sớm.
   */
  async findSiteStats(): Promise<SiteStats> {
    const stats = await this.siteStatRepository.findAllOrdered();
    return Object.fromEntries(
      stats.map((stat) => [stat.key, Number(stat.value)]),
    );
  }

  /**
   * Bản admin của dải số liệu: trả **đủ mọi khoá trong whitelist**, kể cả khoá
   * chưa từng có hàng trong bảng (giá trị 0).
   *
   * Route công khai chỉ trả những gì đang có nên nó không dùng lại được: form
   * CMS mà thiếu một ô thì người vận hành không có cách nào thêm số liệu đó.
   */
  async findAllSiteStats(): Promise<SiteStatView[]> {
    const stats = await this.findSiteStats();
    return SITE_STAT_KEYS.map((key) => ({ key, value: stats[key] ?? 0 }));
  }

  async updateSiteStats(dto: UpdateSiteStatsDto): Promise<SiteStatView[]> {
    await this.siteStatRepository.upsertMany(dto.stats);
    this.revalidateService.ping([CACHE_TAGS.siteStats]);
    return this.findAllSiteStats();
  }

  /* ------------------------------------------------------------- admin: FAQ */

  async findAllFaqs(page: PaginationDto): Promise<Paginated<Faq>> {
    const [items, total] = await this.faqRepository.findAllPaged(page);
    return { items, total };
  }

  /**
   * Ba hàm sửa FAQ đều phải vứt chỉ số tìm kiếm. Không làm thì người biên tập
   * sửa xong, thử lại trong hộp chat vẫn thấy kết quả cũ suốt 5 phút và sẽ kết
   * luận là tính năng hỏng.
   */
  async createFaq(dto: CreateFaqDto): Promise<Faq> {
    const faq = await this.faqRepository.save(this.faqRepository.create(dto));
    this.invalidateFaqCaches();
    return faq;
  }

  async updateFaq(id: string, dto: UpdateFaqDto): Promise<Faq> {
    const faq = await this.faqRepository.findById(id);
    if (!faq) throw new NotFoundException(ERROR_MESSAGES.CONTENT.FAQ_NOT_FOUND);
    Object.assign(faq, definedFields(dto));
    const saved = await this.faqRepository.save(faq);
    this.invalidateFaqCaches();
    return saved;
  }

  async removeFaq(id: string): Promise<void> {
    const faq = await this.faqRepository.findById(id);
    if (!faq) throw new NotFoundException(ERROR_MESSAGES.CONTENT.FAQ_NOT_FOUND);
    await this.faqRepository.remove(faq);
    this.invalidateFaqCaches();
  }

  /* -------------------------------------------------- admin: couple showcase */

  async findAllCoupleShowcases(
    page: PaginationDto,
  ): Promise<Paginated<CoupleShowcase>> {
    const [items, total] =
      await this.coupleShowcaseRepository.findAllPaged(page);
    return { items, total };
  }

  /**
   * `slug` là duy nhất ở tầng database — một thiệp chỉ chiếm một ô trong dải.
   * Bắt sớm ở đây để người vận hành thấy câu tiếng Việt thay vì lỗi 500 từ
   * unique index.
   */
  async createCoupleShowcase(
    dto: CreateCoupleShowcaseDto,
  ): Promise<CoupleShowcase> {
    if (await this.coupleShowcaseRepository.slugExists(dto.slug)) {
      throw new ConflictException(ERROR_MESSAGES.CONTENT.SHOWCASE_SLUG_EXISTS);
    }
    const showcase = await this.coupleShowcaseRepository.save(
      this.coupleShowcaseRepository.create(dto),
    );
    this.revalidateService.ping([CACHE_TAGS.showcase]);
    return showcase;
  }

  async updateCoupleShowcase(
    id: string,
    dto: UpdateCoupleShowcaseDto,
  ): Promise<CoupleShowcase> {
    const showcase = await this.findCoupleShowcaseById(id);
    if (dto.slug && dto.slug !== showcase.slug) {
      if (await this.coupleShowcaseRepository.slugExists(dto.slug)) {
        throw new ConflictException(
          ERROR_MESSAGES.CONTENT.SHOWCASE_SLUG_EXISTS,
        );
      }
    }
    Object.assign(showcase, definedFields(dto));
    const saved = await this.coupleShowcaseRepository.save(showcase);
    this.revalidateService.ping([CACHE_TAGS.showcase]);
    return saved;
  }

  /**
   * `ids` phải là **đúng** tập ô đang có — không thiếu, không thừa. Lệch nghĩa
   * là màn CMS đang cầm danh sách cũ (người khác vừa thêm/xoá một ô), và ghi
   * theo danh sách đó sẽ để ô mới nằm lẫn số thứ tự với các ô vừa sắp.
   */
  async reorderCoupleShowcases(ids: string[]): Promise<void> {
    const existing = new Set(await this.coupleShowcaseRepository.findAllIds());
    if (ids.length !== existing.size || ids.some((id) => !existing.has(id))) {
      throw new BadRequestException(
        ERROR_MESSAGES.CONTENT.SHOWCASE_ORDER_STALE,
      );
    }
    await this.coupleShowcaseRepository.reorder(ids);
    this.revalidateService.ping([CACHE_TAGS.showcase]);
  }

  async removeCoupleShowcase(id: string): Promise<void> {
    const showcase = await this.findCoupleShowcaseById(id);
    await this.coupleShowcaseRepository.remove(showcase);
    this.revalidateService.ping([CACHE_TAGS.showcase]);
  }

  private async findCoupleShowcaseById(id: string): Promise<CoupleShowcase> {
    const showcase = await this.coupleShowcaseRepository.findById(id);
    if (!showcase) {
      throw new NotFoundException(ERROR_MESSAGES.CONTENT.SHOWCASE_NOT_FOUND);
    }
    return showcase;
  }
}
