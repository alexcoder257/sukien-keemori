import type { Paginated } from '@common/dto/pagination.dto';
import { PAYMENT_HOLD_MS } from '@common/constants/payment.constants';
import { AuditService, type AuditActor } from '@modules/audit/audit.service';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { CommerceService } from '@modules/commerce/commerce.service';
import type { Order, OrderStatus } from '@modules/commerce/order.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { extractPaymentCode } from '@common/payment/payment-code';
import type {
  QueryAdminOrdersDto,
  QueryUnmatchedDto,
} from './dto/query-admin-payments.dto';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { PaymentTransaction } from './payment-transaction.entity';
import { PaymentsRepository } from './payments.repository';

/** Thông tin đủ để dựng màn thanh toán cho một đơn. */
export interface CheckoutInfo {
  orderId: string;
  status: Order['status'];
  /** Thiệp được mua; trang thanh toán dùng để dẫn về thiệp khi đã trả. */
  cardId: string | null;
  /** Đường dẫn công khai của thiệp — chỉ có khi đơn đã `paid` (thiệp đã xuất bản). */
  cardSlug?: string;
  amount: number;
  paymentCode: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  /** Cùng dữ liệu ngân hàng, gom nhóm theo hợp đồng API (`bin` = mã ngân hàng của SePay). */
  bank: {
    bin: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
  };
  /** Ảnh QR VietQR đã điền sẵn số tiền và nội dung. */
  qrImageUrl: string;
  /** Bí danh của `qrImageUrl`. */
  qrUrl: string;
  /**
   * Mốc màn thanh toán ngừng chờ, ISO. Tính từ lúc tạo đơn nên tải lại trang
   * không kéo dài thêm giờ. **Không phải hạn của đơn** — xem
   * `PAYMENT_HOLD_MINUTES`.
   */
  holdExpiresAt: string;
  /**
   * Lúc tiền được ghi nhận, ISO; `null` khi đơn chưa trả. Màn thanh toán dùng
   * nó để phân biệt "vừa trả xong" với "mở lại đơn đã trả hôm trước" — đơn 0₫
   * sinh ra đã là `paid` nên không có lượt chuyển `pending → paid` nào để bắt.
   */
  paidAt: string | null;
}

/**
 * Tài khoản nhận tiền, công bố ở trang Thông tin doanh nghiệp.
 *
 * Đọc từ đúng ba biến môi trường mà `checkout` dựng QR — trang công bố và mã QR
 * không bao giờ trỏ vào hai tài khoản khác nhau. Không có số tiền hay mã đơn:
 * đây là thông tin pháp nhân, không phải thông tin của một giao dịch.
 */
export interface ReceivingAccount {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

/** Mã lỗi Postgres cho vi phạm unique constraint. */
const UNIQUE_VIOLATION = '23505';

/** Một đơn như màn tra cứu ở CMS nhìn thấy. */
export interface AdminOrderView {
  id: string;
  paymentCode: string | null;
  status: OrderStatus;
  amount: number;
  listAmount: number;
  discountAmount: number;
  voucherCode: string | null;
  gatewayReference: string | null;
  createdAt: Date;
  paidAt: Date | null;
  /** `null` khi tài khoản đã xoá thật — đơn sống lâu hơn tài khoản. */
  user: { id: string; email: string; fullName: string } | null;
  /** `null` khi thiệp đã bị xoá. */
  card: { id: string; slug: string; title: string } | null;
  transactions: PaymentTransaction[];
}

/** Danh sách đơn kèm tổng của mọi đơn khớp bộ lọc (không riêng trang này). */
export interface AdminOrderPage extends Paginated<AdminOrderView> {
  summary: { paidCount: number; paidAmount: number };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly commerceService: CommerceService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  /* ------------------------------------------------------------- checkout */

