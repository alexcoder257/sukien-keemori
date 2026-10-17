import {
  GUEST_TOKEN_MAX_LENGTH,
  VISITOR_ID_MAX_LENGTH,
} from '@common/constants/invitation.constants';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  NotFoundException,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import {
  QueryAdminCardsDto,
  SetCardShowcaseDto,
} from './dto/query-admin-cards.dto';
import { QueryUpcomingWeddingsDto } from './dto/query-admin-card-insights.dto';
import { SetCoupleNamesLockDto } from './dto/set-couple-names-lock.dto';
import type { AdminUser } from '@modules/admin-auth/admin-auth.types';
import { CurrentAdmin } from '@modules/admin-auth/decorators/current-admin.decorator';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';
import { ChangeTemplateDto, UpdateCardDto } from './dto/update-card.dto';

/** Thiệp của chính mình — mọi route đều yêu cầu đăng nhập. */
@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCardDto,
  ) {
    const card = await this.cardsService.create(user.userId, dto);
    return { ...card, pendingOrderId: null };
  }

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.cardsService.findMine(user.userId);
  }

  /** Số liệu cho trang tài khoản. Phải khai trước `:id` kẻo bị nuốt route. */
  @Get('stats')
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.cardsService.statsForOwner(user.userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const card = await this.cardsService.findOneForOwner(user.userId, id);
    return this.cardsService.withPendingOrder(card);
  }

  /** Link mời riêng của từng khách — nguồn của màn "Link khách mời". */
  @Get(':id/guests')
  findGuests(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cardsService.findGuestsForOwner(user.userId, id);
  }

  /** Lưu nội dung. `PUT` vì editor gửi nguyên khối `content`, không patch lẻ. */
  @Put(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCardDto,
  ) {
    const card = await this.cardsService.update(user.userId, id, dto);
    return this.cardsService.withPendingOrder(card);
  }

  @Patch(':id/template')
  async changeTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeTemplateDto,
  ) {
    const card = await this.cardsService.changeTemplate(user.userId, id, dto);
    return this.cardsService.withPendingOrder(card);
  }

  @Post(':id/publish')
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const card = await this.cardsService.publish(user.userId, id);
    return this.cardsService.withPendingOrder(card);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cardsService.remove(user.userId, id);
  }
}

/**
 * Thiệp mà khách mời mở — không đăng nhập. Tách controller vì đây là bề mặt
 * công khai duy nhất của module: nó tính lượt xem và gỡ danh sách khách khỏi
 * payload, còn nhánh `/cards` ở trên thì không.
 *
 * Lời chúc **không** trả kèm ở đây; chúng là bảng riêng của `interactions` và
 * có endpoint riêng `/public/cards/:slug/wishes`.
 */
@Controller('public/cards')
export class PublicCardsController {
  constructor(private readonly cardsService: CardsService) {}

  /**
   * `x-visitor-id` do `proxy.ts` phía frontend gắn vào, lấy từ cookie của người
   * xem. Header chứ không phải cookie vì request này đi từ **server Next**, chứ
   * không phải từ trình duyệt — cookie của khách không tự đến được đây.
   *
   * Giá trị là dữ liệu ngoài nên phải tự cắt: mã quá dài thì bỏ qua, coi như
   * lượt xem không nhận diện được. Không ném lỗi — một header rác không phải lý
   * do để khách mời không mở được thiệp cưới.
   *
   * `?khach=` là mã trong link mời riêng, cắt theo cùng nguyên tắc.
   */
  @Get(':slug')
  findPublic(
    @Param('slug') slug: string,
    @Headers('x-visitor-id') visitorId?: string,
    @Query('khach') guestToken?: string,
  ) {
    const trimmed = visitorId?.trim();
    const token = typeof guestToken === 'string' ? guestToken.trim() : '';
    return this.cardsService.findPublicBySlug(
      slug,
      trimmed && trimmed.length <= VISITOR_ID_MAX_LENGTH ? trimmed : undefined,
      token && token.length <= GUEST_TOKEN_MAX_LENGTH ? token : undefined,
    );
  }

  /**
   * Đường dẫn cũ → đường dẫn đang hiệu lực. Trang thiệp chỉ gọi khi tra theo
   * `:slug` đã trượt, rồi tự chuyển hướng người xem sang đường mới.
   *
   * Tách khỏi route trên thay vì để `findPublic` tự chuyển hướng, vì route trên
   * **có tính lượt xem**: gộp lại thì một lượt xem qua link cũ bị đếm hai lần,
   * một lần cho alias và một lần cho đường dẫn thật.
   */
  @Get(':slug/canonical')
  async findCanonical(@Param('slug') slug: string) {
    const canonical = await this.cardsService.findCanonicalSlug(slug);
    if (!canonical) throw new NotFoundException(ERROR_MESSAGES.CARD.NOT_FOUND);
    return { slug: canonical };
  }
}

/**
 * Lịch sử thiệp toàn hệ thống (spec CMS mục 9) — quyền *Admin*.
 *
 * Chỉ **đọc và trưng bày**: không sửa, không xoá thiệp của khách. Nội dung
 * thiệp cũng không trả về ở đây, xem ghi chú ở `CardsRepository.findForAdmin`.
 */
@Controller('admin/cards')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('cards:manage')
export class CardsAdminController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  findAll(@Query() query: QueryAdminCardsDto) {
    return this.cardsService.findForAdmin(query);
  }

  /** Lịch ngày cưới — gần nhất trước, để gửi lời chúc đúng ngày. */
  @Get('weddings')
  findWeddings(@Query() query: QueryUpcomingWeddingsDto) {
    return this.cardsService.findWeddingsByDate(query);
  }

  @Patch(':id/showcase')
  setShowcase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetCardShowcaseDto,
  ) {
    return this.cardsService.setShowcase(id, dto.showcasedOnHome);
  }

  /** Mở/khoá lại sửa tên cô dâu chú rể khi cặp đôi liên hệ hỗ trợ. */
  @Patch(':id/couple-names-lock')
  setCoupleNamesLock(
    @CurrentAdmin() actor: AdminUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetCoupleNamesLockDto,
  ) {
    return this.cardsService.setCoupleNamesUnlocked(actor, id, dto.unlocked);
  }
}
