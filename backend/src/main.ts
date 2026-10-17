import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // `rawBody`: webhook Resend ký trên đúng từng byte của body (xem
  // `ResendWebhookGuard`), nên cần giữ lại bản gốc trước khi JSON được parse.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Sau reverse proxy (Nginx, Railway, Render...) IP thật của client nằm ở
  // header X-Forwarded-For. Không bật thì rate limit sẽ tính chung mọi request
  // vào một IP duy nhất của proxy.
  app.set('trust proxy', 1);

  // Chạy `onApplicationShutdown` khi nhận SIGTERM (docker stop, deploy):
  // `ImageWorkerHost` cần nó để dừng process worker nén ảnh cho gọn.
  app.enableShutdownHooks();

  // Ảnh khách tải lên nằm trên đĩa (xem `LocalDiskProvider`) và được serve lại
  // qua đúng prefix mà provider ghi vào URL. Đổi sang S3/CDN thì bỏ dòng này.
  //
  // Cache vĩnh viễn, cùng lý do với `Cache-Control` của ảnh lên R2: tên tệp là
  // ngẫu nhiên và không bao giờ bị ghi đè, nên một URL chỉ trỏ về đúng một nội
  // dung. Thiếu header này thì mỗi lần khách mở lại thiệp là tải lại cả album.
  app.useStaticAssets(
    join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'),
    {
      prefix: process.env.UPLOAD_PUBLIC_PATH ?? '/uploads',
      maxAge: '365d',
      immutable: true,
    },
  );

  // CORS cho phép frontend Next.js gọi API kèm Authorization header.
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // loại bỏ field thừa không khai báo trong DTO
      forbidNonWhitelisted: true, // báo lỗi nếu client gửi field lạ
      transform: true, // tự ép kiểu theo type của DTO
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
