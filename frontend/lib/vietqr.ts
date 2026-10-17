import { QRPay } from "vietnam-qr-pay";
import { BANK_ACCOUNT_PATTERN, BANK_BIN_PATTERN } from "@/constants/banks";

/**
 * Sinh payload VietQR cho một tài khoản nhận mừng cưới.
 *
 * **Mã trần, cố ý không nhúng số tiền và nội dung chuyển khoản.** Payload chỉ
 * gồm BIN + số tài khoản nên toàn bộ chuỗi là chữ số ASCII; khách quét xong tự
 * gõ số tiền và lời nhắn trong app ngân hàng của họ, và app đó tự quyết định có
 * cho gõ dấu tiếng Việt hay không.
 *
 * Đây không phải chi tiết vụn: `vietnam-qr-pay` ghi độ dài trường EMV theo **số
 * ký tự** trong khi chuẩn đếm theo **byte**. Nhét "Mừng cưới Đức Anh" vào phần
 * nội dung thì trường khai 17 nhưng thực tế 26 byte, app ngân hàng đọc lệch và
 * hỏng cả mã. Ngày nào thêm ô "số tiền gợi ý" hay "lời nhắn mặc định" vào QR
 * thì **bắt buộc** bỏ dấu và viết hoa trước khi encode.
 *
 * Tên chủ tài khoản cũng không nằm trong payload — app ngân hàng tự tra ra từ
 * BIN + số tài khoản. Thiệp hiện tên riêng bên cạnh mã để khách đối chiếu.
 *
 * @returns `null` khi thiếu dữ liệu hoặc dữ liệu sai định dạng. Trả `null` chứ
 * không ném lỗi: đây là dữ liệu người dùng nhập nằm trên trang thiệp công khai,
 * hỏng thì mất mã QR chứ không được sập cả trang.
 */
export function vietQrPayload(
  bankBin: string,
  accountNumber: string,
): string | null {
  if (!BANK_BIN_PATTERN.test(bankBin)) return null;
  if (!BANK_ACCOUNT_PATTERN.test(accountNumber)) return null;

  try {
    return QRPay.initVietQR({ bankBin, bankNumber: accountNumber }).build();
  } catch {
    return null;
  }
}
