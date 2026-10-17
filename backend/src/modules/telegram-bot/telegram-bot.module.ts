import { AdminAlertsModule } from '@modules/admin-alerts/admin-alerts.module';
import { Module } from '@nestjs/common';
import { TelegramWebhookGuard } from './guards/telegram-webhook.guard';
import { TelegramBotController } from './telegram-bot.controller';
import { TelegramBotRepository } from './telegram-bot.repository';
import { TelegramBotService } from './telegram-bot.service';

/**
 * Lệnh Telegram cho người vận hành (`/health`, ...). Chiều ngược với
 * `admin-alerts`: module đó chỉ gửi và không import ai, còn module này nhận
 * lệnh rồi đọc số liệu — nên nó được import domain khác, chỉ để **đọc**.
 */
@Module({
  imports: [AdminAlertsModule],
  controllers: [TelegramBotController],
  providers: [TelegramBotService, TelegramBotRepository, TelegramWebhookGuard],
})
export class TelegramBotModule {}
