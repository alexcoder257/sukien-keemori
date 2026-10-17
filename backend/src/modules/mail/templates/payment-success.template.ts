import {
  detailTable,
  escapeHtml,
  link,
  paragraph,
  renderEmailLayout,
  strong,
} from './email-layout';
import type { RenderedEmail } from './rendered-email';

export interface PaymentSuccessTemplateData {
  fullName: string;
  cardTitle: string;
  /** Tên gói đã hiển thị sẵn bằng tiếng Việt ("Thiệp custom"). */
  tierName: string;
  /** Số tiền đã định dạng sẵn, ví dụ "899.000 ₫". */
  amountLabel: string;
  /** URL đầy đủ tới thiệp công khai. */
  cardUrl: string;
  /** URL đầy đủ tới danh sách "Thiệp của tôi". */
  myCardsUrl: string;
}

/**
 * Biên nhận sau khi thanh toán thành công.
 *
 * Việc quan trọng nhất email này làm không phải là báo "đã nhận tiền" — chuông
 * trong ứng dụng đã nói rồi — mà là **giao lại cái link thiệp** vào một nơi
 * người dùng tìm lại được sau nhiều tháng. Hộp thư sống lâu hơn một dòng thông
 * báo, và đây là thứ họ sẽ đi tìm vào đúng tuần trước đám cưới.
 */
export function paymentSuccessTemplate(
  {
    fullName,
    cardTitle,
    tierName,
    amountLabel,
    cardUrl,
    myCardsUrl,
  }: PaymentSuccessTemplateData,
  siteUrl: string,
): RenderedEmail {
  const subject = `Đã nhận thanh toán — thiệp ${cardTitle}`;

  const text = [
    `Xin chào ${fullName},`,
    '',
    `Chúng tôi đã nhận được thanh toán ${amountLabel} cho thiệp "${cardTitle}".`,
    `Gói: ${tierName}. Thiệp của bạn đã được xuất bản.`,
    '',
    'Link thiệp có hiệu lực vĩnh viễn, bạn có thể gửi cho toàn bộ khách mời:',
    cardUrl,
    '',
    `Xem lại toàn bộ thiệp của bạn: ${myCardsUrl}`,
    '',
    'Thân mến,',
    'Đội ngũ Keemori',
  ].join('\n');

  const bodyHtml = [
    paragraph(`Xin chào ${escapeHtml(fullName)},`),
    paragraph(
      `Cảm ơn bạn đã tin chọn Keemori. Chúng tôi đã nhận được thanh toán cho thiệp ${strong(`“${escapeHtml(cardTitle)}”`)}.`,
    ),
    detailTable([
      { label: 'Thiệp', value: cardTitle },
      { label: 'Gói', value: tierName },
      { label: 'Số tiền', value: amountLabel, emphasis: true },
    ]),
    paragraph(
      `Link thiệp giờ có hiệu lực ${strong('vĩnh viễn')} — bạn có thể gửi cho toàn bộ khách mời.`,
    ),
  ].join('');

  const html = renderEmailLayout({
    subject,
    preheader: `Thiệp ${tierName} của bạn đã được xuất bản. Link có hiệu lực vĩnh viễn.`,
    eyebrow: 'Thanh toán thành công',
    heading: 'Thiệp của bạn đã sẵn sàng',
    bodyHtml,
    cta: { label: 'Xem thiệp', url: cardUrl },
    noteHtml: `Hãy lưu email này để tìm lại link thiệp khi cần. Quản lý toàn bộ thiệp tại ${link(myCardsUrl, 'Thiệp của tôi')}.`,
    siteUrl,
  });

  return { subject, html, text };
}
