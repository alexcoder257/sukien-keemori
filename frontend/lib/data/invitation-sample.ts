import {
  ALBUM_PHOTO_CAP,
  DEFAULT_GUEST_INVITE,
  INVITATION_BLOCKS,
  type InvitationKind,
  type PhotoSlotKey,
  type TemplateSlug,
} from "@/constants/invitation";
import { emptyInvitationContentFor } from "@/lib/empty-invitation-content";
import { withKhaiHoBirthday } from "@/lib/data/khai-ho-birthday";
import {
  sampleCoupleByKey,
  type SampleCoupleKey,
} from "@/lib/data/sample-couples";
import type {
  InvitationContent,
  TimelineActivityKind,
  TimelineItem,
} from "@/lib/schemas/invitation";

/**
 * Dòng lịch trình mẫu **bắt buộc** mang `kind`, dù form để tuỳ chọn. Nút điền
 * mẫu và thumbnail kho mẫu đều đi từ dữ liệu này: để "Tự động" thì những câu
 * mơ hồ ("Tiệc tối & giao lưu") phụ thuộc vào phép đoán, và dropdown trong
 * editor không cho người dùng thấy nó dùng để làm gì.
 */
type SampleTimelineItem = TimelineItem & { kind: TimelineActivityKind };
type SampleTimeline = Omit<InvitationContent["timeline"], "items"> & {
  items: SampleTimelineItem[];
};

/**
 * Nội dung mẫu để điền nhanh toàn bộ form editor khi cần xem thử thiệp. Đây là
 * dữ liệu client-safe (khác `lib/data/invitations.ts` vốn là `server-only`) vì
 * nút điền mẫu chạy ngay trong trình chỉnh sửa.
 */

/**
 * Mọi block đều hiện, kể cả xác nhận tham dự: nội dung mẫu cũng là thứ nút điền
 * mẫu đổ vào form, và form bật sẵn mọi block.
 */
const allVisible = Object.fromEntries(
  INVITATION_BLOCKS.map((block) => [block, true]),
) as InvitationContent["visibility"];

type SamplePhotoSet = {
  /**
   * Cặp đôi giả gán cho mẫu này (`lib/data/sample-couples.ts`). Gán ở đây chứ
   * không phải một map riêng vì registry này đã exhaustive theo `TemplateSlug`:
   * thêm mẫu mới mà quên cặp đôi thì TypeScript báo ngay, còn hai map song song
   * thì lệch nhau lúc nào không biết.
   */
  couple: SampleCoupleKey;
  /** Ảnh ngang ưu tiên đứng trước để khớp slot `cover`, rồi mới tới ảnh dọc. */
  photos: readonly string[];
  /**
   * Ảnh riêng cho album mẫu khi album không nên lấy nguyên `photos` — ví dụ một
   * ảnh đã đứng ở photo slot và lặp lại trong album thì thừa. Các photo slot
   * vẫn gán từ `photos`.
   */
  albumPhotos?: readonly string[];
  /** Giới hạn riêng số ảnh xuất hiện trong album mẫu; các photo slot vẫn giữ đủ ảnh. */
  albumPhotoCount?: number;
  /** Nhạc riêng theo phong cách mẫu; không phụ thuộc cặp đôi điền thử. */
  trackId?: InvitationContent["music"]["trackId"];
  /**
   * Chỉ áp cho trang `demo` của kho mẫu, không đổ vào nút điền mẫu trong editor
   * hay iframe `xem-thu`: ở đó block xác nhận tham dự vẫn mặc định tắt như form.
   */
  /**
   * Mẫu dựng cho loại khác thiệp cưới: nội dung trưng bày phủ lên bản mẫu của
   * loại đó — trang demo, iframe `xem-thu` **và** nút "Điền dữ liệu mẫu" trong
   * editor đều ra đúng tấm thiệp mà mẫu được dựng từ đó. Ảnh trong nội dung
   * này là ảnh của chính mẫu (không phải ảnh stock), nên editor điền cả ảnh.
   */
  showcase?: (content: InvitationContent) => InvitationContent;
  demo?: {
    /** Dựng demo như một link mời riêng mang tên khách này. */
    guestName?: string;
    /** Bật block xác nhận tham dự (demo không gửi gì — không có `cardSlug`). */
    rsvp?: boolean;
  };
  defaults?: Partial<
    Pick<
      InvitationContent,
      | "visibility"
      | "wishes"
      | "dressCode"
      | "envelope"
      | "story"
      | "ceremonies"
    > & {
      timeline: SampleTimeline;
    }
  >;
};

