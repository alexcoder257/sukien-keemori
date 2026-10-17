import { AdminAlertsService } from '@modules/admin-alerts/admin-alerts.service';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { collectSystemHealth } from './system-health';
import type { MemoryUsage, SystemHealth } from './system-health';
import { TelegramBotRepository } from './telegram-bot.repository';

const TELEGRAM_API = 'https://api.telegram.org';
const REQUEST_TIMEOUT_MS = 10_000;
/** Từ ngưỡng này RAM/ổ đĩa được gắn ⚠️ trong `/health`. */
const WARN_PERCENT = 85;

/** Phần của một Telegram Update mà bot cần đọc. */
export interface TelegramUpdate {
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
}

export interface DatabaseHealth {
  ok: boolean;
  latencyMs: number;
  sizeBytes: number | null;
}

interface BotCommand {
  command: string;
  description: string;
  run: () => Promise<Array<string | null>>;
}

/**
 * Bot Telegram trả lời lệnh của **người vận hành**.
 *
 * Chỉ nói chuyện với đúng `TELEGRAM_CHAT_ID`: tin từ chat khác bị bỏ qua im
 * lặng — kể cả không trả lời "không có quyền", để người lạ tìm ra bot không
 * biết được bot đang sống. Trả lời đi qua `AdminAlertsService.reply`, nên cùng
 * luật plain text và không bao giờ ném lỗi.
 *
 * `handleUpdate` cũng **không ném lỗi**: webhook trả khác 200 là Telegram gửi
 * lại cùng update, và một lệnh lỗi sẽ lặp mãi.
 */
@Injectable()
export class TelegramBotService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramBotService.name);

  private readonly commands: BotCommand[] = [
    {
      command: 'health',
      description: 'RAM, ổ đĩa, CPU và database của server',
      run: () => this.health(),
    },
    {
      command: 'help',
      description: 'Danh sách lệnh',
      run: () => Promise.resolve(this.help()),
    },
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly adminAlertsService: AdminAlertsService,
    private readonly telegramBotRepository: TelegramBotRepository,
  ) {}

  /**
   * Tự đăng ký webhook và menu lệnh mỗi lần khởi động, thay vì bắt người vận
   * hành chạy tay `setWebhook` sau mỗi lần đổi secret hay tên miền. Cả hai lệnh
   * Telegram đều idempotent nên nhiều container cùng gọi cũng không sao.
   *
   * Không `await`: Telegram chậm thì backend vẫn phải lên được.
   */
  onApplicationBootstrap(): void {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const secret = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');
    const apiUrl = this.configService.get<string>('PUBLIC_API_URL');
    if (!token || !secret || !apiUrl) return;

    void this.callTelegram(token, 'setWebhook', {
      url: `${apiUrl.replace(/\/+$/, '')}/telegram/webhook`,
      secret_token: secret,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    });
    void this.callTelegram(token, 'setMyCommands', {
      commands: this.commands.map(({ command, description }) => ({
        command,
        description,
      })),
    });
  }

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    try {
      const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
      const message = update.message;
      if (!chatId || !message?.text) return;
      if (String(message.chat?.id) !== chatId.trim()) return;

      const name = parseCommand(message.text);
      if (!name) return;

      const command = this.commands.find((item) => item.command === name);
      const lines = command
        ? await command.run()
        : [`Không có lệnh /${name}.`, '', ...this.help()];
      this.adminAlertsService.reply(lines);
    } catch (error) {
      this.logger.error(`Lệnh Telegram lỗi: ${String(error)}`);
      this.adminAlertsService.reply(['❌ Lệnh lỗi, xem log backend.']);
    }
  }

  private help(): string[] {
    return this.commands.map(
      ({ command, description }) => `/${command} — ${description}`,
    );
  }

  private async health(): Promise<Array<string | null>> {
    const [system, database] = await Promise.all([
      collectSystemHealth(),
      this.databaseHealth(),
    ]);
    return formatHealth(system, database);
  }

  private async databaseHealth(): Promise<DatabaseHealth> {
    const startedAt = Date.now();
    try {
      const sizeBytes = await this.telegramBotRepository.databaseSize();
      return { ok: true, latencyMs: Date.now() - startedAt, sizeBytes };
    } catch (error) {
      this.logger.warn(`Không truy vấn được database: ${String(error)}`);
      return { ok: false, latencyMs: Date.now() - startedAt, sizeBytes: null };
    }
  }

  private async callTelegram(
    token: string,
    method: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    try {
      const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(
          `Telegram ${method} thất bại: HTTP ${response.status} ${await response.text()}`,
        );
      }
    } catch (error) {
      this.logger.warn(`Không gọi được Telegram ${method}: ${String(error)}`);
    }
  }
}

/**
 * Tên lệnh viết thường, không dấu `/`. Bỏ hậu tố `@TenBot` mà Telegram gắn vào
 * khi bấm lệnh trong nhóm. `null` nếu tin không phải lệnh.
 */
export function parseCommand(text: string): string | null {
  const match = /^\/([a-z0-9_]+)(?:@\w+)?(?:\s|$)/i.exec(text.trim());
  return match ? match[1].toLowerCase() : null;
}

export function formatHealth(
  system: SystemHealth,
  database: DatabaseHealth,
): Array<string | null> {
  const [load1, load5, load15] = system.loadAverage.map((value) =>
    value.toFixed(2),
  );
  return [
    '🩺 Keemori server',
    `🧠 RAM: ${formatUsage(system.memory)}`,
    system.swap ? `🔄 Swap: ${formatUsage(system.swap)}` : null,
    system.disk
      ? `💾 Ổ đĩa: ${formatUsage(system.disk)} · còn ${formatBytes(
          system.disk.total - system.disk.used,
        )}`
      : '💾 Ổ đĩa: không đọc được',
    `⚙️ CPU: load ${load1} / ${load5} / ${load15} · ${system.cpuCount} nhân`,
    database.ok
      ? `🐘 Database: OK (${database.latencyMs} ms)${
          database.sizeBytes === null
            ? ''
            : ` · ${formatBytes(database.sizeBytes)}`
        }`
      : '🐘 Database: ❌ KHÔNG KẾT NỐI ĐƯỢC',
    `📦 Backend: RSS ${formatBytes(system.processRss)} · heap ${formatBytes(
      system.processHeapUsed,
    )}`,
    `⏱ Server chạy ${formatDuration(system.hostUptimeSeconds)} · backend ${formatDuration(
      system.processUptimeSeconds,
    )}`,
  ];
}

function formatUsage(usage: MemoryUsage): string {
  const percent = usage.total > 0 ? (usage.used / usage.total) * 100 : 0;
  const warn = percent >= WARN_PERCENT ? ' ⚠️' : '';
  return `${formatBytes(usage.used)} / ${formatBytes(usage.total)} (${Math.round(
    percent,
  )}%)${warn}`;
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit >= 3 ? 1 : 0)} ${units[unit]}`;
}

function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}