  /**
   * Dựng thông tin thanh toán cho một đơn của chính người đang đăng nhập.
   *
   * QR trỏ thẳng vào tài khoản nhận và đã nhúng sẵn số tiền lẫn nội dung, nên
   * đường đi thường gặp là khách không gõ gì cả — đó là lớp phòng thủ rẻ nhất
   * chống mất mã.
   */
  async checkout(userId: string, orderId: string): Promise<CheckoutInfo> {
    const order = await this.commerceService.findOwnOrder(userId, orderId);
    if (!order.paymentCode) {
      throw new BadRequestException(ERROR_MESSAGES.PAYMENT.MISSING_CODE);
    }

    const accountNumber = this.requireConfig('SEPAY_ACCOUNT_NUMBER');
    const bankCode = this.requireConfig('SEPAY_BANK_CODE');
    const accountName =
      this.configService.get<string>('SEPAY_ACCOUNT_NAME') ?? '';

    const qrImageUrl = buildQrUrl({
      accountNumber,
      bankCode,
      amount: order.amount,
      description: order.paymentCode,
    });

    // Slug chỉ lộ sau khi tiền về: trước đó thiệp chưa có link công khai.
    const cardSlug =
      order.status === 'paid' && order.cardId
        ? await this.commerceService.findPaidCardSlug(userId, order.cardId)
        : undefined;

    return {
      orderId: order.id,
      status: order.status,
      cardId: order.cardId,
      cardSlug,
      amount: order.amount,
      paymentCode: order.paymentCode,
      accountNumber,
      accountName,
      bankCode,
      bank: { bin: bankCode, accountNumber, accountName, bankName: bankCode },
      qrImageUrl,
      qrUrl: qrImageUrl,
      holdExpiresAt: new Date(
        order.createdAt.getTime() + PAYMENT_HOLD_MS,
      ).toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
    };
  }

  /**
   * Tài khoản nhận tiền cho trang công khai.
   *
   * Chưa cấu hình thì trả `null` chứ không ném như `checkout`: ở màn thanh toán
   * thiếu tài khoản là phải dừng hẳn, còn trang thông tin doanh nghiệp chỉ bỏ
   * đi một dòng.
   */
  receivingAccount(): ReceivingAccount | null {
    const accountNumber = this.configService.get<string>(
      'SEPAY_ACCOUNT_NUMBER',
    );
    const bankCode = this.configService.get<string>('SEPAY_BANK_CODE');
    if (!accountNumber || !bankCode) return null;
    return {
      bankCode,
      accountNumber,
      accountName: this.configService.get<string>('SEPAY_ACCOUNT_NAME') ?? '',
    };
  }

  /* -------------------------------------------------------------- webhook */

