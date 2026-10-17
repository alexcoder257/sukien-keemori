import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { PricingService } from './pricing.service';

/** Giá công khai — khách phải xem được giá trước khi đăng nhập. */
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  find() {
    return this.pricingService.find();
  }
}

/** Cấu hình giá — quyền `pricing:manage`. */
@Controller('admin/pricing')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('pricing:manage')
export class PricingAdminController {
  constructor(private readonly pricingService: PricingService) {}

  @Patch()
  update(@Body() dto: UpdatePricingDto) {
    return this.pricingService.update(dto);
  }
}
