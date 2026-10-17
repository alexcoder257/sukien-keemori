"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Khách đang mở thiệp bằng link mời riêng. */
export type InvitationGuest = {
  /** Nguyên văn cách xưng hô cặp đôi gõ: "Anh Chị Cường Thu". */
  name: string;
  /**
   * Mã link đã được backend xác nhận. Vắng ở preview trong editor — ở đó chỉ có
   * tên khách đầu danh sách để xem thử, chưa có link nào.
   */
  token?: string;
};

/**
 * Nhãn của khối lời mời riêng ("Trân trọng kính mời:") khi thiệp mở bằng link
 * mời riêng, hoặc `null` khi mở bằng link chung. Khác `null` cũng là tín hiệu
 * để lời chào chung trên màn bìa ẩn đi.
 *
 * Mẫu không đọc trực tiếp: màn bìa tự vẽ dùng `InvitationGuestGreeting` và
 * `InvitationCoverGreeting` (`invitation-guest-greeting.tsx`), còn bìa chung
 * `WeddingOpening` tự làm cả hai việc.
 *
 * Context thay vì thêm prop vì cùng lý do với `InvitationCardSlugProvider`:
 * `InvitationTemplateProps` là hợp đồng chung của mọi mẫu, và một prop mà mẫu
 * phải nhớ chuyền tay xuống là một prop mẫu thứ 70 sẽ quên.
 */
const InvitationGuestGreetingContext = createContext<string | null>(null);

/**
 * Chính khách đó — tên và mã link — cho những block **ghi ngược** cần biết ai
 * đang gửi: xác nhận tham dự điền sẵn tên và đứng tên đúng khách. Tách khỏi lời
 * chào vì lời chào là chuỗi đã dịch, còn đây là dữ liệu.
 */
const InvitationGuestContext = createContext<InvitationGuest | null>(null);

export function InvitationGuestGreetingProvider({
  greeting,
  guest = null,
  children,
}: {
  greeting: string | null;
  guest?: InvitationGuest | null;
  children: ReactNode;
}) {
  return (
    <InvitationGuestContext.Provider value={guest}>
      <InvitationGuestGreetingContext.Provider value={greeting}>
        {children}
      </InvitationGuestGreetingContext.Provider>
    </InvitationGuestContext.Provider>
  );
}

export function useInvitationGuestGreeting(): string | null {
  return useContext(InvitationGuestGreetingContext);
}

export function useInvitationGuest(): InvitationGuest | null {
  return useContext(InvitationGuestContext);
}
