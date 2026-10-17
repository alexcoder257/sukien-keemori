import { applyPercent } from '@common/pricing/discount';
import { RevalidateService } from '@common/revalidate/revalidate.service';
import { CACHE_TAGS } from '@constant/cache-tags';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { PricingRepository } from './pricing.repository';

/** Giá của gói duy nhất, đúng hình dạng `GET /pricing`. */
export interface Pricing {
  /** Giá niêm yết. */
  price: number;
  /** Khuyến mãi gói, phần trăm; `null` là không cấu hình. */
  discountPercent: number | null;
  /** Giá sau khuyến mãi gói (chưa tính mã giảm giá). */
  finalPrice: number;
}

/**
 * Giá của **một gói** thiệp. Module này không import domain nào khác —
 * `commerce` gọi vào đây, không có chiều ngược lại.
 */
@Injectable()
export class PricingService {
  constructor(
    private readonly pricingRepository: PricingRepository,
    private readonly revalidateService: RevalidateService,
  ) {}

  async find(): Promise<Pricing> {
    const row = await this.pricingRepository.findPackage();
    if (!row) {
      throw new InternalServerErrorException(
        ERROR_MESSAGES.PRICING.NOT_CONFIGURED,
      );
    }
    return {
      price: row.price,
      discountPercent: row.discountPercent,
      finalPrice: applyPercent(row.price, row.discountPercent ?? 0),
    };
  }

  async update(dto: UpdatePricingDto): Promise<Pricing> {
    const row = await this.pricingRepository.findPackage();
    if (!row) {
      throw new InternalServerErrorException(
        ERROR_MESSAGES.PRICING.NOT_CONFIGURED,
      );
    }
    row.price = dto.price;
    row.discountPercent = dto.discountPercent;
    await this.pricingRepository.save(row);
    // Trang bảng giá và trang thông tin doanh nghiệp là trang tĩnh (ISR): báo
    // frontend xoá cache để giá mới hiện ngay.
    this.revalidateService.ping([CACHE_TAGS.pricing]);
    return this.find();
  }
}
