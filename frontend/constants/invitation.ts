/**
 * Cấp thiết kế của **mẫu** thiệp (`WeddingTemplate.tier`). Không còn là gói của
 * thiệp: website chỉ bán một gói thiệp thiết kế riêng, mọi thiệp đều có đủ tính
 * năng, nên không có `planTier` ở frontend.
 */
export const TIERS = ["free", "gold", "diamond"] as const;
export type Tier = (typeof TIERS)[number];

/** Nhãn marketing trên card mẫu thiệp. */
export const TEMPLATE_TAGS = ["hot", "new"] as const;
export type TemplateTag = (typeof TEMPLATE_TAGS)[number];

/** Phong cách mẫu thiệp — key dịch nằm ở `dictionaries/*.json`. */
export const TEMPLATE_CATEGORIES = [
  "luxury",
  "modern",
  "classic",
  "minimal",
  "traditional",
  "formal",
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

/**
 * Nhóm màu chủ đạo của mẫu — bản sao có chủ đích của
 * `backend/src/common/enums/invitation.enum.ts`. Mỗi nhóm là một họ màu đơn
 * sắc (đỏ đô cũng là `red`), `white` gồm cả kem/ngà. Một mẫu mang 1–2 màu: màu
 * nền và màu concept; bộ lọc kho mẫu ghép các màu đã chọn bằng **AND**.
 */
export const TEMPLATE_COLORS = [
  "red",
  "pink",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "brown",
  "black",
  "white",
] as const;
export type TemplateColor = (typeof TEMPLATE_COLORS)[number];

/**
 * Ô màu trong bộ lọc kho mẫu. Đây là **dữ liệu** — nó vẽ màu của thiệp khách
 * chọn, không phải màu giao diện của app — nên mã hex nằm thẳng ở đây, cùng
 * lý do với `DRESS_CODE_SUGGESTED_COLORS`, và là ngoại lệ có phạm vi của luật
 * "7 màu thương hiệu" (`CLAUDE.md`, mục Design system). Mỗi mã là điểm giữa
 * của cả họ màu, không phải màu của một mẫu cụ thể.
 */
export const TEMPLATE_COLOR_SWATCHES = {
  red: "#b3261e",
  pink: "#e8a0b4",
  orange: "#e07a4f",
  yellow: "#d9b44a",
  green: "#5f8a5a",
  blue: "#3f6aa8",
  purple: "#8e6bb8",
  brown: "#7a5536",
  black: "#1c1c1c",
  white: "#f6f1e7",
} as const satisfies Record<TemplateColor, string>;

/**
 * Slug của mọi mẫu thiệp đang có. Đây là **khoá định danh duy nhất** của một
 * mẫu: nó là URL, là tên thư mục ảnh (`public/images/templates/<slug>/`), là
 * tên file spec (`docs/templates/<slug>.md`) và là khoá của mọi registry.
 *
 * Trước đây có thêm một mã concept A–L làm khoá nối tài liệu với code. Mã đó đã
 * bỏ: nó trần theo số mẫu, và từ khi ảnh mock dọn về `templates/<slug>/photos/`
 * thì nó chỉ còn là một lớp trung gian phải giữ đồng bộ bằng tay.
 *
 * Khai ở đây thay vì suy từ `lib/data/templates.ts` vì file đó là `server-only`;
 * danh sách này còn phải dùng được ở client và trong `satisfies Record<...>` để
 * TypeScript báo lỗi khi thêm mẫu mà quên khai bộ ảnh mẫu.
 */
// Thêm mẫu mới là thêm slug vào đây trước tiên.
export const TEMPLATE_SLUGS = ["burgundy-birthday"] as const;
/** Slug của mẫu trong kho, cộng mẫu dựng sẵn `DEFAULT_TEMPLATE_SLUG`. */
export type TemplateSlug =
  | (typeof TEMPLATE_SLUGS)[number]
  | typeof DEFAULT_TEMPLATE_SLUG;

/**
 * 15 block nội dung của một thiệp. Người dùng chỉ sửa nội dung, bố cục/font/
 * màu do template quyết định. Thứ tự ở đây cũng là thứ tự các thẻ trong trình
 * chỉnh sửa, nên nó bám theo thứ tự block hiện trên thiệp.
 *
 * Ô ảnh trong thiết kế (`PHOTO_SLOT_KEYS`) **không** nằm ở đây: nó không tắt
 * được — bố cục mẫu được dàn quanh những ô đó — nên nó không thoả định nghĩa
 * "block bật/tắt được" của `CLAUDE.md` mục 6.
 */
export const INVITATION_BLOCKS = [
  "envelope",
  "couple",
  "families",
  "ceremonies",
  "reception",
  "dressCode",
  "timeline",
  "countdown",
  "story",
  "album",
  "giftBox",
  "wishes",
  "rsvp",
  "music",
  "thankYou",
] as const;
export type InvitationBlock = (typeof INVITATION_BLOCKS)[number];

/**
 * Sổ lưu bút — block duy nhất mà **khách** ghi vào chứ không phải cặp đôi.
 * Vì vậy nó không đi theo luật "bật block rỗng thì ẩn" của các block khác: khi
 * bật, thiệp luôn vẽ ra ô nhập kể cả chưa có lời chúc nào.
 *
 * Mọi lời chúc gửi lên đều ở trạng thái **chờ duyệt**; chỉ lời chúc đã duyệt
 * mới hiện trên thiệp. Duyệt và xoá là quyền của chủ thiệp, và như mọi quyền
 * khác thì backend mới là nơi thực thi thật — UI chỉ phản ánh trạng thái.
 */
export const WISH_MAX_NAME_LENGTH = 60;
export const WISH_MAX_MESSAGE_LENGTH = 500;

/**
 * Xác nhận tham dự — thứ thứ hai khách ghi vào thiệp. Khác sổ lưu bút ở hai
 * điểm: không có gì hiện công khai (chỉ chủ thiệp đọc), và block này **mặc định
 * bật** như mọi block khác.
 *
 * Bản sao có chủ đích của `backend/src/common/constants/invitation.constants.ts`.
 * Tên rộng bằng `GUEST_NAME_MAX_LENGTH` vì link mời riêng điền sẵn tên khách.
 */
export const RSVP_NAME_MAX_LENGTH = 120;
export const RSVP_MAX_PARTY_SIZE = 20;

/**
 * Bảng màu gợi ý cho dress code — những tông hay gặp ở tiệc cưới Việt: đen,
 * trắng ngà, champagne, xanh rêu nhạt, xanh khói, hồng đất, nâu trầm. Đây là
 * dữ liệu của thiệp khách chọn, không phải màu thương hiệu của app, nên để mã
 * hex thẳng ở đây thay vì token trong `globals.css`.
 */
export const DRESS_CODE_SUGGESTED_COLORS = [
  "#1c1c1c",
  "#f5f2ec",
  "#e0c9a6",
  "#a8b8a0",
  "#a9bccf",
  "#e8b7b7",
  "#7a5c4b",
] as const;

/**
 * Trạng thái thiệp trong danh sách "Thiệp của tôi": `draft` (bản nháp) hoặc
 * `paid` — nghĩa là **đã xuất bản**, link vĩnh viễn, không còn khái niệm đã/chưa
 * thanh toán trong ứng dụng. Backend không còn ghi `free`/`unpaid`; client coi
 * mọi giá trị khác `draft` là đã xuất bản. Bản sao của `CARD_STATUSES` ở backend.
 */
export const INVITATION_STATUSES = ["paid", "draft"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/**
 * Ô ảnh trong thiết kế của mẫu — loại ảnh thứ nhất trong hai loại của
 * `docs/business-model.md` mục 5. Số ô, tỉ lệ và vị trí do **mẫu** quy định;
 * album thì do **gói** quy định. Không gộp hai loại làm một.
 *
 * Key mang ngữ nghĩa của ô ("ảnh bìa", "ảnh đôi") chứ không phải thứ tự. Nhờ
 * vậy đổi mẫu là ảnh tự về đúng chỗ ở mẫu mới, đúng ràng buộc "đổi mẫu giữ
 * nguyên nội dung" của mục 4.
 */
export const PHOTO_SLOT_KEYS = [
  "cover",
  "couple",
  "groom",
  "bride",
  "story",
  "closing",
] as const;
export type PhotoSlotKey = (typeof PHOTO_SLOT_KEYS)[number];

/**
 * Trần cứng của album. Thiệp là link vĩnh viễn nên chi phí lưu trữ cũng vĩnh
 * viễn — không hứa "không giới hạn", và ở đây phải có một con số thật. Giá trị
 * chính thức do backend cấu hình.
 */
export const ALBUM_PHOTO_CAP = 30;

/**
 * Thư viện nhạc nền của nền tảng. Người dùng chỉ chọn trong danh sách này,
 * không tự upload nhạc. Tên bài và tên ca sĩ là **dữ liệu**, không phải text
 * giao diện — không đưa vào `dictionaries/`, không dịch.
 *
 * `id` là khoá được ghi vào `content.music.trackId` của từng thiệp, nên nó
 * **không đổi được** sau khi phát hành: đổi là mọi thiệp đang trỏ tới bài đó
 * mất nhạc. Vì vậy `em-dong-y-i-do` và `le-duong` giữ nguyên khoá cũ dù các
 * bài thêm sau đặt tên theo quy ước slug của tên file.
 *
 * Tên file trong `public/music/` là **ASCII kebab-case**, không dấu và không
 * khoảng trắng: đây là URL công khai, mà tên file có dấu thì trình duyệt phải
 * percent-encode và mỗi tầng (Next, CDN, trình phát) lại encode một kiểu.
 *
 * `src` hiện trỏ tới file trong `public/music/` để chạy thử phần nghe thử;
 * khi module `invitation` phía backend sẵn sàng, URL này do backend trả về.
 */
export const MUSIC_TRACKS = [
  { id: "em-dong-y-i-do", title: "Em Đồng Ý (I Do)", artist: "Đức Phúc x 911" },
  { id: "le-duong", title: "Lễ Đường", artist: "Kai Đinh" },
  { id: "cuoi-thoi", title: "Cưới Thôi", artist: "Masew, Masiu, B Ray, TAP" },
  {
    id: "minh-cuoi-nhau-di",
    title: "Mình Cưới Nhau Đi",
    artist: "Huỳnh James, Pjnboys",
  },
  { id: "dam-cuoi-nha", title: "Đám Cưới Nha?", artist: "Hồng Thanh, Mie" },
  { id: "cau-hon", title: "Cầu Hôn", artist: "Văn Mai Hương" },
  { id: "ngay-chung-doi", title: "Ngày Chung Đôi", artist: "Văn Mai Hương" },
  {
    id: "50-nam-ve-sau",
    title: "50 Năm Về Sau",
    artist: "Dương Edward, Đặng Thanh Tuyền",
  },
  { id: "mot-nha", title: "Một Nhà", artist: "Da LAB" },
  { id: "mot-doi", title: "Một Đời", artist: "14 Casper, Bon Nghiêm" },
  {
    id: "mai-mai-ben-nhau",
    title: "Mãi Mãi Bên Nhau",
    artist: "Noo Phước Thịnh",
  },
  { id: "ngay-dau-tien", title: "Ngày Đầu Tiên", artist: "Đức Phúc" },
  { id: "anh-nang-cua-anh", title: "Ánh Nắng Của Anh", artist: "Đức Phúc" },
  { id: "noi-nay-co-anh", title: "Nơi Này Có Anh", artist: "Sơn Tùng M-TP" },
  { id: "la-anh-remix", title: "Là Anh (Remix)", artist: "Phạm Lịch" },
  {
    id: "theu-hoa-det-gam",
    title: "Thêu Hoa Dệt Gấm",
    artist: "buitruonglinh, HURRYKNG, JSOL, CONGB",
  },
  {
    id: "cam-on-nguoi-da-thuc-cung-toi",
    title: "Cảm Ơn Người Đã Thức Cùng Tôi",
    artist: "Phùng Khánh Linh",
  },
  {
    id: "beautiful-in-white",
    title: "Beautiful in White",
    artist: "Shane Filan",
  },
  { id: "perfect", title: "Perfect", artist: "Ed Sheeran" },
  { id: "thinking-out-loud", title: "Thinking Out Loud", artist: "Ed Sheeran" },
  {
    id: "a-thousand-years",
    title: "A Thousand Years",
    artist: "Christina Perri",
  },
  { id: "all-of-me", title: "All of Me", artist: "John Legend" },
  { id: "marry-you", title: "Marry You", artist: "Bruno Mars" },
  { id: "my-love", title: "My Love", artist: "Westlife" },
  { id: "i-do", title: "I Do", artist: "911" },
  {
    id: "you-are-the-reason",
    title: "You Are the Reason",
    artist: "Calum Scott",
  },
  {
    id: "young-and-beautiful",
    title: "Young and Beautiful",
    artist: "Lana Del Rey",
  },
  {
    id: "until-i-found-you",
    title: "Until I Found You (Em Beihold Version)",
    artist: "Stephen Sanchez, Em Beihold",
  },
  {
    id: "cant-help-falling-in-love",
    title: "Can't Help Falling in Love",
    artist: "Elvis Presley",
  },
  {
    id: "how-deep-is-your-love",
    title: "How Deep Is Your Love",
    artist: "Richard Clayderman",
  },
].map((track) => ({ ...track, src: `/music/${track.id}.mp3` }));

export type MusicTrack = (typeof MUSIC_TRACKS)[number];

/**
 * Chuẩn hoá chuỗi để so khớp khi tìm bài: bỏ dấu tiếng Việt và hạ chữ thường.
 * Gõ "cuoi thoi" phải ra "Cưới Thôi" — người dùng tìm nhạc thường gõ không dấu,
 * và `toLowerCase()` trần thì "Cưới" với "cuoi" là hai chuỗi khác nhau.
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

/**
 * Mã nhận diện người xem thiệp, để số người xem đếm theo **người** chứ không
 * theo số lần tải trang.
 *
 * `proxy.ts` phát mã vào cookie ở lần đầu vào `/{locale}/t/...` và chuyển tiếp
 * nó xuống Server Component bằng header cùng tên — request tới backend đi từ
 * server Next chứ không từ trình duyệt, nên cookie của khách không tự tới đó
 * được. Cookie là `httpOnly`: không có đoạn JS nào cần đọc nó, mà mở ra cho
 * client đọc thì nó thành một thứ để script bên thứ ba lấy dấu người dùng.
 */
export const VISITOR_COOKIE = "tco_visitor";
export const VISITOR_HEADER = "x-visitor-id";
/** Cookie sống một năm: mùa cưới kéo dài, và đây chỉ là một chuỗi ngẫu nhiên. */
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Đường dẫn công khai của thiệp (`/t/<slug>`). Bản sao có chủ đích của
 * `backend/src/common/constants/invitation.constants.ts` — backend mới là nơi
 * chốt thật, đây chỉ để báo lỗi sớm ngay trong ô nhập.
 */
export const CARD_SLUG_MAX_LENGTH = 60;
export const CARD_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Link mời riêng cho từng khách: `/t/<slug>?khach=<mã>` mở thiệp với lời chào
 * "Kính mời: <tên>" trên màn mở đầu. Bản sao có chủ đích của
 * `backend/src/common/constants/invitation.constants.ts` — backend chốt thật.
 *
 * Query chứ không phải một đoạn đường dẫn: đường dẫn `/t/<slug>` giữ nguyên
 * nghĩa "tấm thiệp này", nên chuyển hướng từ slug cũ, trang 404 và cookie người
 * xem của `proxy.ts` đều chạy đúng cho link khách mời mà không phải biết gì.
 */
export const GUEST_QUERY_PARAM = "khach";
export const GUEST_LIST_MAX_GUESTS = 500;
export const GUEST_NAME_MAX_LENGTH = 120;
/**
 * Mặc định bật — danh sách rỗng thì không sinh link riêng nào, link chung vẫn
 * chạy như cũ. Bản sao của `createEmptyContent` ở backend.
 */
export const DEFAULT_GUEST_INVITE = { enabled: true, guestList: "" };

/**
 * Thiệp mẫu công khai dùng cho CTA "xem thiệp thật" ở homepage.
 *
 * Đây là **ô đầu tiên của dải "Cặp đôi đã tạo thiệp"**, không phải một thiệp
 * dựng riêng: `backend/src/seeders/data/showcase-cards.seed.ts` đã nạp nó
 * (`paid`, chủ là admin) nên nó thoả sẵn mọi điều kiện của một link đặt trên
 * trang chủ. Trước đây có một thiệp mẫu thứ hai chỉ để phục vụ hero, và cái giá
 * của nó là hai bộ nội dung phải sửa song song mỗi lần đổi mẫu.
 *
 * Đổi slug ở đây thì phải đổi kèm slug tương ứng trong `showcase-cards.seed.ts`
 * — hero đọc lời mời và địa điểm từ chính thiệp này.
 *
 * Từ khi có `siteSettings.demoCardSlug` (CMS, màn `/cai-dat`) thì đây là
 * **giá trị dự phòng**, không còn là lựa chọn duy nhất: chưa ai chọn trong CMS
 * thì hero dùng slug này. Giữ lại chứ không bỏ, vì nút "Xem thiệp mẫu" không
 * được phép biến mất chỉ vì một hàng cấu hình còn trống.
 */
export const DEMO_INVITATION_SLUG = "tuan-anh-nhu-binh";

/**
 * Loại thiệp — thứ quyết định **form** (khối nào hiện, trường nào bắt buộc) và
 * cách mẫu mặc định dựng thiệp. Bản sao có chủ đích của
 * `backend/src/common/enums/invitation.enum.ts`.
 *
 * Loại nằm trong `content.kind` và bất biến sau khi tạo (backend trả 400 nếu
 * đổi): thiệp cưới đổi thành thiệp sinh nhật là mất nghĩa của nửa nội dung.
 * Thiệp lưu trước khi có loại thiếu khoá này — vắng khoá nghĩa là thiệp cưới.
 */
export const INVITATION_KINDS = [
  "wedding",
  "birthday",
  "graduation",
  "event",
  "anniversary",
  "greeting",
] as const;
export type InvitationKind = (typeof INVITATION_KINDS)[number];
export const DEFAULT_INVITATION_KIND: InvitationKind = "wedding";

export function isInvitationKind(value: unknown): value is InvitationKind {
  return (
    typeof value === "string" &&
    (INVITATION_KINDS as readonly string[]).includes(value)
  );
}

/** Loại của một nội dung đã lưu — thiệp cũ không có khoá `kind` là thiệp cưới. */
export function invitationKindOf(content: {
  kind?: InvitationKind;
}): InvitationKind {
  return content.kind ?? DEFAULT_INVITATION_KIND;
}

/**
 * Slug của loại trên URL (`/editor/mac-dinh?loai=sinh-nhat`). Chỉ frontend dùng:
 * backend và `content.kind` luôn mang khoá tiếng Anh.
 */
export const INVITATION_KIND_SLUGS: Record<InvitationKind, string> = {
  wedding: "cuoi",
  birthday: "sinh-nhat",
  graduation: "tot-nghiep",
  event: "su-kien",
  anniversary: "ky-niem",
  greeting: "chuc-mung",
};
export const INVITATION_KIND_QUERY_PARAM = "loai";

export function invitationKindFromSlug(
  slug: string | undefined,
): InvitationKind | null {
  const match = INVITATION_KINDS.find(
    (kind) => INVITATION_KIND_SLUGS[kind] === slug,
  );
  return match ?? null;
}

/** Dịp con của thiệp chúc mừng. Bản sao của backend. */
export const GREETING_OCCASIONS = [
  "birthday",
  "opening",
  "housewarming",
  "newYear",
  "teachersDay",
  "other",
] as const;
export type GreetingOccasion = (typeof GREETING_OCCASIONS)[number];

/**
 * Khối editor hiện theo từng loại, đúng thứ tự `INVITATION_BLOCKS`. Khối không
 * thuộc loại vẫn nằm trong `content` (để `visibility` đủ khoá) nhưng tắt sẵn và
 * không có thẻ trong editor; mẫu mặc định không vẽ chúng.
 */
export const KIND_EDITOR_BLOCKS: Record<
  InvitationKind,
  readonly InvitationBlock[]
> = {
  wedding: INVITATION_BLOCKS,
  birthday: [
    "envelope",
    "reception",
    "dressCode",
    "timeline",
    "countdown",
    "story",
    "album",
    "giftBox",
    "wishes",
    "rsvp",
    "music",
    "thankYou",
  ],
  graduation: [
    "envelope",
    "reception",
    "timeline",
    "countdown",
    "story",
    "album",
    "giftBox",
    "wishes",
    "rsvp",
    "music",
    "thankYou",
  ],
  event: [
    "envelope",
    "reception",
    "dressCode",
    "timeline",
    "countdown",
    "story",
    "album",
    "wishes",
    "rsvp",
    "music",
    "thankYou",
  ],
  anniversary: [
    "envelope",
    "reception",
    "dressCode",
    "timeline",
    "countdown",
    "story",
    "album",
    "giftBox",
    "wishes",
    "rsvp",
    "music",
    "thankYou",
  ],
  greeting: ["envelope", "story", "album", "wishes", "music", "thankYou"],
};

/** Trường của khối "Thông tin chính" (`content.occasion`). */
export const OCCASION_FIELDS = [
  "name",
  "nickname",
  "age",
  "school",
  "major",
  "classOf",
  "organizer",
  "years",
  "sender",
  "greetingOccasion",
  "message",
] as const;
export type OccasionField = (typeof OCCASION_FIELDS)[number];

/** Trần độ dài từng trường — bản sao của `OccasionDto` ở backend. */
export const OCCASION_FIELD_MAX_LENGTH: Record<
  Exclude<OccasionField, "greetingOccasion">,
  number
> = {
  name: 120,
  nickname: 120,
  age: 60,
  school: 160,
  major: 160,
  classOf: 60,
  organizer: 160,
  years: 60,
  sender: 120,
  message: 1000,
};

/**
 * Trường của khối "Thông tin chính" theo loại. Thiệp cưới không có khối này —
 * thông tin chính của nó là khối Cô dâu & chú rể. `name` luôn bắt buộc.
 */
export const KIND_OCCASION_FIELDS: Record<
  Exclude<InvitationKind, "wedding">,
  readonly OccasionField[]
> = {
  birthday: ["name", "nickname", "age", "organizer"],
  graduation: ["name", "nickname", "school", "major", "classOf"],
  event: ["name", "organizer"],
  anniversary: ["name", "years"],
  greeting: ["greetingOccasion", "name", "sender", "message"],
};

/** Link mời riêng từng khách: thiệp chúc mừng gửi một người nên không có. */
export function kindHasGuestInvite(kind: InvitationKind) {
  return kind !== "greeting";
}

/** Mẫu dựng sẵn cho mọi loại khi kho chưa có mẫu riêng — không nằm trong catalog. */
export const DEFAULT_TEMPLATE_SLUG = "mac-dinh";
