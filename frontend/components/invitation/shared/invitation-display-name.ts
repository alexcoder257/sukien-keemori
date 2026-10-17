import { invitationKindOf } from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { coupleShortNames } from "./couple-name";

/**
 * Tên gọi của một tấm thiệp — tiêu đề trong "Thiệp của tôi", tên sự kiện khi
 * thêm vào lịch, tên trong thẻ chia sẻ. Thiệp cưới là "Minh Tuấn & Ngọc Anh";
 * loại khác là thông tin chính của dịp (`occasion`), ưu tiên tên gọi thân mật.
 */
export function invitationDisplayName(
  content: Pick<InvitationContent, "couple" | "kind" | "occasion">,
): string {
  if (invitationKindOf(content) === "wedding") {
    return coupleShortNames(content.couple);
  }
  return content.occasion?.nickname || content.occasion?.name || "";
}

/**
 * Tiêu đề và mô tả của thiệp khi chia sẻ (thẻ `og:*`, tab trình duyệt). Thiệp
 * cưới giữ đúng câu cũ; loại khác dùng `invitation.kinds.meta.<loại>`. Thiệp
 * chúc mừng gọi tên **người nhận** — tiêu đề là "Thiệp chúc mừng gửi Cô Lan",
 * không phải tên người gửi.
 */
export function invitationMetaCopy(
  dict: Dictionary["invitation"],
  content: Pick<InvitationContent, "couple" | "kind" | "occasion">,
): { title: string; description: string } {
  const kind = invitationKindOf(content);
  if (kind === "wedding") {
    const couple = coupleShortNames(content.couple);
    return {
      title: fill(dict.meta.title, { couple }),
      description: fill(dict.meta.description, { couple }),
    };
  }
  const name =
    kind === "greeting"
      ? (content.occasion?.name ?? "")
      : invitationDisplayName(content);
  const copy = dict.kinds.meta[kind];
  return {
    // Chưa nhập tên thì bỏ luôn dấu ngăn treo ở cuối ("Thiệp mời sinh nhật ·").
    title: fill(copy.title, { name }).replace(/\s*·\s*$/, ""),
    description: fill(copy.description, { name }),
  };
}
