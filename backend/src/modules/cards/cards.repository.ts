import {
  CARD_STATUSES,
  DEFAULT_INVITATION_KIND,
  INVITATION_KINDS,
} from '@common/enums/invitation.enum';
import type { CardStatus, InvitationKind } from '@common/enums/invitation.enum';
import type { UserRole } from '@common/enums/user-role.enum';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CardGuest } from './card-guest.entity';
import { CardSlugAlias } from './card-slug-alias.entity';
import { CardView } from './card-view.entity';
import { WeddingCard } from './wedding-card.entity';

/**
 * Một dòng trong bảng thiệp của khu quản trị: thiệp **không có `content`**, kèm
 * chủ sở hữu. Khai kiểu riêng thay vì trả `WeddingCard` để chỗ gọi không tưởng
 * là mình đang cầm nội dung thiệp.
 */
export type AdminCardRow = Omit<WeddingCard, 'content' | 'owner'> & {
  owner: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    /** Để người vận hành gọi/nhắn chúc mừng cặp đôi (lịch ngày cưới). */
    phone: string | null;
  };
  /**
   * `content.countdown.weddingDate` nguyên văn — trường **duy nhất** của
   * `content` mà danh sách quản trị đọc: ô trưng bày trang chủ điền sẵn ngày
   * cưới từ đây. Nó vốn hiện công khai trên thiệp; `null` là chưa nhập.
   */
  weddingDate: string | null;
  /** `content.kind` — loại thiệp; thiệp cũ không mang khoá này là `wedding`. */
  kind: InvitationKind;
};

@Injectable()
export class CardsRepository extends Repository<WeddingCard> {
  constructor(private readonly dataSource: DataSource) {
    super(WeddingCard, dataSource.createEntityManager());
  }

  findByOwner(ownerId: string): Promise<WeddingCard[]> {
    return this.find({ where: { ownerId }, order: { updatedAt: 'DESC' } });
  }

  /**
   * Thiệp mà một đường dẫn trỏ tới: đường dẫn chung, hoặc một trong hai đường
   * dẫn riêng nhà trai / nhà gái của thiệp Diamond Song Hỷ. Ba cột cùng một
   * không gian tên (`CardsService.isSlugFree`), nên một slug khớp tối đa một
   * hàng. Hai đường dẫn riêng là di sản của gói Song Hỷ đã gỡ: chúng vẫn phải
   * mở được thiệp, nhưng không còn mang nội dung riêng của nhà nào.
   */
  findBySlug(slug: string): Promise<WeddingCard | null> {
    return this.findOne({
      where: [{ slug }, { groomSlug: slug }, { brideSlug: slug }],
    });
  }

  /**
   * Ghi nội dung thiệp cùng danh sách khách mời trong **một transaction**.
   *
   * Hai thứ này là một lần bấm Lưu của người dùng. Ghi rời nhau thì bước khách
   * hỏng sau khi thiệp đã ghi xong sẽ trả lỗi cho một lượt lưu thực ra đã thành
   * công một nửa: editor báo lỗi, người dùng bấm lại, còn danh sách link trong
   * database lệch với ô danh sách đang nằm trong nội dung thiệp.
   *
   * Xoá khách trước rồi mới ghi: khách mới được sinh mã tránh cả mã của khách
   * vừa bị gạch, nên thứ tự này không đụng unique index `(card_id, token)`.
   */
  saveWithGuests(
    card: WeddingCard,
    guests: { save: CardGuest[]; remove: CardGuest[] },
  ): Promise<WeddingCard> {
    return this.manager.transaction(async (manager) => {
      const saved = await manager.save(WeddingCard, card);
      if (guests.remove.length > 0) {
        await manager.remove(CardGuest, guests.remove);
      }
      if (guests.save.length > 0) {
        await manager.save(CardGuest, guests.save);
      }
      return saved;
    });
  }

