import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { QueryAdminTemplateReviewsDto } from './dto/query-admin-template-reviews.dto';
import { UpsertTemplateReviewDto } from './dto/upsert-template-review.dto';
import { TemplateReviewService } from './interactions.service';
import type { AdminUser } from '@modules/admin-auth/admin-auth.types';
import { CurrentAdmin } from '@modules/admin-auth/decorators/current-admin.decorator';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

/**
 * Đánh giá mẫu thiệp: đọc công khai, viết thì phải đăng nhập.
 *
 * `summaries` khai **trước** `:slug` — Nest so khớp theo thứ tự khai báo, để
 * sau thì `GET /template-reviews/summaries` sẽ rơi vào route động và bị hiểu
 * thành một mẫu tên "summaries".
 */
@Controller('template-reviews')
export class TemplateReviewController {
  constructor(private readonly templateReviewService: TemplateReviewService) {}

  @Get('summaries')
  summarize() {
    return this.templateReviewService.summarizeAll();
  }

  /**
   * Guard tuỳ chọn: khách vãng lai vẫn đọc được, còn người đã đăng nhập thì
   * mỗi đánh giá kèm cờ `mine` để UI biết bản nào cho phép sửa/xoá.
   */
  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  findByTemplate(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.templateReviewService.findByTemplate(slug, user?.userId);
  }

  /**
   * Gửi/sửa đánh giá. `POST` chứ không `PUT` vì phần lớn lượt gọi là tạo mới;
   * gửi lại chỉ ghi đè đúng bản của người gửi (mỗi người một đánh giá mỗi mẫu).
   *
   * Siết nhịp riêng: đánh giá là nội dung công khai người khác đọc được, nên
   * đây là đường dễ bị lạm dụng nhất trong module này.
   */
  @Post(':slug')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: UpsertTemplateReviewDto,
  ) {
    return this.templateReviewService.upsert(user.userId, slug, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.templateReviewService.remove(user.userId, slug);
  }

  /**
   * Bấm "Hữu ích" cho đánh giá của người khác.
   *
   * Hai đoạn đường dẫn nên không đụng `:slug` (một đoạn), và `ParseUUIDPipe`
   * chốt thêm một lớp nữa: slug của mẫu không bao giờ là UUID.
   */
  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  markHelpful(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templateReviewService.setHelpful(user.userId, id, true);
  }

  @Delete(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  unmarkHelpful(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templateReviewService.setHelpful(user.userId, id, false);
  }
}

/**
 * Kiểm duyệt đánh giá mẫu thiệp — quyền *Admin*.
 *
 * Chỉ **đọc và gỡ**: admin không sửa được điểm hay lời của người khác, vì một
 * nhận xét bị biên tập lại thì không còn là nhận xét của ai cả. Đánh giá vẫn
 * hiện ngay khi gửi (không có bước duyệt trước như `Wish`); màn này để xử lý
 * nội dung không phù hợp sau khi nó đã lên.
 */
@Controller('admin/template-reviews')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('reviews:manage')
export class TemplateReviewAdminController {
  constructor(private readonly templateReviewService: TemplateReviewService) {}

  @Get()
  findAll(@Query() query: QueryAdminTemplateReviewsDto) {
    return this.templateReviewService.findForAdmin(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentAdmin() actor: AdminUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templateReviewService.removeAsAdmin(actor, id);
  }
}
