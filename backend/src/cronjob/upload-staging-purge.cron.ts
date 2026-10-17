import { UploadStagingService } from '@modules/storage/upload-staging.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Dọn phiên tải ảnh đã hết hạn (một ngày) — ảnh tạm của những người soạn thiệp
 * rồi bỏ ngang, kể cả người chưa bao giờ đăng nhập.
 *
 * Trên R2, lifecycle rule của bucket tạm cũng dọn — nhưng nó chỉ là lưới an
 * toàn: R2 xoá "thường trong vòng 24 giờ" sau hạn, và nó không biết gì về hàng
 * trong `staged_photos`. Với `STORAGE_DRIVER=local` thì job này là thứ **duy
 * nhất** dọn thư mục tạm.
 *
 * Mỗi giờ một lần, mỗi lần tối đa 200 phiên: đủ nhỏ để không bao giờ chiếm
 * database lâu, đủ thường để thư mục tạm không phình qua một đêm.
 */
@Injectable()
export class UploadStagingPurgeCron {
  private readonly logger = new Logger(UploadStagingPurgeCron.name);

  constructor(private readonly uploadStagingService: UploadStagingService) {}

  @Cron(CronExpression.EVERY_HOUR, { name: 'upload-staging-purge' })
  async purge(): Promise<void> {
    try {
      const purged = await this.uploadStagingService.purgeExpired();
      if (purged > 0) {
        this.logger.log(`Đã dọn ${purged} phiên tải ảnh hết hạn`);
      }
    } catch (error) {
      this.logger.error(`Dọn phiên tải ảnh hỏng: ${(error as Error).message}`);
    }
  }
}