  /**
   * Đơn đang chờ thanh toán của từng thiệp (`cardId` → `orderId`). Đọc thẳng
   * bảng `orders` bằng SQL thay vì import entity của `commerce`: `commerce`
   * phụ thuộc `cards`, nên chiều ngược lại sẽ là vòng phụ thuộc. Mỗi thiệp chỉ
   * có tối đa một đơn chờ (`CommerceService.createOrder`).
   */
  async findPendingOrderIds(cardIds: string[]): Promise<Map<string, string>> {
    if (cardIds.length === 0) return new Map();
    const rows: { card_id: string; id: string }[] = await this.query(
      `SELECT "card_id", "id" FROM "orders"
        WHERE "status" = 'pending' AND "card_id" = ANY($1::uuid[])
        ORDER BY "created_at" ASC`,
      [cardIds],
    );
    return new Map(rows.map((row) => [row.card_id, row.id]));
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<WeddingCard | null> {
    return this.findOne({ where: { id, ownerId } });
  }

  /** Slug đã thuộc một thiệp nào chưa — ở cả đường dẫn chung lẫn hai đường dẫn riêng. */
  slugExists(slug: string): Promise<boolean> {
    return this.exists({
      where: [{ slug }, { groomSlug: slug }, { brideSlug: slug }],
    });
  }

  /**
   * Tăng lượt xem bằng một câu UPDATE thay vì đọc-sửa-ghi: thiệp được chia sẻ
   * hàng loạt nên nhiều request vào cùng lúc là chuyện bình thường, và
   * read-modify-write sẽ nuốt mất lượt xem.
   */
  async incrementViewCount(id: string): Promise<number> {
    const result = await this.createQueryBuilder()
      .update(WeddingCard)
      .set({ viewCount: () => '"view_count" + 1' })
      .where('id = :id', { id })
      .returning('view_count')
      .execute();
    return Number((result.raw as { view_count: number }[])[0]?.view_count ?? 0);
  }

  countByOwner(ownerId: string): Promise<number> {
    return this.countBy({ ownerId });
  }

  findById(id: string): Promise<WeddingCard | null> {
    return this.findOne({ where: { id } });
  }

  /** Danh sách thiệp cho khu quản trị, mới tạo trước. Cột: `adminCardQuery`. */
  async findForAdmin(filter: {
    status?: CardStatus;
    templateSlug?: string;
    kind?: InvitationKind;
    q?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: AdminCardRow[]; total: number }> {
    const query = this.adminCardQuery()
      .orderBy('card.createdAt', 'DESC')
      .take(filter.limit)
      .skip(filter.offset);

    if (filter.status) {
      query.andWhere('card.status = :status', { status: filter.status });
    }
    if (filter.templateSlug) {
      query.andWhere('card.templateSlug = :templateSlug', {
        templateSlug: filter.templateSlug,
      });
    }
    if (filter.kind) {
      // Thiệp tạo trước khi có loại không mang khoá `kind` — chúng là thiệp
      // cưới, nên lọc `wedding` phải bắt cả hàng thiếu khoá.
      query.andWhere(
        `COALESCE(card.content ->> 'kind', :defaultKind) = :kind`,
        { kind: filter.kind, defaultKind: DEFAULT_INVITATION_KIND },
      );
    }
    if (filter.q) {
      query.andWhere(
        '(card.title ILIKE :q OR card.slug ILIKE :q OR owner.email ILIKE :q)',
        { q: `%${filter.q}%` },
      );
    }

    const [items, total] = await query.getManyAndCount();
    return { items: await this.withWeddingDates(items), total };
  }

  /**
   * Lịch ngày cưới theo `content.countdown.weddingDate`. Editor luôn ghi giờ
   * Việt Nam dạng `YYYY-MM-DDTHH:mm:00+07:00`, nên 10 ký tự đầu **là** ngày
   * cưới tại chỗ và so chuỗi ISO đúng bằng so ngày — không cần ép kiểu, và một
   * giá trị gõ hỏng chỉ bị bỏ qua (`~` bên dưới) thay vì làm cả truy vấn lỗi.
   *
   * `today`/`until`/`from` là chuỗi `YYYY-MM-DD` theo giờ Việt Nam, do service
   * tính. Bỏ thiệp nháp: chưa xuất bản thì chưa chắc là một đám cưới thật.
   */
  async findWeddingsByDate(filter: {
    scope: 'upcoming' | 'past';
    today: string;
    /** Biên xa của khoảng: ngày muộn nhất (sắp tới) hoặc sớm nhất (đã qua). */
    bound: string | null;
    limit: number;
    offset: number;
  }): Promise<{ items: AdminCardRow[]; total: number }> {
    const day = "LEFT(card.content -> 'countdown' ->> 'weddingDate', 10)";
    const query = this.createQueryBuilder('card')
      .select('card.id', 'id')
      .where("card.status <> 'draft'")
      .andWhere(
        "(card.content -> 'countdown' ->> 'weddingDate') ~ '^\\d{4}-\\d{2}-\\d{2}'",
      );

    if (filter.scope === 'upcoming') {
      query.andWhere(`${day} >= :today`, { today: filter.today });
      if (filter.bound)
        query.andWhere(`${day} <= :bound`, { bound: filter.bound });
      query.orderBy(day, 'ASC');
    } else {
      query.andWhere(`${day} < :today`, { today: filter.today });
      if (filter.bound)
        query.andWhere(`${day} >= :bound`, { bound: filter.bound });
      query.orderBy(day, 'DESC');
    }
    query.addOrderBy('card.created_at', 'ASC');

    const total = await query.getCount();
    const rows = await query
      .offset(filter.offset)
      .limit(filter.limit)
      .getRawMany<{ id: string }>();
    return {
      items: await this.findAdminRowsInOrder(rows.map((row) => row.id)),
      total,
    };
  }

  /**
   * Cột của một dòng quản trị. **Không chọn cột `content`**: admin cần biết
   * thiệp nào tồn tại và ở trạng thái nào, không cần đọc nội dung riêng tư của
   * từng cặp đôi — và một trang danh sách kéo theo JSONB của mọi thiệp thì vừa
   * nặng vừa lộ.
   */
  private adminCardQuery() {
    return this.createQueryBuilder('card')
      .innerJoin('card.owner', 'owner')
      .select([
        'card.id',
        'card.slug',
        'card.title',
        'card.templateSlug',
        'card.templateTier',
        'card.status',
        'card.viewCount',
        'card.showcasedOnHome',
        'card.publishedAt',
        // Cột "Tên cô dâu chú rể" của CMS: ngày tự khoá và công tắc mở khoá.
        'card.paidAt',
        'card.coupleNamesUnlocked',
        'card.createdAt',
        'owner.id',
        'owner.email',
        'owner.fullName',
        'owner.role',
        'owner.phone',
      ]);
  }

  /** Nạp dòng quản trị cho một loạt id, giữ đúng thứ tự đã xếp hạng. */
  private async findAdminRowsInOrder(ids: string[]): Promise<AdminCardRow[]> {
    if (ids.length === 0) return [];
    const items = await this.adminCardQuery()
      .where('card.id IN (:...ids)', { ids })
      .getMany();
    const byId = new Map(items.map((item) => [item.id, item]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((item): item is WeddingCard => item !== undefined);
    return this.withWeddingDates(ordered);
  }

  private async withWeddingDates(
    items: WeddingCard[],
  ): Promise<AdminCardRow[]> {
    const fields = await this.findContentFields(items.map((item) => item.id));
    return items.map((item) => ({
      ...(item as unknown as Omit<AdminCardRow, 'weddingDate' | 'kind'>),
      weddingDate: fields.get(item.id)?.weddingDate ?? null,
      kind: fields.get(item.id)?.kind ?? DEFAULT_INVITATION_KIND,
    }));
  }

  /**
   * Bóc riêng `content.countdown.weddingDate` và `content.kind` bằng toán tử
   * JSONB của Postgres, để danh sách quản trị vẫn không kéo nguyên cột
   * `content` về.
   */
  private async findContentFields(
    ids: string[],
  ): Promise<
    Map<string, { weddingDate: string | null; kind: InvitationKind }>
  > {
    if (ids.length === 0) return new Map();
    const rows = await this.createQueryBuilder('card')
      .select('card.id', 'id')
      .addSelect(
        "NULLIF(card.content -> 'countdown' ->> 'weddingDate', '')",
        'weddingDate',
      )
      .addSelect("card.content ->> 'kind'", 'kind')
      .where('card.id IN (:...ids)', { ids })
      .getRawMany<{
        id: string;
        weddingDate: string | null;
        kind: string | null;
      }>();
    return new Map(
      rows.map((row) => [
        row.id,
        {
          weddingDate: row.weddingDate || null,
          // Giá trị lạ trong JSONB không được rò ra API dưới dạng một loại thật.
          kind: (INVITATION_KINDS as readonly string[]).includes(row.kind ?? '')
            ? (row.kind as InvitationKind)
            : DEFAULT_INVITATION_KIND,
        },
      ]),
    );
  }

  /**
   * Đếm thiệp theo mẫu — "mẫu nào đang hot" của spec analytic. Có `since` thì
   * chỉ đếm thiệp tạo từ mốc đó (màn "Mẫu xem nhiều" so lượt xem với số thiệp
   * tạo ra trong cùng kỳ).
   */
  async countByTemplate(
    since: Date | null = null,
  ): Promise<{ templateSlug: string; count: number }[]> {
    const query = this.createQueryBuilder('card')
      .select('card.template_slug', 'templateSlug')
      .addSelect('COUNT(*)', 'count')
      .groupBy('card.template_slug')
      .orderBy('COUNT(*)', 'DESC');
    if (since) query.where('card.created_at >= :since', { since });
    const rows = await query.getRawMany<{
      templateSlug: string;
      count: string;
    }>();
    return rows.map((row) => ({
      templateSlug: row.templateSlug,
      count: Number(row.count),
    }));
  }

  /** Tổng lượt xem các thiệp của một chủ sở hữu — cho trang tài khoản. */
  async sumViewCountByOwner(ownerId: string): Promise<number> {
    const row = await this.createQueryBuilder('card')
      .select('COALESCE(SUM(card.view_count), 0)', 'total')
      .where('card.owner_id = :ownerId', { ownerId })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  /** Tổng lượt xem mọi thiệp — thước đo lưu lượng thật của sản phẩm. */
  async sumViewCount(): Promise<number> {
    const row = await this.createQueryBuilder('card')
      .select('COALESCE(SUM(card.view_count), 0)', 'total')
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  /**
   * Đếm thiệp theo trạng thái trong một câu query thay vì hai lần `countBy`.
   * Trả về đủ mọi khoá kể cả khi chưa có thiệp nào ở trạng thái đó — thẻ số
   * liệu phải hiện `0`, không phải ô trống.
   */
  async countByStatus(): Promise<Record<CardStatus, number>> {
    const rows = await this.createQueryBuilder('card')
      .select('card.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('card.status')
      .getRawMany<{ status: string; count: string }>();

    const result = Object.fromEntries(
      CARD_STATUSES.map((status) => [status, 0]),
    ) as Record<CardStatus, number>;
    for (const row of rows) {
      // Hàng cũ còn `free`/`unpaid` (trước migration gộp trạng thái) cũng là
      // thiệp đã xuất bản — gộp vào `paid` thay vì tạo khoá lạ.
      const status: CardStatus = row.status === 'draft' ? 'draft' : 'paid';
      result[status] += Number(row.count);
    }
    return result;
  }
}

/**
 * Người đã xem thiệp. Hai thao tác: hỏi "khách này đã được tính chưa" và ghi
 * nhận một khách mới.
 */
@Injectable()
export class CardViewRepository extends Repository<CardView> {
  constructor(private readonly dataSource: DataSource) {
    super(CardView, dataSource.createEntityManager());
  }

  hasViewed(cardId: string, visitorId: string): Promise<boolean> {
    return this.existsBy({ cardId, visitorId });
  }

  /**
   * Ghi nhận một khách mới, trả về `true` nếu đây thật sự là lần đầu.
   *
   * `orIgnore` dựa vào unique index `(card_id, visitor_id)` thay vì "đọc rồi
   * ghi": trang thiệp hay được mở đồng loạt (một tin nhắn gửi vào nhóm chat gia
   * đình), và hai request của **cùng một khách** vào cùng lúc sẽ cùng thấy
   * "chưa có" rồi cùng ghi — thành hai khách. Để Postgres phân xử thì lượt thứ
   * hai không chèn được hàng nào và `view_count` không bị cộng oan.
   */
  async record(cardId: string, visitorId: string): Promise<boolean> {
    const result = await this.createQueryBuilder()
      .insert()
      .into(CardView)
      .values({ cardId, visitorId })
      .orIgnore()
      .execute();
    return result.identifiers.filter(Boolean).length > 0;
  }
}

/**
 * Đường dẫn cũ của thiệp. Bảng chỉ có hai thao tác — ghi lại một đường dẫn vừa
 * bị thay, và tra ngược đường dẫn cũ về thiệp — nên repository cũng chỉ có bấy
 * nhiêu.
 */
@Injectable()
export class CardSlugAliasRepository extends Repository<CardSlugAlias> {
  constructor(private readonly dataSource: DataSource) {
    super(CardSlugAlias, dataSource.createEntityManager());
  }

  findBySlug(slug: string): Promise<CardSlugAlias | null> {
    return this.findOne({ where: { slug } });
  }

  slugExists(slug: string): Promise<boolean> {
    return this.existsBy({ slug });
  }
}

/** Khách mời có link riêng của một thiệp. */
@Injectable()
export class CardGuestRepository extends Repository<CardGuest> {
  constructor(private readonly dataSource: DataSource) {
    super(CardGuest, dataSource.createEntityManager());
  }

  findByCard(cardId: string): Promise<CardGuest[]> {
    return this.find({ where: { cardId }, order: { position: 'ASC' } });
  }

  findByToken(cardId: string, token: string): Promise<CardGuest | null> {
    return this.findOne({ where: { cardId, token } });
  }
}
