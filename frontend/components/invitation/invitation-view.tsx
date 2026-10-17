import { InvitationCardSlugProvider } from "./shared/invitation-card-context";
import { InvitationGuestGreetingProvider } from "./shared/invitation-guest-context";
import type { InvitationTemplateProps } from "./shared/invitation-template";
import { InvitationTemplateRenderer } from "./templates/registry";
import { TemplateTypography } from "./templates/template-typography";

type Props = InvitationTemplateProps & {
  /**
   * Thiệp thật đang được xem. Không truyền nghĩa là preview — sổ lưu bút biết
   * tự chuyển sang chế độ demo, xem `invitation-card-context.tsx`.
   */
  cardSlug?: string;
  /**
   * Tên khách của link mời riêng ("Bạn Minh"). Có thì màn bìa thêm khối
   * "Trân trọng kính mời: Bạn Minh" trên tên cô dâu chú rể và ẩn lời chào
   * chung — xem `invitation-guest-greeting.tsx`.
   */
  guestName?: string | null;
  /**
   * Mã link mời riêng đã được backend xác nhận — chỉ truyền khi có `guestName`.
   * Xác nhận tham dự dùng nó để phản hồi đứng tên đúng khách.
   */
  guestToken?: string;
};

/**
 * Điểm vào duy nhất để dựng một tấm thiệp: chọn mẫu theo slug rồi giao toàn bộ
 * việc dựng cho mẫu đó. Bố cục, thứ tự block, font và màu là chuyện riêng của
 * từng mẫu — component này không biết gì về chúng.
 *
 * Dùng chung cho trang khách mời, trang xem thử và preview trong editor.
 */
export function InvitationView({
  templateSlug,
  cardSlug,
  guestName,
  guestToken,
  content,
  ...props
}: Props) {
  // Nhãn của khối lời mời riêng ("Trân trọng kính mời:"); tên khách đi riêng
  // trong `guest` để mẫu vẽ nhãn và tên bằng hai kiểu chữ khác nhau.
  const guestGreeting = guestName ? props.dict.guestInviteLabel : null;
  const guest = guestName ? { name: guestName, token: guestToken } : null;

  return (
    <InvitationCardSlugProvider slug={cardSlug}>
      <InvitationGuestGreetingProvider greeting={guestGreeting} guest={guest}>
        <TemplateTypography templateSlug={templateSlug}>
          <InvitationTemplateRenderer
            {...props}
            content={content}
            templateSlug={templateSlug}
          />
        </TemplateTypography>
      </InvitationGuestGreetingProvider>
    </InvitationCardSlugProvider>
  );
}
