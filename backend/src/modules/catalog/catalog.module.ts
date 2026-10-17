import { RevalidateModule } from '@common/revalidate/revalidate.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CatalogAdminController,
  CatalogController,
} from './catalog.controller';
import {
  TemplateRepository,
  TemplateViewRepository,
} from './catalog.repository';
import { CatalogService } from './catalog.service';
import { TemplateDailyView } from './template-daily-view.entity';
import { Template } from './template.entity';

@Module({
  // `SettingsModule` không phụ thuộc domain nào nên import vào đây an toàn:
  // số mẫu hiện trên trang chủ là cấu hình vận hành, không phải hằng số.
  imports: [
    TypeOrmModule.forFeature([Template, TemplateDailyView]),
    SettingsModule,
    RevalidateModule,
  ],
  controllers: [CatalogController, CatalogAdminController],
  providers: [CatalogService, TemplateRepository, TemplateViewRepository],
  // Chuẩn team: chỉ export Service. `cards` cần tra mẫu.
  exports: [CatalogService],
})
export class CatalogModule {}
