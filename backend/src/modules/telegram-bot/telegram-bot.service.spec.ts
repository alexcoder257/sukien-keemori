import type { ConfigService } from '@nestjs/config';
import type { AdminAlertsService } from '@modules/admin-alerts/admin-alerts.service';
import type { SystemHealth } from './system-health';
import type { TelegramBotRepository } from './telegram-bot.repository';
import {
  formatHealth,
  parseCommand,
  TelegramBotService,
} from './telegram-bot.service';

const GB = 1024 ** 3;

function makeService(databaseSize: jest.Mock) {
  const send = jest.fn<void, [Array<string | null>]>();
  const env: Record<string, string> = { TELEGRAM_CHAT_ID: '42' };
  const service = new TelegramBotService(
    { get: (key: string) => env[key] } as unknown as ConfigService,
    { reply: send } as unknown as AdminAlertsService,
    { databaseSize } as unknown as TelegramBotRepository,
  );
  return { service, send };
}

const SYSTEM: SystemHealth = {
  memory: { total: 4 * GB, used: 3.6 * GB },
  swap: null,
  disk: { total: 40 * GB, used: 10 * GB },
  loadAverage: [0.5, 0.25, 0.1],
  cpuCount: 2,
  hostUptimeSeconds: 3 * 86_400 + 2 * 3_600,
  processUptimeSeconds: 125,
  processRss: 200 * 1024 ** 2,
  processHeapUsed: 90 * 1024 ** 2,
};

describe('parseCommand', () => {
  it('đọc lệnh, bỏ hậu tố @TenBot và tham số', () => {
    expect(parseCommand('/health')).toBe('health');
    expect(parseCommand('/Health@KeemoriBot')).toBe('health');
    expect(parseCommand('/health 7d')).toBe('health');
  });

  it('tin thường không phải lệnh', () => {
    expect(parseCommand('hi')).toBeNull();
    expect(parseCommand('/healthcheck/x')).toBeNull();
  });
});

describe('formatHealth', () => {
  it('gắn cảnh báo khi RAM vượt ngưỡng và hiện chỗ trống ổ đĩa', () => {
    const lines = formatHealth(SYSTEM, {
      ok: true,
      latencyMs: 3,
      sizeBytes: 12 * 1024 ** 2,
    });
    const text = lines.filter(Boolean).join('\n');
    expect(text).toContain('RAM: 3.6 GB / 4.0 GB (90%) ⚠️');
    expect(text).toContain('Ổ đĩa: 10.0 GB / 40.0 GB (25%) · còn 30.0 GB');
    expect(text).toContain('Database: OK (3 ms) · 12 MB');
    expect(text).toContain('Server chạy 3 ngày 2 giờ · backend 2 phút');
    expect(text).not.toContain('Swap');
  });

  it('báo rõ khi database không kết nối được', () => {
    const text = formatHealth(SYSTEM, {
      ok: false,
      latencyMs: 5000,
      sizeBytes: null,
    }).join('\n');
    expect(text).toContain('KHÔNG KẾT NỐI ĐƯỢC');
  });
});

describe('TelegramBotService.handleUpdate', () => {
  it('bỏ qua im lặng tin từ chat khác', async () => {
    const { service, send } = makeService(jest.fn());
    await service.handleUpdate({
      message: { chat: { id: 7 }, text: '/health' },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('trả lời /health cho đúng chat vận hành', async () => {
    const { service, send } = makeService(jest.fn().mockResolvedValue(1024));
    await service.handleUpdate({
      message: { chat: { id: 42 }, text: '/health' },
    });
    const lines = send.mock.calls[0][0];
    expect(lines[0]).toBe('🩺 Keemori server');
    expect(lines.join('\n')).toContain('Database: OK');
  });

  it('database hỏng vẫn trả lời, không ném lỗi', async () => {
    const { service, send } = makeService(
      jest.fn().mockRejectedValue(new Error('down')),
    );
    await expect(
      service.handleUpdate({ message: { chat: { id: 42 }, text: '/health' } }),
    ).resolves.toBeUndefined();
    expect(send.mock.calls[0][0].join('\n')).toContain('KHÔNG KẾT NỐI ĐƯỢC');
  });

  it('lệnh lạ trả về danh sách lệnh', async () => {
    const { service, send } = makeService(jest.fn());
    await service.handleUpdate({ message: { chat: { id: 42 }, text: '/abc' } });
    const text = send.mock.calls[0][0].join('\n');
    expect(text).toContain('Không có lệnh /abc.');
    expect(text).toContain('/health');
  });
});
