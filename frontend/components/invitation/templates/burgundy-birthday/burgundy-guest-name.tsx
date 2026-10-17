"use client";

import { useInvitationGuest } from "@/components/invitation/shared/invitation-guest-context";

/**
 * Dòng tên khách ngay dưới "TRÂN TRỌNG KÍNH MỜI" — chỉ có ở link mời riêng
 * (`?khach=<mã>`). Link chung không vẽ gì, để nhãn mời chung đứng một mình.
 *
 * Mẫu này tự vẽ dòng tên theo đúng thiết kế (chữ Cormorant, gạch chân mảnh)
 * thay vì dùng `InvitationGuestGreeting`: nhãn "Trân trọng kính mời" đã là một
 * phần cố định của bố cục, khối dùng chung sẽ lặp lại nhãn đó lần thứ hai.
 */
export function BurgundyGuestName({ className }: { className?: string }) {
  const guest = useInvitationGuest();
  if (!guest) return null;
  return (
    <p className={className} data-invitation-guest>
      {guest.name}
    </p>
  );
}
