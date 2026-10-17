import { CONTACT } from "@/constants/contact";
import type { Locale } from "@/i18n/config";

/**
 * Nguồn duy nhất của mọi thứ **không phải câu chữ** trong khu pháp lý: danh
 * tính doanh nghiệp, đầu mối liên hệ, phiên bản và ngày hiệu lực của từng văn
 * bản, và đường dẫn của sáu trang.
 *
 * Câu chữ nằm ở `dictionaries/vi.json` và `en.json` như mọi text khác. Tách hai
 * thứ vì chúng đổi theo nhịp khác nhau: mã số thuế đổi một lần trong đời sản
 * phẩm, còn chữ trong Điều khoản đổi mỗi lần sản phẩm đổi — và số thì không
 * được phép có hai bản dịch lệch nhau.
 */

/**
 * Thông tin pháp nhân.
 *
 * `null` nghĩa là **chưa có**, không phải "để trống cho đẹp": mọi chỗ hiển thị
 * đều bỏ qua trường `null` thay vì in ra chuỗi rỗng hay một giá trị mẫu. Điền
 * số giả vào đây là in một mã số thuế không có thật lên trang pháp lý của
 * chính mình — sai nghiêm trọng hơn hẳn việc thiếu thông tin.
 *
 * Chủ thể kinh doanh là một **hộ kinh doanh**, không phải công ty — nên trang
 * Thông tin doanh nghiệp gọi `legalRepresentative` là "chủ hộ kinh doanh". Tên
 * hộ khớp tên chủ tài khoản nhận tiền (`SEPAY_ACCOUNT_NAME` ở backend, bản
 * không dấu); tài khoản đó không đứng tên hộ thì không mở được.
 *
 * TODO: BUSINESS INFORMATION REQUIRED — xem `docs/legal-decisions.md`.
 */
export const LEGAL_ENTITY = {
  /** Tên hộ kinh doanh đầy đủ trên giấy chứng nhận đăng ký. */
  companyName: "HỘ KINH DOANH KEEMORI" as string | null,
  /** Tên thương mại đang dùng với khách. */
  businessName: "Keemori",
  /** Mã số hộ kinh doanh — đồng thời là mã số thuế. */
  taxCode: "026097004248" as string | null,
  /** Ngày đăng ký lần đầu, dạng ISO. */
  registeredAt: "2026-10-09" as string | null,
  /** Cơ quan cấp giấy chứng nhận đăng ký hộ kinh doanh. */
  registrationAuthority:
    "Phòng Kinh tế, Hạ tầng và Đô thị, UBND phường Phú Lương, Hà Nội" as
      | string
      | null,
  /** Địa chỉ trụ sở đăng ký. */
  registeredAddress:
    "Số 18, ngõ 20, đường Thanh Lãm, TDP Thanh Lãm 1, phường Phú Lương, Hà Nội, Việt Nam" as
      | string
      | null,
  /**
   * Chủ hộ kinh doanh. Cố ý để `null`: Bộ Công Thương không đòi in tên chủ hộ
   * trên website, và đây là tên một cá nhân — tên hộ, mã số và địa chỉ đã đủ
   * định danh chủ thể kinh doanh.
   */
  legalRepresentative: null as string | null,
  /**
   * Trang hồ sơ của website trên online.gov.vn sau khi đã thông báo với Bộ
   * Công Thương. Chưa thông báo thì để `null` — huy hiệu "Đã thông báo" mà
   * không có hồ sơ thật đứng sau là một lời khai sai trên trang pháp lý.
   */
  moitNotificationUrl: null as string | null,
} as const;

/**
 * Trang Thông tin doanh nghiệp. Không nằm trong `LEGAL_DOCUMENTS` vì nó là
 * **bản công bố**, không phải văn bản người dùng chấp thuận: không có phiên bản,
 * không có hàng nào trong `legal_acceptances`, không gửi lên backend.
 *
 * `updatedAt` tăng tay mỗi lần sửa nội dung hoặc `LEGAL_ENTITY` — sitemap dùng
 * nó làm `lastmod`.
 */
export const BUSINESS_INFO_PAGE = {
  path: "/thong-tin-doanh-nghiep",
  updatedAt: "2026-10-17",
} as const;

