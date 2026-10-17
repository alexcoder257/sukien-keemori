/**
 * Khung chung của mọi email Keemori: banner thương hiệu, thân thư, chữ ký và
 * chân thư. Template của từng loại email chỉ viết phần nội dung rồi gọi
 * `renderEmailLayout` — đổi nhận diện là sửa một chỗ.
 *
 * Viết theo luật của email chứ không theo luật của web: bố cục bằng `<table>`,
 * CSS inline, không font web, không flex/grid. Outlook trên Windows render
 * bằng Word nên bỏ qua `border-radius`, `max-width` và phần lớn CSS hiện đại;
 * mọi thứ ở đây phải vẫn đọc được khi các thuộc tính đó rơi mất.
 *
 * Màu lấy từ 7 màu thương hiệu (`frontend/app/globals.css`), sắc độ trung gian
 * pha từ chúng như `color-mix` — không thêm hue mới. Nền thư là **trắng trơn**,
 * chỉ banner giữ màu giấy của logo: thư được đọc giữa một hộp thư nền trắng,
 * và một mảng be phủ kín khung đọc trông nặng và khó đọc hơn hẳn. Không có chế
 * độ tối; `color-scheme: light` xin các ứng dụng thư đừng tự đảo màu.
 */

/** `cid` của ảnh nhúng — khớp với `BRAND_ATTACHMENTS` trong `MailService`. */
export const EMAIL_CID = {
  cover: 'keemori-cover',
  avatar: 'keemori-avatar',
} as const;

/**
 * Bản sao có chủ đích của `CONTACT.supportEmail` ở frontend. Không đọc
 * `site_settings.contactEmail`: địa chỉ hỗ trợ được trích trong văn bản pháp lý
 * có phiên bản, không đổi bằng một cú bấm Lưu trong CMS.
 */
export const SUPPORT_EMAIL = 'hotro@keemori.com';

const COLOR = {
  ink: '#0b0d0b', // forest-ink
  ivory: '#f5f0e6',
  /** Nền thư, khung đọc, bảng và khối nhấn mạnh. */
  white: '#ffffff',
  champagne: '#d8c39b',
  deepGold: '#b88a4a',
  /** Nền banner — đúng màu nền của `keemori-cover.jpg` để ảnh liền với khung. */
  cover: '#f1ebdb',
  /** forest-ink 78%: chữ thân, dịu hơn tiêu đề (≈11:1 trên nền trắng). */
  body: '#3e3f3b',
  /** forest-ink 60%: chữ phụ, vẫn đạt AA (≈5.6:1 trên nền trắng). */
  muted: '#686863',
  /**
   * deep-gold 60% + forest-ink 40%: chữ nhãn và link. Deep Gold nguyên bản chỉ
   * đạt ~2.5:1 trên nền giấy nên chỉ dùng làm nét trang trí, không làm chữ.
   */
  goldText: '#735831',
  /** champagne 45% trên nền sáng: đường kẻ và viền. */
  line: '#e6dac3',
} as const;

const FONT_SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const FONT_SERIF = "'Playfair Display',Georgia,'Times New Roman',serif";

/** Escape ký tự HTML để nội dung người dùng nhập (họ tên, tên thiệp) không phá layout. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Ngày dạng `25/09/2026`, luôn theo giờ Việt Nam bất kể múi giờ của server. */
export function formatDateVi(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}

/** "14:30 ngày 29/09/2026" theo giờ Việt Nam — cho mốc cần chính xác tới giờ. */
export function formatDateTimeVi(date: Date): string {
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
  return `${time} ngày ${formatDateVi(date)}`;
}

/** Một đoạn văn thân thư. `html` phải đã được escape. */
export function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${COLOR.body}">${html}</p>`;
}

/** Chữ đậm màu mực trong đoạn văn. `html` phải đã được escape. */
export function strong(html: string): string {
  return `<strong style="color:${COLOR.ink};font-weight:600">${html}</strong>`;
}

/** Link trong thân thư, màu vàng đậm của nhãn. Tự escape. */
export function link(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}" target="_blank" style="color:${COLOR.goldText}">${escapeHtml(label)}</a>`;
}

