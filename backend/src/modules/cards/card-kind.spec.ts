import { INVITATION_BLOCKS, KIND_BLOCKS } from '@common/enums/invitation.enum';
import { cardDisplayName, contentKind } from './card-kind';
import { lockedNameValues } from './couple-names-lock';
import { createEmptyContent } from './empty-content';
import type { StoredContent } from './wedding-card.entity';

function birthday(name: string, nickname = ''): StoredContent {
  const content = createEmptyContent('birthday');
  content.occasion = { ...content.occasion!, name, nickname };
  return content;
}

describe('contentKind', () => {
  it('thiệp cũ không mang `kind` là thiệp cưới', () => {
    const legacy = createEmptyContent();
    delete legacy.kind;
    expect(contentKind(legacy)).toBe('wedding');
    expect(contentKind(undefined)).toBe('wedding');
  });

  it('đọc đúng loại đã lưu', () => {
    expect(contentKind(createEmptyContent('graduation'))).toBe('graduation');
  });
});

describe('cardDisplayName', () => {
  it('thiệp cưới đứng tên bằng tên cô dâu chú rể', () => {
    const content = createEmptyContent();
    content.couple.groomFullName = 'Tuấn Anh';
    content.couple.brideFullName = 'Như Bình';
    expect(cardDisplayName(content)).toBe('Tuấn Anh Như Bình');
  });

  it('loại khác đứng tên bằng `occasion.name`, bỏ qua tên cặp đôi', () => {
    const content = birthday('  Minh Anh ');
    content.couple.groomFullName = 'Không dùng';
    expect(cardDisplayName(content)).toBe('Minh Anh');
  });

  it('chưa nhập tên thì trả chuỗi rỗng', () => {
    expect(cardDisplayName(createEmptyContent('event'))).toBe('');
  });
});

describe('lockedNameValues', () => {
  it('thiệp cưới khoá đúng bốn ô tên, đã trim', () => {
    const content = createEmptyContent();
    content.couple.groomFullName = ' An ';
    content.couple.brideNickname = 'Bi';
    expect(lockedNameValues(content)).toEqual(['An', '', '', 'Bi']);
  });

  it('loại khác khoá tên và tên gọi của nhân vật chính', () => {
    expect(lockedNameValues(birthday('Minh Anh ', 'Bống'))).toEqual([
      'Minh Anh',
      'Bống',
    ]);
  });
});

describe('createEmptyContent', () => {
  it('thiệp cưới giữ nguyên nội dung cũ: không có `occasion`, mọi khối bật', () => {
    const content = createEmptyContent();
    expect(content.kind).toBe('wedding');
    expect(content.occasion).toBeUndefined();
    expect(content.ceremonies).toHaveLength(1);
    expect(content.envelope.greeting).toBe('Trân trọng kính mời');
    expect(content.timeline.title).toBe('Lịch trình ngày cưới');
    expect(content.guestInvite.enabled).toBe(true);
    expect(Object.values(content.visibility).every(Boolean)).toBe(true);
  });

  it.each(
    (
      ['birthday', 'graduation', 'event', 'anniversary', 'greeting'] as const
    ).map((kind) => [kind]),
  )('%s: occasion rỗng, không nghi lễ, chỉ bật khối của loại', (kind) => {
    const content = createEmptyContent(kind);
    expect(content.kind).toBe(kind);
    expect(content.occasion).toMatchObject({
      name: '',
      greetingOccasion: 'other',
    });
    expect(content.ceremonies).toEqual([]);
    for (const block of INVITATION_BLOCKS) {
      expect(content.visibility[block]).toBe(KIND_BLOCKS[kind].includes(block));
    }
    // Khối riêng của thiệp cưới không bao giờ bật ở loại khác.
    expect(content.visibility.couple).toBe(false);
    expect(content.visibility.families).toBe(false);
    expect(content.visibility.ceremonies).toBe(false);
  });

  it('lời chào điền sẵn theo loại', () => {
    expect(createEmptyContent('birthday').envelope).toEqual({
      greeting: 'Trân trọng mời bạn',
      invitation: 'Rất mong bạn đến chung vui trong tiệc sinh nhật của mình.',
    });
    expect(createEmptyContent('greeting').envelope.greeting).toBe(
      'Gửi đến bạn',
    );
  });

  it('thiệp chúc mừng không có danh sách link mời riêng', () => {
    expect(createEmptyContent('greeting').guestInvite.enabled).toBe(false);
    expect(createEmptyContent('event').guestInvite.enabled).toBe(true);
  });

  it('mỗi lần gọi là một object mới', () => {
    const first = createEmptyContent('birthday');
    first.occasion!.name = 'Đã sửa';
    expect(createEmptyContent('birthday').occasion!.name).toBe('');
  });
});
