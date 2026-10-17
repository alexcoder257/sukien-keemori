import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationDto } from '@common/dto/pagination.dto';
import { ContentService } from './content.service';
import { QueryFaqDto } from './dto/query-content.dto';
import { UpdateSiteStatsDto } from './dto/update-site-stats.dto';
import { CreateFaqDto, UpdateFaqDto } from './dto/upsert-faq.dto';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';
import {
  CreateCoupleShowcaseDto,
  ReorderCoupleShowcasesDto,
  UpdateCoupleShowcaseDto,
} from './dto/upsert-couple-showcase.dto';

/**
 * Nội dung biên tập: FAQ, dải thiệp trưng bày và số liệu
 * marketing. Toàn bộ là **công khai, chỉ đọc** — mọi trang dùng chúng đều là
 * Server Component render trước khi biết người xem là ai.
 *
 * Nhánh soạn thảo nằm ở `ContentAdminController` bên dưới, cùng cách `catalog`
 * đang làm: prefix `/admin` gom một chỗ và guard khai một lần cho cả nhóm.
 */
@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('faqs')
  findFaqs(@Query() query: QueryFaqDto) {
    return this.contentService.findFaqs(query.locale ?? 'vi');
  }

  @Get('couple-showcases')
  findCoupleShowcases() {
    return this.contentService.findCoupleShowcases();
  }

  @Get('site-stats')
  findSiteStats() {
    return this.contentService.findSiteStats();
  }
}

/**
 * Soạn thảo nội dung — spec mục 4 (FAQ) và 11 (đánh giá trang chủ),
 * cùng một quyền `content:manage`.
 *
 * Route đọc ở đây **không** trùng route công khai phía trên: bản admin trả bản
 * ghi thô, gồm cả mục đang tắt và cả hai ngôn ngữ của FAQ.
 */
@Controller('admin')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('content:manage')
export class ContentAdminController {
  constructor(private readonly contentService: ContentService) {}

  /* ------------------------------------------------------------------- FAQ */

  @Get('faqs')
  findFaqs(@Query() page: PaginationDto) {
    return this.contentService.findAllFaqs(page);
  }

  @Post('faqs')
  createFaq(@Body() dto: CreateFaqDto) {
    return this.contentService.createFaq(dto);
  }

  @Patch('faqs/:id')
  updateFaq(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFaqDto) {
    return this.contentService.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @HttpCode(204)
  removeFaq(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.removeFaq(id);
  }

  /* -------------------------------------------------------- couple showcase */

  /**
   * Dải "Cặp đôi đã tạo thiệp" ở trang chủ. Bản admin trả cả ô đang tắt — màn
   * CMS sửa chính bản ghi nên phải thấy đúng thứ đang nằm trong bảng.
   */
  @Get('couple-showcases')
  findCoupleShowcases(@Query() page: PaginationDto) {
    return this.contentService.findAllCoupleShowcases(page);
  }

  @Post('couple-showcases')
  createCoupleShowcase(@Body() dto: CreateCoupleShowcaseDto) {
    return this.contentService.createCoupleShowcase(dto);
  }

  /** Kéo thả ở CMS: ghi lại thứ tự của cả dải. */
  @Put('couple-showcases/order')
  @HttpCode(204)
  reorderCoupleShowcases(@Body() dto: ReorderCoupleShowcasesDto) {
    return this.contentService.reorderCoupleShowcases(dto.ids);
  }

  @Patch('couple-showcases/:id')
  updateCoupleShowcase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCoupleShowcaseDto,
  ) {
    return this.contentService.updateCoupleShowcase(id, dto);
  }

  @Delete('couple-showcases/:id')
  @HttpCode(204)
  removeCoupleShowcase(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.removeCoupleShowcase(id);
  }

  /* ------------------------------------------------------------ site stats */

  /**
   * Dải số liệu ở trang chủ.
   *
   * Khoá là **cố định** (whitelist ở `SITE_STAT_KEYS`) nên không có `POST` và
   * không có `DELETE`: thêm một số liệu mới đồng nghĩa phải sửa cả chỗ hiển thị
   * bên frontend, còn xoá một khoá chỉ khiến trang khách hiện số 0.
   */
  @Get('site-stats')
  findSiteStats() {
    return this.contentService.findAllSiteStats();
  }

  @Patch('site-stats')
  updateSiteStats(@Body() dto: UpdateSiteStatsDto) {
    return this.contentService.updateSiteStats(dto);
  }
}
