import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { CardsModule } from '@modules/cards/cards.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { CommerceModule } from '@modules/commerce/commerce.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import {
  AdminDashboardController,
  AnalyticsAdminController,
  TemplateStatsAdminController,
  UserSummaryAdminController,
} from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

/** Chỉ đọc, không có entity riêng — xem ghi chú trong `AdminDashboardService`. */
@Module({
  imports: [
    UserModule,
    CardsModule,
    CatalogModule,
    CommerceModule,
    AnalyticsModule,
  ],
  controllers: [
    AdminDashboardController,
    AnalyticsAdminController,
    TemplateStatsAdminController,
    UserSummaryAdminController,
  ],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
