/**
 * 15 block nội dung của một thiệp, đúng thứ tự của
 * `frontend/constants/invitation.ts` → `INVITATION_BLOCKS`. Mỗi block bật/tắt
 * được độc lập; danh sách này là khoá của `content.visibility`.
 *
 * Thêm một block là phải backfill `visibility` của mọi thiệp đã có bằng
 * migration: `IsBlockVisibility` đòi đủ khoá, thiếu một khoá là thiệp cũ không
 * lưu lại được từ editor.
 */
export const INVITATION_BLOCKS = [
  'envelope',
  'couple',
  'families',
  'ceremonies',
  'reception',
  'dressCode',
  'timeline',
  'countdown',
  'story',
  'album',
  'giftBox',
  'wishes',
  'rsvp',
  'music',
  'thankYou',
] as const;
export type InvitationBlock = (typeof INVITATION_BLOCKS)[number];

/**
 * Loại thiệp — chọn ở bước đầu tiên, trước khi vào form, và **không đổi được**
 * sau khi tạo: mỗi loại một bộ khối riêng, đổi loại giữa chừng là để lại nửa
 * nội dung không còn chỗ hiện. Bản sao có chủ đích của
 * `frontend/constants/invitation.ts`.
 *
 * Lưu trong `content.kind` chứ không phải một cột: mọi nơi dựng thiệp (trang
 * khách, xem thử, editor) đã nhận `content`, nên loại đi theo nội dung mà không
 * phải nối thêm trường nào vào từng payload. Thiệp tạo trước khi có loại không
 * mang khoá này — vắng khoá là `wedding`.
 */
export const INVITATION_KINDS = [
  'wedding',
  'birthday',
  'graduation',
  'event',
  'anniversary',
  'greeting',
] as const;
export type InvitationKind = (typeof INVITATION_KINDS)[number];
export const DEFAULT_INVITATION_KIND: InvitationKind = 'wedding';

/** Dịp con của thiệp chúc mừng — key dịch nằm ở `frontend/dictionaries/*.json`. */
export const GREETING_OCCASIONS = [
  'birthday',
  'opening',
  'housewarming',
  'newYear',
  'teachersDay',
  'other',
] as const;
export type GreetingOccasion = (typeof GREETING_OCCASIONS)[number];

/**
 * Khối hiện trong form của từng loại, theo thứ tự của `INVITATION_BLOCKS`. Khối
 * không có ở đây vẫn nằm trong `visibility` (hình dạng nội dung là một cho mọi
 * loại) nhưng luôn tắt — thiệp sinh nhật không bao giờ vẽ khối gia đình nhà
 * trai. Bản sao có chủ đích của `frontend/constants/invitation.ts`.
 */
export const KIND_BLOCKS: Record<InvitationKind, readonly InvitationBlock[]> = {
  wedding: INVITATION_BLOCKS,
  birthday: [
    'envelope',
    'reception',
    'dressCode',
    'timeline',
    'countdown',
    'story',
    'album',
    'giftBox',
    'wishes',
    'rsvp',
    'music',
    'thankYou',
  ],
  graduation: [
    'envelope',
    'reception',
    'timeline',
    'countdown',
    'story',
    'album',
    'giftBox',
    'wishes',
    'rsvp',
    'music',
    'thankYou',
  ],
  event: [
    'envelope',
    'reception',
    'dressCode',
    'timeline',
    'countdown',
    'story',
    'album',
    'wishes',
    'rsvp',
    'music',
    'thankYou',
  ],
  anniversary: [
    'envelope',
    'reception',
    'dressCode',
    'timeline',
    'countdown',
    'story',
    'album',
    'giftBox',
    'wishes',
    'rsvp',
    'music',
    'thankYou',
  ],
  greeting: ['envelope', 'story', 'album', 'wishes', 'music', 'thankYou'],
};

/**
 * Ô ảnh trong thiết kế của mẫu — loại ảnh thứ nhất trong hai loại của
 * `docs/business-model.md` mục 5. Số ô do **mẫu** quy định; album do **gói**.
 * Không gộp hai loại làm một.
 *
 * Key mang ngữ nghĩa của ô chứ không phải thứ tự, nhờ vậy đổi mẫu thì ảnh tự về
 * đúng chỗ và ảnh của ô mà mẫu mới không có vẫn được giữ lại.
 */
export const PHOTO_SLOT_KEYS = [
  'cover',
  'couple',
  'groom',
  'bride',
  'story',
  'closing',
] as const;
export type PhotoSlotKey = (typeof PHOTO_SLOT_KEYS)[number];

