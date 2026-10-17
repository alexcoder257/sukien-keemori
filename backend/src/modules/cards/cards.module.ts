import { RevalidateModule } from '@common/revalidate/revalidate.module';
import { AuditModule } from '@modules/audit/audit.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { StorageProviderModule } from '@modules/storage/storage-provider.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CardsAdminController,
  CardsController,
  PublicCardsController,
} from './cards.controller';
import {
  CardGuestRepository,
  CardsRepository,
  CardSlugAliasRepository,
  CardViewRepository,
} from './cards.repository';
import { CardsService } from './cards.service';
import { SharePreviewService } from '@modules/cards/share-preview.service';
import { CardGuest } from './card-guest.entity';
import { CardSlugAlias } from './card-slug-alias.entity';
import { CardView } from './card-view.entity';
import { WeddingCard } from './wedding-card.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeddingCard, CardSlugAlias, CardView, CardGuest]),
    // Ghi nhật ký khi admin mở/khoá tên cô dâu chú rể. `audit` không import
    // module nào nên không có vòng phụ thuộc.
    AuditModule,
    CatalogModule,
    RevalidateModule,
    // Chỉ để xoá thư mục ảnh khi thiệp bị xoá. Import `StorageProviderModule`
    // chứ không phải `StorageModule`: `StorageModule` import ngược `CardsModule`
    // nên gọi thẳng vào nó là một vòng phụ thuộc.
    StorageProviderModule,
  ],
  controllers: [CardsController, PublicCardsController, CardsAdminController],
  providers: [
    CardsService,
    SharePreviewService,
    CardsRepository,
    CardSlugAliasRepository,
    CardViewRepository,
    CardGuestRepository,
  ],
  // `interactions` cần phân giải slug và kiểm quyền sở hữu. Nó phụ thuộc vào
  // `cards`, không có chiều ngược lại — nhờ vậy không phải dùng forwardRef.
  exports: [CardsService],
})
export class CardsModule {}
