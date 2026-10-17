"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Slug của tấm thiệp đang được dựng, cho những block cần **ghi ngược** lên
 * đúng thiệp đó — hiện chỉ có sổ lưu bút.
 *
 * Đi bằng context chứ không bằng prop vì `InvitationTemplateProps` là hợp đồng
 * chung của 13 mẫu: thêm một prop ở đó nghĩa là mọi mẫu phải nhớ chuyền tay nó
 * xuống `InvitationWishes`, và mẫu thứ 14 quên chuyền thì sổ lưu bút hỏng im
 * lặng — đúng thứ lỗi vừa xảy ra. Context để mẫu không phải biết gì cả.
 *
 * `null` là trạng thái hợp lệ: preview trong editor và trang xem thử mẫu dựng
 * cùng component này nhưng chưa có thiệp thật nào để ghi vào.
 */
const InvitationCardSlugContext = createContext<string | null>(null);

export function InvitationCardSlugProvider({
  slug,
  children,
}: {
  slug?: string;
  children: ReactNode;
}) {
  return (
    <InvitationCardSlugContext.Provider value={slug ?? null}>
      {children}
    </InvitationCardSlugContext.Provider>
  );
}

/** `null` nghĩa là đang ở preview: block ghi phải tự chuyển sang chế độ demo. */
export function useInvitationCardSlug(): string | null {
  return useContext(InvitationCardSlugContext);
}
