import { randomBytes } from 'node:crypto';
import {
  ALBUM_PHOTO_CAP,
  CARD_SLUG_MAX_LENGTH,
  DEFAULT_TEMPLATE_SLUG,
  GUEST_LIST_MAX_GUESTS,
  GUEST_NAME_MAX_LENGTH,
} from '@common/constants/invitation.constants';
import { DEFAULT_INVITATION_KIND } from '@common/enums/invitation.enum';
import type { CardStatus, InvitationKind } from '@common/enums/invitation.enum';
import type { Tier } from '@common/enums/tier.enum';
import { slugify } from '@common/utils/slugify';
import { DAY_MS, vietnamDate } from '@common/utils/vietnam-date';
import { ERROR_CODES } from '@constant/error-codes';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { CACHE_TAGS } from '@constant/cache-tags';
import { RevalidateService } from '@common/revalidate/revalidate.service';
import {
  CatalogService,
  type CardTemplate,
} from '@modules/catalog/catalog.service';
import { AuditService, type AuditActor } from '@modules/audit/audit.service';
import { STORAGE_PROVIDER } from '@modules/storage/storage.types';
import type { StorageProvider } from '@modules/storage/storage.types';
import { isKeyInsideCard } from '@modules/storage/storage-keys';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { CardGuest } from './card-guest.entity';
import {
  CardGuestRepository,
  CardsRepository,
  CardSlugAliasRepository,
  CardViewRepository,
} from './cards.repository';
import type { AdminCardRow } from './cards.repository';
import { cardDisplayName, contentKind } from './card-kind';
import { isCoupleNamesLocked, lockedNameValues } from './couple-names-lock';
import { parseGuestNames } from './guest-list';
import { CreateCardDto } from './dto/create-card.dto';
import { QueryAdminCardsDto } from './dto/query-admin-cards.dto';
import { QueryUpcomingWeddingsDto } from './dto/query-admin-card-insights.dto';
import { ChangeTemplateDto, UpdateCardDto } from './dto/update-card.dto';
import { createEmptyContent } from './empty-content';
import { StoredContent, WeddingCard } from './wedding-card.entity';
import { SharePreviewService } from '@modules/cards/share-preview.service';

/**
 * Đường dẫn do hệ thống sinh lúc tạo thiệp (`thiep-a1b2c3d4`). Chỉ những slug
 * khớp mẫu này mới bị thay ở lần xuất bản đầu — slug người dùng tự đặt là lựa
 * chọn của họ.
 */
const GENERATED_SLUG_PATTERN = /^thiep-[0-9a-f]{8}$/;

/** Thiệp trong danh sách "Thiệp của tôi" — không kèm nội dung. */
export interface CardSummary {
  id: string;
  createdAt: Date;
  slug: string;
  title: string;
  /** Loại thiệp (`content.kind`, thiếu là `wedding`). */
  kind: InvitationKind;
  templateSlug: string;
  templateName: string;
  /**
   * Thumbnail của mẫu, để danh sách có gì đó nhìn thấy được. Ảnh của chính cặp
   * đôi thì không dùng ở đây: mẫu dựng sẵn có 0 ô ảnh và thiệp nháp thì chưa tải
   * ảnh nào, nên nguồn đó rỗng đúng ở những dòng cần một mỏ neo thị giác nhất.
   * `null` khi mẫu đã gỡ khỏi kho hoặc chưa có ảnh.
   */
  templateImageSrc: string | null;
  templateTier: Tier;
  /** `draft` (chưa thanh toán, chưa có link) hoặc `paid` (đã xuất bản). */
  status: CardStatus;
  /** Đơn chuyển khoản đang chờ của thiệp nháp — "Thanh toán" mở lại đúng màn đó. */
  pendingOrderId: string | null;
  views: number;
  /** Thiệp đang bật link mời riêng — danh sách mới hiện lối vào danh sách link. */
  guestInviteEnabled: boolean;
  /**
   * Số khách trong danh sách link mời riêng. Tính năng giờ bật sẵn, nên chỉ
   * "bật" thôi không đủ để danh sách hiện lối vào màn link — phải có khách.
   */
  guestCount: number;
  /** Thiệp đang bật xác nhận tham dự — danh sách mới hiện lối vào màn phản hồi. */
  rsvpEnabled: boolean;
}

