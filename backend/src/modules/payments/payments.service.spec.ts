import type { ConfigService } from '@nestjs/config';
import type { CommerceService } from '@modules/commerce/commerce.service';
import type { Order } from '@modules/commerce/order.entity';
import type { SepayWebhookDto } from './dto/sepay-webhook.dto';
import type { PaymentTransaction } from './payment-transaction.entity';
import type { PaymentsRepository } from './payments.repository';
import { AuditService } from '@modules/audit/audit.service';
import { PaymentsService } from './payments.service';

function makeWebhook(
  overrides: Partial<SepayWebhookDto> = {},
): SepayWebhookDto {
  return {
    id: 1001,
    gateway: 'Techcombank',
    transactionDate: '2026-08-15 09:32:00',
    accountNumber: '19001234567',
    transferType: 'in',
    transferAmount: 299_000,
    content: 'NGUYEN VAN A chuyen tien TC7F3K9A',
    referenceCode: 'FT26123456789',
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    amount: 299_000,
    status: 'pending',
    paymentCode: 'TC7F3K9A',
    // Mốc giữ đơn của màn thanh toán tính từ đây, nên đơn giả cũng phải có.
    createdAt: new Date('2026-08-15T07:00:00.000Z'),
    ...overrides,
  } as Order;
}

const DEFAULT_CONFIG: Record<string, string> = {
  SEPAY_ACCOUNT_NUMBER: '19001234567',
  SEPAY_BANK_CODE: 'TCB',
  SEPAY_ACCOUNT_NAME: 'DANG TUAN ANH',
};

/** Repository giả: `save` trả lại chính bản nháp, đủ cho luật nghiệp vụ. */
function makeService(
  repositoryOverrides: Partial<PaymentsRepository> = {},
  commerceOverrides: Partial<CommerceService> = {},
  configValues: Record<string, string> = DEFAULT_CONFIG,
) {
  const markPaid = jest.fn().mockResolvedValue(undefined);
  const findPendingByPaymentCode = jest.fn().mockResolvedValue(makeOrder());
  const repository = {
    findBySepayId: jest.fn().mockResolvedValue(null),
    create: jest.fn((draft: Partial<PaymentTransaction>) => draft),
    save: jest.fn((draft: PaymentTransaction) => Promise.resolve(draft)),
    ...repositoryOverrides,
  } as unknown as PaymentsRepository;

  const commerce = {
    findPendingByPaymentCode,
    markPaid,
    ...commerceOverrides,
  } as unknown as CommerceService;

  const config = {
    get: jest.fn((key: string) => configValues[key]),
  } as unknown as ConfigService;

  return {
    service: new PaymentsService(repository, commerce, config, {
      record: jest.fn(),
    } as unknown as AuditService),
    repository,
    findPendingByPaymentCode,
    markPaid,
  };
}

describe('PaymentsService.handleSepayWebhook', () => {
  it('ghép đúng đơn theo mã trong nội dung và nâng gói', async () => {
    const { service, markPaid } = makeService();

    const saved = await service.handleSepayWebhook(makeWebhook());

    expect(saved.matchStatus).toBe('matched');
    expect(saved.orderId).toBe('order-1');
    expect(markPaid).toHaveBeenCalledWith('order-1', {
      gatewayReference: 'FT26123456789',
    });
  });

  it('giao dịch đã xử lý rồi thì không nâng gói lần nữa', async () => {
    // SePay thử lại tới 7 lần trong 5 giờ khi không nhận được `success: true`.
    // Không chống lặp ở đây thì một đơn được `markPaid` nhiều lần.
    const existing = {
      id: 'tx-1',
      matchStatus: 'matched',
    } as PaymentTransaction;
    const { service, markPaid } = makeService({
      findBySepayId: jest.fn().mockResolvedValue(existing),
    });

    const result = await service.handleSepayWebhook(makeWebhook());

    expect(result).toBe(existing);
    expect(markPaid).not.toHaveBeenCalled();
  });

  it('trả thiếu tiền thì ghi nhận nhưng KHÔNG nâng gói', async () => {
    const { service, markPaid } = makeService();

    const saved = await service.handleSepayWebhook(
      makeWebhook({ transferAmount: 200_000 }),
    );

    expect(saved.matchStatus).toBe('underpaid');
    expect(saved.orderId).toBe('order-1');
    expect(markPaid).not.toHaveBeenCalled();
  });

  it('trả dư thì vẫn nâng gói', async () => {
    // Khách làm tròn lên là chuyện thường; chặn ở đây là phạt người đã trả đủ.
    const { service, markPaid } = makeService();

    const saved = await service.handleSepayWebhook(
      makeWebhook({ transferAmount: 300_000 }),
    );

    expect(saved.matchStatus).toBe('matched');
    expect(markPaid).toHaveBeenCalled();
  });

  it('mất mã trong nội dung thì vào hàng đợi tra soát, không ném lỗi', async () => {
    // Ném lỗi ở đây khiến SePay bắn lại sáu lần rồi bỏ cuộc, và ta mất luôn
    // bản ghi của một khoản tiền đã thật sự về tài khoản.
    const { service, markPaid } = makeService();

    const saved = await service.handleSepayWebhook(
      makeWebhook({ content: 'chuyen tien', description: null, code: null }),
    );

    expect(saved.matchStatus).toBe('unmatched');
    expect(saved.orderId).toBeNull();
    expect(saved.paymentCode).toBeNull();
    expect(markPaid).not.toHaveBeenCalled();
  });

  it('mã đúng nhưng không còn đơn nào chờ thì cũng vào hàng đợi', async () => {
    // Đây là ca chuyển trùng: đơn đã trả rồi. Khoản này phải được hoàn, không
    // được lặng lẽ nuốt vào đơn cũ.
    const { service, markPaid } = makeService(
      {},
      { findPendingByPaymentCode: jest.fn().mockResolvedValue(null) },
    );

    const saved = await service.handleSepayWebhook(makeWebhook());

    expect(saved.matchStatus).toBe('unmatched');
    expect(saved.paymentCode).toBe('TC7F3K9A');
    expect(markPaid).not.toHaveBeenCalled();
  });

  it('tiền chuyển ĐI chỉ ghi sổ, không bao giờ là thanh toán', async () => {
    const { service, markPaid, findPendingByPaymentCode } = makeService();

    const saved = await service.handleSepayWebhook(
      makeWebhook({ transferType: 'out' }),
    );

    expect(saved.matchStatus).toBe('ignored');
    expect(findPendingByPaymentCode).not.toHaveBeenCalled();
    expect(markPaid).not.toHaveBeenCalled();
  });

  it('dò mã trong cả `description` khi `content` trống', async () => {
    const { service } = makeService();

    const saved = await service.handleSepayWebhook(
      makeWebhook({ content: null, description: 'CT DEN:TC7F3K9A' }),
    );

    expect(saved.paymentCode).toBe('TC7F3K9A');
  });

  it('giữ nguyên payload gốc để còn tra soát và hoàn tiền', async () => {
    const { service } = makeService();
    const payload = makeWebhook();

    const saved = await service.handleSepayWebhook(payload);

    expect(saved.rawPayload).toEqual({ ...payload });
  });
});

