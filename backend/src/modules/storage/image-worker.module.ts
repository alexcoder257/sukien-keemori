import { typeOrmConfig } from '@configuration/typeorm.config';
import { Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageProcessorService } from './image-processor.service';
import { ImageQueueProcessor } from './image-queue.processor';
import { StagedPhoto } from './staged-photo.entity';
import { StagingProviderModule } from './staging-provider.module';
import { UploadSession } from './upload-session.entity';
import { StagedPhotoRepository } from './upload-staging.repository';

/**
 * Module gốc của **process worker nén ảnh** (`src/image-worker.ts`), không phải
 * một phần của `AppModule`.
 *
 * Cố ý nhỏ: chỉ database, vùng tạm và bộ nén. Không `CardsModule`, không
 * controller, không cron — worker không phục vụ HTTP và không phải biết thiệp
 * là gì, nên RAM của nó dành gần trọn cho `sharp`.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...typeOrmConfig(configService),
        // Hai kết nối là đủ: worker xử lý đúng một tấm một lúc.
        extra: { max: 2 },
      }),
    }),
    TypeOrmModule.forFeature([UploadSession, StagedPhoto]),
    StagingProviderModule,
  ],
  providers: [
    ImageQueueProcessor,
    ImageProcessorService,
    StagedPhotoRepository,
  ],
})
export class ImageWorkerModule implements OnApplicationShutdown {
  constructor(private readonly processor: ImageQueueProcessor) {}

  onApplicationShutdown(): void {
    this.processor.stop();
  }
}
