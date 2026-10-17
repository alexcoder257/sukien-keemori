import type { ComponentType } from "react";
import type { PhotoSlotKey } from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { InvitationContent } from "@/lib/schemas/invitation";

/**
 * Hợp đồng chung của mọi mẫu thiệp. Một mẫu nhận đúng nội dung khách nhập cộng
 * với dictionary và locale, rồi tự quyết định bố cục, font và màu — không mẫu
 * nào được thêm prop riêng, nếu không `InvitationView` sẽ phải biết từng mẫu.
 */
export type InvitationTemplateProps = {
  /** Slug giúp mẫu dự phòng chọn phần trình bày đặc trưng cho từng concept. */
  templateSlug?: string;
  content: InvitationContent;
  dict: Dictionary["invitation"];
  ceremonyKindsDict: Dictionary["editor"]["ceremonyKinds"];
  locale: Locale;
  /**
   * Ô ảnh mà mẫu này dàn sẵn. `content.photos` giữ cả ảnh của những ô thuộc
   * mẫu khác — đổi mẫu không được làm mất nội dung — nên mẫu phải đọc danh
   * sách này để biết ảnh nào là của mình, thay vì lấy hết những gì có.
   *
   * Mẫu có bản dựng riêng (Aurora) tự đặt từng ô vào đúng chỗ trong bố cục và
   * không cần tra prop này; nó dành cho mẫu mặc định vốn phải dựng được mọi
   * cấu hình ô ảnh.
   */
  photoSlots: PhotoSlotKey[];
  /** Trong preview của editor không cần nút nhạc nổi trên toàn màn hình. */
  showMusicToggle?: boolean;
  musicTogglePlacement?: "viewport" | "mobile-preview";
};

export type InvitationTemplate = ComponentType<InvitationTemplateProps>;
