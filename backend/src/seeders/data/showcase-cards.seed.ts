import { TEMPLATE_SEEDS } from './templates.seed';
import type { StoredContent } from '@modules/cards/wedding-card.entity';
import type { Tier } from '@common/enums/tier.enum';
import type { TimelineActivityKind } from '@common/enums/invitation.enum';

/**
 * Thiệp demo cho dải "Cặp đôi đã tạo thiệp" ở trang chủ.
 *
 * Trước đây dải đó là tám ảnh stock trong bảng `couple_showcases` trỏ tới những
 * slug **không có thiệp nào** — bấm vào là rơi ra trang 404, trong khi phụ đề
 * ngay bên cạnh nói "thiệp thật, do các cặp đôi tự tạo trên nền tảng". Giờ mỗi
 * ô trong dải là một thiệp có thật trong `wedding_cards`, mở ra được, mỗi thiệp
 * một mẫu và một cặp đôi khác nhau.
 *
 * **Cặp đôi ở đây là bản sao có chủ đích của `frontend/lib/data/sample-couples.ts`.**
 * Ảnh của ô chính là `thumbnail.avif` của mẫu, mà thumbnail được chụp từ trang
 * `xem-thu` — tức từ dữ liệu mẫu phía frontend. Sửa tên hay ngày một bên mà quên
 * bên kia thì ảnh và nội dung thiệp mở ra sẽ nói hai chuyện khác nhau, và phải
 * chụp lại thumbnail của đúng mẫu đó.
 *
 * Ô **đầu tiên** trong danh sách này còn là thiệp mẫu của CTA "Xem thiệp mẫu"
 * ở hero (`frontend/constants/invitation.ts` → `DEMO_INVITATION_SLUG` trỏ vào
 * slug của nó, và hero đọc lời mời cùng địa điểm từ chính nó). Đổi slug ô đó
 * thì phải đổi kèm hằng số bên frontend.
 *
 * Ba điều kiện bắt buộc:
 *
 * 1. Trạng thái `paid` (đã xuất bản) — thiệp `draft` là 404 với khách, mà đây là
 *    dải nằm trên trang chủ.
 * 2. Chủ sở hữu là tài khoản admin, vì thiệp phải thuộc về một người có thật.
 * 3. `templateSlug` phải có trong `templates.seed.ts` và `photos` phải khớp
 *    `photoSlots` của mẫu đó — sai ô ảnh thì thiệp mở ra thủng chỗ.
 */
type ShowcaseCoupleSeed = {
  /** Đường dẫn công khai `/t/<slug>`, cũng là khoá của hàng `couple_showcases`. */
  slug: string;
  names: string;
  templateSlug: string;
  /** Ảnh cưới theo đúng thứ tự `photoSlots` của mẫu. */
  photos: readonly string[];
  /**
   * Ảnh của khối album, tách hẳn khỏi `photos` vì hai thứ đi theo hai trục khác
   * nhau (`docs/business-model.md`): `photos` đổ vào `photoSlots` do **mẫu** bố
   * trí, còn album là của **thiệp** — thiệp nào cũng có album nên mẫu Free không
   * có ô ảnh nào vẫn hiện được album.
   * Bỏ trống thì album hiện ra rỗng.
   */
  albumPhotos?: readonly string[];
  groomFullName: string;
  brideFullName: string;
  /**
   * Bản sao của `groomNickname`/`brideNickname` bên frontend. Nhiều mẫu in tên
   * gọi thay tên đầy đủ ở màn bìa, nên bỏ trống là ảnh thumbnail đọc ra "Bảo
   * Long & Thanh Trúc" còn thiệp mở ra đọc ra "Đặng Bảo Long & Huỳnh Thanh
   * Trúc".
   */
  groomNickname: string;
  brideNickname: string;
  groomChildOrder: string;
  brideChildOrder: string;
  groomFather: string;
  groomMother: string;
  brideFather: string;
  brideMother: string;
  groomAddress: string;
  brideAddress: string;
  venue: string;
  latitude: number;
  longitude: number;
  weddingDate: string;
  engagementDateTime: string;
  brideCeremonyDateTime: string;
  groomCeremonyDateTime: string;
  welcomeTime: string;
  startTime: string;
  countdown: string;
  story: string;
  dressCodeColors: string[];
  groomAccountName: string;
  brideAccountName: string;
  trackId: string;
  /**
   * Phần nội dung do **mẫu** quyết định chứ không do cặp đôi: mỗi art direction
   * chọn bật/tắt block nào và gọi tên chương ra sao, và `frontend/lib/data/
   * invitation-sample.ts` đã khai đúng bộ đó cho trang `xem-thu`.
   *
   * Không có nó thì thiệp trong dải trang chủ mọc thêm những chương mà mẫu
   * chưa bao giờ dựng — bố cục vỡ, mà ảnh `thumbnail.avif` (chụp từ `xem-thu`)
   * lại không có chúng, nên ô trong dải và thiệp mở ra nói hai chuyện khác
   * nhau. Đây là **bản sao có chủ đích** của `defaults` bên frontend, cùng luật
   * đồng bộ với phần tên và ngày ở trên.
   */
  templateDefaults?: {
    hiddenBlocks?: readonly (keyof StoredContent['visibility'])[];
    envelopeGreeting?: string;
    envelopeInvitation?: string;
    timelineTitle?: string;
    /**
     * `kind` bắt buộc ở dữ liệu demo dù DTO để tuỳ chọn: thumbnail kho mẫu chụp
     * từ chính dữ liệu này, nên nghĩa của biểu tượng không được để máy đoán.
     */
    timelineItems?: readonly {
      startTime: string;
      endTime: string;
      activity: string;
      kind: TimelineActivityKind;
    }[];
    dressCodeTitle?: string;
    dressCodeDescription?: string;
  };
};

