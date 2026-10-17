import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Trả về cấu hình kết nối Postgres cho TypeORM.
 * Được dùng trong AppModule qua TypeOrmModule.forRootAsync.
 */
export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE'),
  // Tự động nạp mọi entity được đăng ký qua TypeOrmModule.forFeature()
  autoLoadEntities: true,
  // CHỈ bật ở môi trường dev. Production dùng migration.
  synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
  logging: configService.get<string>('DB_LOGGING') === 'true',
});
