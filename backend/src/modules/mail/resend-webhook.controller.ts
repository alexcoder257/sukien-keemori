import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ResendWebhookGuard } from './guards/resend-webhook.guard';
import { ResendWebhookService } from './resend-webhook.service';
import type { ResendWebhookEvent } from './resend-webhook.service';

/**
 * Webhook Resend gọi vào khi có thư tới `@keemori.com` hoặc thư đi gặp sự cố.
 *
 * Không có DTO, cùng lý do với `TelegramBotController`: `ValidationPipe` toàn
 * cục bật `forbidNonWhitelisted`, mà payload của Resend có nhiều trường và thêm
 * dần — khai DTO là mỗi lần Resend thêm trường thì webhook trả 400. Chữ ký đã
 * được `ResendWebhookGuard` kiểm; service chỉ đọc vài trường nó cần.
 */
@Controller('resend')
export class ResendWebhookController {
  constructor(private readonly resendWebhookService: ResendWebhookService) {}

  @Post('webhook')
  @UseGuards(ResendWebhookGuard)
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  receive(@Body() event: ResendWebhookEvent): { ok: true } {
    this.resendWebhookService.handle(event);
    return { ok: true };
  }
}
