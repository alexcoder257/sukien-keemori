import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Báo frontend xoá cache theo tag sau khi admin đổi cấu hình (giá, FAQ, kho
 * mẫu…), để nội dung mới hiện ra ngay thay vì chờ hết chu kỳ `revalidate`.
 *
 * Fire-and-forget có chủ đích: lưu cấu hình đã thành công thì không được fail
 * vì frontend đang tắt — tệ nhất là cache tự hết hạn theo chu kỳ như cũ.
 */
@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);

  constructor(private readonly configService: ConfigService) {}

  ping(tags: string[]): void {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const secret = this.configService.get<string>('REVALIDATE_SECRET');
    if (!frontendUrl || !secret) return;

    void fetch(`${frontendUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ tags }),
    })
      .then((response) => {
        // 4xx/5xx không ném — phải tự soi, không thì sai secret/sai route cứ
        // im lặng và cache "kẹt" đúng như bug đã gặp lúc dựng tính năng này.
        if (!response.ok) {
          this.logger.warn(
            `Frontend từ chối revalidate [${tags.join(', ')}]: HTTP ${response.status}`,
          );
        }
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Không báo được frontend revalidate [${tags.join(', ')}]: ${String(error)}`,
        );
      });
  }
}
