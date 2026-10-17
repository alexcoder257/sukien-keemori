/**
 * Trần cứng của album. Thiệp là link vĩnh viễn nên chi phí lưu trữ cũng vĩnh
 * viễn — album không phải "không giới hạn" (`docs/business-model.md` mục 5).
 * Giá trị này là bản chính thức; frontend giữ một bản để phản hồi sớm.
 */
export const ALBUM_PHOTO_CAP = 30;

/**
 * Sau ngần này ngày kể từ lần xuất bản đầu tiên (`paid_at`), tên cô dâu chú rể trên thiệp
 * không sửa được nữa (Điều khoản sử dụng mục 3).
 *
 * Thiệp đã xuất bản là link vĩnh viễn, không trần lượt xem — không khoá tên thì
 * một lần mua dùng được cho mọi đám cưới về sau, chỉ việc gõ tên cặp khác vào.
 * Khoá **tên** chứ không khoá cả thiệp: đổi ngày, địa điểm, ảnh là nhu cầu thật
 * của chính cặp đôi, còn tấm thiệp mang tên người khác thì không ai dùng lại.
 *
 * Hằng số chứ không phải `site_settings`: con số này nằm trong văn bản pháp lý
 * có phiên bản, nên nó không được đổi bằng một cú bấm Lưu trong CMS. Bản sao ở
 * `dashboard/constants/card.ts` (hiện ngày tự khoá). Trang khách cố ý không có
 * bản sao: luật chỉ được công bố trong Điều khoản, editor không hiện gì — người
 * lưu sai tên sau mốc nhận lỗi 403 kèm câu `COUPLE_NAMES_LOCKED`.
 */
export const COUPLE_NAMES_LOCK_DAYS = 15;

/**
 * Mẫu dựng sẵn cho mọi loại thiệp, dùng khi kho chưa có mẫu riêng cho loại đó.
 * Không có hàng trong `templates`: nó không bán, không hiện ở kho mẫu và không
 * "tim" được — chỉ là bản dựng mặc định của thiệp (`CatalogService.findCardTemplate`).
 * Bản sao ở `frontend/constants/invitation.ts`.
 */
export const DEFAULT_TEMPLATE_SLUG = 'mac-dinh';

/** Trần độ dài từng ô của `content.occasion` — khớp schema phía frontend. */
export const OCCASION_FIELD_MAX = {
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
} as const;

/**
 * Mã người xem trong cookie (`card_views.visitor_id`). Frontend phát bằng
 * `crypto.randomUUID()` nên 36 ký tự là đủ; trần rộng hơn một chút để đổi cách
 * sinh mã mà không phải chạy migration, nhưng vẫn đủ chặt để một header bịa ra
 * không nhét được rác vào bảng.
 */
export const VISITOR_ID_MAX_LENGTH = 64;

/** Sổ lưu bút — giới hạn độ dài, khớp `wishFormSchema` phía frontend. */
export const WISH_MAX_NAME_LENGTH = 60;
export const WISH_MAX_MESSAGE_LENGTH = 500;

/**
 * Xác nhận tham dự — khớp `rsvpFormSchema` phía frontend.
 *
 * Tên rộng bằng `GUEST_NAME_MAX_LENGTH`: khách vào bằng link mời riêng được điền
 * sẵn đúng cách xưng hô cặp đôi gõ ("Anh Chị Cường Thu"), nên trần hẹp hơn là
 * chính tên do cặp đôi đặt trượt validate. Trần số người là chốt chặn chống số
 * bịa, không phải chính sách: một phản hồi thật là một gia đình, không phải cả
 * họ hàng.
 */
export const RSVP_NAME_MAX_LENGTH = 120;
export const RSVP_MAX_PARTY_SIZE = 20;

/** Số tông màu tối đa của bảng màu trang phục. */
export const DRESS_CODE_MAX_COLORS = 6;

/** Chỉ nhận mã hex 3 hoặc 6 ký tự; người dùng thường dán từ Figma/Canva. */
export const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Tài khoản nhận mừng cưới. Cả hai mẫu đều **cho phép rỗng** vì khối này bật/tắt
 * được và người dùng có thể mới nhập một nửa.
 *
 * `BANK_BIN_PATTERN` là BIN 6 số của NAPAS — khoá định danh ngân hàng trong
 * payload VietQR. Backend chỉ kiểm định dạng; bảng ngân hàng đầy đủ nằm ở
 * `frontend/constants/banks.ts`.
 */
export const BANK_BIN_PATTERN = /^(?:\d{6})?$/;

/**
 * Số tài khoản: chữ và số, không dấu, không khoảng trắng. Vài ngân hàng cấp số
 * tài khoản có chữ cái. Ký tự nhiều byte bị chặn ở đây vì độ dài trường EMV
 * trong payload VietQR đếm theo ký tự, lệch byte là app ngân hàng đọc hỏng mã.
 */
export const BANK_ACCOUNT_PATTERN = /^[0-9A-Za-z]*$/;
export const BANK_ACCOUNT_MAX_LENGTH = 30;

/** Tên chủ tài khoản chỉ để khách đối chiếu; không nằm trong payload QR. */
export const BANK_ACCOUNT_NAME_MAX_LENGTH = 60;

/** Slug thiệp trong URL công khai `/t/<slug>`. */
export const CARD_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CARD_SLUG_MAX_LENGTH = 60;

/**
 * Link mời riêng cho từng khách (`content.guestInvite`, bảng `card_guests`).
 * Bản sao có chủ đích ở `frontend/constants/invitation.ts`.
 *
 * Trần số khách là chốt chặn, không phải chính sách gói: mỗi dòng là một hàng
 * trong database và một lần so khớp lúc lưu, còn một đám cưới đông nhất cũng
 * hiếm khi gửi tới 500 tấm thiệp riêng — gia đình thường mời chung cả nhà.
 */
export const GUEST_LIST_MAX_GUESTS = 500;
export const GUEST_NAME_MAX_LENGTH = 120;
/** Trần độ dài của cả ô nhập — đủ cho trần số khách, mỗi tên kèm dấu xuống dòng. */
export const GUEST_LIST_MAX_LENGTH =
  GUEST_LIST_MAX_GUESTS * (GUEST_NAME_MAX_LENGTH + 1);
/** Mã trong link khách mời. Sinh ra 8 ký tự; cột chừa rộng để đổi cách sinh. */
export const GUEST_TOKEN_MAX_LENGTH = 16;
