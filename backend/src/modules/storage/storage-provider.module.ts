import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalDiskProvider } from './providers/local-disk.provider';
import { R2Provider } from './providers/r2.provider';
import { STORAGE_PROVIDER } from './storage.types';

/**
 * Chỗ duy nhất chọn **nơi** lưu tệp, tách khỏi `StorageModule` vốn còn chứa
 * controller upload và `StorageService`.
 *
 * Tách ra vì `StorageModule` import `CardsModule` (mỗi lần tải ảnh lên phải
 * kiểm chủ thiệp), nên `CardsModule` không import ngược lại được. Mà `cards`
 * lại cần đúng một thứ khi xoá thiệp: xoá luôn thư mục ảnh của nó. Module này
 * **không phụ thuộc module nào**, nên cả hai bên cùng import được mà không sinh
 * vòng.
 *
 * `R2Provider` được dựng bằng `useFactory` chứ không khai thẳng trong
 * `providers`, vì constructor của nó gọi `getOrThrow` cho 4 biến môi trường —
 * để Nest tự khởi tạo thì mọi môi trường chưa cấu hình R2 sẽ **sập lúc khởi
 * động** dù không hề dùng tới.
 */
@Module({
  providers: [
    LocalDiskProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, LocalDiskProvider],
      useFactory: (
        configService: ConfigService,
        localDisk: LocalDiskProvider,
      ) =>
        configService.get<string>('STORAGE_DRIVER') === 'r2'
          ? new R2Provider(configService)
          : localDisk,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageProviderModule {}
