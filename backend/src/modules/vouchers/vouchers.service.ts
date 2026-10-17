import { definedFields } from '@common/utils/defined-fields';
import type { PaginationDto, Paginated } from '@common/dto/pagination.dto';
import { applyAmount, applyPercent } from '@common/pricing/discount';
import { ERROR_MESSAGES } from '@constant/error-messages';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/upsert-voucher.dto';
import { VoucherRedemption } from './voucher-redemption.entity';
import { Voucher } from './voucher.entity';
import {
  VoucherRedemptionRepository,
  VoucherRepository,
} from './vouchers.repository';

/** Kết quả thẩm định một mã cho một đơn cụ thể. */
export interface VoucherEvaluation {
  voucher: Voucher;
  /** Số tiền được giảm, đã chặn trần và không bao giờ vượt quá giá đơn. */
  discountAmount: number;
  /** Giá phải trả sau khi trừ mã. */
  finalAmount: number;
}

export interface CheckoutVoucher {
  id: string;
  code: string;
  discountType: Voucher['discountType'];
  discountValue: number;
  maxDiscount: number | null;
  minAmount: number;
  remaining: number | null;
  perUserLimit: number | null;
  expiresAt: Date | null;
  amount: number;
  discountAmount: number;
  finalAmount: number;
  available: boolean;
  unavailableReason: 'minimum' | 'user-limit' | null;
  /** Bí danh của `unavailableReason` theo hợp đồng API; `undefined` khi dùng được. */
  reason?: 'minimum' | 'user-limit';
}

interface VoucherPurchase {
  userId: string;
  amount: number;
}

/**
 * Mã giảm giá.
 *
 * Module này **không import module nào khác** — `commerce` gọi vào đây, không
 * có chiều ngược lại. Nhờ vậy nó không biết gì về đơn hàng hay gói;
 * `evaluate` nhận sẵn số tiền đã tính và chỉ trả lời đúng một câu: mã này giảm
 * được bao nhiêu.
 */
@Injectable()
export class VouchersService {
  constructor(
    private readonly voucherRepository: VoucherRepository,
    private readonly redemptionRepository: VoucherRedemptionRepository,
  ) {}

  /* ------------------------------------------------------------ quản trị */

  async findAll(page: PaginationDto): Promise<Paginated<Voucher>> {
    const [items, total] = await this.voucherRepository.findAllPaged(page);
    return { items, total };
  }

  async create(dto: CreateVoucherDto): Promise<Voucher> {
    if (await this.voucherRepository.findByCode(dto.code)) {
      throw new ConflictException(ERROR_MESSAGES.VOUCHER.CODE_EXISTS);
    }
    this.assertShape(dto.discountType, dto.discountValue);
    // `tiers` (một gói duy nhất) và `partnerStoreId` (đối tác đã gỡ) nhận rồi bỏ.
    const { partnerStoreId: _partner, tiers: _tiers, ...rest } = dto;
    void _partner;
    void _tiers;
    return this.voucherRepository.save(
      this.voucherRepository.create({
        ...rest,
        tiers: [],
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      }),
    );
  }

