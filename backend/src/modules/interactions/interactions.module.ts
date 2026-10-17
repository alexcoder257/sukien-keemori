import { AuditModule } from '@modules/audit/audit.module';
import { RevalidateModule } from '@common/revalidate/revalidate.module';
import { CardsModule } from '@modules/cards/cards.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './favorite.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import {
  TemplateReviewAdminController,
  TemplateReviewController,
} from './interactions.controller';
import {
  FavoriteRepository,
  RsvpRepository,
  TemplateReviewHelpfulRepository,
  TemplateReviewRepository,
  WishRepository,
} from './interactions.repository';
import { TemplateReviewService } from './interactions.service';
import { Rsvp } from './rsvp.entity';
import { PublicRsvpsController, RsvpsController } from './rsvps.controller';
import { RsvpsService } from './rsvps.service';
import { TemplateReviewHelpful } from './template-review-helpful.entity';
import { TemplateReview } from './template-review.entity';
import { Wish } from './wish.entity';
import {
  PublicWishesController,
  WishStatsController,
  WishesController,
} from './wishes.controller';
import { WishesService } from './wishes.service';

/**
 * Tương tác của người dùng lên kho mẫu và lên thiệp: đánh giá mẫu, mẫu yêu
 * thích, sổ lưu bút và xác nhận tham dự. Khác nhau về nghiệp vụ nhưng cùng một
 * hình dạng — dữ liệu người dùng gắn vào một mẫu hoặc một thiệp — nên chúng ở
 * chung domain thay vì đẻ ra bốn thư mục.
 *
 * Module này phụ thuộc `cards` (phân giải slug, kiểm quyền sở hữu), `catalog`
 * (kiểm mẫu có thật) và `notifications` (báo chủ thiệp có lời chúc chờ duyệt).
 * Chiều ngược lại không tồn tại, nên không cần `forwardRef`.
 *
 * Chuẩn team: chỉ export service.
 */
@Module({
  imports: [
    AuditModule,
    RevalidateModule,
    TypeOrmModule.forFeature([
      TemplateReview,
      TemplateReviewHelpful,
      Wish,
      Rsvp,
      Favorite,
    ]),
    CardsModule,
    CatalogModule,
    NotificationsModule,
  ],
  controllers: [
    TemplateReviewController,
    TemplateReviewAdminController,
    PublicWishesController,
    WishesController,
    WishStatsController,
    PublicRsvpsController,
    RsvpsController,
    FavoritesController,
  ],
  providers: [
    TemplateReviewService,
    WishesService,
    RsvpsService,
    FavoritesService,
    TemplateReviewRepository,
    TemplateReviewHelpfulRepository,
    WishRepository,
    RsvpRepository,
    FavoriteRepository,
  ],
  exports: [
    TemplateReviewService,
    WishesService,
    RsvpsService,
    FavoritesService,
  ],
})
export class InteractionsModule {}
