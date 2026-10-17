import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { Rsvp } from './rsvp.entity';
import { TemplateReviewHelpful } from './template-review-helpful.entity';
import { TemplateReview } from './template-review.entity';
import { Wish } from './wish.entity';

/** Một dòng thống kê sao của một mẫu, đã gộp sẵn ở tầng DB. */
export interface ReviewSummaryRow {
  templateSlug: string;
  count: number;
  average: number;
  /** Số lượt cho từng mức sao, index 0 ứng với 1 sao. */
  distribution: number[];
}

@Injectable()
export class WishRepository extends Repository<Wish> {
  constructor(private readonly dataSource: DataSource) {
    super(Wish, dataSource.createEntityManager());
  }

  /** Lời chúc hiện trên thiệp: chỉ bản đã duyệt, mới nhất trước. */
  findApproved(cardId: string): Promise<Wish[]> {
    return this.find({
      where: { cardId, approved: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** Màn quản lý của chủ thiệp: cả đã duyệt lẫn chờ duyệt. */
  findAllForCard(cardId: string): Promise<Wish[]> {
    return this.find({ where: { cardId }, order: { createdAt: 'DESC' } });
  }

  /**
   * Số lời chúc chờ duyệt của từng thiệp. Gom một câu query thay vì đếm từng
   * thiệp một: danh sách "Thiệp của tôi" cần con số này cho mọi dòng.
   */
  async countPendingByCards(
    cardIds: string[],
  ): Promise<Record<string, number>> {
    if (!cardIds.length) return {};
    const rows = await this.createQueryBuilder('wish')
      .select('wish.card_id', 'cardId')
      .addSelect('COUNT(*)', 'count')
      .where('wish.card_id IN (:...cardIds)', { cardIds })
      .andWhere('wish.approved = false')
      .groupBy('wish.card_id')
      .getRawMany<{ cardId: string; count: string }>();

    return Object.fromEntries(
      rows.map((row) => [row.cardId, Number(row.count)]),
    );
  }

  /** Tổng lời chúc (mọi trạng thái) trên một nhóm thiệp — trang tài khoản. */
  countByCards(cardIds: string[]): Promise<number> {
    if (!cardIds.length) return Promise.resolve(0);
    return this.createQueryBuilder('wish')
      .where('wish.card_id IN (:...cardIds)', { cardIds })
      .getCount();
  }

  findOneForCard(id: string, cardId: string): Promise<Wish | null> {
    return this.findOne({ where: { id, cardId } });
  }
}

@Injectable()
export class RsvpRepository extends Repository<Rsvp> {
  constructor(private readonly dataSource: DataSource) {
    super(Rsvp, dataSource.createEntityManager());
  }

  /**
   * Màn quản lý của chủ thiệp. Xếp theo `updated_at`: khách đổi câu trả lời
   * qua link riêng thì dòng đó nổi lên đầu như một phản hồi mới.
   */
  findAllForCard(cardId: string): Promise<Rsvp[]> {
    return this.find({ where: { cardId }, order: { updatedAt: 'DESC' } });
  }

  findByGuest(guestId: string): Promise<Rsvp | null> {
    return this.findOne({ where: { guestId } });
  }

  findOneForCard(id: string, cardId: string): Promise<Rsvp | null> {
    return this.findOne({ where: { id, cardId } });
  }
}

@Injectable()
export class FavoriteRepository extends Repository<Favorite> {
  constructor(private readonly dataSource: DataSource) {
    super(Favorite, dataSource.createEntityManager());
  }

  /** Slug đã tim, mới tim nằm đầu — đúng thứ tự mà frontend đang mong đợi. */
  async findSlugsByUser(userId: string): Promise<string[]> {
    const favorites = await this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      select: { templateSlug: true },
    });
    return favorites.map((favorite) => favorite.templateSlug);
  }

  countByTemplates(slugs: string[]): Promise<number> {
    return this.countBy({ templateSlug: In(slugs) });
  }
}

@Injectable()
export class TemplateReviewHelpfulRepository extends Repository<TemplateReviewHelpful> {
  constructor(private readonly dataSource: DataSource) {
    super(TemplateReviewHelpful, dataSource.createEntityManager());
  }

  /**
   * Số lượt hữu ích của một nhóm đánh giá, gộp trong một câu query.
   *
   * Danh sách đánh giá của một mẫu luôn được lấy nguyên lô, nên đếm từng dòng
   * một là mở thêm N request xuống DB cho đúng một khối UI.
   */
  async countByReviews(reviewIds: string[]): Promise<Map<string, number>> {
    if (!reviewIds.length) return new Map();
    const rows = await this.createQueryBuilder('helpful')
      .select('helpful.review_id', 'reviewId')
      .addSelect('COUNT(*)', 'count')
      .where('helpful.review_id IN (:...reviewIds)', { reviewIds })
      .groupBy('helpful.review_id')
      .getRawMany<{ reviewId: string; count: string }>();

    return new Map(rows.map((row) => [row.reviewId, Number(row.count)]));
  }

  /** Những đánh giá mà **người đang xem** đã bấm hữu ích, trong cùng lô đó. */
  async findMarkedByUser(
    userId: string,
    reviewIds: string[],
  ): Promise<Set<string>> {
    if (!reviewIds.length) return new Set();
    const rows = await this.find({
      where: { userId, reviewId: In(reviewIds) },
      select: { reviewId: true },
    });
    return new Set(rows.map((row) => row.reviewId));
  }
}

@Injectable()
export class TemplateReviewRepository extends Repository<TemplateReview> {
  constructor(private readonly dataSource: DataSource) {
    super(TemplateReview, dataSource.createEntityManager());
  }

  /**
   * Danh sách đánh giá của một mẫu, mới nhất trước.
   *
   * Chỉ lấy đúng ba cột của người viết (`id`, `fullName`) thay vì cả bản ghi
   * user: đây là dữ liệu công khai, email và hash mật khẩu không được đi kèm.
   */
  findByTemplate(templateSlug: string): Promise<TemplateReview[]> {
    return this.find({
      where: { templateSlug },
      order: { createdAt: 'DESC' },
      relations: { user: true },
      select: {
        id: true,
        userId: true,
        templateSlug: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: { id: true, fullName: true },
      },
    });
  }

  findOneByUser(
    userId: string,
    templateSlug: string,
  ): Promise<TemplateReview | null> {
    return this.findOne({ where: { userId, templateSlug } });
  }

  /**
   * Bảng kiểm duyệt của khu quản trị: mọi mẫu, mọi người viết, mới nhất trước.
   *
   * Khác `findByTemplate`, ở đây trả kèm **email** người viết — admin cần định
   * danh được tài khoản đứng sau một nhận xét bị báo cáo, còn phía công khai
   * thì chỉ có tên hiển thị.
   */
  async findForAdmin(filter: {
    templateSlug?: string;
    q?: string;
    rating?: number;
    limit: number;
    offset: number;
  }): Promise<{ items: TemplateReview[]; total: number }> {
    const query = this.createQueryBuilder('review')
      .innerJoin('review.user', 'user')
      .select([
        'review.id',
        'review.userId',
        'review.templateSlug',
        'review.rating',
        'review.comment',
        'review.createdAt',
        'review.updatedAt',
        'user.id',
        'user.email',
        'user.fullName',
      ])
      .orderBy('review.createdAt', 'DESC')
      .take(filter.limit)
      .skip(filter.offset);

    if (filter.templateSlug) {
      query.andWhere('review.templateSlug = :templateSlug', {
        templateSlug: filter.templateSlug,
      });
    }
    if (filter.rating) {
      query.andWhere('review.rating = :rating', { rating: filter.rating });
    }
    if (filter.q) {
      query.andWhere(
        '(review.comment ILIKE :q OR user.email ILIKE :q OR user.fullName ILIKE :q)',
        { q: `%${filter.q}%` },
      );
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  /**
   * Thống kê sao của **mọi** mẫu trong một câu query.
   *
   * Card trong kho mẫu nào cũng cần con số này, nên đếm từng mẫu một là 12–80
   * lượt truy vấn cho một trang. Tập kết quả chỉ có tối đa vài chục dòng nên
   * gộp hết một lần rẻ hơn nhiều so với lọc theo danh sách slug đang hiển thị.
   */
  async summarizeAll(): Promise<ReviewSummaryRow[]> {
    const rows = await this.createQueryBuilder('review')
      .select('review.template_slug', 'templateSlug')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(review.rating)', 'average')
      .addSelect('COUNT(*) FILTER (WHERE review.rating = 1)', 'star1')
      .addSelect('COUNT(*) FILTER (WHERE review.rating = 2)', 'star2')
      .addSelect('COUNT(*) FILTER (WHERE review.rating = 3)', 'star3')
      .addSelect('COUNT(*) FILTER (WHERE review.rating = 4)', 'star4')
      .addSelect('COUNT(*) FILTER (WHERE review.rating = 5)', 'star5')
      .groupBy('review.template_slug')
      .getRawMany<Record<string, string>>();

    // Postgres trả COUNT/AVG dưới dạng chuỗi (bigint/numeric không lọt vừa
    // `number` của JS trong trường hợp tổng quát), nên ép kiểu ở đây.
    return rows.map((row) => ({
      templateSlug: row.templateSlug,
      count: Number(row.count),
      average: Number(row.average),
      distribution: [row.star1, row.star2, row.star3, row.star4, row.star5].map(
        Number,
      ),
    }));
  }
}
