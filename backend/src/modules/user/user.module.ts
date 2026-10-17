import { AuditModule } from '@modules/audit/audit.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserAdminController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [AuditModule, TypeOrmModule.forFeature([User])],
  // Không có controller công khai: `user` vẫn là domain nội bộ, controller
  // dưới đây nằm sau `/admin` và sau guard quyền CMS.
  controllers: [UserAdminController],
  providers: [UserService, UserRepository],
  // Chuẩn team: chỉ export Service.
  exports: [UserService],
})
export class UserModule {}