/**
 * Đầu mối liên hệ cho từng loại yêu cầu.
 *
 * Đang trỏ chung vào bộ địa chỉ ở `constants/contact.ts` — đó là **chủ đích cho
 * giai đoạn hiện tại**: một hộp thư có người đọc tốt hơn bốn hộp thư không ai
 * mở. Tách ra thành bốn hằng số riêng ngay từ đầu để ngày tách thật chỉ phải
 * sửa file này, không phải rà lại sáu trang.
 *
 * Email hỗ trợ đã được chốt. Messenger là cấu hình vận hành trong
 * `site_settings`, nên trang pháp lý đọc nó cùng nguồn với trang Liên hệ thay
 * vì sao chép URL vào hằng số này.
 */
export const LEGAL_CONTACT = {
  supportEmail: CONTACT.supportEmail,
  /** Yêu cầu liên quan tới dữ liệu cá nhân (truy cập, sửa, xoá). */
  privacyEmail: CONTACT.supportEmail,
  /** Khiếu nại và tranh chấp. */
  complaintEmail: CONTACT.supportEmail,
} as const;

/**
 * Bốn văn bản pháp lý. Khoá khớp `LEGAL_DOCUMENT_TYPES` của backend.
 *
 * Từng có năm: trang Khiếu nại đã được gộp vào Điều khoản sử dụng (mục "Khiếu
 * nại và giải quyết tranh chấp"). Nó là trang mỏng nhất và hai phần ba nội
 * dung chỉ trỏ sang `/lien-he`; phần còn lại — thông tin cần cung cấp và đường
 * khiếu nại lên cơ quan có thẩm quyền — vừa đúng một mục trong Điều khoản.
 * Luật không đòi cơ chế khiếu nại phải là một URL riêng, chỉ đòi nó được công
 * bố. Giá trị `complaints` **vẫn nằm trong enum backend**: Postgres không xoá
 * được giá trị enum, và giữ lại thì vô hại vì chưa có hàng nào dùng.
 */
export const LEGAL_DOCUMENT_KEYS = [
  "terms",
  "privacy",
  "paymentRefund",
] as const;
export type LegalDocumentKey = (typeof LEGAL_DOCUMENT_KEYS)[number];

/**
 * Khoá dùng ở frontend là camelCase (khớp khoá dictionary), khoá gửi lên backend
 * là snake_case (khớp enum Postgres). Bảng này là chỗ **duy nhất** dịch giữa
 * hai bên — đừng viết chuỗi `payment_refund` ở nơi nào khác.
 */
export const LEGAL_DOCUMENT_API_TYPE: Record<LegalDocumentKey, string> = {
  terms: "terms",
  privacy: "privacy",
  paymentRefund: "payment_refund",
};

type LegalDocumentMeta = {
  /** Tăng **minor** khi sửa câu chữ, **major** khi đổi nghĩa vụ của các bên. */
  version: string;
  /** Ngày văn bản bắt đầu có hiệu lực, dạng ISO. */
  effectiveDate: string;
  /** Ngày sửa gần nhất, dạng ISO. Bằng `effectiveDate` ở bản đầu. */
  updatedAt: string;
  /** Đường dẫn không kèm locale. */
  path: string;
};

/**
 * Phiên bản đang hiệu lực.
 *
 * **Bản sao có chủ đích** của `backend/src/constant/legal-documents.ts` — sửa
 * một bên thì phải sửa nốt bên kia, giống `apis/http.ts` và `constants/role.ts`
 * (xem `CLAUDE.md`). Backend chỉ đọc con số này cho đúng một trường hợp: đăng
 * nhập bằng Google/Facebook, nơi không có form nào để gửi phiên bản lên.
 *
 * Đổi `version` là một hành động có hệ quả: sổ `legal_acceptances` sẽ ghi rằng
 * người dùng cũ chưa chấp thuận bản mới. Sửa lỗi chính tả thì **đừng** tăng.
 *
 * Terms và Privacy ở `2.0` chứ không phải `1.0`: bản `1.0` đã chạy trên
 * production với nội dung khác (không có sổ lưu bút và có
 * một điều khoản hoàn tiền chưa từng được business chốt). Giữ nguyên số cũ là
 * làm sổ chấp thuận nói dối.
 */