  async update(id: string, dto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.findByIdOrFail(id);
    const {
      startsAt,
      expiresAt,
      partnerStoreId: _partner,
      tiers: _tiers,
      ...rest
    } = dto;
    void _partner;
    void _tiers;
    Object.assign(voucher, definedFields(rest));
    if (startsAt !== undefined) {
      voucher.startsAt = startsAt ? new Date(startsAt) : null;
    }
    if (expiresAt !== undefined) {
      voucher.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    this.assertShape(voucher.discountType, voucher.discountValue);
    return this.voucherRepository.save(voucher);
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findByIdOrFail(id);
    await this.voucherRepository.remove(voucher);
  }

  private async findByIdOrFail(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findById(id);
    if (!voucher) throw new NotFoundException(ERROR_MESSAGES.VOUCHER.NOT_FOUND);
    return voucher;
  }

  /**
   * Mã phần trăm quá 100 là trả tiền cho khách. Kiểm ở service chứ không chỉ ở
   * DTO vì `discountType` và `discountValue` sửa được độc lập: đổi một mã
   * "giảm 50.000₫" sang loại phần trăm mà quên sửa giá trị là ra 50.000%.
   */
  private assertShape(type: Voucher['discountType'], value: number): void {
    if (type === 'percent' && value > 100) {
      throw new BadRequestException(ERROR_MESSAGES.VOUCHER.PERCENT_TOO_HIGH);
    }
  }

  /* ------------------------------------------------------------ áp mã */

  /**
   * Thẩm định một mã cho một lượt mua cụ thể. Ném lỗi với đúng lý do thay vì
   * trả `null`: khách gõ mã sai cần biết mã hết hạn hay mã không áp cho gói
   * này, và "mã không hợp lệ" cho cả năm trường hợp thì họ thử lại vô ích.
   *
   * Chỉ còn **một gói** nên mã không có phạm vi theo gói (`tiers` bị bỏ qua).
   *
   * `amount` là giá **sau** khuyến mãi gói. Đây là đầu vào chứ không phải thứ
   * service này tự tra — đó là cách nó không cần biết `commerce` tồn tại.
   */
  async evaluate(
    input: VoucherPurchase & { code: string },
  ): Promise<VoucherEvaluation> {
    const voucher = await this.voucherRepository.findByCode(input.code);
    if (!voucher) {
      throw new NotFoundException(ERROR_MESSAGES.VOUCHER.INVALID);
    }
    const used =
      voucher.perUserLimit === null
        ? 0
        : await this.redemptionRepository.countByVoucherAndUser(
            voucher.id,
            input.userId,
          );
    this.assertEligible(voucher, input, used);
    return { voucher, ...this.computeDiscount(voucher, input.amount) };
  }

  /** Danh sách được chọn ở checkout, không trả ghi chú nội bộ. */
  async findForCheckout(input: VoucherPurchase): Promise<CheckoutVoucher[]> {
    const vouchers = await this.voucherRepository.findCheckoutCandidates();
    const counts = await this.redemptionRepository.countsByVouchersAndUser(
      vouchers
        .filter((voucher) => voucher.perUserLimit !== null)
        .map((voucher) => voucher.id),
      input.userId,
    );
    const available: CheckoutVoucher[] = [];
    for (const voucher of vouchers) {
      if (!voucher.isPublic) continue;
      let unavailableReason: CheckoutVoucher['unavailableReason'] = null;
      try {
        this.assertEligible(voucher, input, counts.get(voucher.id) ?? 0);
      } catch (error) {
        if (!(error instanceof BadRequestException)) throw error;
        if (error.message === ERROR_MESSAGES.VOUCHER.BELOW_MIN_AMOUNT) {
          unavailableReason = 'minimum';
        } else if (
          error.message === ERROR_MESSAGES.VOUCHER.USER_LIMIT_REACHED
        ) {
          unavailableReason = 'user-limit';
        } else {
          continue;
        }
      }
      const discount = this.computeDiscount(voucher, input.amount);
      if (discount.discountAmount <= 0) continue;
      available.push({
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscount: voucher.maxDiscount,
        minAmount: voucher.minAmount,
        expiresAt: voucher.expiresAt,
        remaining:
          voucher.usageLimit === null
            ? null
            : Math.max(0, voucher.usageLimit - voucher.usedCount),
        perUserLimit: voucher.perUserLimit,
        amount: input.amount,
        available: unavailableReason === null,
        unavailableReason,
        reason: unavailableReason ?? undefined,
        ...discount,
      });
    }
    return available.sort(
      (a, b) =>
        Number(b.available) - Number(a.available) ||
        b.discountAmount - a.discountAmount ||
        a.code.localeCompare(b.code),
    );
  }

  private assertEligible(
    voucher: Voucher,
    input: VoucherPurchase,
    used: number,
  ): void {
    if (!voucher.isActive) {
      throw new BadRequestException(ERROR_MESSAGES.VOUCHER.INACTIVE);
    }
    const now = new Date();
    if (voucher.startsAt && voucher.startsAt > now) {
      throw new BadRequestException(ERROR_MESSAGES.VOUCHER.NOT_STARTED);
    }
    if (voucher.expiresAt && voucher.expiresAt <= now) {
      throw new BadRequestException(ERROR_MESSAGES.VOUCHER.EXPIRED);
    }
    // `voucher.tiers` là cột di sản: chỉ còn một gói nên mã áp cho mọi đơn.
    if (input.amount < voucher.minAmount) {
      throw new BadRequestException(ERROR_MESSAGES.VOUCHER.BELOW_MIN_AMOUNT);
    }
    if (
      voucher.usageLimit !== null &&
      voucher.usedCount >= voucher.usageLimit
    ) {
      throw new BadRequestException(ERROR_MESSAGES.VOUCHER.USAGE_EXHAUSTED);
    }
    if (voucher.perUserLimit !== null && used >= voucher.perUserLimit) {
      throw new BadRequestException(ERROR_MESSAGES.VOUCHER.USER_LIMIT_REACHED);
    }
  }

  /**
   * Số tiền giảm thật sự. Ba luật xếp chồng, thứ tự có ý nghĩa: tính mức giảm →
   * chặn bằng `maxDiscount` → chặn bằng chính giá đơn. Bỏ bước cuối thì một mã
   * "giảm 100.000₫" áp lên đơn 50.000₫ ra số âm và khách thành chủ nợ.
   */
  private computeDiscount(
    voucher: Voucher,
    amount: number,
  ): { discountAmount: number; finalAmount: number } {
    const raw =
      voucher.discountType === 'percent'
        ? amount - applyPercent(amount, voucher.discountValue)
        : voucher.discountValue;

    const capped =
      voucher.maxDiscount !== null ? Math.min(raw, voucher.maxDiscount) : raw;
    const discountAmount = Math.min(Math.max(0, capped), amount);

    return { discountAmount, finalAmount: applyAmount(amount, discountAmount) };
  }

  /**
   * Ghi nhận một lượt dùng. Gọi từ `CommerceService.markPaid` — tức **lúc tiền
   * đã về**, không phải lúc tạo đơn: khách mở hộp thanh toán rồi bỏ ngang là
   * chuyện thường, đếm sớm thì mỗi lần bỏ ngang đốt một suất của chiến dịch.
   *
   * Không bao giờ ném lỗi ra ngoài. Tới đây gói đã được nâng và tiền đã vào tài
   * khoản; để một lỗi ở sổ chiến dịch làm hỏng lời gọi thì webhook SePay nhận
   * lỗi, thử lại, và ta phải xử lý một đơn đã `paid` — thứ `markPaid` từ chối.
   * Cùng lý do với `announcePaid`.
   */
  async redeem(input: {
    voucherId: string;
    userId: string;
    orderId: string;
    discountAmount: number;
  }): Promise<VoucherRedemption | null> {
    // Webhook SePay thử lại tới 7 lần: cùng một đơn có thể vào đây hai lượt.
    if (await this.redemptionRepository.existsByOrder(input.orderId)) {
      return null;
    }
    const saved = await this.redemptionRepository.save(
      this.redemptionRepository.create(input),
    );
    await this.voucherRepository.incrementUsed(input.voucherId);
    return saved;
  }
}
