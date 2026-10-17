import { PaginationDto } from '@common/dto/pagination.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/upsert-voucher.dto';
import { VouchersService } from './vouchers.service';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

/**
 * Mã giảm giá — quyền *Super admin*, đi cùng bảng giá: mã giảm giá trừ thẳng
 * vào doanh thu, mà spec CMS ghi rõ `admin` không được xem doanh thu.
 *
 * Không có route công khai nào ở đây. Khách thử mã qua
 * `POST /orders/voucher-preview` của `commerce`, vì chỉ `commerce` mới biết
 * giá của gói này cho chính người đang đăng nhập.
 */
@Controller('admin/vouchers')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('vouchers:manage')
export class VouchersAdminController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  findAll(@Query() page: PaginationDto) {
    return this.vouchersService.findAll(page);
  }

  @Post()
  create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVoucherDto,
  ) {
    return this.vouchersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vouchersService.remove(id);
  }
}