/**
 * Loại của một mốc lịch trình — quyết định ý nghĩa của biểu tượng, còn hình vẽ
 * do từng mẫu thiệp quyết định. Bản sao có chủ đích của
 * `frontend/lib/schemas/invitation/content.ts` → `TIMELINE_ACTIVITY_KINDS`.
 */
export const TIMELINE_ACTIVITY_KINDS = [
  'welcome',
  'ancestral',
  'procession',
  'ceremony',
  'reception',
  'toast',
  'cake',
  'photo',
  'music',
  'farewell',
] as const;
export type TimelineActivityKind = (typeof TIMELINE_ACTIVITY_KINDS)[number];

/** Nghi lễ — một thiệp hỗ trợ nhiều nghi lễ. `kind` là key dịch, không phải text. */
export const CEREMONY_KINDS = [
  'engagement',
  'bride',
  'groom',
  'other',
] as const;
export type CeremonyKind = (typeof CEREMONY_KINDS)[number];

/** Phong cách mẫu thiệp — key dịch nằm ở `frontend/dictionaries/*.json`. */
export const TEMPLATE_CATEGORIES = [
  'luxury',
  'modern',
  'classic',
  'minimal',
  'traditional',
  'formal',
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

/**
 * Nhóm màu chủ đạo của mẫu — key dịch nằm ở `frontend/dictionaries/*.json`.
 *
 * Mỗi nhóm là **một họ màu đơn sắc**: đỏ đô, đỏ son, đỏ tươi đều là `red`.
 * Chia nhỏ hơn thì cùng một tấm thiệp đỏ rơi vào ba ô lọc khác nhau tuỳ người
 * gán, và khách lọc "đỏ" bỏ sót hai phần ba số mẫu đỏ. `white` gồm cả kem/ngà.
 *
 * Một mẫu mang **1–2** màu: màu nền và màu concept. Mẫu đơn sắc chỉ có một.
 * Trần 2 là để dữ liệu không loang — cho gán năm màu thì mẫu nào cũng khớp mọi
 * bộ lọc. Bộ lọc kho mẫu ghép các màu đã chọn bằng **AND**.
 */
export const TEMPLATE_COLORS = [
  'red',
  'pink',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'brown',
  'black',
  'white',
] as const;
export type TemplateColor = (typeof TEMPLATE_COLORS)[number];
export const TEMPLATE_COLOR_MAX = 2;

/** Nhãn marketing trên card mẫu thiệp. */
export const TEMPLATE_TAGS = ['hot', 'new'] as const;
export type TemplateTag = (typeof TEMPLATE_TAGS)[number];

/**
 * Trạng thái thiệp.
 * - `draft`: chưa xuất bản, chưa có link công khai.
 * - `paid`: đã xuất bản — "thiệp custom đã kích hoạt": link vĩnh viễn, không
 *   trần lượt xem. Tên giữ nguyên vì là giá trị enum đã nằm trong database; bán
 *   một gói duy nhất, thanh toán ngoài hệ thống, nên không còn trạng thái nào
 *   khác ngoài nháp / đã xuất bản.
 */
export const CARD_STATUSES = ['draft', 'paid'] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

/**
 * Giá trị của enum Postgres `wedding_cards_status_enum`. Hai giá trị cũ `free`
 * và `unpaid` còn trong database (Postgres không xoá được giá trị enum) nhưng
 * không còn code nào ghi chúng; migration `CollapseCardPlans` đã chuyển mọi
 * hàng cũ sang `paid`.
 */
export const CARD_STATUS_DB_VALUES = [
  ...CARD_STATUSES,
  'free',
  'unpaid',
] as const;

/**
 * Một ô trưng bày trỏ tới thiệp nào.
 *
 * - `card`: một thiệp có thật trong `wedding_cards` → `/t/<slug>`.
 * - `template`: bản demo của một **mẫu** trong kho → `/mau-thiep/<slug>/demo`.
 *
 * Hai loại vì kho mẫu có 63 mẫu mà thiệp demo dựng sẵn chỉ có hơn chục: mẫu
 * nào cũng có sẵn một trang demo, nên bắt người vận hành chỉ được chọn trong
 * số thiệp đã dựng là tự giới hạn mình xuống một phần năm kho mẫu.
 *
 * Lưu `kind` thay vì suy từ slug: hai bảng khác nhau và **không có gì cấm một
 * mẫu trùng slug với một thiệp**, nên suy ngược sẽ có ngày trỏ nhầm chỗ mà
 * không báo lỗi nào.
 */
export const SHOWCASE_KINDS = ['card', 'template'] as const;
export type ShowcaseKind = (typeof SHOWCASE_KINDS)[number];
