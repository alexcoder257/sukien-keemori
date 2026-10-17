import "server-only";
import { REVALIDATE, serverFetch } from "./api";

export interface ReceivingAccount {
  /** Mã ngắn VietQR (`MB`, `ACB`…), tra tên ở `constants/banks.ts`. */
  bankCode: string;
  accountNumber: string;
  /** Tên chủ tài khoản đúng như ngân hàng in — viết hoa, không dấu. */
  accountName: string;
}

/**
 * Tài khoản nhận tiền (`GET /payments/receiving-account`) — chính tài khoản mà
 * QR ở màn thanh toán trỏ vào, nên trang công bố không bao giờ lệch QR.
 *
 * Không có tag: giá trị là biến môi trường của backend, chỉ đổi khi deploy,
 * không có cú bấm Lưu nào để bắn revalidate. Hỏng thì trả `null` — trang
 * thông tin doanh nghiệp bỏ dòng đó chứ không đổ 500.
 */
export async function getReceivingAccount(): Promise<ReceivingAccount | null> {
  try {
    const { account } = await serverFetch<{ account: ReceivingAccount | null }>(
      "/payments/receiving-account",
      { revalidate: REVALIDATE.config },
    );
    return account;
  } catch {
    return null;
  }
}
