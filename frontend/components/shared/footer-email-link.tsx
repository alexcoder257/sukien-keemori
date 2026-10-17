"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";

type Props = {
  email: string;
  label: string;
  /** Câu báo đã sao chép — đã điền sẵn địa chỉ, component không tự ghép chữ. */
  copiedMessage: string;
  /** Câu dùng khi không sao chép được; phải chứa địa chỉ để người đọc tự chép. */
  copyFailedMessage: string;
  className?: string;
  children: ReactNode;
};

/**
 * Biểu tượng email ở chân trang: vẫn là `mailto:`, **kèm** sao chép địa chỉ.
 *
 * `mailto:` chỉ hoạt động khi máy có ứng dụng email mặc định. Trên điện thoại
 * gần như luôn có, còn trên máy tính thì hay không — macOS chưa thêm tài khoản
 * vào Mail, hoặc người dùng Gmail web chưa cho Chrome xử lý link email — và khi
 * đó bấm vào không có gì xảy ra, trông như nút hỏng.
 *
 * Vì vậy không `preventDefault`: máy nào mở được trình soạn thư thì vẫn mở,
 * còn máy nào không thì người dùng ít nhất có địa chỉ trong clipboard và một
 * thông báo cho biết điều đó.
 *
 * Tách thành client component riêng thay vì biến cả `SiteFooter` thành client:
 * footer đọc cấu hình ở server, chỉ đúng nút này cần `navigator.clipboard`.
 */
export function FooterEmailLink({
  email,
  label,
  copiedMessage,
  copyFailedMessage,
  className,
  children,
}: Props) {
  async function copy() {
    try {
      // Clipboard API cần secure context và có thể bị trình duyệt từ chối —
      // khi đó vẫn phải cho người dùng thấy địa chỉ, không im lặng.
      await navigator.clipboard.writeText(email);
      toast.success(copiedMessage);
    } catch {
      toast.info(copyFailedMessage);
    }
  }

  return (
    <a
      href={`mailto:${email}`}
      aria-label={label}
      className={className}
      onClick={() => void copy()}
    >
      {children}
    </a>
  );
}
