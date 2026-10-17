import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CatalogService } from './catalog.service';
import { QueryAdminTemplatesDto } from './dto/query-admin-templates.dto';
import { QueryTemplatesDto } from './dto/query-templates.dto';
import { RecordTemplateViewDto } from './dto/record-template-view.dto';
import {
  SetHomepageTemplatesDto,
  UpdateTemplateDto,
} from './dto/update-template.dto';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

/**
 * Kho mẫu — dữ liệu công khai, không cần đăng nhập: trang chủ và trang kho
 * mẫu đều render ở Server Component trước khi biết
 * người xem là ai.
 */
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('templates')
  findTemplates(@Query() query: QueryTemplatesDto) {
    return this.catalogService.findTemplates(query);
  }

  /**
   * Dải mẫu trang chủ. Khai **trước** `:slug` vì Nest so khớp theo thứ tự khai
   * báo, và `homepage` sẽ bị hiểu thành một slug.
   */
  @Get('templates/homepage')
  findHomepageTemplates() {
    return this.catalogService.findHomepageTemplates();
  }

  @Get('templates/:slug')
  findTemplate(@Param('slug') slug: string) {
    return this.catalogService.findTemplateBySlug(slug);
  }

  /**
   * Beacon "khách vừa mở mẫu này", gọi từ trang mẫu và trang demo. Công khai
   * như `public/visits`: khách chưa đăng nhập cũng phải đếm được. Trình duyệt
   * tự giới hạn một lần mỗi mẫu mỗi ngày; throttle ở đây chặn kẻ cố tình bơm.
   */
  @Post('templates/:slug/views')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async recordView(
    @Param('slug') slug: string,
    @Body() dto: RecordTemplateViewDto,
  ): Promise<void> {
    await this.catalogService.recordTemplateView(slug, dto.kind);
  }
}

/** Nhánh cấu hình của admin, tách controller để prefix `/admin` nằm một chỗ. */
@Controller('admin')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('templates:manage')
export class CatalogAdminController {
  constructor(private readonly catalogService: CatalogService) {}

  /** Kho mẫu đầy đủ cho màn quản lý tag/bậc (spec mục 7). */
  @Get('templates')
  findTemplates(@Query() query: QueryAdminTemplatesDto) {
    return this.catalogService.findAllTemplates(query);
  }

  @Patch('templates/:slug')
  updateTemplate(@Param('slug') slug: string, @Body() dto: UpdateTemplateDto) {
    return this.catalogService.updateTemplate(slug, dto);
  }

  /** Đặt lại cả dải mẫu trang chủ theo thứ tự gửi lên (spec mục 8). */
  @Put('homepage-templates')
  setHomepageTemplates(@Body() dto: SetHomepageTemplatesDto) {
    return this.catalogService.setHomepageTemplates(dto.slugs);
  }
}
