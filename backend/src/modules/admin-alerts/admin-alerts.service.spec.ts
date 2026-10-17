import type { ConfigService } from '@nestjs/config';
import { AdminAlertsService } from './admin-alerts.service';

function makeService(env: Record<string, string | undefined>) {
  return new AdminAlertsService({
    get: (key: string) => env[key],
  } as unknown as ConfigService);
}

const CONFIGURED = {
  TELEGRAM_BOT_TOKEN: '123:abc',
  TELEGRAM_CHAT_ID: '42',
  FRONTEND_URL: 'https://keemori.com',
};

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('AdminAlertsService', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
  });

  it('không gọi Telegram khi chưa cấu hình bot', () => {
    makeService({}).newUser({
      email: 'an@example.com',
      fullName: 'An',
      source: 'register',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gửi tin tài khoản mới dạng plain text', () => {
    makeService(CONFIGURED).newUser({
      email: 'an@example.com',
      fullName: 'Nguyễn_An',
      source: 'google',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(url).toBe('https://api.telegram.org/bot123:abc/sendMessage');
    expect(body.chat_id).toBe('42');
    expect(body.parse_mode).toBeUndefined();
    expect(body.text).toContain('an@example.com');
    expect(body.text).toContain('Google');
  });

  describe('chat phụ', () => {
    const alert = {
      email: 'an@example.com',
      fullName: 'An',
      source: 'register' as const,
    };
    const targets = () =>
      fetchMock.mock.calls.map(([url, init]: [string, RequestInit]) => [
        url,
        (JSON.parse(init.body as string) as { chat_id: string }).chat_id,
      ]);

    it('gửi tin báo tới cả bot phụ', () => {
      makeService({
        ...CONFIGURED,
        TELEGRAM_EXTRA_BOT_TOKEN: '999:xyz',
        TELEGRAM_EXTRA_CHAT_ID: '77',
      }).newUser(alert);

      expect(targets()).toEqual([
        ['https://api.telegram.org/bot123:abc/sendMessage', '42'],
        ['https://api.telegram.org/bot999:xyz/sendMessage', '77'],
      ]);
    });

    it('không khai token phụ thì mượn bot chính', () => {
      makeService({ ...CONFIGURED, TELEGRAM_EXTRA_CHAT_ID: '77' }).newUser(
        alert,
      );

      expect(targets()[1]).toEqual([
        'https://api.telegram.org/bot123:abc/sendMessage',
        '77',
      ]);
    });

    it('chỉ có chat phụ vẫn gửi được', () => {
      makeService({
        TELEGRAM_EXTRA_BOT_TOKEN: '999:xyz',
        TELEGRAM_EXTRA_CHAT_ID: '77',
      }).newUser(alert);

      expect(targets()).toEqual([
        ['https://api.telegram.org/bot999:xyz/sendMessage', '77'],
      ]);
    });

    it('trả lời lệnh bot chỉ về chat chính', () => {
      makeService({
        ...CONFIGURED,
        TELEGRAM_EXTRA_BOT_TOKEN: '999:xyz',
        TELEGRAM_EXTRA_CHAT_ID: '77',
      }).reply(['pong']);

      expect(targets()).toEqual([
        ['https://api.telegram.org/bot123:abc/sendMessage', '42'],
      ]);
    });
  });

  it('không ném lỗi khi Telegram hỏng', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const service = makeService(CONFIGURED);

    expect(() =>
      service.newUser({ email: 'a@b.c', fullName: 'A', source: 'register' }),
    ).not.toThrow();
    await flush();
  });
});
