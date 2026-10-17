import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { RecordAcceptanceDto } from './dto/record-acceptance.dto';
import { LegalService } from './legal.service';

/**
 * Sổ chấp thuận văn bản pháp lý.
 *
 * Chỉ hai route, cả hai đều **của chính người đang đăng nhập**: không có đường
 * nào đọc sổ của người khác. Chấp thuận lúc đăng ký không đi qua đây — nó nằm
 * trong cùng một request với `POST /auth/register` để hai việc cùng thành công
 * hoặc cùng thất bại.
 */
@Controller('legal/acceptances')
@UseGuards(JwtAuthGuard)
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.legalService.findMine(user.userId);
  }

  /**
   * Chấp thuận thêm văn bản sau khi đã có tài khoản — đối tác đọc Điều khoản
   * Đối tác, hoặc người dùng chấp thuận lại một phiên bản mới.
   */
  @Post()
  async record(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordAcceptanceDto,
  ) {
    await this.legalService.record(user.userId, dto.documents, 'reconsent');
    return this.legalService.findMine(user.userId);
  }
}