describe('PaymentsService.checkout', () => {
  it('dựng QR đã nhúng sẵn số tiền và mã đơn', async () => {
    const { service } = makeService(
      {},
      { findOwnOrder: jest.fn().mockResolvedValue(makeOrder()) },
    );

    const info = await service.checkout('user-1', 'order-1');

    expect(info.paymentCode).toBe('TC7F3K9A');
    expect(info.qrImageUrl).toContain('acc=19001234567');
    expect(info.qrImageUrl).toContain('bank=TCB');
    expect(info.qrImageUrl).toContain('amount=299000');
    expect(info.qrImageUrl).toContain('des=TC7F3K9A');
  });

  it('chốt mốc giữ đơn theo lúc tạo đơn, không theo lúc mở trang', async () => {
    const { service } = makeService(
      {},
      { findOwnOrder: jest.fn().mockResolvedValue(makeOrder()) },
    );

    const info = await service.checkout('user-1', 'order-1');

    // Tải lại trang muộn hơn không được kéo dài thêm giờ: mốc phải là
    // `createdAt + 10 phút` chứ không phải `now + 10 phút`.
    expect(info.holdExpiresAt).toBe('2026-08-15T07:10:00.000Z');
  });

  it('chưa cấu hình tài khoản nhận thì báo lỗi rõ, không dựng QR rỗng', async () => {
    // Thiếu cấu hình mà vẫn dựng QR thì ra một mã trỏ vào tài khoản rỗng —
    // khách quét, chuyển tiền đi đâu không ai biết.
    const { service } = makeService(
      {},
      { findOwnOrder: jest.fn().mockResolvedValue(makeOrder()) },
      {},
    );

    await expect(service.checkout('user-1', 'order-1')).rejects.toThrow();
  });
});

describe('PaymentsService.receivingAccount', () => {
  it('trả đúng tài khoản mà QR thanh toán đang dùng', () => {
    const { service } = makeService();

    expect(service.receivingAccount()).toEqual({
      bankCode: 'TCB',
      accountNumber: '19001234567',
      accountName: 'DANG TUAN ANH',
    });
  });

  it('chưa cấu hình thì trả null chứ không ném — trang công khai chỉ ẩn dòng đó', () => {
    const { service } = makeService({}, {}, {});

    expect(service.receivingAccount()).toBeNull();
  });
});

describe('PaymentsService.matchManually — ghép bằng mã đơn', () => {
  const ACTOR = { userId: 'kc-1', email: 'ops@keemori.vn', role: 'cms-admin' };
  const orphan = {
    id: 'tx-1',
    sepayId: '1001',
    orderId: null,
    matchStatus: 'unmatched',
    transferAmount: '299000',
    referenceCode: 'FT26123456789',
    paymentCode: null,
  } as unknown as PaymentTransaction;

  it('tìm đơn đang chờ theo mã rồi nâng gói qua markPaid', async () => {
    const { service, markPaid, findPendingByPaymentCode } = makeService({
      findById: jest.fn().mockResolvedValue({ ...orphan }),
    });

    const saved = await service.matchManually(ACTOR, 'tx-1', 'TC7F3K9A');

    expect(findPendingByPaymentCode).toHaveBeenCalledWith('TC7F3K9A');
    expect(markPaid).toHaveBeenCalledWith('order-1', {
      gatewayReference: 'FT26123456789',
    });
    expect(saved.orderId).toBe('order-1');
    expect(saved.matchStatus).toBe('manual');
  });

  it('báo không tìm thấy khi không có đơn chờ với mã đó', async () => {
    const { service, markPaid } = makeService(
      { findById: jest.fn().mockResolvedValue({ ...orphan }) },
      { findPendingByPaymentCode: jest.fn().mockResolvedValue(null) },
    );

    await expect(
      service.matchManually(ACTOR, 'tx-1', 'KHONGCO1'),
    ).rejects.toThrow('Không có đơn nào đang chờ thanh toán với mã này');
    expect(markPaid).not.toHaveBeenCalled();
  });
});
