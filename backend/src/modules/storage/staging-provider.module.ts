import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStagingStorage } from './providers/local-staging.provider';
import { R2StagingStorage } from './providers/r2-staging.provider';
import { STAGING_STORAGE } from './staging.types';

/**
 * Chọn vùng tạm theo cùng biến `STORAGE_DRIVER` với kho công khai: `r2` thì
 * bucket tạm trên R2, còn lại là thư mục trên đĩa. Tách module riêng vì cả API
 * lẫn worker nén ảnh (`ImageWorkerModule`) cần nó, mà worker không được kéo
 * theo `CardsModule` và cả cây phụ thuộc của nó.
 *
 * `useFactory` cùng lý do với `StorageProviderModule`: `R2StagingStorage` gọi
 * `getOrThrow`, để Nest tự dựng thì môi trường chưa cấu hình R2 sẽ sập lúc
 * khởi động.
 */
@Module({
  providers: [
    LocalStagingStorage,
    {
      provide: STAGING_STORAGE,
      inject: [ConfigService, LocalStagingStorage],
      useFactory: (configService: ConfigService, local: LocalStagingStorage) =>
        configService.get<string>('STORAGE_DRIVER') === 'r2'
          ? new R2StagingStorage(configService)
          : local,
    },
  ],
  exports: [STAGING_STORAGE],
})
export class StagingProviderModule {}
