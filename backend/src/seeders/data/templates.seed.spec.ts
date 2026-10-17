import { TEMPLATE_COLOR_MAX } from '@common/enums/invitation.enum';
import { TEMPLATE_SEEDS } from './templates.seed';

/**
 * Database chỉ chặn trần số màu (CHECK), vì migration không được làm hỏng cả
 * lượt deploy chỉ vì một slug lạ. Sàn "ít nhất một màu" giữ ở đây: mẫu mới
 * quên khai màu thì không bao giờ hiện ra khi khách lọc theo màu.
 */
describe('TEMPLATE_SEEDS — màu chủ đạo', () => {
  // `it.each` ném lỗi với bảng rỗng, mà kho mẫu có lúc trống thật.
  if (TEMPLATE_SEEDS.length === 0) {
    it('kho mẫu trống', () => expect(TEMPLATE_SEEDS).toEqual([]));
    return;
  }

  it.each(TEMPLATE_SEEDS.map((seed) => [seed.slug, seed.colorTones]))(
    '%s có 1–2 màu, không trùng nhau',
    (_slug, colorTones) => {
      expect(colorTones.length).toBeGreaterThanOrEqual(1);
      expect(colorTones.length).toBeLessThanOrEqual(TEMPLATE_COLOR_MAX);
      expect(new Set(colorTones).size).toBe(colorTones.length);
    },
  );
});
