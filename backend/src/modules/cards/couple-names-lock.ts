import { COUPLE_NAMES_LOCK_DAYS } from '@common/constants/invitation.constants';
import { contentKind } from './card-kind';
import type { StoredContent, WeddingCard } from './wedding-card.entity';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Bốn ô tên bị khoá — cả tên gọi, vì bìa thiệp thường in đúng tên gọi. */
export const LOCKED_COUPLE_FIELDS = [
  'groomFullName',
  'brideFullName',
  'groomNickname',
  'brideNickname',
] as const;

/**
 * Hai ô tên bị khoá ở mọi loại không phải thiệp cưới. Cùng lý do với thiệp
 * cưới: thiệp đã trả tiền là link vĩnh viễn, không khoá tên người được mừng thì
 * một lần mua dùng được cho mọi bữa tiệc sinh nhật về sau.
 */
export const LOCKED_OCCASION_FIELDS = ['name', 'nickname'] as const;

type LockState = Pick<WeddingCard, 'status' | 'paidAt' | 'coupleNamesUnlocked'>;

/** Mốc tên bắt đầu bị khoá, hoặc `null` khi thiệp chưa từng thanh toán. */
export function coupleNamesLockAt(paidAt: Date | null): Date | null {
  return paidAt
    ? new Date(paidAt.getTime() + COUPLE_NAMES_LOCK_DAYS * DAY_MS)
    : null;
}

/**
 * Tên trên thiệp (cô dâu chú rể, hoặc tên chính của loại khác) đang bị khoá
 * hay không.
 *
 * Admin mở khoá (`coupleNamesUnlocked`) thắng mốc thời gian; khoá lại thì luật
 * thời gian có hiệu lực trở lại ngay. Thiệp chưa `paid` không bao giờ bị khoá:
 * hạn 3 ngày và trần 15 người xem đã tự chặn việc dùng lại.
 */
export function isCoupleNamesLocked(
  card: LockState,
  now: Date = new Date(),
): boolean {
  if (card.status !== 'paid' || card.coupleNamesUnlocked) return false;
  const lockAt = coupleNamesLockAt(card.paidAt);
  return lockAt !== null && now.getTime() >= lockAt.getTime();
}

/**
 * Giá trị của những ô tên bị khoá theo loại thiệp, đã `trim` — so hai mảng này
 * là biết lượt lưu có đổi tên không. Một khoảng trắng thừa editor gửi lên không
 * bị tính là đổi tên.
 */
export function lockedNameValues(content: StoredContent): string[] {
  if (contentKind(content) === 'wedding') {
    return LOCKED_COUPLE_FIELDS.map((field) =>
      (content.couple?.[field] ?? '').trim(),
    );
  }
  return LOCKED_OCCASION_FIELDS.map((field) =>
    (content.occasion?.[field] ?? '').trim(),
  );
}