export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocumentMeta> = {
  terms: {
    // 3.0: thiệp chưa thanh toán không chỉ ngừng truy cập được mà còn bị **xoá
    // vĩnh viễn** 5 ngày sau khi chủ thiệp được báo link hết hiệu lực (mục 3).
    // Major chứ không phải minor: trước bản này, hết hạn chỉ mất đường vào —
    // giờ nó mất luôn dữ liệu, và đó là một hệ quả mới cho người dùng chứ
    // không phải một câu chữ chuyển chỗ.
    // 3.1: công bố hai kênh liên hệ thật và bỏ hotline mẫu.
    // 3.2: mục 12 chốt thời hạn trả lời khiếu nại (tối đa 3 ngày làm việc).
    // Minor: đây là cam kết mới **của chúng tôi**, không thêm nghĩa vụ hay hệ
    // quả nào cho người dùng — khác với 3.0, nơi thiệp bắt đầu bị xoá thật.
    // 4.0: mục 3 khoá tên cô dâu chú rể 15 ngày sau khi thanh toán, chỉ mở lại
    // qua hỗ trợ. Major: trước bản này thiệp đã trả tiền sửa được mọi thứ —
    // đây là một giới hạn mới đặt lên người dùng.
    // 5.0: mục 3 đổi luật gói Free — link vĩnh viễn, không trần người xem,
    // nhưng không còn xác nhận tham dự và link mời riêng; "3 ngày / 15 người
    // xem" chỉ còn là bản dùng thử của Gold/Diamond chưa thanh toán. Major:
    // gói Free **mất** hai tính năng người dùng đang có.
    // 6.0: mục 3 rút thời gian giữ thiệp chưa thanh toán sau khi hết hạn từ 5
    // ngày xuống 1 ngày, và nói rõ thông báo hết hạn đi qua cả email. Major:
    // người dùng mất 4 ngày để cứu dữ liệu trước khi bị xoá vĩnh viễn.
    // 7.0: viết lại cho dịch vụ thiết kế **thiệp mời sự kiện theo yêu cầu**
    // (thiệp custom): không còn gói Free/Gold/Diamond, không dùng thử, trả
    // 100% trước khi thiết kế, Keemori tạo tài khoản rồi gửi khách duyệt, khách
    // chỉ tự sửa phần chữ. Mục khoá tên chuyển sang mục 6. Major: đổi toàn bộ
    // đối tượng của hợp đồng.
    version: "7.0",
    effectiveDate: "2026-10-17",
    updatedAt: "2026-10-17",
    path: "/dieu-khoan",
  },
  privacy: {
    // 3.0: lần đầu tiên hệ thống **xoá dữ liệu người dùng theo thời hạn** —
    // thiệp chưa thanh toán và toàn bộ ảnh của nó bị xoá vĩnh viễn 5 ngày sau
    // thông báo hết hạn (mục 13). Bản 2.x nói thẳng rằng "không có cơ chế xoá
    // tự động theo thời hạn"; giữ nguyên số cũ là để một câu đã thành sai đứng
    // dưới một phiên bản người dùng đã chấp thuận.
    // 3.1: công bố hai kênh liên hệ thật.
    // 3.2: mục 13 chốt nốt bốn loại còn lại — tài khoản và thiệp đã thanh toán
    // không bị xoá vì không hoạt động, nhật ký thao tác 24 tháng, bản sao lưu
    // 30 ngày. Minor: ba câu đầu chỉ nói rõ hành vi vốn đã đúng, và câu về sao
    // lưu là **thêm** một giới hạn chứ không lấy đi quyền nào của người dùng.
    // 3.3: mục 13 — thiệp gói Free không còn hết hạn nên không bị xoá tự động.
    // Minor: chỉ thu hẹp phạm vi xoá, không thêm hệ quả nào cho người dùng.
    // 4.0: mục 13 — thiệp chưa thanh toán bị xoá 1 ngày (không còn 5 ngày) sau
    // thông báo hết hạn, thông báo gửi qua email lẫn trong ứng dụng. Major: dữ
    // liệu bị xoá sớm hơn, tức một hệ quả mới nặng hơn cho người dùng.
    // 5.0: viết lại cho thiệp custom — thêm dữ liệu tư vấn (Zalo/Messenger),
    // tài khoản do Keemori tạo kèm mật khẩu ban đầu, nhân sự xem nội dung khi
    // thiết kế, tên/số tài khoản người chuyển; mục 13 bỏ luật xoá thiệp chưa
    // thanh toán vì không còn dùng thử. Major: thu thêm loại dữ liệu mới.
    // 5.1: thanh toán chuyển khoản (VietQR) diễn ra ngay trong website và được
    // đối soát tự động qua SePay — mục dữ liệu thanh toán và bên thứ ba nói
    // đúng điều đó. Minor: bản chưa từng phát hành, chỉ làm chữ khớp với luồng
    // thanh toán thật.
    version: "5.1",
    effectiveDate: "2026-10-17",
    updatedAt: "2026-10-17",
    path: "/chinh-sach-bao-mat",
  },
  paymentRefund: {
    // 1.1: công bố hai kênh liên hệ thật.
    // 2.0: mục 8 lần đầu có quy tắc hoàn tiền thật — chỉ hoàn khi thiệp lỗi do
    // mình, và tự hoàn nếu quá 3 ngày làm việc chưa sửa xong. Major: bản 1.x
    // nói "chưa ấn định" nên mọi yêu cầu đều ngỏ; bản này vừa cam kết một
    // trường hợp vừa **đóng** các trường hợp còn lại, tức đổi thật quyền của
    // người mua theo cả hai chiều.
    // 2.1: mục 2 — gói Free có link vĩnh viễn, không còn giới hạn 3 ngày / 15
    // người xem. Minor: không đổi nghĩa vụ thanh toán của ai.
    // 3.0: thiệp custom — trả 100% trước khi thiết kế, không dùng thử, không
    // hoàn tiền trừ lỗi kỹ thuật của Keemori (vẫn tự hoàn nếu quá 3 ngày làm
    // việc chưa sửa); thêm đổi ý / sự kiện huỷ, hoãn vào danh sách không hoàn.
    // Major: đổi thời điểm thanh toán và thu hẹp quyền hoàn tiền.
    // 3.1: thanh toán diễn ra ngay trong website (mã VietQR, đối soát tự động
    // qua SePay), email biên nhận và link thiệp được tạo khi tiền về. Minor:
    // bản chưa từng phát hành, chỉ làm chữ khớp với luồng thanh toán thật,
    // không đổi quyền hay nghĩa vụ của ai.
    version: "3.1",
    effectiveDate: "2026-10-17",
    updatedAt: "2026-10-17",
    path: "/thanh-toan-hoan-tien",
  },
};

