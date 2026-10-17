import { CatalogService } from '@modules/catalog/catalog.service';
import { Injectable } from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-wish.dto';
import { FavoriteRepository } from './interactions.repository';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly favoriteRepository: FavoriteRepository,
    private readonly catalogService: CatalogService,
  ) {}

  findSlugs(userId: string): Promise<string[]> {
    return this.favoriteRepository.findSlugsByUser(userId);
  }

  /**
   * Tim một mẫu. Idempotent: tim lại mẫu đã tim thì không tạo bản ghi thứ hai
   * và cũng không báo lỗi — nút tim ở UI là toggle, người dùng bấm hai lần
   * nhanh không phải là một lỗi cần hiện ra.
   */
  async add(userId: string, dto: CreateFavoriteDto): Promise<void> {
    // Kiểm mẫu có thật, nếu không thì danh sách yêu thích sẽ đầy slug rác.
    await this.catalogService.findTemplateBySlug(dto.templateSlug);
    const existing = await this.favoriteRepository.findOneBy({
      userId,
      templateSlug: dto.templateSlug,
    });
    if (existing) return;
    await this.favoriteRepository.save(
      this.favoriteRepository.create({
        userId,
        templateSlug: dto.templateSlug,
      }),
    );
  }

  async remove(userId: string, templateSlug: string): Promise<void> {
    await this.favoriteRepository.delete({ userId, templateSlug });
  }
}
