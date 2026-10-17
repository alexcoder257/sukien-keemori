import { definedFields } from '@common/utils/defined-fields';
import type { ShowcaseKind } from '@common/enums/invitation.enum';
import { RevalidateService } from '@common/revalidate/revalidate.service';
import { CACHE_TAGS } from '@constant/cache-tags';
import { Injectable } from '@nestjs/common';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SettingsRepository } from './settings.repository';
import { SiteSettings } from './site-settings.entity';

/** Phần cấu hình mở cho trang khách. Xem `SettingsPublicController`. */
export interface PublicSiteSettings {
  messengerUrl: string | null;
  /** Slug thiệp mẫu cho nút "Xem thiệp mẫu" ở hero trang chủ. */
  demoCardSlug: string | null;
  /** `demoCardSlug` là thiệp (`card`) hay mẫu (`template`). */
  demoCardKind: ShowcaseKind;
  /** Kênh mạng xã hội ở chân trang; `null` là ẩn biểu tượng đó. */
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  /** Số Zalo nội địa 10 số; frontend dựng link `https://zalo.me/<số>`. */
  zaloPhone: string | null;
  contactEmail: string | null;
}

@Injectable()
export class SettingsService {
  /**
   * Bản nhớ của hàng cấu hình duy nhất.
   *
   * `site_settings` là bảng **một hàng** và chỉ đổi khi admin bấm Lưu, nhưng
   * `GET /settings/public` chạy trên mọi trang khách. Đọc lại cùng một hàng vài nghìn lần một ngày là lãng phí
   * thuần tuý.
   *
   * Không đặt TTL, và đó là chủ đích: `update()` là **đường duy nhất** sửa
   * được hàng này, nên nó xoá bản nhớ ngay tại chỗ. Một TTL ở đây chỉ thêm một
   * khoảng thời gian mà dữ liệu vừa sai vừa không ai xoá hộ.
   *
   * Nằm trong bộ nhớ tiến trình nên chạy nhiều instance thì mỗi instance giữ
   * một bản. Chấp nhận được vì `update()` hiếm và hệ quả xấu nhất là một
   * instance trả cấu hình cũ trong vài giây. Cần chính xác tuyệt đối
   * giữa nhiều instance thì chuyển sang Redis pub/sub, không phải rút ngắn TTL.
   */
  private cached: SiteSettings | null = null;

  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly revalidateService: RevalidateService,
  ) {}

  /**
   * Cấu hình đang có hiệu lực, đọc từ bản nhớ.
   */
  async find(): Promise<SiteSettings> {
    this.cached ??= await this.settingsRepository.findOrCreate();
    return this.cached;
  }

  /**
   * Phần cấu hình trang khách được đọc. Danh sách trường khai tay ở đây là
   * lớp chắn: thêm cột vào entity không tự động công khai nó.
   */
  async findPublic(): Promise<PublicSiteSettings> {
    const settings = await this.find();
    return {
      messengerUrl: settings.messengerUrl,
      demoCardSlug: settings.demoCardSlug,
      demoCardKind: settings.demoCardKind,
      facebookUrl: settings.facebookUrl,
      instagramUrl: settings.instagramUrl,
      tiktokUrl: settings.tiktokUrl,
      zaloPhone: settings.zaloPhone,
      contactEmail: settings.contactEmail,
    };
  }

  async update(dto: UpdateSiteSettingsDto): Promise<SiteSettings> {
    const settings = await this.settingsRepository.findOrCreate();
    Object.assign(settings, definedFields(dto));
    const saved = await this.settingsRepository.save(settings);
    // Xoá bản nhớ **trước** khi báo frontend: nếu không, cú revalidate có thể
    // khiến frontend hỏi lại ngay và nhận đúng giá trị cũ vừa bị thay.
    this.cached = saved;
    // Trang khách cache cấu hình công khai theo tag này; đổi fanpage mà phải
    // chờ hết chu kỳ revalidate thì nút chat vẫn dẫn về địa chỉ cũ.
    this.revalidateService.ping([CACHE_TAGS.siteSettings]);
    return saved;
  }
}
