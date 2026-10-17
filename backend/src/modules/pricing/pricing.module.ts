import { RevalidateModule } from '@common/revalidate/revalidate.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PricingAdminController,
  PricingController,
} from './pricing.controller';
import { PricingRepository } from './pricing.repository';
import { PricingService } from './pricing.service';
import { TierPrice } from './tier-price.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TierPrice]), RevalidateModule],
  controllers: [PricingController, PricingAdminController],
  providers: [PricingService, PricingRepository],
  exports: [PricingService],
})
export class PricingModule {}