/** Một khách mời và mã link của họ, cho màn "Link khách mời" của chủ thiệp. */
export interface CardGuestLink {
  id: string;
  name: string;
  token: string;
}

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);

  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly slugAliasRepository: CardSlugAliasRepository,
    private readonly cardViewRepository: CardViewRepository,
    private readonly cardGuestRepository: CardGuestRepository,
    private readonly catalogService: CatalogService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    private readonly revalidateService: RevalidateService,
    private readonly auditService: AuditService,
    private readonly sharePreviewService: SharePreviewService,
  ) {}

  async create(ownerId: string, dto: CreateCardDto): Promise<WeddingCard> {
    const kind = dto.kind ?? DEFAULT_INVITATION_KIND;
    const template = await this.catalogService.findCardTemplate(
      dto.templateSlug,
    );
    assertTemplateFitsKind(template, kind);
    const slug = await this.generateSlug();

    // `plan_tier` là cột di sản của mô hình nhiều gói: thiệp nào cũng có đủ tính
    // năng nên luôn ghi `diamond` để mọi phép kiểm còn sót lại đều qua.
    const card = this.cardsRepository.create({
      ownerId,
      slug,
      title: dto.title ?? '',
      templateSlug: template.slug,
      templateTier: template.tier,
      planTier: 'diamond',
      status: 'draft',
      content: createEmptyContent(kind),
    });
    return this.cardsRepository.save(card);
  }

  async findMine(ownerId: string): Promise<CardSummary[]> {
    const cards = await this.cardsRepository.findByOwner(ownerId);
    return this.toSummaries(cards);
  }

  private async toSummaries(cards: WeddingCard[]): Promise<CardSummary[]> {
    const templates = await this.catalogService.findTemplates({});
    const bySlug = new Map<string, { name: string; imageSrc?: string | null }>(
      templates.map((t) => [t.slug, t]),
    );
    // Mẫu dựng sẵn không có hàng trong kho nhưng vẫn phải hiện đúng tên.
    const builtIn = await this.catalogService.findCardTemplate(
      DEFAULT_TEMPLATE_SLUG,
    );
    bySlug.set(builtIn.slug, { name: builtIn.name, imageSrc: null });

    const pendingOrders = await this.cardsRepository.findPendingOrderIds(
      cards.filter((card) => card.status === 'draft').map((card) => card.id),
    );

    return cards.map((card) => ({
      id: card.id,
      createdAt: card.createdAt,
      slug: card.slug,
      title: card.title,
      kind: contentKind(card.content),
      templateSlug: card.templateSlug,
      // Mẫu đã gỡ khỏi kho vẫn phải hiện tên gì đó trong danh sách của khách.
      templateName: bySlug.get(card.templateSlug)?.name ?? card.templateSlug,
      templateImageSrc: bySlug.get(card.templateSlug)?.imageSrc ?? null,
      templateTier: card.templateTier,
      // Hàng cũ còn `free`/`unpaid` (trước migration gộp trạng thái) cũng là
      // thiệp đã xuất bản.
      status: card.status === 'draft' ? 'draft' : 'paid',
      pendingOrderId: pendingOrders.get(card.id) ?? null,
      views: card.viewCount,
      guestInviteEnabled: card.content.guestInvite?.enabled ?? false,
      // Đếm từ chính `guestList` đã nạp cùng hàng, không truy vấn
      // `card_guests`: hai thứ luôn khớp sau mỗi lần lưu (`planGuests`).
      // `?.`: hàng chưa được `AddCardGuests` backfill thì thiếu hẳn khoá này, và
      // một thiệp cũ không được làm sập cả danh sách.
      guestCount: parseGuestNames(card.content.guestInvite?.guestList ?? '')
        .length,
      rsvpEnabled: card.content.visibility?.rsvp ?? false,
    }));
  }

  /** Bản đầy đủ cho chủ thiệp — không ẩn album, không tính lượt xem. */
  async findOneForOwner(ownerId: string, id: string): Promise<WeddingCard> {
    const card = await this.cardsRepository.findByIdAndOwner(id, ownerId);
    if (!card) throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    return card;
  }

  /**
   * Gắn `pendingOrderId` vào thiệp trả cho chủ thiệp: editor và "Thiệp của
   * tôi" dựa vào đó để biết nút "Tạo link" mở hộp thanh toán mới hay mở lại màn
   * chuyển khoản đang dở. Đọc từ bảng `orders` qua repository của `cards` —
   * không import `commerce` vì `commerce` đã phụ thuộc `cards`.
   */
  async withPendingOrder<T extends WeddingCard>(
    card: T,
  ): Promise<T & { pendingOrderId: string | null }> {
    if (card.status !== 'draft') return { ...card, pendingOrderId: null };
    const pending = await this.cardsRepository.findPendingOrderIds([card.id]);
    return { ...card, pendingOrderId: pending.get(card.id) ?? null };
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateCardDto,
  ): Promise<WeddingCard> {
    const card = await this.findOneForOwner(ownerId, id);
    // Chạy trước mọi luật khác, đúng chỗ của hai luật này hồi còn nằm ở DTO.
    if (dto.content) this.assertContentForKind(card, dto.content);
    if (dto.title !== undefined) card.title = dto.title;
    if (!dto.content) return this.cardsRepository.save(card);

    this.assertContentAllowed(dto.content);
    this.assertCoupleNamesEditable(card, dto.content);
    // Gói Song Hỷ đã gỡ: editor cũ hoặc thiệp lưu từ trước vẫn có thể gửi hai
    // khoá này lên — chấp nhận ở DTO rồi bỏ ở đây, không lưu.
    delete dto.content.familySplit;
    delete dto.content.viewSide;
    const previous = card.content;
    card.content = dto.content;
    if (dto.content.sharePreview) {
      const template = await this.catalogService.findCardTemplate(
        card.templateSlug,
      );
      dto.content.sharePreview = await this.sharePreviewService.prepare(
        card.id,
        template.photoSlots,
        dto.content,
        previous.sharePreview,
      );
    } else if (previous.sharePreview) {
      dto.content.sharePreview = previous.sharePreview;
    }
    const guests = await this.planGuests(
      card.id,
      dto.content.guestInvite.guestList,
    );
    const saved = await this.cardsRepository.saveWithGuests(card, guests);
    await this.removeReplacedPhotos(card.id, previous, dto.content);
    return saved;
  }

  /**
   * Xoá tệp của những ảnh có trong nội dung cũ mà không còn trong nội dung vừa
   * lưu — tức ảnh đã bị thay hoặc gỡ.
   *
   * Không làm lúc người dùng gỡ ảnh trong editor, vì họ có thể bỏ ngang không
   * lưu và thiệp đang chạy vẫn cần ảnh cũ. Không làm thì ảnh bị thay nằm lại kho
   * **vĩnh viễn** ở thiệp đã trả tiền — thứ không bao giờ bị cron xoá.
   *
   * Chạy **sau** khi đã ghi database: ghi hỏng thì nội dung cũ vẫn là nội dung
   * thật và mọi ảnh của nó phải còn. Hai luật "không mất ảnh" tự đứng vững vì
   * chúng giữ ảnh **trong** `content`: ảnh của ô mà mẫu mới không có vẫn nằm ở
   * `content.photos`, ảnh album bị ẩn khi hạ gói vẫn nằm ở `content.album`.
   *
   * `isKeyInsideCard` là bắt buộc: `content` là JSON người dùng gửi, dán được
   * URL ảnh của thiệp khác vào — gỡ nó ra không được xoá ảnh của người ta.
   * Xoá hỏng thì chỉ ghi log (provider tự nuốt lỗi): lượt lưu đã thành công.
   */
  private async removeReplacedPhotos(
    cardId: string,
    before: StoredContent,
    after: StoredContent,
  ): Promise<void> {
    const kept = new Set(contentPhotoUrls(after));
    for (const url of contentPhotoUrls(before)) {
      if (kept.has(url)) continue;
      const key = this.storageProvider.keyFromUrl(url);
      if (!key || !isKeyInsideCard(key, cardId)) continue;
      await this.storageProvider.remove(key);
    }
  }

  /**
   * Xoá tệp của những ảnh đã được **nhận về** thiệp (`POST /upload-sessions/claim`)
   * mà nội dung thiệp chưa bao giờ trỏ tới. Trả về số tệp đã xoá.
   *
   * Editor nhận ảnh về thiệp **trước** rồi mới ghi `content`, nên giữa hai bước
   * có một khe: lượt ghi bị từ chối (tên đã khoá, mất mạng) hoặc khách đóng tab
   * là tệp đã nằm trong `cards/<id>/` mà không có URL nào nhắc tới nó.
   * `removeReplacedPhotos` không thấy được tệp đó vì nó chưa từng có trong
   * `content`, còn thiệp đã trả tiền thì không bao giờ bị cron xoá — nên không
   * dọn ở đây là nằm lại kho vĩnh viễn.
   *
   * `UploadStagingService.purgeExpired` gọi hàm này lúc dọn một phiên đã hết
   * hạn, tức ít nhất một ngày sau lượt nhận: lượt Lưu đi kèm đã xong hoặc đã bị
   * bỏ từ lâu. Đọc `content` **lúc dọn** chứ không phải lúc nhận, nên ảnh được
   * một lượt lưu sau đó dùng tới vẫn được giữ.
   */
  async removeUnreferencedPhotos(
    cardId: string,
    urls: string[],
  ): Promise<number> {
    const card = await this.cardsRepository.findById(cardId);
    // Thiệp đã xoá thì `remove()` đã dọn cả thư mục của nó.
    if (!card) return 0;

    const referenced = new Set(contentPhotoUrls(card.content));
    let removed = 0;
    for (const url of urls) {
      if (referenced.has(url)) continue;
      const key = this.storageProvider.keyFromUrl(url);
      if (!key || !isKeyInsideCard(key, cardId)) continue;
      await this.storageProvider.remove(key);
      removed += 1;
    }
    return removed;
  }

  /** Danh sách khách mời kèm mã link, đúng thứ tự dòng cặp đôi đã gõ. */
  async findGuestsForOwner(
    ownerId: string,
    id: string,
  ): Promise<CardGuestLink[]> {
    const card = await this.findOneForOwner(ownerId, id);
    const guests = await this.cardGuestRepository.findByCard(card.id);
    return guests
      .filter((guest) => guest.side === 'groom')
      .map(({ id: guestId, name, token }) => ({
        id: guestId,
        name,
        token,
      }));
  }

  /**
   * Đổi mẫu. Ràng buộc bắt buộc của `docs/business-model.md` mục 4: **giữ
   * nguyên toàn bộ nội dung**, kể cả ảnh của ô mà mẫu mới không có. Vì vậy hàm
   * này chỉ chạm `templateSlug`/`templateTier` và không đụng vào `content` —
   * ảnh thừa nằm im trong map `photos` và đơn giản là không được vẽ ra.
   */
  async changeTemplate(
    ownerId: string,
    id: string,
    dto: ChangeTemplateDto,
  ): Promise<WeddingCard> {
    const card = await this.findOneForOwner(ownerId, id);
    const template = await this.catalogService.findCardTemplate(
      dto.templateSlug,
    );
    assertTemplateFitsKind(template, contentKind(card.content));
    card.templateSlug = template.slug;
    card.templateTier = template.tier;
    return this.cardsRepository.save(card);
  }

  /**
   * Đường dẫn đang hiệu lực của thiệp từng dùng `slug`, hoặc `undefined` nếu
   * `slug` chưa bao giờ thuộc về thiệp nào.
   *
   * Trang thiệp gọi hàm này **chỉ khi** tra theo đường dẫn chính đã trượt, nên
   * đường đi thường ngày không tốn thêm truy vấn nào.
   */
  async findCanonicalSlug(slug: string): Promise<string | undefined> {
    const alias = await this.slugAliasRepository.findBySlug(slug);
    if (!alias) return undefined;

    const card = await this.cardsRepository.findById(alias.cardId);
    return card?.slug;
  }

  /**
   * Đã có đủ tên để dựng đường dẫn và để tấm thiệp ra mắt khách chưa. Dùng ở
   * cả `publish` lẫn lúc tạo đơn: trả tiền cho một thiệp chưa thể xuất bản là
   * lỗi đẩy sang sau khi tiền đã về.
   */
  assertPublishable(card: WeddingCard): void {
    if (contentKind(card.content) === 'wedding') {
      if (
        !card.content.couple.groomFullName ||
        !card.content.couple.brideFullName
      ) {
        throw new BadRequestException(
          ERROR_MESSAGES.CARD.COUPLE_NAMES_REQUIRED_TO_PUBLISH,
        );
      }
    } else if (!cardDisplayName(card.content)) {
      throw new BadRequestException(
        ERROR_MESSAGES.CARD.OCCASION_NAME_REQUIRED_TO_PUBLISH,
      );
    }
  }

  /**
   * "Tạo link". Thiệp **chưa thanh toán** bị từ chối bằng `PAYMENT_REQUIRED`:
   * link công khai chỉ có sau khi tiền về, và việc xuất bản thật sự nằm ở
   * `activateAfterPayment` (gọi từ `CommerceService.markPaid`). Thiệp đã thanh
   * toán thì gọi lại chỉ là một lần lưu vô hại.
   */
  async publish(ownerId: string, id: string): Promise<WeddingCard> {
    const card = await this.findOneForOwner(ownerId, id);
    this.assertPublishable(card);
    if (card.status === 'draft') {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: ERROR_MESSAGES.CARD.PAYMENT_REQUIRED,
        code: ERROR_CODES.PAYMENT_REQUIRED,
      });
    }
    return this.saveWithUniqueSlug(card);
  }

  /**
   * Xuất bản thiệp **vĩnh viễn** khi tiền đã về (webhook, ghép tay hoặc đơn
   * 0₫ — mọi đường đều đi qua `CommerceService.markPaid`).
   *
   * `paidAt` là mốc bắt đầu cửa sổ 15 ngày khoá tên cô dâu chú rể, nên chỉ ghi
   * lần đầu (`??=`). Đường dẫn đọc được chỉ sinh ở lần xuất bản đầu: lúc tạo
   * thiệp chưa có tên ai, còn tới đây thì đã có (`createOrder` kiểm
   * `assertPublishable`). `plan_tier` là cột di sản, luôn `diamond`.
   */
  async activateAfterPayment(cardId: string): Promise<WeddingCard> {
    const card = await this.cardsRepository.findById(cardId);
    if (!card) throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);

    const now = new Date();
    const firstPublish = card.status === 'draft';
    card.status = 'paid';
    card.planTier = 'diamond';
    card.publishedAt ??= now;
    card.paidAt ??= now;
    card.expiresAt = null;
    if (firstPublish) {
      card.slug = await this.slugFromName(
        cardDisplayName(card.content),
        card.slug,
      );
    }
    return this.saveWithUniqueSlug(card);
  }

  /**
   * Xoá thiệp — **cả hàng lẫn ảnh**.
   *
   * Ảnh phải xoá theo, và phải xoá theo **thư mục** chứ không theo URL còn nằm
   * trong `content`: chủ thiệp thay ảnh một ô năm lần thì bốn tệp cũ không còn
   * được nhắc tới ở đâu cả, và suy khoá ngược từ nội dung hiện tại sẽ để chúng
   * lại trên đĩa vĩnh viễn. Mọi ảnh của một thiệp nằm dưới `cards/<id>`, nên đó
   * là đường duy nhất tìm lại đủ.
   *
   * Xoá ảnh **sau** khi hàng đã biến mất, và lỗi ở bước ảnh không được kéo theo
   * lỗi của cả thao tác: người dùng bấm xoá thì thứ họ chờ là thiệp không còn
   * truy cập được nữa. Một tệp mồ côi là chuyện dọn sau; một nút xoá báo lỗi
   * trong khi thiệp đã xoá thì không giải thích được.
   */
  async remove(ownerId: string, id: string): Promise<void> {
    const card = await this.findOneForOwner(ownerId, id);
    await this.cardsRepository.remove(card);
    try {
      await this.storageProvider.removeFolder(`cards/${id}`);
    } catch (error) {
      this.logger.warn(
        `Xoá thiệp ${id} xong nhưng không dọn được ảnh: ${String(error)}`,
      );
    }
  }

  /**
   * Dọn ảnh của **mọi** thiệp thuộc một chủ tài khoản. Dùng khi tài khoản bị
   * xoá thật.
   *
   * Không xoá hàng trong database: `wedding_cards.owner_id` là
   * `ON DELETE CASCADE`, nên Postgres đã dọn phần đó ngay khi hàng `users` biến
   * mất. Vấn đề là cascade chạy **trong database**, không đi qua `remove()` ở
   * trên, nên `removeFolder` không bao giờ được gọi và ảnh ở lại kho vĩnh viễn.
   * Hàm này lấp đúng khoảng đó.
   *
   * Vì vậy nó phải chạy **trước** khi xoá `users` — sau đó thì không còn cách
   * nào biết những `card.id` cần dọn nữa. Trả về danh sách id đã dọn để bên gọi
   * ghi vào nhật ký.
   *
   * Lỗi ở một thiệp không được chặn những thiệp còn lại: tài khoản vẫn phải xoá
   * được, và một thư mục ảnh mồ côi là chuyện dọn sau.
   */
  async removeStorageForOwner(ownerId: string): Promise<string[]> {
    const cards = await this.cardsRepository.findByOwner(ownerId);
    const cleaned: string[] = [];

    for (const card of cards) {
      try {
        await this.storageProvider.removeFolder(`cards/${card.id}`);
        cleaned.push(card.id);
      } catch (error) {
        this.logger.warn(
          `Xoá tài khoản ${ownerId}: không dọn được ảnh của thiệp ${card.id}: ${String(error)}`,
        );
      }
    }

    return cleaned;
  }

  /**
   * Thiệp mà khách mời nhìn thấy. Chưa xuất bản thì không tồn tại; đã xuất bản
   * thì link vĩnh viễn và không có trần người xem.
   *
   * `visitorId` là mã trong cookie của người xem (xem `CardView`). Lượt xem vẫn
   * được ghi nhận (số liệu cho chủ thiệp và CMS) nhưng không còn chặn ai:
   *
   * - **Không có mã thì không tính.** Bot lấy ảnh preview của Messenger/Zalo và
   *   `curl` không giữ cookie, nên `proxy.ts` không phát mã cho chúng; chúng
   *   vẫn xem được thiệp nhưng không làm tăng số liệu.
   */
  async findPublicBySlug(
    slug: string,
    visitorId?: string,
    /**
     * Mã trong link mời riêng. Chỉ đổi **lời chào**, không đổi quyền xem. Mã sai,
     * khách đã bị gạch khỏi danh sách hay cặp đôi đã tắt tính năng đều **hỏng
     * mềm** — thiệp mở bình thường với lời chào chung, vì người cầm link cũ không
     * làm gì sai để phải gặp trang lỗi.
     */
    guestToken?: string,
  ): Promise<{
    card: WeddingCard;
    guestName: string | null;
  }> {
    // `findBySlug` vẫn nhận cả hai đường dẫn riêng của gói Song Hỷ đã gỡ: link
    // cũ mở thiệp bình thường, không có nội dung riêng của nhà nào.
    const card = await this.cardsRepository.findBySlug(slug);
    if (!card || card.status === 'draft') {
      throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    }

    if (visitorId) {
      const knownVisitor = await this.cardViewRepository.hasViewed(
        card.id,
        visitorId,
      );
      if (!knownVisitor) {
        // `view_count` là bản đếm sẵn của số hàng trong `card_views`: giữ nó
        // đồng bộ ở đây để mọi chỗ đọc lượt xem (danh sách thiệp, số liệu CMS)
        // không phải `COUNT(*)` trên một bảng chỉ có lớn dần.
        const isNewVisitor = await this.cardViewRepository.record(
          card.id,
          visitorId,
        );
        if (isNewVisitor) {
          card.viewCount = await this.cardsRepository.incrementViewCount(
            card.id,
          );
        }
      }
    }

    // Hàng chưa được `AddCardGuests` backfill thì thiếu hẳn khoá này; coi như
    // tắt thay vì để trang thiệp của khách mời trả 500.
    const guestInvite = card.content.guestInvite ?? {
      enabled: false,
      guestList: '',
    };
    const guest = await this.findInvitedGuest(card, guestToken);
    // Danh sách khách **không bao giờ** rời backend qua route công khai: mọi
    // khách mời đều nhận cùng một payload, nên để nguyên thì bất kỳ ai mở link
    // cũng đọc được tên của cả trăm người khác trong mã nguồn trang. Cùng lý do
    // với `familySplit` còn sót trong thiệp cũ (có danh sách khách nhà gái).
    const content = { ...card.content };
    delete content.familySplit;
    card.content = {
      ...content,
      guestInvite: { enabled: guestInvite.enabled, guestList: '' },
      visibility: {
        ...card.content.visibility,
        rsvp: card.content.visibility?.rsvp ?? false,
      },
    };
    // Hai đường dẫn riêng cũ và các cột di sản không phải việc của khách; trạng
    // thái chỉ có hai giá trị với client.
    card.groomSlug = null;
    card.brideSlug = null;
    card.status = 'paid';
    card.expiresAt = null;
    return { card, guestName: guest?.name ?? null };
  }

  /**
   * `interactions` dùng để phân giải slug trước khi ghi lời chúc và xác nhận
   * tham dự. Nhận cả hai đường dẫn riêng cũ của gói Song Hỷ đã gỡ.
   */
  async findBySlugOrFail(slug: string): Promise<WeddingCard> {
    const card = await this.cardsRepository.findBySlug(slug);
    if (!card) throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    return card;
  }

  /**
   * Khách mời mà mã link riêng trỏ tới trong thiệp này, hoặc `null`.
   *
   * Đây là **luật duy nhất** cho câu hỏi "mã này còn hiệu lực không", dùng chung
   * cho lời chào trên màn mở đầu và cho xác nhận tham dự — tách ra hai nơi thì
   * có ngày link đã tắt vẫn ghi được phản hồi đứng tên một khách. Cặp đôi tắt
   * tính năng thì mọi mã coi như không có, dù hàng `card_guests` vẫn còn.
   *
   * Không phân biệt nhà: khách từng thuộc danh sách nhà gái của gói Song Hỷ đã
   * gỡ vẫn được chào bằng tên khi mở link riêng của họ.
   */
  async findInvitedGuest(
    card: WeddingCard,
    token: string | undefined,
  ): Promise<CardGuest | null> {
    // `?.`: hàng chưa được `AddCardGuests` backfill thì thiếu hẳn khoá này.
    if (!token || !card.content.guestInvite?.enabled) return null;
    return this.cardGuestRepository.findByToken(card.id, token);
  }

  /** `interactions`/`storage` dùng để kiểm quyền sở hữu trước khi ghi. */
  async assertOwner(cardId: string, ownerId: string): Promise<WeddingCard> {
    const card = await this.cardsRepository.findOneBy({ id: cardId });
    if (!card) throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    if (card.ownerId !== ownerId) {
      throw new ForbiddenException(ERROR_MESSAGES.CARD.NOT_OWNER);
    }
    return card;
  }

  countByOwner(ownerId: string): Promise<number> {
    return this.cardsRepository.countByOwner(ownerId);
  }

  /** Số liệu thiệp của một tài khoản cho trang tài khoản. */
  async statsForOwner(
    ownerId: string,
  ): Promise<{ cards: number; views: number }> {
    const [cards, views] = await Promise.all([
      this.cardsRepository.countByOwner(ownerId),
      this.cardsRepository.sumViewCountByOwner(ownerId),
    ]);
    return { cards, views };
  }

  /** Số thiệp theo từng trạng thái — `admin-dashboard` dựng thẻ số liệu từ đây. */
  countByStatus(): Promise<Record<CardStatus, number>> {
    return this.cardsRepository.countByStatus();
  }

  /* ----------------------------------------------------------- khu quản trị */

  /** Bảng thiệp toàn hệ thống (spec CMS mục 9), có phân trang và lọc. */
  findForAdmin(
    query: QueryAdminCardsDto,
  ): Promise<{ items: AdminCardRow[]; total: number }> {
    return this.cardsRepository.findForAdmin({
      status: query.status,
      templateSlug: query.templateSlug,
      kind: query.kind,
      q: query.q,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });
  }

  /**
   * Lịch ngày cưới: sắp tới thì gần nhất trước, đã qua thì vừa xong trước —
   * để người vận hành biết hôm nay nên gửi lời chúc cho ai. "Hôm nay" tính theo
   * giờ Việt Nam, cùng múi với ngày cưới editor ghi xuống.
   */
  findWeddingsByDate(query: QueryUpcomingWeddingsDto) {
    const scope = query.scope ?? 'upcoming';
    const now = Date.now();
    const bound = query.withinDays
      ? vietnamDate(
          new Date(
            now + (scope === 'upcoming' ? 1 : -1) * query.withinDays * DAY_MS,
          ),
        )
      : null;
    return this.cardsRepository.findWeddingsByDate({
      scope,
      today: vietnamDate(new Date(now)),
      bound,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });
  }

  /**
   * Bật/tắt trưng bày thiệp ở trang chủ. Chỉ thiệp **đã xuất bản** mới bật
   * được: dẫn trang chủ tới một thiệp nháp là dẫn tới trang lỗi.
   */
  async setShowcase(
    id: string,
    showcasedOnHome: boolean,
  ): Promise<WeddingCard> {
    const card = await this.cardsRepository.findById(id);
    if (!card) throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    // "Đã xuất bản" là mọi trạng thái khác `draft`: thiệp nháp chưa từng có link
    // công khai, dẫn trang chủ tới đó là dẫn tới 404.
    if (showcasedOnHome && card.status === 'draft') {
      throw new BadRequestException(ERROR_MESSAGES.CARD.NOT_PUBLISHED);
    }
    card.showcasedOnHome = showcasedOnHome;
    const saved = await this.cardsRepository.save(card);
    this.revalidateService.ping([CACHE_TAGS.showcase]);
    return saved;
  }

  /** Số thiệp tạo theo từng mẫu, từ mốc `since` (`null` là từ trước tới nay). */
  countCreatedByTemplate(
    since: Date | null,
  ): Promise<{ templateSlug: string; count: number }[]> {
    return this.cardsRepository.countByTemplate(since);
  }

  /** Số liệu cho màn phân tích; `admin-dashboard` gọi qua đây, không tự query. */
  async statistics(): Promise<{
    byTemplate: { templateSlug: string; count: number }[];
    totalViews: number;
  }> {
    const [byTemplate, totalViews] = await Promise.all([
      this.cardsRepository.countByTemplate(),
      this.cardsRepository.sumViewCount(),
    ]);
    return { byTemplate, totalViews };
  }

  /**
   * Admin mở hoặc khoá lại việc sửa tên cô dâu chú rể — đường hỗ trợ khi cặp đôi
   * liên hệ trực tiếp sau mốc 15 ngày.
   *
   * Chỉ thiệp đã thanh toán: thiệp khác không có khoá nào để mở. Trả về đúng hai
   * trường chứ không trả entity — khu quản trị không được nhận `content`.
   */
  async setCoupleNamesUnlocked(
    actor: AuditActor,
    id: string,
    unlocked: boolean,
  ): Promise<{ id: string; coupleNamesUnlocked: boolean }> {
    const card = await this.cardsRepository.findOneBy({ id });
    if (!card) throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    if (card.status !== 'paid') {
      throw new BadRequestException(
        ERROR_MESSAGES.CARD.COUPLE_NAMES_LOCK_NOT_PAID,
      );
    }

    if (card.coupleNamesUnlocked !== unlocked) {
      await this.cardsRepository.update(
        { id },
        { coupleNamesUnlocked: unlocked },
      );
      await this.auditService.record({
        action: unlocked
          ? 'card.couple_names_unlocked'
          : 'card.couple_names_locked',
        actor,
        targetType: 'card',
        targetId: card.id,
        targetLabel: card.title,
        metadata: { slug: card.slug, paidAt: card.paidAt },
      });
    }
    return { id: card.id, coupleNamesUnlocked: unlocked };
  }

  /**
   * Luật nội dung theo loại thiệp — những luật DTO không kiểm được vì DTO lồng
   * không đọc được `content.kind`.
   *
   * - Loại **không đổi được**: nội dung mang loại khác loại đang lưu bị từ chối.
   * - Thiệp cưới: đủ tên cô dâu chú rể và ít nhất một nghi lễ. Hai luật này
   *   từng là `@IsNotEmpty`/`@ArrayMinSize(1)` của DTO; lỗi giữ đúng hình dạng
   *   `ValidationPipe` trả, để editor thiệp cưới thấy y như trước.
   * - Mọi loại khác: có `occasion.name`.
   */
  private assertContentForKind(card: WeddingCard, next: StoredContent): void {
    const kind = contentKind(card.content);
    if (contentKind(next) !== kind) {
      throw new BadRequestException(ERROR_MESSAGES.CARD.KIND_IMMUTABLE);
    }
    if (kind === 'wedding') {
      const errors: string[] = [];
      for (const field of ['groomFullName', 'brideFullName'] as const) {
        if (isEmptyValue(next.couple?.[field])) {
          errors.push(`couple.${field} should not be empty`);
        }
      }
      if ((next.ceremonies?.length ?? 0) < 1) {
        errors.push('ceremonies must contain at least 1 elements');
      }
      if (errors.length > 0) throw new BadRequestException(errors);
      return;
    }
    if (!next.occasion?.name.trim()) {
      throw new BadRequestException(ERROR_MESSAGES.CARD.OCCASION_NAME_REQUIRED);
    }
  }

  /**
   * Sau `COUPLE_NAMES_LOCK_DAYS` kể từ lần thanh toán đầu, các ô tên không được
   * đổi (Điều khoản sử dụng mục 3): bốn ô tên cô dâu chú rể ở thiệp cưới, tên và
   * tên gọi của nhân vật chính ở loại khác (`lockedNameValues`). Mọi phần khác
   * của nội dung vẫn sửa tự do.
   */
  private assertCoupleNamesEditable(
    card: WeddingCard,
    next: StoredContent,
  ): void {
    if (!isCoupleNamesLocked(card)) return;
    const before = lockedNameValues(card.content);
    const after = lockedNameValues(next);
    const changed = before.some((value, index) => value !== after[index]);
    if (changed) {
      // Kèm `code`: editor dựa vào mã này để hiện thông báo riêng (lý do + nút
      // liên hệ admin) bằng đúng ngôn ngữ đang xem, thay vì toast chung.
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: ERROR_MESSAGES.CARD.COUPLE_NAMES_LOCKED,
        code: ERROR_CODES.COUPLE_NAMES_LOCKED,
      });
    }
  }

  /**
   * Trần cứng của album: thiệp là link vĩnh viễn nên chi phí lưu trữ cũng vĩnh
   * viễn.
   */
  private assertContentAllowed(content: StoredContent): void {
    if (content.album.photos.length > ALBUM_PHOTO_CAP) {
      throw new BadRequestException(ERROR_MESSAGES.CARD.ALBUM_CAP_EXCEEDED);
    }
    const missingCustomKind = content.ceremonies.some(
      (ceremony) => ceremony.kind === 'other' && !ceremony.customKind.trim(),
    );
    if (missingCustomKind) {
      throw new BadRequestException('Nghi lễ "khác" phải có tên tự nhập');
    }

    const guestNames = parseGuestNames(content.guestInvite.guestList);
    if (guestNames.length > GUEST_LIST_MAX_GUESTS) {
      throw new BadRequestException(ERROR_MESSAGES.CARD.GUEST_LIST_TOO_LONG);
    }
    if (guestNames.some((name) => name.length > GUEST_NAME_MAX_LENGTH)) {
      throw new BadRequestException(ERROR_MESSAGES.CARD.GUEST_NAME_TOO_LONG);
    }
  }

  /**
   * Đưa bảng `card_guests` về khớp với ô danh sách khách vừa lưu.
   *
   * Luật duy nhất: **dòng nào còn nguyên tên thì giữ nguyên mã link**. So khớp
   * theo tên chứ không theo số dòng — cặp đôi chèn thêm một khách lên đầu danh
   * sách thì mọi dòng bên dưới dịch xuống, và so theo vị trí sẽ trao link của
   * người này cho người kia.
   *
   * Tên trùng nhau được ghép lần lượt theo thứ tự (dòng "Bạn Minh" thứ nhất
   * nhận mã của "Bạn Minh" cũ thứ nhất). Sửa chữ một tên là một khách mới với
   * mã mới — không có cách nào phân biệt "sửa lỗi chính tả" với "thay người".
   *
   * Chạy cả khi tính năng đang tắt: tắt không xoá danh sách, và bật lại thì
   * link đã gửi phải còn đúng.
   *
   * Chỉ **tính** chứ không ghi: kết quả được ghi cùng nội dung thiệp trong một
   * transaction ở `CardsRepository.saveWithGuests`.
   *
   * Chỉ quản lý hàng `side = 'groom'` (mọi hàng mới và mọi hàng cũ của thiệp
   * thường). Hàng `bride` còn lại từ gói Song Hỷ đã gỡ được **để nguyên**: link
   * riêng đã gửi cho khách nhà gái vẫn phải chào đúng tên họ (`findInvitedGuest`
   * tra theo mã, không theo nhà), và xoá chúng là xoá dữ liệu không ai yêu cầu.
   * Mã thì duy nhất trên cả thiệp, đúng unique index `(card_id, token)`.
   */
  private async planGuests(
    cardId: string,
    guestList: string,
  ): Promise<{ save: CardGuest[]; remove: CardGuest[] }> {
    const existing = await this.cardGuestRepository.findByCard(cardId);
    const takenTokens = new Set(existing.map((guest) => guest.token));
    const save: CardGuest[] = [];

    const unclaimed = new Map<string, CardGuest[]>();
    for (const guest of existing.filter((item) => item.side === 'groom')) {
      unclaimed.set(guest.name, [...(unclaimed.get(guest.name) ?? []), guest]);
    }

    parseGuestNames(guestList).forEach((name, position) => {
      const kept = unclaimed.get(name)?.shift();
      if (kept) {
        kept.position = position;
        save.push(kept);
        return;
      }
      save.push(
        this.cardGuestRepository.create({
          cardId,
          name,
          position,
          side: 'groom',
          token: this.newGuestToken(takenTokens),
        }),
      );
    });

    return { save, remove: [...unclaimed.values()].flat() };
  }

  /**
   * Mã link khách mời: 8 ký tự base64url, tức 48 bit ngẫu nhiên. Đủ để không
   * dò ra được tên khách của người khác, và vẫn ngắn khi dán vào tin nhắn.
   *
   * Tránh cả mã của khách vừa bị xoá trong cùng lượt lưu: link cũ của người đã
   * bị gạch tên không được mở ra lời chào gửi cho một người khác.
   */
  private newGuestToken(taken: Set<string>): string {
    let token = randomBytes(6).toString('base64url');
    while (taken.has(token)) token = randomBytes(6).toString('base64url');
    taken.add(token);
    return token;
  }

  /**
   * Ghi thiệp, quy lỗi trùng khoá của database thành 409.
   *
   * `isSlugFree` kiểm tra rồi mới ghi, nên hai thiệp cùng xuất bản một đường
   * dẫn trong tích tắc đều qua được phép kiểm và thiệp sau đâm vào unique index.
   * Cửa sổ đó rất hẹp nhưng có thật, và không bắt thì nó rơi xuống thành 500.
   */
  private async saveWithUniqueSlug(card: WeddingCard): Promise<WeddingCard> {
    try {
      return await this.cardsRepository.save(card);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(ERROR_MESSAGES.CARD.SLUG_EXISTS);
      }
      throw error;
    }
  }

  /**
   * Đường dẫn đọc được, dựng từ tên trên thiệp (`cardDisplayName`): tên cô dâu
   * chú rể `tuan-anh-nhu-binh`, hoặc tên người được mừng / tên sự kiện.
   *
   * Chỉ thay khi slug hiện tại là **chuỗi ngẫu nhiên do hệ thống sinh**. Người
   * dùng giờ không đặt hay đổi được đường dẫn nữa, nhưng thiệp cũ có thể còn
   * mang đường dẫn tự đặt từ hồi tính năng đó còn — xuất bản không được ghi đè.
   *
   * Luôn kèm hậu tố ngẫu nhiên ngắn. Không phải để chống trùng — vòng lặp bên
   * dưới lo việc đó — mà để đường dẫn **không đoán được**: thiệp là nội dung
   * riêng tư của một cặp đôi, người lạ dò trúng link không được xem nó.
   */
  private async slugFromName(
    name: string,
    currentSlug: string,
  ): Promise<string> {
    if (!GENERATED_SLUG_PATTERN.test(currentSlug)) return currentSlug;

    const base = slugify(
      name,
      // Chừa chỗ cho hậu tố `-xxxx`.
      CARD_SLUG_MAX_LENGTH - 5,
    );
    if (!base) return currentSlug;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = `${base}-${randomBytes(2).toString('hex')}`;
      if (await this.isSlugFree(slug)) return slug;
    }
    // Không tìm ra chỗ trống sau 5 lần thì giữ nguyên slug ngẫu nhiên: đường dẫn
    // xấu vẫn tốt hơn là chặn người dùng xuất bản thiệp.
    return currentSlug;
  }

  /**
   * Trống ở cả đường dẫn đang dùng (chung lẫn hai đường riêng cũ của Song Hỷ) và
   * đường dẫn từng dùng. Một slug đã phát ra ngoài thì không được cấp lại cho
   * thiệp khác: link cũ của cặp đôi này sẽ mở ra đám cưới của cặp đôi khác.
   */
  private async isSlugFree(slug: string): Promise<boolean> {
    if (await this.cardsRepository.slugExists(slug)) return false;
    return !(await this.slugAliasRepository.slugExists(slug));
  }

  /**
   * Slug ngẫu nhiên cho thiệp vừa tạo, lúc chưa có tên ai. Đổi thành đường dẫn
   * đọc được ở lần xuất bản đầu tiên — xem `slugFromName`.
   */
  private async generateSlug(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = `thiep-${randomBytes(4).toString('hex')}`;
      if (!(await this.cardsRepository.slugExists(slug))) return slug;
    }
    throw new ConflictException(ERROR_MESSAGES.CARD.SLUG_EXISTS);
  }
}

