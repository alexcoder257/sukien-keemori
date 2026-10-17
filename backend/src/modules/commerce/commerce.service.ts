import { AdminAlertsService } from '@modules/admin-alerts/admin-alerts.service';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { CardsService } from '@modules/cards/cards.service';
import { LegalService } from '@modules/legal/legal.service';
import { LEGAL_DOCUMENT_VERSIONS } from '@constant/legal-documents';
import type { WeddingCard } from '@modules/cards/wedding-card.entity';
import { PricingService } from '@modules/pricing/pricing.service';
import { MailService } from '@modules/mail/mail.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { UserService } from '@modules/user/user.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generatePaymentCode } from '@common/payment/payment-code';
import { VouchersService } from '@modules/vouchers/vouchers.service';
import { CommerceRepository } from './commerce.repository';
import {
  ConfirmPaymentDto,
  CreateOrderDto,
  PreviewVoucherDto,
} from './dto/create-order.dto';
import { Order } from './order.entity';

/**
 * `gateway_reference` của một đơn 0₫ — đơn được chốt bằng chính lượt tạo chứ
 * không có giao dịch ngân hàng nào đứng sau. Có mã giảm giá thì ghi kèm mã, vì
 * đó là lời giải thích duy nhất cho một đơn không thu được đồng nào.
 */
const ZERO_AMOUNT_REFERENCE = 'zero-amount';

/** Tên gói trong email biên nhận (chỉ còn một gói). */
const PACKAGE_NAME = 'Thiệp custom';

