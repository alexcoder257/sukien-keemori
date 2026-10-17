import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { TelegramWebhookGuard } from './guards/telegram-webhook.guard';
import { TelegramBotService } from './telegram-bot.service';
import type { TelegramUpdate } from './telegram-bot.service';

/**
 * Webhook Telegram gọi vào khi người vận hành nhắn lệnh cho bot.
 *
 * Không có DTO: Update của Telegram có hàng chục trường và thêm dần theo phiên
 * bản API, còn `ValidationPipe` toàn cục bật `forbidNonWhitelisted` — khai DTO là
 * mỗi lần Telegram thêm trường thì webhook trả 400. Service tự đọc đúng vài
 * trường nó cần và bỏ qua phần còn lại.
 */
@Controller('telegram')
export class TelegramBotController {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  @Post('webhook')
  @UseGuards(TelegramWebhookGuard)
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async receive(@Body() update: TelegramUpdate): Promise<{ ok: true }> {
    await this.telegramBotService.handleUpdate(update);
    return { ok: true };
  }
}
