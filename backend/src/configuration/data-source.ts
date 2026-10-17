import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

/**
 * DataSource dành riêng cho **TypeORM CLI** (`migration:generate`,
 * `migration:run`). Ứng dụng lúc chạy không dùng file này — nó đi qua
 * `typeorm.config.ts` với `ConfigService` của Nest.
 *
 * Phải có hai bản vì CLI chạy ngoài Nest nên không có DI container: nó cần một
 * DataSource dựng sẵn và tự đọc `.env`.
 *
 * `synchronize` luôn `false` ở đây, kể cả khi `.env` bật: mục đích của file này
 * là sinh và chạy migration, mà `synchronize` thì lặng lẽ sửa schema sau lưng
 * migration và làm bản diff sinh ra bị rỗng.
 */
loadEnv();

// Chạy bằng ts-node thì đọc `.ts` trong `src/`, chạy bản build thì đọc `.js`
// trong `dist/`. Suy từ đuôi của chính file này thay vì thêm một biến môi trường.
const isCompiled = __filename.endsWith('.js');
const root = isCompiled ? join(__dirname, '..') : join(__dirname, '..');
const extension = isCompiled ? 'js' : 'ts';

// Đúng **một** export DataSource trong file — CLI của TypeORM từ chối file có
// nhiều hơn một, nên không thêm `export default` bên cạnh.
export const appDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(root, `**/*.entity.${extension}`)],
  migrations: [join(root, `migrations/*.${extension}`)],
  synchronize: false,
  // Mỗi migration một transaction, không gộp cả lượt. Postgres không cho dùng
  // giá trị vừa `ALTER TYPE ... ADD VALUE` trước khi commit, nên gộp chung thì
  // DB dựng mới vấp ở `MoveAdminsToKeycloak` (dùng `super_admin` mà migration
  // trước vừa thêm). Khai ở đây chứ không ở script để cả service `migrate` của
  // docker-compose cũng hưởng.
  migrationsTransactionMode: 'each',
  logging: process.env.DB_LOGGING === 'true',
});
