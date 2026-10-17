import { NestFactory } from '@nestjs/core';
import sharp from 'sharp';
import { ImageQueueProcessor } from '@modules/storage/image-queue.processor';
import { ImageWorkerModule } from '@modules/storage/image-worker.module';

/**
 * Điểm vào của **process worker nén ảnh**. Không chạy tay: `ImageWorkerHost`
 * trong process API sinh ra nó bằng `fork`, hạ độ ưu tiên CPU và dựng lại khi
 * nó chết. Xem `ImageQueueProcessor` cho lý do tách process.
 */
async function bootstrap() {
  // libvips mặc định mở số luồng bằng số lõi. Giới hạn một luồng để worker
  // chiếm tối đa một lõi của VPS 2 lõi, lõi còn lại luôn dành cho API.
  sharp.concurrency(1);
  // Cache của libvips giữ bitmap đã giải mã để tái dùng — vô ích khi mỗi tấm
  // chỉ đọc một lần, chỉ làm RAM của worker phình lên.
  sharp.cache(false);

  const app = await NestFactory.createApplicationContext(ImageWorkerModule);
  app.enableShutdownHooks();

  // Process cha (API) chết hoặc khởi động lại thì kênh IPC đứt: thoát theo,
  // không để lại một worker mồ côi chạy song song với worker mới.
  process.on('disconnect', () => {
    void app.close().finally(() => process.exit(0));
  });

  await app.get(ImageQueueProcessor).run();
  await app.close();
}
void bootstrap();
