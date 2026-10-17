import type { Dictionary } from "@/i18n/dictionaries";
import type { InvitationContent } from "@/lib/schemas/invitation";

export type InvitationFamilySide = {
  key: "groom" | "bride";
  label: string;
  father: string;
  mother: string;
  address: string;
  childName: string;
  childOrder: string;
};

/** Giữ họ tên cô dâu/chú rể liền một dòng trong mọi cách trình bày gia đình. */
function nonBreakingName(name: string): string {
  return name.trim().replace(/\s+/g, "\u00a0");
}

/**
 * Chuẩn hoá dữ liệu hai gia đình cho mọi mẫu thiệp. Mỗi template vẫn tự quyết
 * định cách trình bày, nhưng không phải dựng lại danh sách nhà trai/nhà gái và
 * cùng nhận được hành vi ẩn những card hoàn toàn không có nội dung.
 *
 * `childOrder` để trống thì rơi về "Chú rể"/"Cô dâu" — editor hứa đúng điều đó
 * ở dòng gợi ý dưới ô "Con thứ mấy". Rơi về ở **đây** chứ không ở từng mẫu, để
 * mẫu nào cũng hiện cùng một chữ thay vì mẫu thì ẩn dòng, mẫu thì tự đoán.
 */
export function getInvitationFamilySides(
  content: InvitationContent,
  dict: Dictionary["invitation"]["sections"]["families"],
  showCouple: boolean,
): InvitationFamilySide[] {
  const sides = [
    {
      key: "groom" as const,
      label: dict.groomSide,
      father: content.families.groomFather,
      mother: content.families.groomMother,
      address: content.families.groomAddress,
      childName: nonBreakingName(content.couple.groomFullName),
      childOrder: content.couple.groomChildOrder?.trim() || dict.groom,
    },
    {
      key: "bride" as const,
      label: dict.brideSide,
      father: content.families.brideFather,
      mother: content.families.brideMother,
      address: content.families.brideAddress,
      childName: nonBreakingName(content.couple.brideFullName),
      childOrder: content.couple.brideChildOrder?.trim() || dict.bride,
    },
  ].filter(
    (side) =>
      side.father ||
      side.mother ||
      side.address ||
      (showCouple && side.childName),
  );
  return sides;
}