/** Đúng phép kiểm của `@IsNotEmpty()` — không `trim`, để hành vi không đổi. */
function isEmptyValue(value: unknown): boolean {
  return value === '' || value === null || value === undefined;
}

/**
 * Postgres báo trùng khoá bằng mã `23505`. Đọc mã thay vì so chuỗi thông báo vì
 * thông báo đổi theo ngôn ngữ của server.
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

/** Mọi URL ảnh trong nội dung thiệp: ô ảnh của mẫu và album. */
function contentPhotoUrls(content: StoredContent | undefined): string[] {
  if (!content) return [];
  return [
    ...Object.values(content.photos ?? {}),
    ...(content.album?.photos ?? []),
  ].filter((url): url is string => typeof url === 'string' && url.length > 0);
}

/**
 * Mẫu chỉ dựng được thiệp đúng loại của nó (`templates.kind`): mẫu sinh nhật
 * không có chỗ cho tên cô dâu chú rể, mẫu cưới không có khối "thông tin chính".
 * Mẫu dựng sẵn là ngoại lệ — nó tự đổi bố cục theo loại thiệp.
 */
function assertTemplateFitsKind(
  template: Pick<CardTemplate, 'slug' | 'kind'>,
  kind: InvitationKind,
): void {
  if (template.slug === DEFAULT_TEMPLATE_SLUG) return;
  if (template.kind !== kind) {
    throw new BadRequestException(ERROR_MESSAGES.CARD.TEMPLATE_KIND_MISMATCH);
  }
}
