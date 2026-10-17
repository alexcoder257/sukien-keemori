import { AdminAlertsModule } from '@modules/admin-alerts/admin-alerts.module';
import { Module } from '@nestjs/common';
import { ResendWebhookGuard } from './guards/resend-webhook.guard';
import { MailService } from './mail.service';
import { ResendWebhookController } from './resend-webhook.controller';
import { ResendWebhookService } from './resend-webhook.service';

@Module({
  imports: [AdminAlertsModule],
  controllers: [ResendWebhookController],
  providers: [MailService, ResendWebhookService, ResendWebhookGuard],
  exports: [MailService],
})
export class MailModule {}
