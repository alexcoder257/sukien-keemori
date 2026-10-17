/**
 * Bảng ngân hàng dùng cho QR chuyển khoản của khối "Hộp mừng cưới".
 *
 * **`bin` là khoá thật, không phải tên ngân hàng.** QR chuyển khoản ở Việt Nam
 * là VietQR — EMVCo Merchant-Presented QR + TCCS 03:2018/NHNNVN của NAPAS — và
 * mã định danh trong payload là BIN 6 số do NAPAS cấp, không phải chuỗi
 * "Vietcombank". Vì vậy nội dung thiệp lưu `bankBin`; tên hiển thị suy ra từ
 * bảng này chứ không lưu trùng.
 *
 * **Ảnh chụp tại 2026-08-14** từ `https://api.vietqr.io/v2/banks` (miễn phí,
 * không cần key), đã lọc `transferSupported === 1` — ngân hàng không nhận
 * chuyển khoản qua QR thì đưa vào chỉ tạo ra mã không quét được. Danh sách nằm
 * trong repo chứ không gọi mạng lúc render: trang thiệp phải dựng được cả khi
 * api.vietqr.io sập, và bảng này gần như không đổi.
 *
 * Đổi lại, nó **mục dần theo thời gian**: ngân hàng sáp nhập hoặc đổi tên
 * (OceanBank → MBV, CBBank → VCBNeo, DongA Bank…) thì BIN cũ chết mà không có
 * tín hiệu nào — khách quét ra "không tìm thấy tài khoản", cặp đôi không hề
 * biết. Rà lại danh sách này mỗi năm một lần và cập nhật ngày ở trên.
 */
export interface Bank {
  /** BIN 6 số của NAPAS — giá trị đi thẳng vào payload VietQR. */
  bin: string;
  /**
   * Mã ngắn của VietQR (`VCB`, `TCB`…). Logo tương ứng nằm ở
   * `public/images/banks/<code>.avif` — tải về chứ không hotlink cdn.vietqr.io.
   * **Có thể thiếu file** (KBank, Ubank không có logo ở nguồn), nên nơi hiển thị
   * phải chịu được ảnh vắng mặt.
   */
  code: string;
  shortName: string;
  name: string;
}

