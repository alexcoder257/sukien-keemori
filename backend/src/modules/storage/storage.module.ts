import { CardsModule } from '@modules/cards/cards.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditorialUploadController } from './editorial-upload.controller';
import { UploadSessionGuard } from './guards/upload-session.guard';
import { ImageProcessorService } from './image-processor.service';
import { ImageWorkerHost } from './image-worker.host';
import { StagedPhoto } from './staged-photo.entity';
import { StagingProviderModule } from './staging-provider.module';
import { StorageProviderModule } from './storage-provider.module';
import { StorageService } from './storage.service';
import { UploadSession } from './upload-session.entity';
import { UploadSessionsController } from './upload-sessions.controller';
import {
  StagedPhotoRepository,
  UploadSessionRepository,
} from './upload-staging.repository';
import { UploadStagingService } from './upload-staging.service';

/**
 * Đường tải ảnh lên. `StorageService` và mọi module gọi tới nó không biết tệp
 * nằm ở đâu.
 *
 * Việc **chọn** nơi lưu nằm ở `StorageProviderModule` (kho công khai) và
 * `StagingProviderModule` (vùng tạm); module này chỉ dựng đường tải lên. Tách
 * nhau để `cards` dùng được provider mà không sinh phụ thuộc vòng — xem chú
 * thích ở `StorageProviderModule`.
 *
 * `ImageWorkerHost` sinh process worker nén ảnh — xem `ImageQueueProcessor`.
 */
@Module({
  imports: [
    CardsModule,
    StorageProviderModule,
    StagingProviderModule,
    TypeOrmModule.forFeature([UploadSession, StagedPhoto]),
  ],
  controllers: [UploadSessionsController, EditorialUploadController],
  providers: [
    StorageService,
    ImageProcessorService,
    UploadStagingService,
    UploadSessionRepository,
    StagedPhotoRepository,
    UploadSessionGuard,
    ImageWorkerHost,
  ],
  exports: [StorageService, UploadStagingService],
})
export class StorageModule {}
