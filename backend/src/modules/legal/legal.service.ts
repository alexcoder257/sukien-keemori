import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { REQUIRED_SIGNUP_DOCUMENTS } from '@common/enums/legal-document.enum';
import type {
  LegalAcceptanceSource,
  LegalDocumentType,
} from '@common/enums/legal-document.enum';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { LegalAcceptance } from './legal-acceptance.entity';
import { LegalRepository } from './legal.repository';
import type { AcceptedDocumentDto } from './dto/accepted-document.dto';

@Injectable()
export class LegalService {
  private readonly logger = new Logger(LegalService.name);

  constructor(private readonly legalRepository: LegalRepository) {}

  /**
   * Kiểm tra một lô chấp thuận có đủ hai văn bản bắt buộc không.
   *
   * Tách khỏi `record` vì thứ tự quan trọng: đăng ký phải **từ chối trước khi
   * tạo tài khoản**, không phải tạo xong rồi mới phát hiện thiếu. Ô tick ở
   * frontend là trải nghiệm; chốt chặn thật nằm ở đây.
   */
  assertSignupDocuments(documents: AcceptedDocumentDto[]): void {
    this.assertDocuments(
      documents,
      REQUIRED_SIGNUP_DOCUMENTS,
      ERROR_MESSAGES.LEGAL.CONSENT_REQUIRED,
    );
  }

  /**
   * Lô chấp thuận có đủ những văn bản một luồng đòi hỏi không.
   *
   * Thông điệp lỗi truyền vào chứ không dựng từ tên văn bản: người nộp hồ sơ
   * đối tác cần đọc "chưa đồng ý Điều khoản đối tác", không phải một danh sách
   * khoá kỹ thuật.
   */
  assertDocuments(
    documents: AcceptedDocumentDto[],
    required: readonly LegalDocumentType[],
    message: string,
  ): void {
    const accepted = new Set(documents.map((doc) => doc.type));
    const missing = required.filter((type) => !accepted.has(type));
    if (missing.length) {
      throw new BadRequestException(message);
    }
  }

  /**
   * Ghi sổ chấp thuận.
   *
   * **Không bao giờ ném lỗi.** Tới lúc gọi hàm này tài khoản đã được tạo hoặc
   * đơn đã đi tiếp; để một lỗi ghi sổ nổi lên thì người dùng nhận về màn hình
   * lỗi cho một thao tác đã thành công, và lần thử lại sẽ vấp "email đã được
   * đăng ký". Sổ thiếu một hàng là thứ vá được bằng một lần chấp thuận lại;
   * một tài khoản kẹt giữa chừng thì không.
   *
   * Việc chặn "chưa đồng ý thì không đăng ký" nằm ở `assertSignupDocuments`,
   * chạy **trước** khi tài khoản tồn tại — đó mới là chốt chặn.
   */
  async record(
    userId: string,
    documents: AcceptedDocumentDto[],
    source: LegalAcceptanceSource,
  ): Promise<void> {
    const acceptedAt = new Date();
    try {
      await this.legalRepository.recordMany(
        documents.map((doc) => ({
          userId,
          documentType: doc.type,
          documentVersion: doc.version,
          source,
          acceptedAt,
        })),
      );
    } catch (error) {
      this.logger.error(
        `Không ghi được sổ chấp thuận cho user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Sổ chấp thuận của chính người đang đăng nhập. */
  findMine(userId: string): Promise<LegalAcceptance[]> {
    return this.legalRepository.findAllForUser(userId);
  }
}