/** Bảng thông tin nhãn–giá trị (thiệp, gói, ngày...). Tự escape. */
export function detailTable(
  rows: Array<{ label: string; value: string; emphasis?: boolean }>,
): string {
  const cells = rows
    .map(
      (row, index) => `
        <tr>
          <td style="padding:12px 20px;${index > 0 ? `border-top:1px solid ${COLOR.line};` : ''}font-family:${FONT_SANS};font-size:13px;line-height:1.5;color:${COLOR.muted};white-space:nowrap;vertical-align:top">${escapeHtml(row.label)}</td>
          <td align="right" style="padding:12px 20px;${index > 0 ? `border-top:1px solid ${COLOR.line};` : ''}font-family:${FONT_SANS};font-size:14px;line-height:1.5;font-weight:600;color:${row.emphasis ? COLOR.goldText : COLOR.ink};text-align:right">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-collapse:separate;background:${COLOR.white};border:1px solid ${COLOR.line};border-radius:12px">${cells}
    </table>`;
}

/** Khối nhấn mạnh có vạch vàng bên trái — dùng cho điều người đọc không được bỏ lỡ. */
export function callout(html: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
      <tr>
        <td style="padding:16px 20px;background:${COLOR.white};border:1px solid ${COLOR.line};border-left:3px solid ${COLOR.deepGold};font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:${COLOR.body}">${html}</td>
      </tr>
    </table>`;
}

export interface EmailLayoutOptions {
  /** Tiêu đề thư, cũng là `<title>` của tài liệu. */
  subject: string;
  /** Dòng xem trước hiện cạnh tiêu đề trong hộp thư; không hiển thị trong thân thư. */
  preheader: string;
  /** Nhãn nhỏ viết hoa phía trên tiêu đề. */
  eyebrow: string;
  heading: string;
  /** Thân thư, đã escape — dựng bằng `paragraph`, `detailTable`, `callout`. */
  bodyHtml: string;
  cta?: { label: string; url: string };
  /** Chữ nhỏ dưới nút (ghi chú, "nếu bạn không yêu cầu..."), đã escape. */
  noteHtml?: string;
  /** Địa chỉ website, cho link ở banner và chân thư. */
  siteUrl: string;
}

export function renderEmailLayout({
  subject,
  preheader,
  eyebrow,
  heading,
  bodyHtml,
  cta,
  noteHtml,
  siteUrl,
}: EmailLayoutOptions): string {
  const site = escapeHtml(siteUrl);
  const siteLabel = escapeHtml(siteUrl.replace(/^https?:\/\//, ''));
  const year = new Date().getFullYear();

  const ctaHtml = cta
    ? `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
            <tr>
              <td align="center" bgcolor="${COLOR.ink}" style="border-radius:10px;background:${COLOR.ink}">
                <a href="${escapeHtml(cta.url)}" target="_blank" style="display:inline-block;padding:15px 32px;font-family:${FONT_SANS};font-size:15px;font-weight:600;line-height:1;color:${COLOR.ivory};text-decoration:none;border-radius:10px;letter-spacing:0.01em">${escapeHtml(cta.label)}</a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 24px;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${COLOR.muted}">
            Nếu nút không hoạt động, sao chép liên kết này vào trình duyệt:<br />
            <a href="${escapeHtml(cta.url)}" target="_blank" style="color:${COLOR.goldText};word-break:break-all">${escapeHtml(cta.url)}</a>
          </p>`
    : '';

  const noteBlock = noteHtml
    ? `<p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:13px;line-height:1.7;color:${COLOR.muted}">${noteHtml}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    @media (max-width: 620px) {
      .k-pad { padding-left: 24px !important; padding-right: 24px !important; }
      .k-heading { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLOR.white};-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${COLOR.white}">${escapeHtml(preheader)}&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.white}" style="background:${COLOR.white}">
    <tr>
      <td align="center" style="padding:32px 12px 40px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${COLOR.white};border:1px solid ${COLOR.line};border-radius:16px;overflow:hidden">
          <tr>
            <td bgcolor="${COLOR.cover}" style="background:${COLOR.cover};border-bottom:1px solid ${COLOR.line}">
              <a href="${site}" target="_blank" style="display:block;text-decoration:none">
                <img src="cid:${EMAIL_CID.cover}" width="600" alt="Keemori — Keep your memories, beautifully." style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;font-family:${FONT_SERIF};font-size:20px;color:${COLOR.ink}" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="k-pad" style="padding:40px 48px 16px">
              <p style="margin:0 0 12px;font-family:${FONT_SANS};font-size:12px;font-weight:600;line-height:1.4;letter-spacing:0.14em;text-transform:uppercase;color:${COLOR.goldText}">${escapeHtml(eyebrow)}</p>
              <h1 class="k-heading" style="margin:0 0 24px;font-family:${FONT_SERIF};font-size:28px;font-weight:500;line-height:1.3;letter-spacing:-0.01em;color:${COLOR.ink}">${escapeHtml(heading)}</h1>
              ${bodyHtml}
              ${ctaHtml}
              ${noteBlock}
            </td>
          </tr>
          <tr>
            <td class="k-pad" style="padding:8px 48px 40px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid ${COLOR.line};font-size:0;line-height:0;height:1px">&nbsp;</td></tr>
              </table>
              <p style="margin:24px 0 0;font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:${COLOR.body}">
                Thân mến,<br />
                <span style="font-family:${FONT_SERIF};font-size:17px;color:${COLOR.ink}">Đội ngũ Keemori</span>
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
          <tr>
            <td align="center" style="padding:32px 24px 0">
              <img src="cid:${EMAIL_CID.avatar}" width="44" height="44" alt="Keemori" style="display:block;width:44px;height:44px;border:0;margin:0 auto 12px" />
              <p style="margin:0 0 4px;font-family:${FONT_SERIF};font-size:16px;letter-spacing:0.24em;color:${COLOR.ink}">KEEMORI</p>
              <p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${COLOR.muted}">Thiệp cưới online — Keep your memories, beautifully.</p>
              <p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:12px;line-height:1.8;color:${COLOR.muted}">
                <a href="${site}" target="_blank" style="color:${COLOR.goldText};text-decoration:none">${siteLabel}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${COLOR.goldText};text-decoration:none">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:0;font-family:${FONT_SANS};font-size:11px;line-height:1.6;color:${COLOR.muted}">
                Bạn nhận được email này vì có tài khoản tại Keemori.<br />
                © ${year} Keemori. Mọi quyền được bảo lưu.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
