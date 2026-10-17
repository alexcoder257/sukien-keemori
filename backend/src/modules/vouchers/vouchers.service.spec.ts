import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Voucher } from './voucher.entity';
import type {
  VoucherRedemptionRepository,
  VoucherRepository,
} from './vouchers.repository';
import { VouchersService } from './vouchers.service';

function makeVoucher(overrides: Partial<Voucher> = {}): Voucher {
  return {
    id: 'voucher-1',
    code: 'CUOIVUI',
    description: null,
    discountType: 'percent',
    discountValue: 20,
    maxDiscount: null,
    tiers: [],
    minAmount: 0,
    startsAt: null,
    expiresAt: null,
    usageLimit: null,
    usedCount: 0,
    perUserLimit: null,
    isActive: true,
    isPublic: true,
    ...overrides,
  } as Voucher;
}

function makeService(
  voucher: Voucher | null,
  redemptionCount = 0,
): VouchersService {
  return new VouchersService(
    {
      findByCode: jest.fn().mockResolvedValue(voucher),
    } as unknown as VoucherRepository,
    {
      countByVoucherAndUser: jest.fn().mockResolvedValue(redemptionCount),
    } as unknown as VoucherRedemptionRepository,
  );
}

const base = { userId: 'user-1', amount: 300_000 };

