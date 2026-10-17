import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { AutocompletePlacesDto } from './dto/autocomplete-places.dto';
import { ResolveMapLinkDto } from './dto/resolve-map-link.dto';
import { MapLinkService } from './map-link.service';
import { PlaceDetailsDto } from './dto/place-details.dto';
import { PlacesService } from './places.service';

/**
 * Proxy gợi ý địa điểm.
 *
 * **Không bắt đăng nhập.** Editor mở cho cả khách chưa có tài khoản (soạn thử
 * rồi mới đăng ký), nên bắt đăng nhập ở đây là chặn đúng nhóm người dùng chính.
 * Nguồn mặc định là Photon — miễn phí — nên traffic ẩn danh không tiêu tiền của
 * ai; hàng rào cho nhóm này là `@Throttle` theo IP cộng cache.
 *
 * Ranh giới nằm ở chỗ khác: khi cấu hình `GOOGLE_PLACES_API_KEY`, mỗi lượt gọi
 * là một khoản tiền, và lúc đó `PlacesService` **bắt buộc phải có tài khoản** để
 * còn quy trách nhiệm và trừ hạn mức theo người.
 */
@Controller('places')
@UseGuards(OptionalJwtAuthGuard)
export class PlacesController {
  constructor(
    private readonly placesService: PlacesService,
    private readonly mapLinkService: MapLinkService,
  ) {}

  /**
   * POST /places/resolve-link — bóc toạ độ từ link chia sẻ Google Maps.
   *
   * Không cần API key nên không đụng tới quota theo ngày của `PlacesService`;
   * throttle ở đây chỉ để không ai biến backend thành công cụ dò redirect.
   * POST vì link Maps rất dài và không nên nằm lại trong access log.
   */
  @Post('resolve-link')
  @Throttle({ default: { limit: 30, ttl: 5 * 60_000 } })
  @HttpCode(HttpStatus.OK)
  resolveLink(@Body() dto: ResolveMapLinkDto) {
    return this.mapLinkService.resolve(dto.url);
  }

  // GET /places/autocomplete?q=...&sessionToken=...
  // 60 lượt / 5 phút: người gõ tay có debounce 350ms không bao giờ chạm tới.
  @Get('autocomplete')
  @Throttle({ default: { limit: 60, ttl: 5 * 60_000 } })
  autocomplete(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() dto: AutocompletePlacesDto,
  ) {
    return this.placesService.autocomplete(
      user?.userId ?? null,
      dto.q,
      dto.sessionToken,
    );
  }

  // GET /places/details?placeId=...&sessionToken=...
  // Chỉ gọi khi người dùng bấm chọn một gợi ý nên hạn mức chặt hơn nhiều.
  @Get('details')
  @Throttle({ default: { limit: 20, ttl: 5 * 60_000 } })
  details(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query() dto: PlaceDetailsDto,
  ) {
    return this.placesService.details(
      user?.userId ?? null,
      dto.placeId,
      dto.sessionToken,
    );
  }
}
