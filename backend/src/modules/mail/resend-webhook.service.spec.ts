import type { AdminAlertsService } from '@modules/admin-alerts/admin-alerts.service';
import {
  formatResendEvent,
  ResendWebhookService,
} from './resend-webhook.service';

function text(lines: Array<string | null> | null): string {
  return (lines ?? []).filter((line) => line !== null).join('\n');
}

describe('formatResendEvent', () => {
  it('thư đến: báo người gửi và địa chỉ nhận, không kèm tiêu đề', () => {
    const lines = formatResendEvent({
      type: 'email.received',
      data: {
        from: 'Nguyễn An <an@gmail.com>',
        to: ['hotro@keemori.com'],
        subject: 'Nội dung riêng tư',
      },
    });
    expect(text(lines)).toContain('Nguyễn An <an@gmail.com>');
    expect(text(lines)).toContain('hotro@keemori.com');
    expect(text(lines)).not.toContain('Nội dung riêng tư');
  });

  it('thư bị trả về: kèm người nhận, tiêu đề và lý do', () => {
    const lines = text(
      formatResendEvent({
        type: 'email.bounced',
        data: {
          to: ['khach@example.com'],
          subject: 'Đặt lại mật khẩu',
          bounce: { message: 'Mailbox does not exist' },
        },
      }),
    );
    expect(lines).toContain('khach@example.com');
    expect(lines).toContain('Đặt lại mật khẩu');
    expect(lines).toContain('Mailbox does not exist');
  });

  it('cắt ngắn trường quá dài', () => {
    const lines = text(
      formatResendEvent({
        type: 'email.received',
        data: { from: 'x'.repeat(500) },
      }),
    );
    expect(lines).toContain('…');
    expect(lines.length).toBeLessThan(300);
  });

  it('bỏ qua sự kiện không cần báo', () => {
    expect(formatResendEvent({ type: 'email.delivered', data: {} })).toBeNull();
    expect(formatResendEvent({})).toBeNull();
  });
});

describe('ResendWebhookService', () => {
  it('không ném lỗi khi payload lệch định dạng', () => {
    const send = jest.fn();
    const service = new ResendWebhookService({
      send,
    } as unknown as AdminAlertsService);

    expect(() =>
      service.handle({
        type: 'email.received',
        data: { from: 42, to: 'hotro@keemori.com' } as never,
      }),
    ).not.toThrow();
    expect(send).toHaveBeenCalledTimes(1);
  });
});