/**
 * Ảnh mock lấy từ `templates/<slug>/photos/` của chính mẫu đó. Không đặt ảnh cưới mẫu vào
 * thư mục art direction của template (`images/templates/*`): template chỉ giữ
 * scenery, texture và ornament riêng của nó.
 *
 * Registry exhaustive theo `TemplateSlug`: thêm mẫu mới mà quên bộ
 * ảnh mock sẽ lỗi TypeScript ngay. Thứ tự ảnh đồng thời là thứ tự gán vào các
 * `photoSlots`, vì vậy ưu tiên ảnh ngang cho `cover` nếu concept có ảnh ngang.
 */
const samplePhotosBySlug: Partial<Record<TemplateSlug, SamplePhotoSet>> = {
  "burgundy-birthday": {
    // Bắt buộc theo kiểu nhưng không dùng: mẫu sinh nhật không có cặp đôi.
    couple: "tuan-anh-nhu-binh",
    photos: [],
    showcase: (content) => ({
      ...withKhaiHoBirthday(content),
      wishes: content.wishes,
    }),
    demo: { rsvp: true },
  },
};

/**
 * Bộ dùng khi slug không có trong registry — kho đang trống, hoặc thiệp cũ
 * mang slug của một mẫu đã gỡ và đang rơi về mẫu `classic`. Chỉ có chữ, không
 * có ảnh: không có thư mục ảnh mẫu nào để mượn.
 */
const fallbackSampleSet: SamplePhotoSet = {
  couple: "tuan-anh-nhu-binh",
  photos: [],
};

type SampleInvitationOptions = {
  /**
   * Có đổ ảnh mẫu vào ô ảnh và album hay không. Mặc định `true`.
   *
   * Trang demo và bản xem thử của kho mẫu cần ảnh — đó là thứ chúng đang khoe.
   * Nút "Điền dữ liệu mẫu" trong editor thì **không**: ảnh mẫu là ảnh cưới của
   * người mẫu trong ảnh stock, và một tấm thiệp thật gửi cho họ hàng mà mang
   * mặt người lạ là chuyện không sửa lại được sau khi link đã chia sẻ. Chữ thì
   * ngược lại — gõ đè lên là xong, nên điền sẵn chữ vẫn có ích.
   */
  includePhotos?: boolean;
  /** Loại thiệp — mặc định thiệp cưới, đúng như trước khi có loại. */
  kind?: InvitationKind;
  templateSlug: TemplateSlug;
  photoSlots: PhotoSlotKey[];
};

/**
 * Ảnh mẫu bám đúng hai loại ảnh của thiệp: ô ảnh đổ theo **mẫu** đang chọn, còn
 * album thì thiệp nào cũng có.
 */
/** Tuỳ chọn riêng của trang demo cho một mẫu — xem `SamplePhotoSet.demo`. */
export function sampleDemoOptions(
  templateSlug: TemplateSlug,
): NonNullable<SamplePhotoSet["demo"]> {
  const sampleSet: SamplePhotoSet =
    samplePhotosBySlug[templateSlug] ?? fallbackSampleSet;
  return sampleSet.demo ?? {};
}

/**
 * Mẫu có nội dung trưng bày riêng (`SamplePhotoSet.showcase`) — ảnh trong đó là
 * ảnh của chính mẫu, nên nút điền mẫu trong editor được điền cả ảnh.
 */
export function sampleHasOwnPhotos(templateSlug: TemplateSlug): boolean {
  return Boolean(samplePhotosBySlug[templateSlug]?.showcase);
}

