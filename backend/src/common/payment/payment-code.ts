import { randomInt } from 'crypto';

/**
 * Bảng chữ cái của mã đơn, **cố ý thiếu** `0 O 1 I L 5 S`. Mã này đi qua tay
 * người: khách gõ lại bằng tay khi chuyển khoản ở ATM, nhân viên đọc qua điện
 * thoại lúc tra soát. Giữ những cặp ký tự nhìn giống nhau là tự tạo ra một lớp
 * sai chính tả mà tầng khớp mờ phải đi dọn.
 */
const ALPHABET = '2346789ABCDEFGHJKMNPQRTUVWXYZ';

/** Tiền tố cố định, để mã nhận ra được giữa một chuỗi mô tả đầy rác. */
export const PAYMENT_CODE_PREFIX = 'TC';

const RANDOM_LENGTH = 6;

/**
 * Tìm mã đơn nằm lẫn trong nội dung chuyển khoản.
 *
 * Không so bằng `===`: ngân hàng và ví điện tử chèn thêm chữ của riêng họ vào
 * nội dung (`SEVQR`, tên người gửi, mã tham chiếu), nên thứ về đến webhook gần
 * như không bao giờ là đúng cái chuỗi ta đưa cho khách.
 */
export const PAYMENT_CODE_PATTERN = new RegExp(
  `${PAYMENT_CODE_PREFIX}[${ALPHABET}]{${RANDOM_LENGTH}}`,
);

/**
 * Sinh một mã đơn. Dùng `randomInt` (CSPRNG) chứ không phải `Math.random`: mã
 * đoán được nghĩa là người lạ dựng được QR trỏ vào đơn của người khác.
 */
export function generatePaymentCode(): string {
  let code = PAYMENT_CODE_PREFIX;
  for (let i = 0; i < RANDOM_LENGTH; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/**
 * Bóc mã đơn ra khỏi nội dung chuyển khoản; `null` nếu không thấy.
 *
 * Viết hoa trước khi dò vì một số ngân hàng trả nội dung về dạng thường.
 */
export function extractPaymentCode(content: string): string | null {
  return PAYMENT_CODE_PATTERN.exec(content.toUpperCase())?.[0] ?? null;
}