/** Hai văn bản bắt buộc chấp thuận khi tạo tài khoản. */
export const SIGNUP_LEGAL_DOCUMENTS = ["terms", "privacy"] as const;

/**
 * Ba văn bản hiện ở chân trang **mọi** trang.
 *
 * Hiện trùng `LEGAL_DOCUMENT_KEYS`; giữ riêng để thêm văn bản chuyên biệt về sau
 * không tự động lên chân trang.
 */
export const FOOTER_LEGAL_KEYS = [
  "terms",
  "privacy",
  "paymentRefund",
] as const satisfies readonly LegalDocumentKey[];

export function legalHref(locale: Locale, key: LegalDocumentKey): string {
  return `/${locale}${LEGAL_DOCUMENTS[key].path}`;
}

/**
 * Ngày ISO → chữ người đọc được, theo đúng locale đang xem.
 *
 * Không dùng `toLocaleDateString` với `new Date(iso)`: chuỗi `YYYY-MM-DD` bị
 * đọc là UTC nên ở múi giờ âm nó lùi một ngày — và một ngày hiệu lực lệch là
 * thứ không ai phát hiện ra cho tới khi có tranh chấp.
 */
export function formatLegalDate(iso: string, locale: Locale): string {
  const [year, month, day] = iso.split("-");
  return locale === "vi"
    ? `${day}/${month}/${year}`
    : `${year}-${month}-${day}`;
}