export const BANKS: readonly Bank[] = [
  {
    bin: "970425",
    code: "ABB",
    shortName: "ABBANK",
    name: "Ngân hàng TMCP An Bình",
  },
  {
    bin: "970416",
    code: "ACB",
    shortName: "ACB",
    name: "Ngân hàng TMCP Á Châu",
  },
  {
    bin: "970405",
    code: "VBA",
    shortName: "Agribank",
    name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
  },
  {
    bin: "970409",
    code: "BAB",
    shortName: "BacABank",
    name: "Ngân hàng TMCP Bắc Á",
  },
  {
    bin: "970438",
    code: "BVB",
    shortName: "BaoVietBank",
    name: "Ngân hàng TMCP Bảo Việt",
  },
  {
    bin: "970418",
    code: "BIDV",
    shortName: "BIDV",
    name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
  },
  {
    bin: "546034",
    code: "CAKE",
    shortName: "CAKE",
    name: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank",
  },
  {
    bin: "422589",
    code: "CIMB",
    shortName: "CIMB",
    name: "Ngân hàng TNHH MTV CIMB Việt Nam",
  },
  {
    bin: "970446",
    code: "COOPBANK",
    shortName: "COOPBANK",
    name: "Ngân hàng Hợp tác xã Việt Nam",
  },
  {
    bin: "970431",
    code: "EIB",
    shortName: "Eximbank",
    name: "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam",
  },
  {
    bin: "970437",
    code: "HDB",
    shortName: "HDBank",
    name: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh",
  },
  {
    bin: "668888",
    code: "KBank",
    shortName: "KBank",
    name: "Ngân hàng Đại chúng TNHH Kasikornbank",
  },
  {
    bin: "970452",
    code: "KLB",
    shortName: "KienLongBank",
    name: "Ngân hàng TMCP Kiên Long",
  },
  {
    bin: "970449",
    code: "LPB",
    shortName: "LPBank",
    name: "Ngân hàng TMCP Lộc Phát Việt Nam",
  },
  {
    bin: "970422",
    code: "MB",
    shortName: "MBBank",
    name: "Ngân hàng TMCP Quân đội",
  },
  {
    bin: "970414",
    code: "MBV",
    shortName: "MBV",
    name: "Ngân hàng TNHH MTV Việt Nam Hiện Đại",
  },
  {
    bin: "971025",
    code: "momo",
    shortName: "MoMo",
    name: "CTCP Dịch Vụ Di Động Trực Tuyến",
  },
  {
    bin: "970426",
    code: "MSB",
    shortName: "MSB",
    name: "Ngân hàng TMCP Hàng Hải Việt Nam",
  },
  {
    bin: "970428",
    code: "NAB",
    shortName: "NamABank",
    name: "Ngân hàng TMCP Nam Á",
  },
  {
    bin: "970419",
    code: "NCB",
    shortName: "NCB",
    name: "Ngân hàng TMCP Quốc Dân",
  },
  {
    bin: "970448",
    code: "OCB",
    shortName: "OCB",
    name: "Ngân hàng TMCP Phương Đông",
  },
  {
    bin: "970430",
    code: "PGB",
    shortName: "PGBank",
    name: "Ngân hàng TMCP Thịnh vượng và Phát triển",
  },
  {
    bin: "970412",
    code: "PVCB",
    shortName: "PVcomBank",
    name: "Ngân hàng TMCP Đại Chúng Việt Nam",
  },
  {
    bin: "971133",
    code: "PVDB",
    shortName: "PVcomBank Pay",
    name: "Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số",
  },
  {
    bin: "970403",
    code: "STB",
    shortName: "Sacombank",
    name: "Ngân hàng TMCP Sài Gòn Thương Tín",
  },
  {
    bin: "970400",
    code: "SGICB",
    shortName: "SaigonBank",
    name: "Ngân hàng TMCP Sài Gòn Công Thương",
  },
  {
    bin: "970429",
    code: "SCB",
    shortName: "SCB",
    name: "Ngân hàng TMCP Sài Gòn",
  },
  {
    bin: "970440",
    code: "SEAB",
    shortName: "SeABank",
    name: "Ngân hàng TMCP Đông Nam Á",
  },
  {
    bin: "970443",
    code: "SHB",
    shortName: "SHB",
    name: "Ngân hàng TMCP Sài Gòn - Hà Nội",
  },
  {
    bin: "970424",
    code: "SHBVN",
    shortName: "ShinhanBank",
    name: "Ngân hàng TNHH MTV Shinhan Việt Nam",
  },
  {
    bin: "970407",
    code: "TCB",
    shortName: "Techcombank",
    name: "Ngân hàng TMCP Kỹ thương Việt Nam",
  },
  {
    bin: "963388",
    code: "TIMO",
    shortName: "Timo",
    name: "Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)",
  },
  {
    bin: "970423",
    code: "TPB",
    shortName: "TPBank",
    name: "Ngân hàng TMCP Tiên Phong",
  },
  {
    bin: "546035",
    code: "Ubank",
    shortName: "Ubank",
    name: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank",
  },
  {
    bin: "970441",
    code: "VIB",
    shortName: "VIB",
    name: "Ngân hàng TMCP Quốc tế Việt Nam",
  },
  {
    bin: "970427",
    code: "VAB",
    shortName: "VietABank",
    name: "Ngân hàng TMCP Việt Á",
  },
  {
    bin: "970433",
    code: "VIETBANK",
    shortName: "VietBank",
    name: "Ngân hàng TMCP Việt Nam Thương Tín",
  },
  {
    bin: "970454",
    code: "VCCB",
    shortName: "VietCapitalBank",
    name: "Ngân hàng TMCP Bản Việt",
  },
  {
    bin: "970436",
    code: "VCB",
    shortName: "Vietcombank",
    name: "Ngân hàng TMCP Ngoại Thương Việt Nam",
  },
  {
    bin: "970415",
    code: "ICB",
    shortName: "VietinBank",
    name: "Ngân hàng TMCP Công thương Việt Nam",
  },
  {
    bin: "970432",
    code: "VPB",
    shortName: "VPBank",
    name: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
  },
  {
    bin: "970457",
    code: "WVN",
    shortName: "Woori",
    name: "Ngân hàng TNHH MTV Woori Việt Nam",
  },
] as const;

const BANKS_BY_BIN = new Map(BANKS.map((bank) => [bank.bin, bank]));

/**
 * Thiệp cũ hoặc dữ liệu hỏng có thể mang BIN không còn trong bảng — trả
 * `undefined` để nơi gọi tự quyết định (ẩn QR, hiện mỗi số tài khoản), thay vì
 * ném lỗi làm sập cả trang thiệp.
 */
export function findBankByBin(bin: string): Bank | undefined {
  return BANKS_BY_BIN.get(bin);
}

/**
 * Tra theo mã ngắn VietQR — dạng backend dùng cho tài khoản nhận tiền
 * (`SEPAY_BANK_CODE`). Không thấy thì nơi gọi hiện nguyên mã.
 */
export function findBankByCode(code: string): Bank | undefined {
  return BANKS.find((bank) => bank.code === code);
}

/** Định dạng BIN hợp lệ. Backend kiểm bằng đúng biểu thức này. */
export const BANK_BIN_PATTERN = /^\d{6}$/;

/**
 * Số tài khoản: chữ và số, **không dấu và không khoảng trắng**. Vài ngân hàng
 * cấp số tài khoản có chữ cái nên không giới hạn ở `\d`. Chuỗi này đi thẳng vào
 * payload VietQR, mà độ dài trong payload đếm theo ký tự — có dấu tiếng Việt là
 * số byte lệch số ký tự và app ngân hàng đọc hỏng cả mã.
 */
export const BANK_ACCOUNT_PATTERN = /^[0-9A-Za-z]+$/;
export const BANK_ACCOUNT_MAX_LENGTH = 30;

/** Chỉ hiển thị cạnh QR để khách đối chiếu, không nằm trong payload. */
export const BANK_ACCOUNT_NAME_MAX_LENGTH = 60;
