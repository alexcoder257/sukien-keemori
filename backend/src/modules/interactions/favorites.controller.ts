import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-wish.dto';
import { FavoritesService } from './favorites.service';

/**
 * Mẫu thiệp yêu thích. Ba route dưới đây khớp đúng hợp đồng đã ghi sẵn trong
 * `frontend/apis/favorite.ts` — file đó chỉ cần thay thân ba hàm bằng
 * `request()`, không phải sửa hook hay component nào.
 */
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.findSlugs(user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  add(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.add(user.userId, dto);
  }

  @Delete(':templateSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('templateSlug') templateSlug: string,
  ) {
    return this.favoritesService.remove(user.userId, templateSlug);
  }
}