const MAP_URL = 'https://maps.app.goo.gl/rH3bWK6kfC5dVDhH8';

// Mọi thiệp demo cũ dùng một mẫu đã gỡ cùng ảnh trong thư mục của mẫu đó, nên
// danh sách trống cho tới khi kho có mẫu mới. Kéo theo: dải trang chủ trống và
// hero không có thiệp mẫu (`DEMO_INVITATION_SLUG` không còn thiệp nào).
const SHOWCASE_COUPLES: ShowcaseCoupleSeed[] = [];

/** Lời chúc mẫu, xoay vòng để không thiệp nào cũng đúng bốn câu giống nhau. */
const WISH_POOL = [
  { name: 'Bạn Hoàng', message: 'Chúc 2 bạn mãi yêu nhau, đầu bạc răng long!' },
  {
    name: 'Hoài Nam',
    message: 'Chúc hai bạn luôn nắm tay nhau qua mọi chặng đường!',
  },
  {
    name: 'Bạn Linh',
    message:
      'Mừng ngày trọng đại! Chúc hai bạn cười nhiều hơn cãi, yêu nhiều hơn giận nhen!',
  },
  {
    name: 'Chị Huyền',
    message: 'Chúc hai em trăm năm hạnh phúc, vợ chồng đồng lòng.',
  },
  {
    name: 'Cô Thanh',
    message: 'Chúc hai cháu sớm sinh quý tử, gia đình luôn đầm ấm.',
  },
  {
    name: 'Đức Anh',
    message: 'Bay chuyến sớm nhất để kịp dự đám cưới hai bạn nhé!',
  },
  {
    name: 'Bạn Trang',
    message: 'Nhìn ảnh cưới mà xúc động quá. Chúc mừng hai đứa!',
  },
];

export type ShowcaseCardSeed = {
  slug: string;
  title: string;
  templateSlug: string;
  templateTier: Tier;
  weddingDate: string;
  imageSrc: string;
  content: StoredContent;
  wishes: { name: string; message: string }[];
};

const TEMPLATE_BY_SLUG = new Map(
  TEMPLATE_SEEDS.map((template) => [template.slug, template]),
);

