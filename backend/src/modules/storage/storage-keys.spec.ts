import { isKeyInsideCard } from './storage-keys';

const CARD_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_CARD_ID = '22222222-2222-4222-8222-222222222222';

describe('isKeyInsideCard', () => {
  it.each([
    `cards/${CARD_ID}/photos/1700000000-abc123.avif`,
    `uploads/cards/${CARD_ID}/album/1700000000-abc123.avif`,
  ])('nhận khoá nằm trong thư mục của thiệp: %s', (key) => {
    expect(isKeyInsideCard(key, CARD_ID)).toBe(true);
  });

  // `content` là JSON người dùng gửi: dán URL ảnh của thiệp khác vào rồi gỡ ra
  // không được xoá ảnh của người ta.
  it.each([
    `cards/${OTHER_CARD_ID}/photos/a.avif`,
    `cards/${CARD_ID}/../${OTHER_CARD_ID}/photos/a.avif`,
    `cards/${CARD_ID}/photos/sub/a.avif`,
    'editorial/a.jpg',
    `showcase/${CARD_ID}/a.avif`,
  ])('từ chối khoá ngoài thiệp: %s', (key) => {
    expect(isKeyInsideCard(key, CARD_ID)).toBe(false);
  });
});
