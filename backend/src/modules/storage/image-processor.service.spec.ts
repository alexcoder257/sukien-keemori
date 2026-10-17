import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { ImageProcessorService } from './image-processor.service';

/** Ảnh thật để libvips có gì mà giải mã — buffer giả sẽ bị ném ngay. */
async function makeImage(
  width: number,
  height: number,
  options: { alpha?: boolean } = {},
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: options.alpha ? 4 : 3,
      background: options.alpha
        ? { r: 200, g: 150, b: 100, alpha: 0 }
        : { r: 200, g: 150, b: 100 },
    },
  })
    .png()
    .toBuffer();
}

describe('ImageProcessorService', () => {
  const service = new ImageProcessorService();

  describe('toShowcaseAvif', () => {
    it('chỉ chặn bề ngang: ảnh chụp dài giữ nguyên tỉ lệ', async () => {
      const input = await makeImage(1440, 12000);
      const result = await service.toShowcaseAvif(input, 'thumbnail.png');

      const meta = await sharp(result.buffer).metadata();
      expect(result.fileName).toBe('thumbnail.avif');
      expect(meta.width).toBe(960);
      expect(meta.height).toBe(8000);
    });

    it('không phóng to ảnh hẹp hơn 960px', async () => {
      const input = await makeImage(640, 820);
      const result = await service.toShowcaseAvif(input, 'poster.png');

      expect((await sharp(result.buffer).metadata()).width).toBe(640);
    });
  });

  describe('toAvif', () => {
    it('chuyển sang AVIF và đổi đuôi tệp theo', async () => {
      const input = await makeImage(800, 600);
      const result = await service.toAvif(input, 'anh-cuoi.png');

      expect(result.fileName).toBe('anh-cuoi.avif');
      expect(result.mimeType).toBe('image/avif');
      expect(result.size).toBe(result.buffer.length);
      expect((await sharp(result.buffer).metadata()).format).toBe('heif');
    });

    it('nén nhỏ hơn hẳn bản gốc', async () => {
      const input = await makeImage(1200, 1600);
      const result = await service.toAvif(input, 'a.png');

      expect(result.size).toBeLessThan(input.length);
    });

    it('thu ảnh quá khổ về đúng trần cạnh dài', async () => {
      const input = await makeImage(4000, 3000);
      const result = await service.toAvif(input, 'dt.jpg');

      const meta = await sharp(result.buffer).metadata();
      expect(meta.width).toBe(2048);
      expect(meta.height).toBe(1536);
    });

    it('không phóng to ảnh nhỏ hơn trần', async () => {
      const input = await makeImage(300, 200);
      const result = await service.toAvif(input, 'nho.png');

      const meta = await sharp(result.buffer).metadata();
      expect(meta.width).toBe(300);
      expect(meta.height).toBe(200);
    });

    it('giữ kênh alpha — hoạ tiết và phong bì cần vùng trong suốt', async () => {
      const input = await makeImage(400, 400, { alpha: true });
      const result = await service.toAvif(input, 'phong-bi.png');

      expect((await sharp(result.buffer).metadata()).hasAlpha).toBe(true);
    });

    /**
     * Ảnh cưới từ điện thoại mang toạ độ GPS nhà cô dâu chú rể, mà thiệp là link
     * công khai ai cũng mở được. Đây là lý do metadata phải bị bỏ.
     */
    it('xoá metadata EXIF', async () => {
      const input = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 1, g: 2, b: 3 },
        },
      })
        .withExifMerge({ IFD0: { Copyright: 'ai-do', Software: 'test' } })
        .jpeg()
        .toBuffer();

      const result = await service.toAvif(input, 'exif.jpg');
      expect((await sharp(result.buffer).metadata()).exif).toBeUndefined();
    });

    it('từ chối tệp không phải ảnh', async () => {
      await expect(
        service.toAvif(Buffer.from('day khong phai anh'), 'gia-mao.png'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('đặt tên mặc định khi tên gốc chỉ có mỗi phần đuôi', async () => {
      const input = await makeImage(100, 100);
      const result = await service.toAvif(input, '.png');

      expect(result.fileName).toBe('image.avif');
    });
  });
});
