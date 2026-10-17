import { ERROR_MESSAGES } from '@constant/error-messages';
import { CardsService } from '@modules/cards/cards.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { RsvpRepository } from './interactions.repository';
import { Rsvp } from './rsvp.entity';

/** Thứ khách nhận lại sau khi gửi — không kèm id hay phản hồi của ai khác. */
export interface RsvpReceipt {
  attending: boolean;
  partySize: number;
}

type RsvpFields = Pick<Rsvp, 'name' | 'attending' | 'partySize'>;

/** Postgres báo trùng khoá bằng mã `23505`; thông báo thì đổi theo ngôn ngữ. */
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class RsvpsService {
  constructor(
    private readonly rsvpRepository: RsvpRepository,
    private readonly cardsService: CardsService,
  ) {}

  /**
   * Khách gửi xác nhận tham dự. Cùng điều kiện với sổ lưu bút, tất cả kiểm ở
   * đây chứ không ở UI: thiệp phải đã xuất bản và block `rsvp` phải đang bật.
   *
   * Vào bằng link mời riêng thì phản hồi **đứng tên khách đó** và gửi lại là
   * sửa, không tạo dòng mới. Việc mã còn hiệu lực hay không do
   * `CardsService.findInvitedGuest` quyết, không tự tra ở đây.
   */
  async submitFromGuest(
    slug: string,
    dto: CreateRsvpDto,
  ): Promise<RsvpReceipt> {
    const card = await this.cardsService.findBySlugOrFail(slug);
    if (card.status === 'draft') {
      throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    }
    // `?.`: thiệp chưa được migration `AddRsvps` backfill thì thiếu khoá — coi
    // như tắt, đúng với mặc định của block này.
    if (!card.content.visibility?.rsvp) {
      throw new BadRequestException(ERROR_MESSAGES.RSVP.BLOCK_DISABLED);
    }

    const fields: RsvpFields = {
      name: dto.name,
      attending: dto.attending,
      partySize: dto.attending ? dto.partySize : 0,
    };
    const guest = await this.cardsService.findInvitedGuest(
      card,
      dto.guestToken,
    );
    const saved = guest
      ? await this.saveForGuest(card.id, guest.id, fields)
      : await this.rsvpRepository.save(
          this.rsvpRepository.create({
            cardId: card.id,
            guestId: null,
            ...fields,
          }),
        );

    return { attending: saved.attending, partySize: saved.partySize };
  }

  /** Màn quản lý của chủ thiệp. */
  async findAllForOwner(cardId: string, ownerId: string): Promise<Rsvp[]> {
    await this.cardsService.assertOwner(cardId, ownerId);
    return this.rsvpRepository.findAllForCard(cardId);
  }

  /**
   * Xoá một phản hồi — dòng trùng từ link chung, hoặc phản hồi rác. Khách vào
   * bằng link riêng vẫn gửi lại được sau đó; xoá không khoá link của họ.
   */
  async remove(cardId: string, rsvpId: string, ownerId: string): Promise<void> {
    await this.cardsService.assertOwner(cardId, ownerId);
    const rsvp = await this.rsvpRepository.findOneForCard(rsvpId, cardId);
    if (!rsvp) throw new NotFoundException(ERROR_MESSAGES.RSVP.NOT_FOUND);
    await this.rsvpRepository.remove(rsvp);
  }

  /**
   * Một khách một phản hồi. Hai lượt bấm gửi gần như cùng lúc từ cùng một link
   * đều thấy "chưa có" và cùng tạo mới; lượt sau vấp unique index. Khi đó ghi đè
   * lên dòng lượt trước vừa tạo — trả 500 cho một khách chỉ bấm hai lần là sai.
   */
  private async saveForGuest(
    cardId: string,
    guestId: string,
    fields: RsvpFields,
  ): Promise<Rsvp> {
    const existing = await this.rsvpRepository.findByGuest(guestId);
    try {
      return await this.rsvpRepository.save(
        existing
          ? Object.assign(existing, fields)
          : this.rsvpRepository.create({ cardId, guestId, ...fields }),
      );
    } catch (error) {
      if (existing || !isUniqueViolation(error)) throw error;
      const winner = await this.rsvpRepository.findByGuest(guestId);
      if (!winner) throw error;
      return this.rsvpRepository.save(Object.assign(winner, fields));
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}
