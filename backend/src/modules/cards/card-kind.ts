import {
  DEFAULT_INVITATION_KIND,
  KIND_BLOCKS,
} from '@common/enums/invitation.enum';
import type {
  InvitationBlock,
  InvitationKind,
} from '@common/enums/invitation.enum';
import type { StoredContent } from './wedding-card.entity';

/**
 * Loại của một thiệp. Thiệp tạo trước khi có loại không mang `content.kind`,
 * và mọi thiệp đó đều là thiệp cưới.
 */
export function contentKind(
  content: Pick<StoredContent, 'kind'> | undefined,
): InvitationKind {
  return content?.kind ?? DEFAULT_INVITATION_KIND;
}

/** Khối này có thuộc form của loại thiệp không — xem `KIND_BLOCKS`. */
export function kindHasBlock(
  kind: InvitationKind,
  block: InvitationBlock,
): boolean {
  return KIND_BLOCKS[kind].includes(block);
}

/**
 * Tên đứng tên thiệp, nguồn của đường dẫn đọc được ở lần xuất bản đầu.
 * Thiệp cưới: cô dâu chú rể (`tuan-anh-nhu-binh`). Loại khác: `occasion.name`
 * — người được mừng, tên sự kiện, hay người nhận lời chúc.
 *
 * Trả chuỗi rỗng khi chưa nhập: người gọi tự quyết dùng gì thay.
 */
export function cardDisplayName(content: StoredContent): string {
  if (contentKind(content) === 'wedding') {
    return `${content.couple?.groomFullName ?? ''} ${
      content.couple?.brideFullName ?? ''
    }`.trim();
  }
  return (content.occasion?.name ?? '').trim();
}
