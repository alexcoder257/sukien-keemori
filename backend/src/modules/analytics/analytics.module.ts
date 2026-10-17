import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AnalyticsController,
  GoogleAnalyticsAdminController,
} from './analytics.controller';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';
import { DailyVisit } from './daily-visit.entity';
import { GoogleAnalyticsService } from './google-analytics.service';

/**
 * Lưu lượng truy cập website. Không phụ thuộc domain nào — `admin-dashboard`
 * import để ghép vào màn phân tích.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DailyVisit])],
  controllers: [AnalyticsController, GoogleAnalyticsAdminController],
  providers: [AnalyticsService, AnalyticsRepository, GoogleAnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
