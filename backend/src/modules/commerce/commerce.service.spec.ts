import type { AdminAlertsService } from '@modules/admin-alerts/admin-alerts.service';
import { ERROR_MESSAGES } from '@constant/error-messages';
import type { CardsService } from '@modules/cards/cards.service';
import type { LegalService } from '@modules/legal/legal.service';
import type { MailService } from '@modules/mail/mail.service';
import type { NotificationsService } from '@modules/notifications/notifications.service';
import type { PricingService } from '@modules/pricing/pricing.service';
import type { UserService } from '@modules/user/user.service';
import type { VouchersService } from '@modules/vouchers/vouchers.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { CommerceRepository } from './commerce.repository';
import { CommerceService } from './commerce.service';
import type { Order } from './order.entity';

/** Các phụ thuộc mà phần lớn test không đụng tới, đưa vào rỗng. */
interface Deps {
  pricingService?: Partial<PricingService>;
  cardsService?: Partial<CardsService>;
  notificationsService?: Partial<NotificationsService>;
  mailService?: Partial<MailService>;
  userService?: Partial<UserService>;
  vouchersService?: Partial<VouchersService>;
  legalService?: Partial<LegalService>;
}

function makeService(repository: object, deps: Deps = {}) {
  return new CommerceService(
    repository as CommerceRepository,
    (deps.pricingService ?? {}) as PricingService,
    (deps.cardsService ?? {}) as CardsService,
    (deps.notificationsService ?? {}) as NotificationsService,
    (deps.mailService ?? {}) as MailService,
    (deps.userService ?? {}) as UserService,
    (deps.vouchersService ?? {}) as VouchersService,
    { get: () => undefined } as unknown as ConfigService,
    (deps.legalService ?? { record: jest.fn() }) as unknown as LegalService,
    {
      newUser: jest.fn(),
      orderPaid: jest.fn(),
    } as unknown as AdminAlertsService,
  );
}

const PRICING = (discountPercent: number | null, price = 899_000) => ({
  find: jest.fn().mockResolvedValue({
    price,
    discountPercent,
    finalPrice: discountPercent
      ? Math.ceil((price * (100 - discountPercent)) / 100 / 1000) * 1000
      : price,
  }),
});

describe('CommerceService.quote', () => {
  it('trả giá niêm yết khi không có khuyến mãi gói', async () => {
    const service = makeService(
      {},
      { pricingService: PRICING(null) as unknown as PricingService },
    );
    await expect(service.quote()).resolves.toEqual({
      listAmount: 899_000,
      discountPercent: 0,
      amount: 899_000,
    });
  });

  it('trừ khuyến mãi gói vào số phải trả', async () => {
    const service = makeService(
      {},
      { pricingService: PRICING(10) as unknown as PricingService },
    );
    await expect(service.quote()).resolves.toEqual({
      listAmount: 899_000,
      discountPercent: 10,
      amount: 810_000,
    });
  });
});

describe('CommerceService.previewVoucher', () => {
  it('tính mã trên giá đã trừ khuyến mãi gói', async () => {
    const evaluate = jest.fn().mockResolvedValue({
      voucher: {
        code: 'CUOIVUI',
        discountType: 'percent',
        discountValue: 10,
        usageLimit: null,
        usedCount: 0,
        perUserLimit: null,
        expiresAt: null,
      },
      discountAmount: 81_000,
      finalAmount: 729_000,
    });
    const service = makeService(
      {},
      {
        pricingService: PRICING(10) as unknown as PricingService,
        vouchersService: { evaluate } as unknown as VouchersService,
      },
    );

    const preview = await service.previewVoucher('user-1', { code: 'CUOIVUI' });

    expect(evaluate).toHaveBeenCalledWith({
      code: 'CUOIVUI',
      userId: 'user-1',
      amount: 810_000,
    });
    expect(preview).toMatchObject({
      listAmount: 899_000,
      discountAmount: 81_000,
      amount: 729_000,
      voucherCode: 'CUOIVUI',
    });
  });
});

