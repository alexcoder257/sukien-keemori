import { RevalidateModule } from '@common/revalidate/revalidate.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SettingsAdminController,
  SettingsPublicController,
} from './settings.controller';
import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';
import { SiteSettings } from './site-settings.entity';

/**
 * Cấu hình vận hành toàn site. Module này **không phụ thuộc domain nào** nên ai
 * cũng import được mà không sợ vòng phụ thuộc — `cards` là chỗ dùng đầu tiên.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SiteSettings]), RevalidateModule],
  controllers: [SettingsAdminController, SettingsPublicController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsService],
})
export class SettingsModule {}