  /**
   * Xử lý một sự kiện biến động số dư từ SePay.
   *
   * **Luôn hoàn thành bình thường trừ khi máy chủ thật sự hỏng.** SePay coi mọi
   * phản hồi khác `{"success": true}` là thất bại và thử lại tới 7 lần trong 5
   * giờ. Giao dịch không ghép được đơn nào không phải là lỗi giao *tin* — tin
   * đã tới nơi và đã được ghi lại; nó là việc của người tra soát. Trả lỗi ở đây
   * chỉ khiến SePay bắn lại đúng payload đó thêm sáu lần rồi bỏ cuộc, và ta mất
   * luôn bản ghi.
   */
  async handleSepayWebhook(dto: SepayWebhookDto): Promise<PaymentTransaction> {
    const sepayId = String(dto.id);

    // Chống lặp vòng một: đã xử lý rồi thì trả lại đúng bản ghi cũ, không đụng
    // gì tới đơn. Vòng hai là unique index, xem `catch` ở dưới.
    const seen = await this.paymentsRepository.findBySepayId(sepayId);
    if (seen) return seen;

    const content = [dto.content, dto.description]
      .filter((part): part is string => Boolean(part))
      .join(' ');
    const paymentCode = dto.code?.trim()
      ? extractPaymentCode(dto.code)
      : extractPaymentCode(content);

    const draft = this.paymentsRepository.create({
      sepayId,
      gateway: dto.gateway,
      accountNumber: dto.accountNumber,
      subAccount: dto.subAccount ?? null,
      transferAmount: String(dto.transferAmount),
      content,
      paymentCode,
      referenceCode: dto.referenceCode ?? null,
      transactionDate: new Date(dto.transactionDate),
      rawPayload: { ...dto } as Record<string, unknown>,
      orderId: null,
      matchStatus: 'unmatched',
    });

    // Tiền chuyển đi thì ghi sổ rồi thôi — nó không bao giờ là một khoản thanh
    // toán, nhưng vẫn thuộc về sổ cái.
    if (dto.transferType !== 'in') {
      draft.matchStatus = 'ignored';
      return this.persist(draft);
    }

    const order = paymentCode
      ? await this.commerceService.findPendingByPaymentCode(paymentCode)
      : null;

    if (!order) {
      this.logger.warn(
        `Giao dịch ${sepayId} không ghép được đơn (mã: ${paymentCode ?? 'không có'})`,
      );
      return this.persist(draft);
    }

    // Trả thiếu thì **không** nâng gói. Ghi nhận là đã ghép được đơn để người
    // tra soát nhìn ra ngay khách nào còn nợ bao nhiêu.
    if (dto.transferAmount < order.amount) {
      draft.orderId = order.id;
      draft.matchStatus = 'underpaid';
      this.logger.warn(
        `Đơn ${order.id} nhận thiếu: ${dto.transferAmount}/${order.amount}`,
      );
      return this.persist(draft);
    }

    draft.orderId = order.id;
    draft.matchStatus = 'matched';
    const saved = await this.persist(draft);

    // Ghi giao dịch trước rồi mới nâng gói: nếu nâng gói hỏng thì bản ghi vẫn
    // còn và admin ghép tay được. Làm ngược lại thì gói đã nâng mà không có
    // dấu vết tiền ở đâu ra.
    await this.commerceService.markPaid(order.id, {
      gatewayReference: dto.referenceCode ?? sepayId,
    });
    return saved;
  }

  /* ------------------------------------------------------------ tra soát */

  async findUnmatched(
    query: QueryUnmatchedDto,
  ): Promise<Paginated<PaymentTransaction>> {
    const [items, total] =
      await this.paymentsRepository.findUnmatchedPaged(query);
    return { items, total };
  }

  /**
   * Tra cứu đơn mua thiệp: đơn, người mua, thiệp, và mọi khoản **tiền vào** đã
   * ghép vào đơn. Đây là màn người vận hành mở khi khách báo "đã chuyển tiền mà
   * thiệp chưa lên gói" — câu trả lời nằm ở chỗ đơn và tiền có gặp nhau không.
   */
  async findOrders(query: QueryAdminOrdersDto): Promise<AdminOrderPage> {
    const [[orders, total], summary] = await Promise.all([
      this.paymentsRepository.findOrdersPaged(query),
      this.paymentsRepository.summarizeOrders(query),
    ]);
    const transactions = await this.paymentsRepository.findByOrderIds(
      orders.map((order) => order.id),
    );
    const byOrder = new Map<string, PaymentTransaction[]>();
    for (const transaction of transactions) {
      if (!transaction.orderId) continue;
      const list = byOrder.get(transaction.orderId) ?? [];
      list.push(transaction);
      byOrder.set(transaction.orderId, list);
    }
    return {
      items: orders.map((order) => ({
        id: order.id,
        paymentCode: order.paymentCode,
        status: order.status,
        amount: order.amount,
        listAmount: order.listAmount,
        discountAmount: order.discountAmount,
        voucherCode: order.voucherCode,
        gatewayReference: order.gatewayReference,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        user: order.user
          ? {
              id: order.user.id,
              email: order.user.email,
              fullName: order.user.fullName,
            }
          : null,
        card: order.card
          ? {
              id: order.card.id,
              slug: order.card.slug,
              title: order.card.title,
            }
          : null,
        transactions: byOrder.get(order.id) ?? [],
      })),
      total,
      summary,
    };
  }

