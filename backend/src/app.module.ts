import { isRateLimitEnabled } from '@configuration/rate-limit.config';
import { typeOrmConfig } from '@configuration/typeorm.config';
import { AdminDashboardModule } from '@modules/admin-dashboard/admin-dashboard.module';
import { AuditModule } from '@modules/audit/audit.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { AdminAuthModule } from '@modules/admin-auth/admin-auth.module';
import { AuthModule } from '@modules/auth/auth.module';
import { CardsModule } from '@modules/cards/cards.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { CommerceModule } from '@modules/commerce/commerce.module';
import { ContentModule } from '@modules/content/content.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { PricingModule } from '@modules/pricing/pricing.module';
import { PlacesModule } from '@modules/places/places.module';
import { LegalModule } from '@modules/legal/legal.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { StorageModule } from '@modules/storage/storage.module';
import { TelegramBotModule } from '@modules/telegram-bot/telegram-bot.module';
import { InteractionsModule } from '@modules/interactions/interactions.module';
import { TodoModule } from '@modules/todo/todo.module';
import { UserModule } from '@modules/user/user.module';
import { VouchersModule } from '@modules/vouchers/vouchers.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CronjobModule } from './cronjob/cronjob.module';

@Module({
  imports: [
    // Đọc .env, để global nên mọi module dùng được ConfigService
    ConfigModule.forRoot({ isGlobal: true }),
    // Kết nối DB bất đồng bộ: chờ ConfigService sẵn sàng rồi lấy config
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        typeOrmConfig(configService),
    }),
    // Hạn mức chung cho mọi route: 60 request/phút cho mỗi IP.
    // Các route nhạy cảm siết chặt hơn bằng @Throttle ở controller.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 60 }],
        // RATE_LIMIT_ENABLED=false → bỏ qua toàn bộ rate limit (chỉ dùng khi dev).
        skipIf: () => !isRateLimitEnabled(configService),
      }),
    }),
    // Bộ đếm giờ cho việc chạy theo lịch (xem `src/cronjob/`).
    ScheduleModule.forRoot(),
    TodoModule,
    UserModule,
    AuthModule,
    AdminAuthModule,
    CatalogModule,
    CardsModule,
    InteractionsModule,
    NotificationsModule,
    PlacesModule,
    SettingsModule,
    LegalModule,
    CommerceModule,
    PricingModule,
    VouchersModule,
    PaymentsModule,
    StorageModule,
    ContentModule,
    AdminDashboardModule,
    AuditModule,
    AnalyticsModule,
    TelegramBotModule,
    CronjobModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Áp ThrottlerGuard toàn cục.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
