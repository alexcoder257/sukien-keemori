import { cardWishesTag } from '@constant/cache-tags';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { RevalidateService } from '@common/revalidate/revalidate.service';
import { CardsService } from '@modules/cards/cards.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWishDto } from './dto/create-wish.dto';
import { WishRepository } from './interactions.repository';
import { Wish } from './wish.entity';

@Injectable()
export class WishesService {
  constructor(
    private readonly wishRepository: WishRepository,
    private readonly cardsService: CardsService,
    private readonly notificationsService: NotificationsService,
    private readonly revalidateService: RevalidateService,
  ) {}

  /**
   * Khách mời gửi lời chúc vào thiệp công khai. Ba điều kiện, tất cả kiểm ở
   * đây chứ không phải ở UI: thiệp phải đã xuất bản, block `wishes` phải đang
   * bật, và lời chúc mới luôn ở trạng thái **chờ duyệt**.
   */
  async createFromGuest(slug: string, dto: CreateWishDto): Promise<Wish> {
    const card = await this.cardsService.findBySlugOrFail(slug);
    if (card.status === 'draft') {
      throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    }
    if (!card.content.visibility.wishes) {
      throw new BadRequestException(ERROR_MESSAGES.WISH.BLOCK_DISABLED);
    }
    const wish = await this.wishRepository.save(
      this.wishRepository.create({
        cardId: card.id,
        name: dto.name,
        message: dto.message,
        approved: false,
      }),
    );

    // Lời chúc nằm im chờ duyệt thì vô hình với chủ thiệp cho tới khi họ tự
    // nghĩ ra mà vào xem. Đây là chỗ duy nhất biết chắc có bản mới nên cũng là
    // chỗ đẩy thông báo. Không gửi email — chuông trong app đủ, và quota mail
    // để dành cho thứ bắt buộc phải tới hộp thư.
    await this.notificationsService.pushWishPending({
      ownerId: card.ownerId,
      cardId: card.id,
      cardSlug: card.slug,
      cardTitle: card.title,
      guestName: wish.name,
    });

    return wish;
  }

  /** Lời chúc hiện trên thiệp khách mời xem — chỉ bản đã duyệt. */
  async findApprovedBySlug(slug: string): Promise<Wish[]> {
    const card = await this.cardsService.findBySlugOrFail(slug);
    if (card.status === 'draft') {
      throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    }
    return this.wishRepository.findApproved(card.id);
  }

  /** Màn quản lý của chủ thiệp — thấy cả bản chờ duyệt. */
  async findAllForOwner(cardId: string, ownerId: string): Promise<Wish[]> {
    await this.cardsService.assertOwner(cardId, ownerId);
    // Mở danh sách là đã nhìn thấy — tắt thông báo của chính thiệp này luôn,
    // không bắt bấm thêm một nút "đã đọc".
    await this.notificationsService.markWishGroupRead(ownerId, cardId);
    return this.wishRepository.findAllForCard(cardId);
  }

  /**
   * Số lời chúc chờ duyệt của từng thiệp, cho danh sách "Thiệp của tôi". Trả
   * riêng thay vì nhét vào `CardsService.findMine()` để `cards` không phải phụ
   * thuộc ngược vào `interactions` — một chiều phụ thuộc duy nhất thì không cần
   * `forwardRef`.
   */
  async countPendingForOwner(ownerId: string): Promise<Record<string, number>> {
    // Lấy danh sách thiệp của chính chủ rồi mới đếm — quyền sở hữu nằm ngay
    // trong phép lọc, không cần kiểm lại từng id.
    const cards = await this.cardsService.findMine(ownerId);
    return this.wishRepository.countPendingByCards(
      cards.map((card) => card.id),
    );
  }

  /** Tổng lời chúc đã nhận trên mọi thiệp của một tài khoản. */
  async countAllForOwner(ownerId: string): Promise<{ wishes: number }> {
    const cards = await this.cardsService.findMine(ownerId);
    const wishes = await this.wishRepository.countByCards(
      cards.map((card) => card.id),
    );
    return { wishes };
  }

  /**
   * Duyệt hoặc ẩn lại một lời chúc. Hai chiều cùng một hàm vì đây là cùng một
   * phép ghi: duyệt nhầm rồi ẩn đi phải khôi phục được đúng trạng thái cũ chứ
   * không buộc chủ thiệp xoá lời chúc của khách.
   */
  async setApproved(
    cardId: string,
    wishId: string,
    ownerId: string,
    approved: boolean,
  ): Promise<Wish> {
    const card = await this.cardsService.assertOwner(cardId, ownerId);
    const wish = await this.wishRepository.findOneForCard(wishId, cardId);
    if (!wish) throw new NotFoundException(ERROR_MESSAGES.WISH.NOT_FOUND);
    wish.approved = approved;
    const saved = await this.wishRepository.save(wish);
    // Danh sách lời chúc trên trang thiệp được Next cache dùng chung cho mọi
    // khách mời. Không bắn thì chủ thiệp vừa bấm Duyệt, mở lại thiệp và không
    // thấy gì đổi — đúng cái bẫy "sửa xong tưởng hỏng".
    this.revalidateService.ping([cardWishesTag(card.slug)]);
    return saved;
  }

  async remove(cardId: string, wishId: string, ownerId: string): Promise<void> {
    const card = await this.cardsService.assertOwner(cardId, ownerId);
    const wish = await this.wishRepository.findOneForCard(wishId, cardId);
    if (!wish) throw new NotFoundException(ERROR_MESSAGES.WISH.NOT_FOUND);
    await this.wishRepository.remove(wish);
    // Xoá một lời chúc **đã duyệt** là đổi danh sách công khai. Bắn cả khi lời
    // chúc còn đang chờ duyệt: rẻ hơn nhiều so với việc tra lại trạng thái để
    // quyết định có bắn hay không, và bắn thừa chỉ tốn một lượt nạp lại.
    this.revalidateService.ping([cardWishesTag(card.slug)]);
  }
}