describe('CommerceService.createOrder', () => {
  const CARD = { id: 'card-1', status: 'draft' };

  function setup(options: {
    pending?: Partial<Order> | null;
    card?: object;
    discountPercent?: number | null;
    evaluate?: jest.Mock;
  }) {
    const save = jest.fn((order: Partial<Order>) =>
      Promise.resolve({ id: 'order-new', ...order }),
    );
    const repository = {
      findPendingForCard: jest.fn().mockResolvedValue(options.pending ?? null),
      existsByPaymentCode: jest.fn().mockResolvedValue(false),
      create: jest.fn((order: object) => order),
      save,
      findOneBy: jest.fn(),
    };
    const assertPublishable = jest.fn();
    const service = makeService(repository, {
      pricingService: PRICING(
        options.discountPercent ?? null,
      ) as unknown as PricingService,
      cardsService: {
        assertOwner: jest.fn().mockResolvedValue(options.card ?? CARD),
        assertPublishable,
      } as unknown as CardsService,
      vouchersService: {
        evaluate: options.evaluate ?? jest.fn(),
      } as unknown as VouchersService,
    });
    return { service, repository, save, assertPublishable };
  }

  it('chốt giá niêm yết và số phải trả lên đơn, gói ghi `diamond` di sản', async () => {
    const { service, save, assertPublishable } = setup({ discountPercent: 10 });

    const order = await service.createOrder('user-1', { cardId: 'card-1' });

    expect(assertPublishable).toHaveBeenCalled();
    expect(order).toMatchObject({
      status: 'pending',
      tier: 'diamond',
      amount: 810_000,
      listAmount: 899_000,
      discountAmount: 0,
      familySplit: false,
      isRepeatPurchase: false,
    });
    expect(order.paymentCode).toBeTruthy();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('từ chối thiệp đã thanh toán', async () => {
    const { service } = setup({ card: { id: 'card-1', status: 'paid' } });
    await expect(
      service.createOrder('user-1', { cardId: 'card-1' }),
    ).rejects.toThrow(ERROR_MESSAGES.ORDER.CARD_ALREADY_PAID);
  });

  it('trả lại đơn chờ cũ khi mã giảm giá không đổi', async () => {
    const pending = { id: 'order-old', voucherCode: null };
    const { service, save } = setup({ pending });
    await expect(
      service.createOrder('user-1', { cardId: 'card-1' }),
    ).resolves.toBe(pending);
    expect(save).not.toHaveBeenCalled();
  });

  it('huỷ đơn chờ cũ rồi phát đơn mới khi khách đổi mã', async () => {
    const pending: Partial<Order> = {
      id: 'order-old',
      voucherCode: null,
      status: 'pending',
    };
    const evaluate = jest.fn().mockResolvedValue({
      voucher: { id: 'v1', code: 'CUOIVUI' },
      discountAmount: 90_000,
      finalAmount: 809_000,
    });
    const { service, save } = setup({ pending, evaluate });

    const order = await service.createOrder('user-1', {
      cardId: 'card-1',
      voucherCode: 'CUOIVUI',
    });

    expect(pending.status).toBe('cancelled');
    expect(order).toMatchObject({
      amount: 809_000,
      discountAmount: 90_000,
      voucherCode: 'CUOIVUI',
      voucherId: 'v1',
    });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('chốt ngay đơn 0₫ qua markPaid', async () => {
    const evaluate = jest.fn().mockResolvedValue({
      voucher: { id: 'v1', code: 'FREE100' },
      discountAmount: 899_000,
      finalAmount: 0,
    });
    const { service } = setup({ evaluate });
    const markPaid = jest
      .spyOn(service, 'markPaid')
      .mockResolvedValue({ id: 'order-new', status: 'paid' } as Order);

    await service.createOrder('user-1', {
      cardId: 'card-1',
      voucherCode: 'FREE100',
    });

    expect(markPaid).toHaveBeenCalledWith('order-new', {
      gatewayReference: 'zero-amount:FREE100',
    });
  });
});

describe('CommerceService.markPaid', () => {
  function setup(order: Partial<Order> | null, overrides: Deps = {}) {
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(order),
      save: jest.fn((value: Order) => Promise.resolve(value)),
    };
    const activateAfterPayment = jest.fn().mockResolvedValue({
      id: 'card-1',
      slug: 'an-linh-ab12',
      title: 'An & Linh',
    });
    const redeem = jest.fn().mockResolvedValue(null);
    const service = makeService(repository, {
      cardsService: { activateAfterPayment } as unknown as CardsService,
      vouchersService: { redeem } as unknown as VouchersService,
      notificationsService: {
        pushPaymentSuccess: jest.fn().mockResolvedValue(undefined),
      } as unknown as NotificationsService,
      userService: {
        findByIdOrFail: jest
          .fn()
          .mockResolvedValue({ email: 'a@b.c', fullName: 'An' }),
      } as unknown as UserService,
      mailService: {
        sendPaymentSuccessEmail: jest.fn().mockResolvedValue(undefined),
      } as unknown as MailService,
      ...overrides,
    });
    return { service, activateAfterPayment, redeem };
  }

  const PENDING = (): Partial<Order> => ({
    id: 'order-1',
    status: 'pending',
    cardId: 'card-1',
    userId: 'user-1',
    amount: 899_000,
    listAmount: 899_000,
    discountAmount: 0,
    voucherId: null,
    voucherCode: null,
  });

  it('đánh dấu đã trả, xuất bản thiệp và ghi tham chiếu ngân hàng', async () => {
    const { service, activateAfterPayment } = setup(PENDING());

    const order = await service.markPaid('order-1', {
      gatewayReference: 'FT123',
    });

    expect(order.status).toBe('paid');
    expect(order.paidAt).toBeInstanceOf(Date);
    expect(order.gatewayReference).toBe('FT123');
    expect(activateAfterPayment).toHaveBeenCalledWith('card-1');
  });

  it('ghi lượt dùng mã khi đơn có voucher', async () => {
    const { service, redeem } = setup({
      ...PENDING(),
      voucherId: 'v1',
      discountAmount: 90_000,
    });
    await service.markPaid('order-1', {});
    expect(redeem).toHaveBeenCalledWith({
      voucherId: 'v1',
      userId: 'user-1',
      orderId: 'order-1',
      discountAmount: 90_000,
    });
  });

  it('không ném lỗi khi email hoặc sổ voucher hỏng — tiền đã về', async () => {
    const { service } = setup(
      { ...PENDING(), voucherId: 'v1' },
      {
        vouchersService: {
          redeem: jest.fn().mockRejectedValue(new Error('db')),
        } as unknown as VouchersService,
        mailService: {
          sendPaymentSuccessEmail: jest
            .fn()
            .mockRejectedValue(new Error('smtp')),
        } as unknown as MailService,
      },
    );
    await expect(service.markPaid('order-1', {})).resolves.toMatchObject({
      status: 'paid',
    });
  });

  it('từ chối đơn đã trả', async () => {
    const { service } = setup({ ...PENDING(), status: 'paid' });
    await expect(service.markPaid('order-1', {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('từ chối đơn đã huỷ và đơn mất thiệp', async () => {
    await expect(
      setup({ ...PENDING(), status: 'cancelled' }).service.markPaid('o', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      setup({ ...PENDING(), cardId: null }).service.markPaid('o', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