describe('VouchersService.evaluate', () => {
  it('trừ theo phần trăm và làm tròn xuống bội số nghìn', async () => {
    const service = makeService(makeVoucher({ discountValue: 15 }));

    const result = await service.evaluate({ ...base, code: 'CUOIVUI' });

    // 300.000 × 85% = 255.000 — số tròn nghìn để khách gõ tay không nhầm.
    expect(result.finalAmount).toBe(255_000);
    expect(result.discountAmount).toBe(45_000);
  });

  it('chặn mức giảm bằng maxDiscount', async () => {
    const service = makeService(
      makeVoucher({ discountValue: 50, maxDiscount: 100_000 }),
    );

    const result = await service.evaluate({ ...base, code: 'CUOIVUI' });

    expect(result.discountAmount).toBe(100_000);
    expect(result.finalAmount).toBe(200_000);
  });

  /**
   * Mã trừ thẳng tiền lớn hơn giá đơn thì đơn về 0, không bao giờ âm — nếu
   * không thì khách thành chủ nợ và số tiền trên QR chuyển khoản là số âm.
   */
  it('không để giá đơn xuống dưới 0', async () => {
    const service = makeService(
      makeVoucher({ discountType: 'amount', discountValue: 500_000 }),
    );

    const result = await service.evaluate({ ...base, code: 'CUOIVUI' });

    expect(result.discountAmount).toBe(300_000);
    expect(result.finalAmount).toBe(0);
  });

  it('bỏ qua cột tiers di sản — chỉ còn một gói nên mã áp cho mọi đơn', async () => {
    const service = makeService(makeVoucher({ tiers: ['diamond'] }));

    await expect(
      service.evaluate({ ...base, code: 'CUOIVUI' }),
    ).resolves.toMatchObject({ discountAmount: 60_000 });
  });

  it('từ chối mã đã hết hạn', async () => {
    const service = makeService(
      makeVoucher({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(
      service.evaluate({ ...base, code: 'CUOIVUI' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('từ chối khi tài khoản đã dùng hết lượt của mình', async () => {
    const service = makeService(makeVoucher({ perUserLimit: 1 }), 1);

    await expect(
      service.evaluate({ ...base, code: 'CUOIVUI' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('từ chối khi mã đã hết tổng lượt', async () => {
    const service = makeService(makeVoucher({ usageLimit: 5, usedCount: 5 }));

    await expect(
      service.evaluate({ ...base, code: 'CUOIVUI' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('từ chối đơn chưa đạt giá trị tối thiểu', async () => {
    const service = makeService(makeVoucher({ minAmount: 500_000 }));

    await expect(
      service.evaluate({ ...base, code: 'CUOIVUI' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('báo không tồn tại khi mã không có trong bảng', async () => {
    const service = makeService(null);

    await expect(
      service.evaluate({ ...base, code: 'KHONGCO' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('VouchersService.redeem', () => {
  /**
   * Webhook SePay thử lại tới 7 lần, nên cùng một đơn có thể vào đây hai lượt.
   * Lượt thứ hai không được cộng thêm một suất vào sổ chiến dịch.
   */
  it('bỏ qua lượt ghi trùng của cùng một đơn', async () => {
    const increment = jest.fn();
    const service = new VouchersService(
      { incrementUsed: increment } as unknown as VoucherRepository,
      {
        existsByOrder: jest.fn().mockResolvedValue(true),
      } as unknown as VoucherRedemptionRepository,
    );

    const result = await service.redeem({
      voucherId: 'voucher-1',
      userId: 'user-1',
      orderId: 'order-1',
      discountAmount: 45_000,
    });

    expect(result).toBeNull();
    expect(increment).not.toHaveBeenCalled();
  });
});

describe('VouchersService — chọn mã khi thanh toán', () => {
  function setup(vouchers: Voucher[], counts = new Map<string, number>()) {
    return new VouchersService(
      {
        findCheckoutCandidates: jest.fn().mockResolvedValue(vouchers),
      } as unknown as VoucherRepository,
      {
        countsByVouchersAndUser: jest.fn().mockResolvedValue(counts),
      } as unknown as VoucherRedemptionRepository,
    );
  }

  it('ẩn mã riêng và hết hiệu lực; ghi lý do cho mã chưa đủ điều kiện', async () => {
    const vouchers = [
      makeVoucher({ id: 'private', isPublic: false }),
      makeVoucher({ id: 'expired', expiresAt: new Date(Date.now() - 1000) }),
      makeVoucher({ id: 'scheduled', startsAt: new Date(Date.now() + 60_000) }),
      makeVoucher({ id: 'inactive', isActive: false }),
      makeVoucher({ id: 'exhausted', usageLimit: 1, usedCount: 1 }),
      makeVoucher({ id: 'user-limit', perUserLimit: 1 }),
      makeVoucher({ id: 'minimum', minAmount: 500_000 }),
      makeVoucher({ id: 'live', description: 'INTERNAL' }),
    ];
    const service = setup(vouchers, new Map([['user-limit', 1]]));
    const result = await service.findForCheckout(base);
    expect(
      result
        .filter((voucher) => voucher.available)
        .map((voucher) => voucher.id),
    ).toEqual(['live']);
    expect(
      result
        .filter((voucher) => !voucher.available)
        .map((voucher) => [voucher.id, voucher.unavailableReason]),
    ).toEqual([
      ['user-limit', 'user-limit'],
      ['minimum', 'minimum'],
    ]);
    expect(result[0]).not.toHaveProperty('description');
  });

  it('xếp theo mức giảm thật sau khi chặn trần', async () => {
    const service = setup([
      makeVoucher({
        code: 'HIGH_PERCENT',
        discountValue: 90,
        maxDiscount: 10_000,
      }),
      makeVoucher({
        code: 'BEST',
        discountType: 'amount',
        discountValue: 50_000,
      }),
      makeVoucher({ code: 'PERCENT', discountValue: 10 }),
    ]);
    const result = await service.findForCheckout(base);
    expect(
      result.map((voucher) => [voucher.code, voucher.discountAmount]),
    ).toEqual([
      ['BEST', 50_000],
      ['PERCENT', 30_000],
      ['HIGH_PERCENT', 10_000],
    ]);
  });

  it('trả lượt còn lại và hạn dùng, giữ null khi không giới hạn', async () => {
    const expiresAt = new Date('2099-12-31T17:00:00Z');
    const service = setup([
      makeVoucher({
        code: 'LIMITED',
        usageLimit: 10,
        usedCount: 3,
        perUserLimit: 1,
        expiresAt,
      }),
      makeVoucher({ code: 'UNLIMITED' }),
    ]);

    const result = await service.findForCheckout(base);
    expect(result.find((voucher) => voucher.code === 'LIMITED')).toMatchObject({
      remaining: 7,
      perUserLimit: 1,
      expiresAt,
    });
    expect(
      result.find((voucher) => voucher.code === 'UNLIMITED'),
    ).toMatchObject({
      remaining: null,
      perUserLimit: null,
      expiresAt: null,
    });
  });

  it('mã chỉ nhập tay vẫn dùng được khi biết mã', async () => {
    await expect(
      makeService(makeVoucher({ isPublic: false })).evaluate({
        ...base,
        code: 'CUOIVUI',
      }),
    ).resolves.toMatchObject({ discountAmount: 60_000 });
  });
});
