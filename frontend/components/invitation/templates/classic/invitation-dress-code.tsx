import type { Dictionary } from "@/i18n/dictionaries";
import type { DressCode } from "@/lib/schemas/invitation";
import { InvitationDressCode as SharedInvitationDressCode } from "@/components/invitation/shared/invitation-dress-code";
import { InvitationSection } from "./invitation-section";

type Props = {
  dressCode: DressCode;
  dict: Dictionary["invitation"]["sections"]["dressCode"];
};

/**
 * Dress code là gợi ý trang phục cho khách: một section riêng, bật/tắt được
 * như mọi block khác. Tiêu đề do cặp đôi tự đặt; bỏ trống thì dùng nhãn mặc
 * định. Bật block mà chưa nhập gì thì section im lặng thay vì hiện một tiêu đề
 * trống trơn.
 */
export function InvitationDressCode({ dressCode, dict }: Props) {
  const colors = dressCode.colors.filter(Boolean);
  if (!dressCode.description && colors.length === 0) return null;

  return (
    <InvitationSection>
      <SharedInvitationDressCode
        title={dressCode.title}
        fallbackTitle={dict.title}
        description={dressCode.description}
        colors={colors}
        colorLabel={dict.colorLabel}
      />
    </InvitationSection>
  );
}