export function sampleInvitationContent({
  templateSlug,
  photoSlots,
  includePhotos = true,
  kind = "wedding",
}: SampleInvitationOptions): InvitationContent {
  const sampleSet: SamplePhotoSet =
    samplePhotosBySlug[templateSlug] ?? fallbackSampleSet;
  if (kind !== "wedding") {
    const content = sampleKindContent(kind);
    return sampleSet.showcase ? sampleSet.showcase(content) : content;
  }
  const samplePhotos = sampleSet.photos;
  const couple = sampleCoupleByKey(sampleSet.couple);
  /*
   * Nhãn địa điểm là địa chỉ **hư cấu mang tên Keemori**, còn toạ độ là thật:
   * thiệp trình diễn cần đọc ra như một địa chỉ có thật, nhưng đặt tên một hàng
   * tiệc có thật vào đó thì hoá ra quảng cáo miễn phí cho họ. Toạ độ bắt buộc
   * phải có — thiếu nó `GoogleMapEmbed` rơi về tra theo chuỗi chữ, Google tự
   * chọn tâm khung và ghim rơi ra góc thay vì nằm giữa.
   */
  const place = {
    placeId: "",
    latitude: couple.latitude,
    longitude: couple.longitude,
  };
  const photos =
    includePhotos
      ? (sampleSet.albumPhotos ?? samplePhotos).slice(
          0,
          Math.min(
            sampleSet.albumPhotoCount ?? ALBUM_PHOTO_CAP,
            ALBUM_PHOTO_CAP,
          ),
        )
      : [];
  // `{}` chứ không phải map slot → chuỗi rỗng: đó là đúng hình dạng của
  // `emptyInvitationContent.photos`, và một ô mang chuỗi rỗng thì phần render
  // phải tự đoán "có ảnh hay không" thay vì đọc thẳng.
  const slotPhotos =
    includePhotos && samplePhotos.length > 0
    ? Object.fromEntries(
        photoSlots.map((slot, index) => [
          slot,
          samplePhotos[index % samplePhotos.length],
        ]),
      )
    : {};

  return {
    photos: slotPhotos,
    envelope: {
      greeting: "Trân trọng kính mời",
      invitation:
        "Chúng tôi rất hân hạnh được đón tiếp bạn trong ngày vui của gia đình.",
    },
    couple: {
      groomFullName: couple.groomFullName,
      brideFullName: couple.brideFullName,
      groomNickname: couple.groomNickname,
      brideNickname: couple.brideNickname,
      groomChildOrder: couple.groomChildOrder,
      brideChildOrder: couple.brideChildOrder,
    },
    families: {
      groomFather: couple.groomFather,
      groomMother: couple.groomMother,
      brideFather: couple.brideFather,
      brideMother: couple.brideMother,
      groomAddress: couple.groomAddress,
      brideAddress: couple.brideAddress,
    },
    ceremonies: [
      {
        kind: "engagement",
        customKind: "",
        dateTime: couple.engagementDateTime,
        venue: couple.venue,
        venuePlace: place,
        note: "Kính mời họ hàng thân thiết dự lễ ăn hỏi.",
      },
      {
        kind: "bride",
        customKind: "",
        dateTime: couple.brideCeremonyDateTime,
        venue: couple.venue,
        venuePlace: place,
        note: "Lễ vu quy tổ chức trong không gian ấm cúng của gia đình.",
      },
      {
        kind: "groom",
        customKind: "",
        dateTime: couple.groomCeremonyDateTime,
        venue: couple.venue,
        venuePlace: place,
        note: "Lễ thành hôn tổ chức trong không gian ấm cúng của gia đình.",
      },
    ],
    reception: {
      date: couple.weddingDate,
      welcomeTime: couple.welcomeTime,
      startTime: couple.startTime,
      venueAddress: couple.venue,
      venuePlace: place,
      mapUrl: couple.mapUrl,
    },
    dressCode: {
      title: "DRESS CODE",
      description:
        "Hãy cùng chúng mình khoác lên những sắc màu của ngày vui nhé!",
      colors: [...couple.dressCodeColors],
    },
    timeline: {
      title: "Lịch trình ngày cưới",
      items: [
        {
          startTime: "08:00",
          endTime: "09:00",
          activity: "Lễ gia tiên tại nhà gái",
          kind: "ancestral",
        },
        {
          startTime: "10:30",
          endTime: "11:30",
          activity: "Đón dâu về nhà trai",
          kind: "procession",
        },
        {
          startTime: "17:30",
          endTime: "18:30",
          activity: "Đón khách tại trung tâm tiệc cưới",
          kind: "welcome",
        },
        {
          startTime: "18:30",
          endTime: "20:30",
          activity: "Khai tiệc",
          kind: "reception",
        },
      ] satisfies SampleTimelineItem[],
      autoTranslate: true,
    },
    countdown: {
      weddingDate: couple.countdown,
      googleCalendar: true,
      appleCalendar: true,
    },
    story: {
      message: couple.story,
    },
    album: { photos },
    giftBox: {
      groom: {
        bankBin: "970436",
        accountNumber: "0123456789",
        accountName: couple.groomAccountName,
      },
      bride: {
        bankBin: "970407",
        accountNumber: "9876543210",
        accountName: couple.brideAccountName,
      },
    },
    // Trộn cả đã duyệt lẫn chờ duyệt: thẻ sổ lưu bút trong editor chỉ dùng được
    // khi có ít nhất một lời chúc đang chờ để bấm Duyệt. `createdAt` cố định để
    // preview server và client không lệch nhau.
    wishes: {
      items: [
        {
          id: "w1",
          name: "Bạn Hoàng",
          message: "Chúc 2 bạn mãi yêu nhau, đầu bạc răng long!",
          createdAt: "2026-11-04T13:44:27+07:00",
          approved: true,
        },
        {
          id: "w2",
          name: "Hoài Nam",
          message: "Chúc hai bạn luôn nắm tay nhau qua mọi chặng đường!",
          createdAt: "2026-11-04T13:43:31+07:00",
          approved: true,
        },
        {
          id: "w3",
          name: "Bạn Linh",
          message:
            "Mừng ngày trọng đại! Chúc hai bạn cười nhiều hơn cãi, yêu nhiều hơn giận nhen!",
          createdAt: "2026-11-04T13:42:43+07:00",
          approved: true,
        },
        {
          id: "w4",
          name: "Chị Huyền",
          message: "Chúc hai em trăm năm hạnh phúc, vợ chồng đồng lòng.",
          createdAt: "2026-11-04T13:42:15+07:00",
          approved: true,
        },
        {
          id: "w5",
          name: "Tuấn Anh",
          message:
            "Hôm đó tớ bay chuyến sớm nhất ra Hà Nội nhé. Chúc mừng hai đứa!",
          createdAt: "2026-11-05T09:10:02+07:00",
          approved: false,
        },
      ],
    },
    music: { trackId: sampleSet.trackId ?? couple.trackId },
    thankYou: {
      message:
        "Cảm ơn bạn đã đến và cùng chúng mình viết nên một phần thật đẹp trong ngày đặc biệt này.",
    },
    guestInvite: { ...DEFAULT_GUEST_INVITE },
    visibility: { ...allVisible },
    ...sampleSet.defaults,
  };
}

