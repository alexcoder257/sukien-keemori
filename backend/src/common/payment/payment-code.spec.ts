import {
  extractPaymentCode,
  generatePaymentCode,
  PAYMENT_CODE_PREFIX,
} from './payment-code';

describe('generatePaymentCode', () => {
  it('sinh mã 8 ký tự có tiền tố cố định', () => {
    const code = generatePaymentCode();
    expect(code).toHaveLength(PAYMENT_CODE_PREFIX.length + 6);
    expect(code.startsWith(PAYMENT_CODE_PREFIX)).toBe(true);
  });

  it('không bao giờ chứa ký tự dễ đọc nhầm', () => {
    // Khách gõ lại mã bằng tay ở ATM; `0/O`, `1/I/L`, `5/S` là nguồn sai chính
    // tả có thật, nên bảng chữ cái phải loại chúng — kiểm trên nhiều lần sinh
    // vì đây là tính chất của bảng chữ cái, không phải của một mã cụ thể.
    const codes = Array.from({ length: 500 }, () => generatePaymentCode());
    for (const code of codes) {
      expect(code.slice(PAYMENT_CODE_PREFIX.length)).not.toMatch(/[01ILO5S]/);
    }
  });

  it('không lặp lại trong một lô lớn', () => {
    const codes = new Set(
      Array.from({ length: 2_000 }, () => generatePaymentCode()),
    );
    expect(codes.size).toBe(2_000);
  });
});

describe('extractPaymentCode', () => {
  it('bóc được mã nằm lẫn giữa chuỗi rác của ngân hàng', () => {
    // Đây là hình dạng thật của nội dung chuyển khoản: ngân hàng và SePay đều
    // chèn thêm chữ của riêng họ, nên so bằng `===` sẽ trượt mọi giao dịch.
    expect(
      extractPaymentCode('NGUYEN VAN A chuyen tien TC7F3K9A FT26123456789'),
    ).toBe('TC7F3K9A');
    expect(extractPaymentCode('SEVQRTC7F3K9A')).toBe('TC7F3K9A');
  });

  it('nhận cả nội dung viết thường', () => {
    expect(extractPaymentCode('thanh toan tc7f3k9a')).toBe('TC7F3K9A');
  });

  it('trả null khi khách xoá mất mã', () => {
    expect(extractPaymentCode('chuyen tien')).toBeNull();
    expect(extractPaymentCode('')).toBeNull();
  });

  it('không nhận mã chứa ký tự ngoài bảng chữ cái', () => {
    // `TC0OO1IL` đủ 8 ký tự nhưng dùng toàn ký tự đã bị loại — nếu regex nhận
    // nó thì một chuỗi rác bất kỳ cũng có thể bị coi là mã đơn.
    expect(extractPaymentCode('TC0OO1IL')).toBeNull();
  });
});