function buildContent(
  seed: ShowcaseCoupleSeed,
  photoSlots: readonly string[],
): StoredContent {
  const place = {
    placeId: '',
    latitude: seed.latitude,
    longitude: seed.longitude,
  };
  const defaults = seed.templateDefaults ?? {};
  const visibility: StoredContent['visibility'] = {
    envelope: true,
    couple: true,
    families: true,
    ceremonies: true,
    reception: true,
    dressCode: true,
    timeline: true,
    countdown: true,
    story: true,
    album: true,
    giftBox: true,
    wishes: true,
    rsvp: false,
    music: true,
    thankYou: true,
  };
  /**
   * Đúng hành vi của công tắc ẩn block trong editor: chỉ tắt hiển thị, **giữ
   * nguyên nội dung**. Xoá luôn dữ liệu thì bật lại công tắc là block rỗng, mà
   * ẩn một block chưa bao giờ có nghĩa là mất những gì đã nhập.
   */
  for (const block of defaults.hiddenBlocks ?? []) visibility[block] = false;

  return {
    // Ô ảnh đổ theo **mẫu**, nên slot nào mẫu không có thì thiệp cũng không có.
    photos: Object.fromEntries(
      photoSlots
        .filter((_, index) => index < seed.photos.length)
        .map((slot, index) => [slot, seed.photos[index]]),
    ),
    envelope: {
      greeting: defaults.envelopeGreeting ?? 'Trân trọng kính mời',
      invitation:
        defaults.envelopeInvitation ??
        'Chúng tôi rất hân hạnh được đón tiếp bạn trong ngày vui của gia đình.',
    },
    couple: {
      groomFullName: seed.groomFullName,
      brideFullName: seed.brideFullName,
      groomNickname: seed.groomNickname,
      brideNickname: seed.brideNickname,
      groomChildOrder: seed.groomChildOrder,
      brideChildOrder: seed.brideChildOrder,
    },
    families: {
      groomFather: seed.groomFather,
      groomMother: seed.groomMother,
      brideFather: seed.brideFather,
      brideMother: seed.brideMother,
      groomAddress: seed.groomAddress,
      brideAddress: seed.brideAddress,
    },
    ceremonies: [
      {
        kind: 'engagement',
        customKind: '',
        dateTime: seed.engagementDateTime,
        venue: seed.venue,
        venuePlace: place,
        note: 'Kính mời họ hàng thân thiết dự lễ ăn hỏi.',
      },
      {
        kind: 'bride',
        customKind: '',
        dateTime: seed.brideCeremonyDateTime,
        venue: seed.venue,
        venuePlace: place,
        note: 'Lễ vu quy tổ chức trong không gian ấm cúng của gia đình.',
      },
      {
        kind: 'groom',
        customKind: '',
        dateTime: seed.groomCeremonyDateTime,
        venue: seed.venue,
        venuePlace: place,
        note: 'Lễ thành hôn tổ chức trong không gian ấm cúng của gia đình.',
      },
    ],
    reception: {
      date: seed.weddingDate,
      welcomeTime: seed.welcomeTime,
      startTime: seed.startTime,
      venueAddress: seed.venue,
      venuePlace: place,
      mapUrl: MAP_URL,
    },
    dressCode: {
      title: defaults.dressCodeTitle ?? 'DRESS CODE',
      description:
        defaults.dressCodeDescription ??
        'Hãy cùng chúng mình khoác lên những sắc màu của ngày vui nhé!',
      colors: seed.dressCodeColors,
    },
    timeline: {
      title: defaults.timelineTitle ?? 'Lịch trình ngày cưới',
      items: defaults.timelineItems
        ? [...defaults.timelineItems]
        : [
            {
              startTime: '08:00',
              endTime: '09:00',
              activity: 'Lễ gia tiên tại nhà gái',
              kind: 'ancestral',
            },
            {
              startTime: '10:30',
              endTime: '11:30',
              activity: 'Đón dâu về nhà trai',
              kind: 'procession',
            },
            {
              startTime: seed.welcomeTime,
              endTime: seed.startTime,
              activity: 'Đón khách tại trung tâm tiệc cưới',
              kind: 'welcome',
            },
            {
              startTime: seed.startTime,
              endTime: '20:30',
              activity: 'Khai tiệc',
              kind: 'reception',
            },
          ],
      autoTranslate: true,
    },
    countdown: {
      weddingDate: seed.countdown,
      googleCalendar: true,
      appleCalendar: true,
    },
    story: { message: seed.story },
    album: { photos: [...(seed.albumPhotos ?? [])] },
    giftBox: {
      groom: {
        bankBin: '970436',
        accountNumber: '0123456789',
        accountName: seed.groomAccountName,
      },
      bride: {
        bankBin: '970407',
        accountNumber: '9876543210',
        accountName: seed.brideAccountName,
      },
    },
    music: { trackId: seed.trackId },
    thankYou: {
      message:
        'Cảm ơn bạn đã đến và cùng chúng mình viết nên một phần thật đẹp trong ngày đặc biệt này.',
    },
    guestInvite: { enabled: false, guestList: '' },
    visibility: { ...visibility },
  };
}

export const SHOWCASE_CARD_SEEDS: ShowcaseCardSeed[] = SHOWCASE_COUPLES.map(
  (seed, index) => {
    const template = TEMPLATE_BY_SLUG.get(seed.templateSlug);
    if (!template) {
      throw new Error(
        `Không có mẫu ${seed.templateSlug} trong TEMPLATE_SEEDS.`,
      );
    }
    return {
      slug: seed.slug,
      title: seed.names,
      templateSlug: seed.templateSlug,
      templateTier: template.tier,
      weddingDate: seed.weddingDate,
      imageSrc: `/images/templates/${seed.templateSlug}/thumbnail.avif`,
      content: buildContent(seed, template.photoSlots),
      // Xoay vòng bắt đầu từ một vị trí khác nhau cho mỗi thiệp.
      wishes: [0, 1, 2, 3].map(
        (offset) => WISH_POOL[(index * 2 + offset) % WISH_POOL.length],
      ),
    };
  },
);