  /**
   * Ghép tay một giao dịch mồ côi vào một đơn — đường cứu hộ cho ca khách xoá
   * mất nội dung chuyển khoản. Vẫn đi qua `markPaid` như webhook, nên luật nâng
   * gói chỉ tồn tại ở một chỗ.
   */
  async matchManually(
    actor: AuditActor,
    transactionId: string,
    paymentCode: string,
  ): Promise<PaymentTransaction> {
    const transaction = await this.paymentsRepository.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException(ERROR_MESSAGES.PAYMENT.TRANSACTION_NOT_FOUND);
    }
    if (transaction.orderId) {
      throw new ConflictException(ERROR_MESSAGES.PAYMENT.ALREADY_MATCHED);
    }
    // Chỉ đơn **đang chờ**: đơn đã trả hay đã huỷ thì `markPaid` cũng từ chối,
    // nhưng báo "không có đơn chờ với mã này" rõ hơn một lỗi trạng thái đơn.
    const order =
      await this.commerceService.findPendingByPaymentCode(paymentCode);
    if (!order) {
      throw new NotFoundException(
        ERROR_MESSAGES.PAYMENT.PENDING_ORDER_NOT_FOUND,
      );
    }
    const orderId = order.id;

    await this.commerceService.markPaid(orderId, {
      gatewayReference: transaction.referenceCode ?? transaction.sepayId,
    });

    transaction.orderId = orderId;
    transaction.matchStatus = 'manual';
    const saved = await this.paymentsRepository.save(transaction);

    // Đây là thao tác tay có hệ quả tiền bạc lớn nhất trong CMS: nó đi qua đúng
    // `markPaid` như webhook nên **nâng gói thật**. Ghi số tiền và mã giao dịch
    // để đối chiếu ngược với sao kê ngân hàng — `payment_transactions` giữ
    // payload gốc, còn dòng này trả lời "ai đã quyết định ghép nó vào đơn nào".
    await this.auditService.record({
      action: 'order.matched_manually',
      actor,
      targetType: 'order',
      targetId: orderId,
      targetLabel: saved.paymentCode,
      metadata: {
        transactionId: saved.id,
        sepayId: saved.sepayId,
        amount: saved.transferAmount,
      },
    });

    return saved;
  }

  /* ------------------------------------------------------------ nội bộ */

  /**
   * Lưu bản ghi, chịu được va chạm khi SePay bắn trùng hai request song song.
   * Kiểm tra `findBySepayId` ở trên là hàng rào mềm; unique index là hàng rào
   * thật, và va vào nó nghĩa là request kia đã xử lý xong — trả bản của họ.
   */
  private async persist(
    draft: PaymentTransaction,
  ): Promise<PaymentTransaction> {
    try {
      return await this.paymentsRepository.save(draft);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code ===
          UNIQUE_VIOLATION
      ) {
        const existing = await this.paymentsRepository.findBySepayId(
          draft.sepayId,
        );
        if (existing) return existing;
      }
      throw error;
    }
  }

  private requireConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new ServiceUnavailableException(
        ERROR_MESSAGES.PAYMENT.NOT_CONFIGURED,
      );
    }
    return value;
  }
}

/**
 * Ảnh QR VietQR do SePay dựng. Chỉ là một URL ảnh, không phải lời gọi API —
 * không tốn hạn mức giao dịch và không cần key, nên frontend nhúng thẳng được.
 */
function buildQrUrl(input: {
  accountNumber: string;
  bankCode: string;
  amount: number;
  description: string;
}): string {
  const params = new URLSearchParams({
    acc: input.accountNumber,
    bank: input.bankCode,
    amount: String(input.amount),
    des: input.description,
    template: 'compact',
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}
