import { fork } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { setPriority } from 'node:os';
import { join } from 'node:path';
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** `nice` 10: nhường CPU cho API mỗi khi hai bên tranh nhau. */
const WORKER_NICENESS = 10;
const MIN_RESTART_DELAY_MS = 1000;
const MAX_RESTART_DELAY_MS = 30_000;
/** Sống được chừng này thì coi là khoẻ, lần chết sau bắt đầu lại từ 1 giây. */
const HEALTHY_UPTIME_MS = 60_000;

/**
 * Sinh và trông **process worker nén ảnh** (`src/image-worker.ts`) ngay trong
 * container backend.
 *
 * Trong container chứ không phải một service Compose riêng, vì script deploy
 * trên VPS (`.github/scripts/deploy-server.py`) cố ý từ chối mọi thay đổi danh
 * sách service — thêm service là một bước bảo trì tay. Process con cho gần đủ
 * cái lợi của service riêng: hạ được `nice`, hết RAM thì hệ điều hành giết nó
 * chứ không giết API, và chết thì được dựng lại ở đây.
 *
 * `IMAGE_WORKER=off` tắt hẳn — dùng khi sau này worker chạy ở chỗ khác (container
 * riêng, máy riêng) để không có hai nơi cùng rút hàng đợi. Rút trùng thì cũng
 * an toàn (`FOR UPDATE SKIP LOCKED`), chỉ là tốn CPU của máy API.
 */
@Injectable()
export class ImageWorkerHost
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ImageWorkerHost.name);
  private child: ChildProcess | null = null;
  private stopping = false;
  private restartDelay = MIN_RESTART_DELAY_MS;
  private restartTimer: NodeJS.Timeout | null = null;

  constructor(private readonly configService: ConfigService) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test') return;
    if (this.configService.get<string>('IMAGE_WORKER') === 'off') {
      this.logger.warn('IMAGE_WORKER=off — process này không nén ảnh');
      return;
    }
    this.spawn();
  }

  onApplicationShutdown(): void {
    this.stopping = true;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.child?.kill('SIGTERM');
  }

  private spawn(): void {
    // Chạy bằng ts-node (`npm run start:dev`) thì sinh bản `.ts` qua đúng các
    // hook đó; chạy bản build thì sinh `dist/image-worker.js`.
    const isSource = __filename.endsWith('.ts');
    const entry = join(
      __dirname,
      '..',
      '..',
      isSource ? 'image-worker.ts' : 'image-worker.js',
    );
    const startedAt = Date.now();

    const child = fork(entry, [], {
      execArgv: isSource
        ? ['-r', 'ts-node/register', '-r', 'tsconfig-paths/register']
        : [],
      stdio: 'inherit',
    });
    this.child = child;

    if (child.pid) {
      try {
        setPriority(child.pid, WORKER_NICENESS);
      } catch (error) {
        this.logger.warn(
          `Không hạ được độ ưu tiên của worker: ${(error as Error).message}`,
        );
      }
    }

    child.on('exit', (code, signal) => {
      if (this.child === child) this.child = null;
      if (this.stopping) return;

      if (Date.now() - startedAt > HEALTHY_UPTIME_MS) {
        this.restartDelay = MIN_RESTART_DELAY_MS;
      }
      // Kêu to: worker chết im lặng thì ảnh cứ nằm "đang xử lý" mãi, và người
      // đầu tiên phát hiện là khách đang ngồi đợi nút Lưu.
      this.logger.error(
        `Worker nén ảnh thoát (code=${code}, signal=${signal}), dựng lại sau ${this.restartDelay}ms`,
      );
      this.restartTimer = setTimeout(() => this.spawn(), this.restartDelay);
      this.restartDelay = Math.min(this.restartDelay * 2, MAX_RESTART_DELAY_MS);
    });
  }
}
