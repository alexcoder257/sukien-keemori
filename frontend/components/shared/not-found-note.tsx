"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  /** Câu cho URL gõ sai / link cũ. */
  body: string;
  /** Câu cho link thiệp đã chết (`/t/<slug>`). */
  invitationNote: string;
  className?: string;
};

/**
 * Câu giải thích của trang 404, chọn theo đường dẫn **ở trình duyệt**.
 *
 * Link thiệp chết là ca 404 đông nhất và cần một câu trả lời khác hẳn: khách
 * mời không gõ sai gì cả, link đơn giản là đã hết hiệu lực, và người duy nhất
 * cấp lại được link là cặp đôi chứ không phải trang chủ của chúng ta.
 *
 * Là Client Component vì `not-found.tsx` không được đọc request (xem
 * `i18n/request-locale.ts`). `usePathname()` không phải request API: nó có sẵn
 * cả lúc server render, nên HTML đầu tiên đã mang đúng câu.
 */
export function NotFoundNote({ locale, body, invitationNote, className }: Props) {
  const pathname = usePathname();
  const isInvitationLink = pathname.startsWith(`/${locale}/t/`);
  return <p className={className}>{isInvitationLink ? invitationNote : body}</p>;
}