/**
 * Toạ độ thật, tên hư cấu mang tên Keemori — cùng luật với địa điểm của thiệp
 * cưới mẫu ở trên: đọc ra như một địa chỉ có thật mà không quảng cáo cho một
 * địa điểm có thật nào.
 */
const SAMPLE_PLACE = { placeId: "", latitude: 21.0285, longitude: 105.8542 };
const SAMPLE_MAP_URL = "https://www.google.com/maps?q=21.0285,105.8542";

/** Bài trung tính nhất của thư viện — thư viện nhạc hiện chỉ có nhạc cưới. */
const SAMPLE_NEUTRAL_TRACK = "ngay-dau-tien";

const sampleWish = (
  id: string,
  name: string,
  message: string,
  approved = true,
): InvitationContent["wishes"]["items"][number] => ({
  id,
  name,
  message,
  createdAt: "2026-11-04T13:44:27+07:00",
  approved,
});

/**
 * Nội dung mẫu cho các loại khác thiệp cưới. Dựng trên `emptyInvitationContentFor`
 * nên khối không thuộc loại vẫn tắt đúng như thiệp thật; không có ảnh mẫu — mẫu
 * dựng sẵn không có ô ảnh, và nút điền mẫu trong editor vốn không đổ ảnh.
 */
function sampleKindContent(
  kind: Exclude<InvitationKind, "wedding">,
): InvitationContent {
  const base = emptyInvitationContentFor(kind);
  const reception = (venue: string, date: string, start: string) => ({
    date,
    welcomeTime: "",
    startTime: start,
    venueAddress: venue,
    venueLabel: "",
    venuePlace: SAMPLE_PLACE,
    mapUrl: SAMPLE_MAP_URL,
  });
  const common = {
    music: { trackId: SAMPLE_NEUTRAL_TRACK },
  };

  switch (kind) {
    case "birthday":
      return {
        ...base,
        ...common,
        occasion: {
          ...base.occasion!,
          name: "Nguyễn Minh Anh",
          nickname: "Minh Anh",
          age: "Tròn 25 tuổi",
          organizer: "",
        },
        reception: reception(
          "Nhà hàng Keemori · Phố Tràng Tiền, Hoàn Kiếm, Hà Nội",
          "22/11/2026",
          "18:30",
        ),
        dressCode: {
          title: "Dresscode",
          description: "Tông pastel nhẹ nhàng cho buổi tối thật xinh nhé!",
          colors: ["#f2d4cf", "#f5e6c8", "#d9e4dd"],
        },
        timeline: {
          ...base.timeline,
          items: [
            { startTime: "18:30", endTime: "19:00", activity: "Đón khách", kind: "welcome" },
            { startTime: "19:00", endTime: "19:30", activity: "Thổi nến & cắt bánh", kind: "cake" },
            { startTime: "19:30", endTime: "21:00", activity: "Tiệc tối & giao lưu", kind: "reception" },
          ],
        },
        countdown: { ...base.countdown, weddingDate: "2026-11-22T18:30:00+07:00" },
        story: {
          message:
            "Một tuổi mới, thêm một năm để biết ơn những người bạn đã luôn ở bên. Đến chung vui cùng mình nhé!",
        },
        giftBox: {
          ...base.giftBox,
          groom: { bankBin: "970436", accountNumber: "0123456789", accountName: "NGUYEN MINH ANH" },
        },
        wishes: {
          items: [
            sampleWish("w1", "Bạn Hoàng", "Chúc mừng sinh nhật! Tuổi mới thật rực rỡ nhé!"),
            sampleWish("w2", "Chị Huyền", "Chúc em tuổi mới bình an, luôn vui và thật nhiều may mắn."),
            sampleWish("w3", "Tuấn Anh", "Hôm đó tớ mang bánh tới nhé!", false),
          ],
        },
        thankYou: { message: "Cảm ơn bạn đã đến và làm tuổi mới của mình thêm trọn vẹn." },
      };
    case "graduation":
      return {
        ...base,
        ...common,
        occasion: {
          ...base.occasion!,
          name: "Trần Bảo Ngọc",
          nickname: "Bảo Ngọc",
          school: "Đại học Keemori",
          major: "Thiết kế đồ hoạ",
          classOf: "Khoá 2022 – 2026",
        },
        reception: reception(
          "Hội trường Keemori · Đường Láng, Đống Đa, Hà Nội",
          "15/07/2026",
          "08:30",
        ),
        timeline: {
          ...base.timeline,
          items: [
            { startTime: "08:30", endTime: "09:30", activity: "Lễ trao bằng", kind: "ceremony" },
            { startTime: "09:30", endTime: "10:30", activity: "Chụp ảnh lưu niệm", kind: "photo" },
            { startTime: "11:00", endTime: "13:00", activity: "Tiệc mừng tốt nghiệp", kind: "reception" },
          ],
        },
        countdown: { ...base.countdown, weddingDate: "2026-07-15T08:30:00+07:00" },
        story: {
          message:
            "Bốn năm với những đêm chạy đồ án và những người bạn tuyệt vời. Mong bạn đến cùng mình khép lại hành trình này.",
        },
        giftBox: {
          ...base.giftBox,
          groom: { bankBin: "970407", accountNumber: "9876543210", accountName: "TRAN BAO NGOC" },
        },
        wishes: {
          items: [
            sampleWish("w1", "Cô Lan", "Chúc mừng em! Chặng đường mới thật nhiều thành công nhé."),
            sampleWish("w2", "Minh Khôi", "Tân cử nhân rồi, khao cả lớp đi!"),
          ],
        },
        thankYou: { message: "Cảm ơn bạn đã đồng hành cùng mình suốt những năm tháng ấy." },
      };
    case "event":
      return {
        ...base,
        ...common,
        occasion: {
          ...base.occasion!,
          name: "Đêm nhạc Mùa thu Keemori",
          organizer: "Câu lạc bộ Âm nhạc Keemori",
        },
        reception: reception(
          "Sân khấu Keemori · Phố Hàng Bài, Hoàn Kiếm, Hà Nội",
          "08/11/2026",
          "19:30",
        ),
        dressCode: {
          title: "Dresscode",
          description: "Smart casual, tông trầm ấm của mùa thu.",
          colors: ["#7a4a2e", "#c8a46e", "#2f3a2f"],
        },
        timeline: {
          ...base.timeline,
          items: [
            { startTime: "19:00", endTime: "19:30", activity: "Đón khách & check-in", kind: "welcome" },
            { startTime: "19:30", endTime: "21:00", activity: "Chương trình biểu diễn", kind: "music" },
            { startTime: "21:00", endTime: "21:30", activity: "Giao lưu & chụp ảnh", kind: "photo" },
          ],
        },
        countdown: { ...base.countdown, weddingDate: "2026-11-08T19:30:00+07:00" },
        story: {
          message:
            "Một buổi tối của những bản tình ca mùa thu, nơi những người yêu nhạc gặp nhau. Số ghế có hạn — hãy xác nhận sớm để chúng tôi giữ chỗ cho bạn.",
        },
        wishes: {
          items: [sampleWish("w1", "Thu Trang", "Mong chờ đêm nhạc lắm luôn!")],
        },
        thankYou: { message: "Cảm ơn bạn đã dành buổi tối này cho âm nhạc cùng chúng tôi." },
      };
    case "anniversary":
      return {
        ...base,
        ...common,
        occasion: {
          ...base.occasion!,
          name: "Minh Quân & Thu Hà",
          years: "10 năm ngày cưới",
        },
        reception: reception(
          "Nhà hàng Keemori · Phố Tràng Tiền, Hoàn Kiếm, Hà Nội",
          "20/12/2026",
          "18:00",
        ),
        dressCode: {
          title: "Dresscode",
          description: "Trắng và vàng champagne — như ngày đầu tiên.",
          colors: ["#f4efe6", "#d4b477"],
        },
        timeline: {
          ...base.timeline,
          items: [
            { startTime: "18:00", endTime: "18:30", activity: "Đón khách", kind: "welcome" },
            { startTime: "18:30", endTime: "19:00", activity: "Nâng ly kỷ niệm", kind: "toast" },
            { startTime: "19:00", endTime: "21:00", activity: "Tiệc tối", kind: "reception" },
          ],
        },
        countdown: { ...base.countdown, weddingDate: "2026-12-20T18:00:00+07:00" },
        story: {
          message:
            "Mười năm, hai đứa nhỏ và rất nhiều kỷ niệm. Chúng mình muốn cảm ơn những người đã cùng đi qua chặng đường ấy.",
        },
        giftBox: {
          ...base.giftBox,
          groom: { bankBin: "970436", accountNumber: "0123456789", accountName: "LE MINH QUAN" },
        },
        wishes: {
          items: [sampleWish("w1", "Gia đình chị Mai", "Chúc hai em mãi hạnh phúc như ngày đầu!")],
        },
        thankYou: { message: "Cảm ơn bạn đã là một phần trong câu chuyện của chúng mình." },
      };
    case "greeting":
      return {
        ...base,
        ...common,
        occasion: {
          ...base.occasion!,
          greetingOccasion: "opening",
          name: "Tiệm cà phê Keemori",
          sender: "Gia đình anh Tuấn",
          message:
            "Chúc mừng khai trương! Chúc tiệm luôn đông khách, buôn may bán đắt và vạn sự hanh thông.",
        },
        story: { message: "" },
        wishes: {
          items: [sampleWish("w1", "Bạn Hoàng", "Khai trương hồng phát nhé!")],
        },
        thankYou: { message: "" },
      };
  }
}

