import type { CardStatus } from '@common/enums/invitation.enum';
import type { Tier } from '@common/enums/tier.enum';
import { DAY_MS, vietnamDate } from '@common/utils/vietnam-date';
import { AnalyticsService } from '@modules/analytics/analytics.service';
import type { TrafficStats } from '@modules/analytics/analytics.service';
import { CardsService } from '@modules/cards/cards.service';
import { CatalogService } from '@modules/catalog/catalog.service';
import { CommerceService } from '@modules/commerce/commerce.service';
import { UserService } from '@modules/user/user.service';
import { Injectable } from '@nestjs/common';

export interface DashboardOverview {
  users: number;
  cardsByStatus: Record<CardStatus, number>;
  /** Số đơn đã thanh toán. Cố ý không có tổng tiền: không còn màn doanh thu. */
  paidOrders: number;
}

/** Số liệu của **một** tài khoản, cho màn chi tiết người dùng trong CMS. */
export interface UserSummary {
  cards: number;
  cardViews: number;
  orders: number;
  paidOrders: number;
}

/** Màn phân tích (spec CMS mục 10) — quyền `super_admin`. */
export interface AnalyticsReport {
  traffic: TrafficStats;
  /** Thiệp đã tạo theo từng mẫu, nhiều nhất trước — "mẫu nào đang hot". */
  cardsByTemplate: {
    templateSlug: string;
    templateName: string;
    count: number;
  }[];
  cardsByStatus: Record<CardStatus, number>;
  /** Tổng lượt xem thiệp — lưu lượng thật của sản phẩm, khác lượt vào website. */
  totalCardViews: number;
}

/** Một dòng của màn "Mẫu xem nhiều": mẫu + lượt xem + thiệp tạo ra trong kỳ. */
export interface TemplateStatsRow {
  slug: string;
  name: string;
  tier: Tier;
  imageSrc: string | null;
  isPublished: boolean;
  /** Lượt mở xem mẫu — hộp thoại hoặc trang mẫu (mỗi trình duyệt một lần mỗi ngày). */
  openViews: number;
  /** Lượt mở bản demo đầy đủ của mẫu. */
  demoViews: number;
  /** Số thiệp khách tạo từ mẫu này trong cùng kỳ. */
  cardsCreated: number;
}

/**
 * Số liệu tổng quan cho trang quản trị. Module này **chỉ đọc** và chỉ gọi
 * service của domain khác — không có entity, không có repository riêng: mọi con
 * số ở đây đều thuộc về một domain đã có chủ, nhân bản query sang đây là mở
 * đường cho hai chỗ đếm lệch nhau.
 */
@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly userService: UserService,
    private readonly cardsService: CardsService,
    private readonly catalogService: CatalogService,
    private readonly commerceService: CommerceService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Mẫu nào trong kho được khách bấm vào nhiều — kèm số thiệp tạo ra từ mẫu đó
   * trong cùng kỳ, để thấy mẫu nào *được xem nhiều mà ít người dùng* (và ngược
   * lại). Trả **mọi** mẫu đang xuất bản, kể cả mẫu 0 lượt: mẫu không ai bấm
   * vào cũng là câu trả lời người vận hành cần.
   *
   * `days = 0` là từ trước tới nay. `trackingSince` là ngày đầu có số liệu xem
   * mẫu: bảng này mới có, nên kỳ "90 ngày" có thể thật ra chỉ là vài ngày.
   */
  async templateStats(days: number): Promise<{
    items: TemplateStatsRow[];
    trackingSince: string | null;
  }> {
    const since = days > 0 ? new Date(Date.now() - (days - 1) * DAY_MS) : null;
    const [{ items: templates }, views, cards] = await Promise.all([
      this.catalogService.findAllTemplates({}),
      this.catalogService.templateViewTotals(since ? vietnamDate(since) : null),
      this.cardsService.countCreatedByTemplate(
        since ? new Date(`${vietnamDate(since)}T00:00:00+07:00`) : null,
      ),
    ]);
    const viewsBySlug = new Map(
      views.rows.map((row) => [row.templateSlug, row]),
    );
    const cardsBySlug = new Map(
      cards.map((row) => [row.templateSlug, row.count]),
    );

    const items = templates
      .map((template) => ({
        slug: template.slug,
        name: template.name,
        tier: template.tier,
        imageSrc: template.imageSrc,
        isPublished: template.isPublished,
        openViews: viewsBySlug.get(template.slug)?.openViews ?? 0,
        demoViews: viewsBySlug.get(template.slug)?.demoViews ?? 0,
        cardsCreated: cardsBySlug.get(template.slug) ?? 0,
      }))
      // Mẫu đã gỡ khỏi kho mà không còn số liệu nào trong kỳ thì không đáng một dòng.
      .filter(
        (row) =>
          row.isPublished ||
          row.openViews + row.demoViews + row.cardsCreated > 0,
      )
      .sort(
        (a, b) =>
          b.openViews - a.openViews ||
          b.demoViews - a.demoViews ||
          b.cardsCreated - a.cardsCreated,
      );

    return { items, trackingSince: views.firstDay };
  }

  async overview(): Promise<DashboardOverview> {
    const [users, cardsByStatus, orderStats] = await Promise.all([
      this.userService.countAll(),
      this.cardsService.countByStatus(),
      this.commerceService.stats(),
    ]);
    return { users, cardsByStatus, paidOrders: orderStats.paidOrders };
  }

  /**
   * Số liệu của một tài khoản. `userService.findByIdOrFail` chạy trước để tài
   * khoản không tồn tại (hoặc đã bị vô hiệu hoá) trả 404 thay vì một loạt số 0
   * trông như một người dùng có thật nhưng chưa làm gì.
   */
  async userSummary(userId: string): Promise<UserSummary> {
    await this.userService.findByIdOrFail(userId);
    const [cardStats, orderStats] = await Promise.all([
      this.cardsService.statsForOwner(userId),
      this.commerceService.summaryForUser(userId),
    ]);
    return {
      cards: cardStats.cards,
      cardViews: cardStats.views,
      orders: orderStats.orders,
      paidOrders: orderStats.paidOrders,
    };
  }

  /**
   * Hai câu hỏi của spec mục 10: bao nhiêu người vào website, mẫu nào đang hot. Tên mẫu ghép ở đây từ kho mẫu vì `cards`
   * chỉ giữ `templateSlug` — bảng thiệp cố tình không khoá ngoại sang kho mẫu.
   */
  async analytics(days = 30): Promise<AnalyticsReport> {
    const [traffic, statistics, cardsByStatus, templates] = await Promise.all([
      this.analyticsService.traffic(days),
      this.cardsService.statistics(),
      this.cardsService.countByStatus(),
      // Không phân trang: chỗ này tra tên mẫu cho **mọi** dòng thống kê.
      this.catalogService.findAllTemplates({}),
    ]);

    return {
      traffic,
      cardsByTemplate: statistics.byTemplate.map((row) => ({
        templateSlug: row.templateSlug,
        templateName:
          templates.items.find((template) => template.slug === row.templateSlug)
            ?.name ?? row.templateSlug,
        count: row.count,
      })),
      cardsByStatus,
      totalCardViews: statistics.totalViews,
    };
  }
}
