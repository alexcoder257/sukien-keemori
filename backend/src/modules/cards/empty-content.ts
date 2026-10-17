import {
  DEFAULT_INVITATION_KIND,
  INVITATION_BLOCKS,
} from '@common/enums/invitation.enum';
import type { InvitationKind } from '@common/enums/invitation.enum';
import { kindHasBlock } from './card-kind';
import type { StoredContent } from './wedding-card.entity';

/**
 * Lời chào và lời mời điền sẵn theo loại thiệp: thiệp mới mở ra đã đọc được
 * như một tấm thiệp thật, chủ thiệp chỉ sửa nếu muốn.
 */
const ENVELOPE_BY_KIND: Record<InvitationKind, StoredContent['envelope']> = {
  wedding: {
    greeting: 'Trân trọng kính mời',
    invitation:
      'Chúng tôi rất hân hạnh được đón tiếp bạn trong ngày vui của gia đình.',
  },
  birthday: {
    greeting: 'Trân trọng mời bạn',
    invitation: 'Rất mong bạn đến chung vui trong tiệc sinh nhật của mình.',
  },
  graduation: {
    greeting: 'Trân trọng mời bạn',
    invitation: 'Rất mong bạn đến chung vui trong ngày tốt nghiệp của mình.',
  },
  event: {
    greeting: 'Trân trọng kính mời',
    invitation:
      'Rất hân hạnh được đón tiếp quý khách tại sự kiện của chúng tôi.',
  },
  anniversary: {
    greeting: 'Trân trọng mời bạn',
    invitation: 'Rất mong bạn đến chung vui trong ngày kỷ niệm của chúng tôi.',
  },
  greeting: {
    greeting: 'Gửi đến bạn',
    invitation: 'Một lời chúc nhỏ, gửi trọn yêu thương.',
  },
};

/** Khối lõi của thiệp không phải thiệp cưới, mọi ô rỗng. */
function emptyOccasion(): NonNullable<StoredContent['occasion']> {
  return {
    name: '',
    nickname: '',
    age: '',
    school: '',
    major: '',
    classOf: '',
    organizer: '',
    years: '',
    sender: '',
    greetingOccasion: 'other',
    message: '',
  };
}

/**
 * Nội dung mặc định khi tạo thiệp mới: mọi field rỗng, mọi block **của loại
 * thiệp** đang hiện (`KIND_BLOCKS`), block của loại khác tắt sẵn.
 * Đây là bản đối chiếu của `emptyInvitationContent` phía frontend, và là **nơi
 * duy nhất** định nghĩa hình dạng thiệp rỗng ở backend — `CreateCardDto` không
 * nhận `content` chính vì vậy.
 *
 * Trả về object mới mỗi lần gọi: nội dung nằm trong cột JSONB và sẽ bị sửa tại
 * chỗ, dùng chung một hằng số là hai thiệp mới sẽ dính vào nhau.
 */
export function createEmptyContent(
  kind: InvitationKind = DEFAULT_INVITATION_KIND,
): StoredContent {
  const wedding = kind === 'wedding';
  return {
    kind,
    // Thiệp cưới đứng tên bằng `couple`; mọi loại khác bằng khối này.
    ...(wedding ? {} : { occasion: emptyOccasion() }),
    envelope: { ...ENVELOPE_BY_KIND[kind] },
    couple: {
      groomFullName: '',
      brideFullName: '',
      groomNickname: '',
      brideNickname: '',
      groomChildOrder: '',
      brideChildOrder: '',
    },
    families: {
      groomFather: '',
      groomMother: '',
      brideFather: '',
      brideMother: '',
      groomAddress: '',
      brideAddress: '',
    },
    // Nghi lễ chỉ có ở thiệp cưới — loại khác để rỗng, khối luôn tắt.
    ceremonies: wedding
      ? [
          {
            kind: 'groom',
            customKind: '',
            dateTime: '',
            venue: '',
            venuePlace: null,
            note: '',
          },
        ]
      : [],
    reception: {
      date: '',
      welcomeTime: '',
      startTime: '',
      venueAddress: '',
      venueLabel: '',
      venuePlace: null,
      mapUrl: '',
    },
    // Tiêu đề dress code và lịch trình điền sẵn chứ không để trống: gần như mọi
    // cặp đôi đều gọi hai khối này đúng một cách, và ô trống thì editor trông
    // như còn việc phải làm.
    dressCode: { title: 'Dresscode', description: '', colors: [] },
    timeline: {
      title: wedding ? 'Lịch trình ngày cưới' : 'Lịch trình',
      items: [],
      autoTranslate: false,
    },
    countdown: { weddingDate: '', googleCalendar: true, appleCalendar: true },
    story: { message: '' },
    photos: {},
    album: { photos: [] },
    giftBox: {
      groom: { bankBin: '', accountNumber: '', accountName: '' },
      bride: { bankBin: '', accountNumber: '', accountName: '' },
    },
    // Bài đầu tiên của thư viện (`MUSIC_TRACKS` phía frontend): thiệp mới có
    // nhạc sẵn, không muốn thì bấm "Không dùng nhạc" trong hộp chọn nhạc.
    music: { trackId: 'em-dong-y-i-do' },
    thankYou: { message: '' },
    // Mặc định bật: danh sách rỗng thì không có link riêng nào, link chung vẫn
    // chạy như cũ — bật sẵn chỉ bỏ một bước người dùng phải tự tìm ra.
    // Thiệp chúc mừng gửi cho **một** người nhận, không có danh sách khách mời.
    guestInvite: { enabled: kind !== 'greeting', guestList: '' },
    // Mọi block của loại đều bật, kể cả xác nhận tham dự: chủ tiệc nào cũng cần
    // biết ai đi để đặt bàn, và tắt đi thì khó ai tìm ra mà bật lên.
    visibility: Object.fromEntries(
      INVITATION_BLOCKS.map((block) => [block, kindHasBlock(kind, block)]),
    ) as StoredContent['visibility'],
  };
}
