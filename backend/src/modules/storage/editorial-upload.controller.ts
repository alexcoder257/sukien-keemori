import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_UPLOAD_BYTES } from './storage.constants';
import { StorageService } from './storage.service';
import { Permissions } from '@modules/admin-auth/decorators/permissions.decorator';
import { AdminJwtAuthGuard } from '@modules/admin-auth/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '@modules/admin-auth/guards/permissions.guard';

/**
 * Tải ảnh cho nội dung biên tập — ảnh của ô trưng bày trang chủ.
 *
 * Tách controller riêng chứ không đi chung đường ảnh thiệp
 * (`UploadSessionsController`) vì hai bên có **mô hình quyền khác hẳn nhau**:
 * bên kia là chủ thiệp nhận ảnh về thiệp của mình và quyền kiểm bằng quyền sở
 * hữu; bên này là admin tải ảnh vào một kho chung, quyền kiểm bằng vai trò.
 * Gộp lại thì `cardId` thành tuỳ chọn và phép kiểm sở hữu thành một nhánh
 * `if` — đúng kiểu chỗ dễ mở nhầm cho người không có quyền.
 */
@Controller('admin/uploads')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Permissions('content:manage')
export class EditorialUploadController {
  constructor(private readonly storageService: StorageService) {}

  /** Ảnh bìa / ảnh chụp dài của ô "Cặp đôi đã tạo thiệp" ở trang chủ. */
  @Post('showcase-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  uploadShowcaseImage(@UploadedFile() file: Express.Multer.File) {
    return this.storageService.uploadShowcaseImage(file);
  }
}
