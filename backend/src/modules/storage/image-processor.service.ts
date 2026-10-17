import { extname } from 'node:path';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

/**
 * Nén lại mọi ảnh tải lên trước khi giao cho `StorageProvider`.
 *
 * Thiệp là **link vĩnh viễn**, nên mỗi byte lưu xuống là chi phí vĩnh viễn —
 * ảnh 6MB thẳng từ điện thoại vừa tốn dung lượng mãi mãi vừa bắt khách mời tải
 * về qua 4G. Nén ở đây chứ không ở client vì client không ép được: người dùng
 * gọi thẳng API vẫn phải qua bước này.
 *
 * Việc này còn là một lớp **kiểm tra an ninh**. `assertValidImage` chỉ đọc
 * `file.mimetype`, mà header đó do client gửi lên nên giả được. Giải mã bằng
 * libvips thì tệp không phải ảnh thật sẽ ném lỗi ngay tại đây, không bao giờ
 * chạm tới đĩa.
 */

/** Khớp mức đã chốt cho ảnh tĩnh sau khi soi ở zoom 300%. */
const AVIF_QUALITY = 70;

/**
 * `effort` 4 chứ không phải 6 như script nén ảnh tĩnh: ở đó nén một lần rồi
 * thôi nên chờ lâu không sao, còn ở đây người dùng đang ngồi đợi upload xong.
 * Chênh lệch dung lượng giữa 4 và 6 chỉ vài phần trăm.
 */
const AVIF_EFFORT = 4;

/**
 * Trần cạnh dài của ảnh thiệp. Trang khách rộng tối đa 1024px CSS
 * (`max-w-5xl` ở `frontend/app/[locale]/t/[slug]/page.tsx`), nên chỗ lớn nhất
 * một tấm ảnh từng được vẽ là ảnh bìa tràn khung trên màn Retina: 1024 × 2 =
 * 2048px. Điện thoại — phần lớn khách mời — chỉ cần ~1170–1290px (390–430px CSS
 * × DPR 3). Không nén theo từng ô được, vì đổi mẫu phải giữ ảnh và cùng một
 * tấm có thể rơi vào ô to của mẫu khác.
 *
 * Từng là 2400, tính từ một giả định "ô rộng 1200px CSS" không có thật: dư ~37%
 * số điểm ảnh mà không màn hình nào dùng tới.
 *
 * **Bản sao có chủ đích** ở `frontend/lib/image-resize.ts`: trình duyệt thu
 * nhỏ về đúng con số này trước khi gửi. Hai bên phải bằng nhau — client nhỏ
 * hơn thì mất chi tiết không lấy lại được, lớn hơn thì gửi byte để rồi bị cắt.
 */
const MAX_PHOTO_DIMENSION = 2048;

/**
 * Trần số điểm ảnh **trước khi** giải nén — chặn "bom giải nén": một tệp PNG
 * vài KB khai kích thước hàng tỷ điểm ảnh, giải ra là hết RAM. 120MP vẫn chừa
 * cho ảnh gốc 48MP/108MP của điện thoại khi trình duyệt không thu nhỏ được.
 */
const MAX_INPUT_PIXELS = 120_000_000;

/**
 * Bề ngang của ảnh trưng bày trang chủ — đúng quy cách `thumbnail.avif` /
 * `poster.avif` của kho mẫu (khung thiệp 640px × DPR 1.5, xem
 * `frontend/CLAUDE.md` mục 2). Chỉ chặn **bề ngang**: ảnh chụp dài cao cả chục
 * nghìn điểm ảnh, chặn theo cạnh dài như ảnh thiệp là thu nó về một sợi chỉ.
 */
const SHOWCASE_IMAGE_WIDTH = 960;

export interface ProcessedImage {
  buffer: Buffer;
  /** Tên đã đổi đuôi — provider lấy đuôi từ đây để đặt tên tệp. */
  fileName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  /** Ảnh của thiệp (ô ảnh trong mẫu và album). */
  async toAvif(buffer: Buffer, originalName: string): Promise<ProcessedImage> {
    const output = await this.encode(
      buffer,
      {
        width: MAX_PHOTO_DIMENSION,
        height: MAX_PHOTO_DIMENSION,
        fit: 'inside',
      },
      (pipeline) =>
        pipeline.avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT }),
    );
    return this.wrap(output, originalName, '.avif', 'image/avif');
  }

  /**
   * Ảnh bìa và ảnh chụp dài của ô "Cặp đôi đã tạo thiệp" ở trang chủ. AVIF
   * như ảnh của kho mẫu: card trang chủ không phải ảnh `openGraph`.
   */
  async toShowcaseAvif(
    buffer: Buffer,
    originalName: string,
  ): Promise<ProcessedImage> {
    const output = await this.encode(
      buffer,
      { width: SHOWCASE_IMAGE_WIDTH },
      (pipeline) =>
        pipeline.avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT }),
    );
    return this.wrap(output, originalName, '.avif', 'image/avif');
  }

  private async encode(
    buffer: Buffer,
    resize: sharp.ResizeOptions,
    format: (pipeline: sharp.Sharp) => sharp.Sharp,
  ): Promise<Buffer> {
    try {
      return await format(
        sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
          // Phải đứng trước mọi thứ: ảnh dọc chụp bằng điện thoại nằm ngang
          // trong tệp và chỉ đúng chiều nhờ cờ orientation trong EXIF. Xoay
          // trước rồi mới bỏ EXIF, không thì ảnh cô dâu nằm ngang.
          .rotate()
          .resize({ ...resize, withoutEnlargement: true }),
      ).toBuffer();
      // `sharp` mặc định **không** giữ metadata, và ở đây đó là điều mong muốn:
      // ảnh cưới từ điện thoại mang toạ độ GPS nhà cô dâu chú rể, mà thiệp là
      // link công khai ai cũng mở được.
    } catch (error) {
      this.logger.warn(
        `Không giải mã được ảnh tải lên: ${(error as Error).message}`,
      );
      throw new BadRequestException(ERROR_MESSAGES.STORAGE.INVALID_IMAGE);
    }
  }

  private wrap(
    buffer: Buffer,
    originalName: string,
    extension: string,
    mimeType: string,
  ): ProcessedImage {
    const ext = extname(originalName);
    let base = ext ? originalName.slice(0, -ext.length) : originalName;

    // Tên bắt đầu bằng dấu chấm về `image`. Hai trường hợp gộp làm một ở đây:
    // `extname('.png')` trả chuỗi rỗng vì Node coi đó là dotfile chứ không phải
    // phần mở rộng, nên base sẽ là `.png` và ra tên `.png.avif`; còn tên kiểu
    // `.anh-cuoi.jpg` thì hợp lệ nhưng sinh ra tệp ẩn trên đĩa.
    if (!base || base.startsWith('.')) base = 'image';

    return {
      buffer,
      fileName: `${base}${extension}`,
      mimeType,
      size: buffer.length,
    };
  }
}
