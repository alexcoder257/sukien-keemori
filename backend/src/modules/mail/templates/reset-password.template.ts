import {
  escapeHtml,
  paragraph,
  renderEmailLayout,
  strong,
} from './email-layout';
import type { RenderedEmail } from './rendered-email';

interface ResetPasswordTemplateData {
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function resetPasswordTemplate(
  { fullName, resetUrl, expiresInMinutes }: ResetPasswordTemplateData,
  siteUrl: string,
): RenderedEmail {
  const subject = 'Đặt lại mật khẩu — Keemori';

  const text = [
    `Xin chào ${fullName},`,
    '',
    'Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Keemori.',
    `Mở liên kết sau để tạo mật khẩu mới (hiệu lực ${expiresInMinutes} phút):`,
    resetUrl,
    '',
    'Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu hiện tại vẫn an toàn.',
    '',
    'Thân mến,',
    'Đội ngũ Keemori',
  ].join('\n');

  const bodyHtml = [
    paragraph(`Xin chào ${escapeHtml(fullName)},`),
    paragraph(
      `Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Keemori. Nhấn nút bên dưới để tạo mật khẩu mới — liên kết có hiệu lực trong ${strong(`${expiresInMinutes} phút`)}.`,
    ),
  ].join('');

  const html = renderEmailLayout({
    subject,
    preheader: `Liên kết đặt lại mật khẩu có hiệu lực trong ${expiresInMinutes} phút.`,
    eyebrow: 'Bảo mật tài khoản',
    heading: 'Đặt lại mật khẩu',
    bodyHtml,
    cta: { label: 'Đặt lại mật khẩu', url: resetUrl },
    noteHtml:
      'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — mật khẩu hiện tại của bạn vẫn an toàn.',
    siteUrl,
  });

  return { subject, html, text };
}
