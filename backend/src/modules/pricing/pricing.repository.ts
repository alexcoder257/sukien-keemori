import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PRICED_TIER, TierPrice } from './tier-price.entity';

@Injectable()
export class PricingRepository extends Repository<TierPrice> {
  constructor(private readonly dataSource: DataSource) {
    super(TierPrice, dataSource.createEntityManager());
  }

  /** Hàng giá duy nhất của gói. */
  findPackage(): Promise<TierPrice | null> {
    return this.findOne({ where: { tier: PRICED_TIER } });
  }
}