/** Số tiền trong email. */
function formatAmount(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

/** Báo giá gói duy nhất, đúng hình dạng `GET /orders/quote`. */
export interface Quote {
  /** Giá niêm yết. */
  listAmount: number;
  /** Khuyến mãi gói đang chạy, phần trăm; `0` là không có. */
  discountPercent: number;
  /** Số phải trả sau khuyến mãi gói (chưa tính mã giảm giá). */
  amount: number;
}

/** Kết quả thử một mã giảm giá, đúng hình dạng `POST /orders/voucher-preview`. */
export interface VoucherPreview {
  listAmount: number;
  discountAmount: number;
  /** Số **phải trả** sau khi trừ mã (đã gồm khuyến mãi gói). */
  amount: number;
  voucherCode: string;
  /** Cùng giá trị với `amount`, tên theo hình dạng cũ của hợp đồng. */
  finalAmount: number;
  /** Giá sau khuyến mãi gói, trước khi trừ mã. */
  packageAmount: number;
  discountType: 'percent' | 'amount';
  discountValue: number;
  remaining: number | null;
  perUserLimit: number | null;
  expiresAt: Date | null;
}

@Injectable()
export class CommerceService {
  private readonly logger = new Logger(CommerceService.name);

  constructor(
    private readonly commerceRepository: CommerceRepository,
    private readonly pricingService: PricingService,
    private readonly cardsService: CardsService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly vouchersService: VouchersService,
    private readonly configService: ConfigService,
    private readonly legalService: LegalService,
    private readonly adminAlertsService: AdminAlertsService,
  ) {}

  /**
   * Báo giá gói duy nhất. Tách khỏi `createOrder` vì hộp thanh toán cần báo giá
   * trước khi tạo đơn, và hai chỗ phải ra đúng một số.
   */
  async quote(): Promise<Quote> {
    const pricing = await this.pricingService.find();
    return {
      listAmount: pricing.price,
      discountPercent: pricing.discountPercent ?? 0,
      amount: pricing.finalPrice,
    };
  }

  /**
   * Thử một mã giảm giá trước khi tạo đơn. `VouchersService` nhận sẵn số tiền
   * (đã trừ khuyến mãi gói) và chỉ trả lời "mã này trừ được bao nhiêu", nên nó
   * không cần biết `commerce` tồn tại.
   */
  async previewVoucher(
    userId: string,
    dto: PreviewVoucherDto,
  ): Promise<VoucherPreview> {
    const quote = await this.quote();
    const evaluation = await this.vouchersService.evaluate({
      code: dto.code,
      userId,
      amount: quote.amount,
    });
    const { voucher } = evaluation;
    return {
      listAmount: quote.listAmount,
      discountAmount: evaluation.discountAmount,
      amount: evaluation.finalAmount,
      voucherCode: voucher.code,
      finalAmount: evaluation.finalAmount,
      packageAmount: quote.amount,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      remaining:
        voucher.usageLimit === null
          ? null
          : Math.max(0, voucher.usageLimit - voucher.usedCount),
      perUserLimit: voucher.perUserLimit,
      expiresAt: voucher.expiresAt,
    };
  }

  async availableVouchers(userId: string) {
    const quote = await this.quote();
    return this.vouchersService.findForCheckout({
      userId,
      amount: quote.amount,
    });
  }

  async findMine(userId: string): Promise<Order[]> {
    return this.commerceRepository.findByUser(userId);
  }

  /** Số liệu mua bán của một tài khoản — `admin-dashboard` dựng màn chi tiết. */
  summaryForUser(userId: string) {
    return this.commerceRepository.summaryForUser(userId);
  }

  /**
   * Đường dẫn công khai của thiệp đã thanh toán, cho màn thanh toán dẫn về
   * thiệp. `undefined` khi thiệp không còn (xoá) hoặc không thuộc người này.
   */
  async findPaidCardSlug(
    userId: string,
    cardId: string,
  ): Promise<string | undefined> {
    try {
      const card = await this.cardsService.findOneForOwner(userId, cardId);
      return card.status === 'draft' ? undefined : card.slug;
    } catch (error) {
      if (error instanceof NotFoundException) return undefined;
      throw error;
    }
  }

  /**
   * Tạo đơn thanh toán cho một thiệp nháp.
   *
   * Chỉ thiệp **chưa thanh toán** mới đặt mua được, và phải đủ tên để xuất bản
   * ngay khi tiền về (`assertPublishable`) — không để khách trả tiền cho một
   * thiệp chưa thể có link.
   *
   * Mỗi thiệp tối đa một đơn chờ: bấm "Thanh toán" lần hai (đóng tab rồi quay
   * lại) trả lại chính đơn đó nếu mã giảm giá không đổi, vì mã chuyển khoản cũ
   * có thể đã nằm trong app ngân hàng của khách.
   */
  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const card = await this.cardsService.assertOwner(dto.cardId, userId);
    if (card.status !== 'draft') {
      throw new BadRequestException(ERROR_MESSAGES.ORDER.CARD_ALREADY_PAID);
    }
    this.cardsService.assertPublishable(card);

    const quote = await this.quote();

    // Ghi lại việc khách được cho biết luật thanh toán/hoàn tiền tại đúng thời
    // điểm đặt mua. Không bao giờ ném lỗi (`LegalService.record`). Khách tick
    // văn bản nào thì ghi văn bản đó; Chính sách thanh toán luôn có mặt vì bấm
    // thanh toán chính là chấp thuận nó.
    const documents = [...(dto.acceptedDocuments ?? [])];
    if (!documents.some((doc) => doc.type === 'payment_refund')) {
      documents.push({
        type: 'payment_refund',
        version: LEGAL_DOCUMENT_VERSIONS.payment_refund,
      });
    }
    await this.legalService.record(userId, documents, 'checkout');

    const evaluation = dto.voucherCode
      ? await this.vouchersService.evaluate({
          code: dto.voucherCode,
          userId,
          amount: quote.amount,
        })
      : null;
    const discountAmount = evaluation?.discountAmount ?? 0;
    const amount = evaluation ? evaluation.finalAmount : quote.amount;

    const pending = await this.commerceRepository.findPendingForCard(card.id);
    if (pending) {
      if ((pending.voucherCode ?? null) === (dto.voucherCode ?? null)) {
        return pending;
      }
      // Mã giảm giá không còn khớp: khách vừa đổi lựa chọn ở hộp thanh toán.
      // Trả lại đơn cũ thì số tiền trên QR không khớp số vừa hiện. Đơn chờ chưa
      // cầm giữ gì — lượt dùng mã chỉ ghi ở `markPaid` — nên huỷ rồi phát lại
      // là an toàn.
      pending.status = 'cancelled';
      await this.commerceRepository.save(pending);
    }

    const order = await this.commerceRepository.save(
      this.commerceRepository.create({
        userId,
        cardId: card.id,
        // Cột di sản NOT NULL: chỉ còn một gói nên luôn `diamond`.
        tier: 'diamond',
        familySplit: false,
        status: 'pending',
        amount,
        // Giá niêm yết **trước** khuyến mãi gói và mã: biên nhận phải nói được
        // "gốc bao nhiêu, giảm bao nhiêu", mà bảng giá thì admin đổi bất cứ lúc
        // nào.
        listAmount: quote.listAmount,
        discountAmount,
        voucherId: evaluation?.voucher.id ?? null,
        voucherCode: evaluation?.voucher.code ?? null,
        isRepeatPurchase: false,
        paymentCode: await this.issuePaymentCode(),
      }),
    );

    // Đơn 0₫ (mã giảm 100%, hoặc khuyến mãi gói 100%) chốt ngay: không ai
    // chuyển được 0₫ nên webhook sẽ không bao giờ bắn. Đi qua `markPaid` chứ
    // không tự đặt `status = 'paid'` — xuất bản thiệp, đếm lượt dùng mã, chuông
    // và email biên nhận đều nằm trong đó.
    if (order.amount === 0) {
      return this.markPaid(order.id, {
        gatewayReference: order.voucherCode
          ? `${ZERO_AMOUNT_REFERENCE}:${order.voucherCode}`
          : ZERO_AMOUNT_REFERENCE,
      });
    }

    return order;
  }

  /**
   * Cấp một mã đơn chưa ai dùng.
   *
   * Không gian mã là 29⁶ ≈ 594 triệu nên đụng độ gần như không xảy ra, nhưng
   * "gần như" trên một cột `unique` là một lỗi 500 ngay giữa màn thanh toán.
   */
  private async issuePaymentCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generatePaymentCode();
      if (!(await this.commerceRepository.existsByPaymentCode(code))) {
        return code;
      }
    }
    throw new ConflictException(ERROR_MESSAGES.ORDER.CODE_GENERATION_FAILED);
  }

  /** `payments` dùng để dựng màn thanh toán cho đúng chủ đơn. */
  async findOwnOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.commerceRepository.findOneForUser(orderId, userId);
    if (!order) throw new NotFoundException(ERROR_MESSAGES.ORDER.NOT_FOUND);
    return order;
  }

  /** `payments` dùng để ghép giao dịch ngân hàng vào đơn đang chờ. */
  findPendingByPaymentCode(paymentCode: string): Promise<Order | null> {
    return this.commerceRepository.findPendingByPaymentCode(paymentCode);
  }

  /**
   * Đánh dấu đã thanh toán và **xuất bản thiệp**. Điểm vào duy nhất của việc
   * "tiền đã về": webhook SePay, ghép tay và xác nhận tay của admin đều đi qua
   * đây, nên luật xuất bản chỉ viết một lần.
   */
  async markPaid(orderId: string, dto: ConfirmPaymentDto): Promise<Order> {
    const order = await this.commerceRepository.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException(ERROR_MESSAGES.ORDER.NOT_FOUND);
    if (order.status === 'paid') {
      throw new ConflictException(ERROR_MESSAGES.ORDER.ALREADY_PAID);
    }
    if (order.status !== 'pending') {
      throw new BadRequestException(ERROR_MESSAGES.ORDER.NOT_PAYABLE);
    }
    // Đơn mất thiệp hoặc mất chủ thì không xuất bản cho ai được nữa — cả hai
    // cột là `SET NULL` nên trạng thái này có thật. Chặn ở đây thay vì để
    // `activateAfterPayment` ném "không tìm thấy thiệp" khi tiền đã về.
    if (!order.cardId || !order.userId) {
      throw new BadRequestException(ERROR_MESSAGES.ORDER.NOT_PAYABLE);
    }
    const { cardId, userId } = order;

    order.status = 'paid';
    order.paidAt = new Date();
    order.gatewayReference = dto.gatewayReference ?? null;
    const saved = await this.commerceRepository.save(order);

    const card = await this.cardsService.activateAfterPayment(cardId);
    await this.recordVoucherUse(saved, userId);
    await this.announcePaid(saved, card, userId);
    return saved;
  }

  /**
   * Ghi một lượt dùng mã vào sổ chiến dịch — chỉ khi tiền đã thật sự về.
   *
   * **Không bao giờ được ném lỗi**, cùng lý do với `announcePaid`: tới đây thiệp
   * đã xuất bản và tiền đã vào tài khoản, để một lỗi ở sổ đếm làm webhook SePay
   * nhận lỗi thì nó thử lại và ta phải xử lý một đơn đã `paid`.
   */
  private async recordVoucherUse(order: Order, userId: string): Promise<void> {
    if (!order.voucherId) return;
    try {
      await this.vouchersService.redeem({
        voucherId: order.voucherId,
        userId,
        orderId: order.id,
        discountAmount: order.discountAmount,
      });
    } catch (error) {
      this.logger.error(
        `Không ghi nhận được lượt dùng mã cho đơn ${order.id}`,
        error,
      );
    }
  }

  /**
   * Báo cho chủ thiệp biết tiền đã về: một dòng trong chuông và một email biên
   * nhận, cộng tin cho người vận hành.
   *
   * **Không bao giờ được ném lỗi.** Tới đây tiền đã vào tài khoản và thiệp đã
   * xuất bản; để một lỗi SMTP làm hỏng lời gọi này thì webhook của SePay sẽ
   * nhận về lỗi, thử lại, và ta phải xử lý một đơn đã `paid` — mà đó là thứ
   * `markPaid` từ chối.
   */
  private async announcePaid(
    order: Order,
    card: WeddingCard,
    userId: string,
  ): Promise<void> {
    try {
      await this.notificationsService.pushPaymentSuccess({
        userId,
        orderId: order.id,
        cardId: card.id,
        cardSlug: card.slug,
        cardTitle: card.title,
      });
    } catch (error) {
      this.logger.error(`Không tạo được thông báo cho đơn ${order.id}`, error);
    }

    let userEmail: string | null = null;
    try {
      const user = await this.userService.findByIdOrFail(userId);
      userEmail = user.email;
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ??
        'http://localhost:3000';
      // Email chỉ có bản tiếng Việt, giống email đặt lại mật khẩu.
      await this.mailService.sendPaymentSuccessEmail(user.email, {
        fullName: user.fullName,
        cardTitle: card.title || 'thiệp của bạn',
        tierName: PACKAGE_NAME,
        amountLabel: formatAmount(order.amount),
        cardUrl: `${frontendUrl}/vi/t/${card.slug}`,
        myCardsUrl: `${frontendUrl}/vi/thiep-cua-toi`,
      });
    } catch (error) {
      this.logger.error(`Không gửi được email cho đơn ${order.id}`, error);
    }

    // Tin cho người vận hành, cũng không ném lỗi — xem `AdminAlertsService`.
    this.adminAlertsService.orderPaid({
      orderId: order.id,
      amount: order.amount,
      listAmount: order.listAmount,
      discountAmount: order.discountAmount,
      voucherCode: order.voucherCode,
      gatewayReference: order.gatewayReference,
      userEmail,
      cardTitle: card.title,
      cardSlug: card.slug,
    });
  }

  async cancel(userId: string, orderId: string): Promise<Order> {
    const order = await this.commerceRepository.findOneForUser(orderId, userId);
    if (!order) throw new NotFoundException(ERROR_MESSAGES.ORDER.NOT_FOUND);
    if (order.status !== 'pending') {
      throw new BadRequestException(ERROR_MESSAGES.ORDER.NOT_PAYABLE);
    }
    order.status = 'cancelled';
    return this.commerceRepository.save(order);
  }

  /** `admin-dashboard` dùng để dựng số liệu tổng quan (số đơn đã trả). */
  async stats(): Promise<{ paidOrders: number }> {
    return { paidOrders: await this.commerceRepository.countPaid() };
  }
}
