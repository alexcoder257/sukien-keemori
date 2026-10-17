import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalAcceptance } from './legal-acceptance.entity';
import { LegalController } from './legal.controller';
import { LegalRepository } from './legal.repository';
import { LegalService } from './legal.service';

/**
 * Sổ chấp thuận văn bản pháp lý.
 *
 * Giống `notifications`, module này **không import module nào
 * khác**: `auth` gọi vào `LegalService`, không có chiều ngược
 * lại. Nhờ vậy thêm một văn bản cần chấp thuận không bao giờ sinh phụ thuộc
 * vòng với `auth`.
 *
 * Chuẩn team: chỉ export service.
 */
@Module({
  imports: [TypeOrmModule.forFeature([LegalAcceptance])],
  controllers: [LegalController],
  providers: [LegalService, LegalRepository],
  exports: [LegalService],
})
export class LegalModule {}
