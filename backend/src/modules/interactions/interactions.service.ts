import { AuditService, type AuditActor } from '@modules/audit/audit.service';
import { ERROR_MESSAGES } from '@constant/error-messages';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TemplateReviewHelpfulRepository,
  TemplateReviewRepository,
} from './interactions.repository';
import { TemplateReview } from './template-review.entity';
import { QueryAdminTemplateReviewsDto } from './dto/query-admin-template-reviews.dto';
import { UpsertTemplateReviewDto } from './dto/upsert-template-review.dto';

/** Một đánh giá như frontend nhìn thấy — không có `userId`, không có email. */
export interface TemplateReviewView {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: Date;
  /** Khác `createdAt` nghĩa là đánh giá đã được sửa; UI gắn nhãn "đã sửa". */
  updatedAt: Date;
  /** Đánh giá của chính người đang gọi — chỉ bản này mới hiện nút sửa/xoá. */
  mine: boolean;
  /** Số người thấy đánh giá này hữu ích. */
  helpfulCount: number;
  /** Người đang xem đã bấm "Hữu ích" hay chưa — quyết định trạng thái nút. */
  helpfulByMe: boolean;
}

export interface TemplateReviewSummary {
  templateSlug: string;
  count: number;
  /** Làm tròn một chữ số thập phân, đúng thứ hiển thị trên card. */
  average: number;
  /** 5 phần tử, index 0 là số lượt 1 sao. */
  distribution: number[];
}

export interface TemplateReviewList {
  summary: TemplateReviewSummary;
  items: TemplateReviewView[];
}

/**
 * Một dòng trong bảng kiểm duyệt của khu quản trị.
 *
 * Có thêm `templateSlug` (bảng gộp mọi mẫu) và email người viết — admin phải
 * định danh được tài khoản đứng sau một nhận xét trước khi xoá nó.
 */
export interface AdminTemplateReviewView {
  id: string;
  templateSlug: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; email: string; fullName: string };
}

@Injectable()
export class TemplateReviewService {
  constructor(
    private readonly templateReviewRepository: TemplateReviewRepository,
    private readonly helpfulRepository: TemplateReviewHelpfulRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Đánh giá của một mẫu. Công khai — ai cũng đọc được, kể cả chưa đăng nhập;
   * `viewerId` chỉ dùng để đánh dấu bản của chính người xem.
   *
   * Thống kê tính ngay trên danh sách vừa lấy thay vì thêm một câu query gộp:
   * đã đọc hết đánh giá của mẫu này rồi thì đếm lại trong bộ nhớ rẻ hơn một
   * vòng nữa xuống DB.
   */
  async findByTemplate(
    templateSlug: string,
    viewerId?: string,
  ): Promise<TemplateReviewList> {
    const reviews =
      await this.templateReviewRepository.findByTemplate(templateSlug);
    const helpful = await this.loadHelpful(
      reviews.map((review) => review.id),
      viewerId,
    );

    const distribution = [0, 0, 0, 0, 0];
    let total = 0;
    for (const review of reviews) {
      distribution[review.rating - 1] += 1;
      total += review.rating;
    }

    return {
      summary: {
        templateSlug,
        count: reviews.length,
        average: reviews.length ? round1(total / reviews.length) : 0,
        distribution,
      },
      // Đánh giá của chính mình luôn nằm đầu: vừa gửi xong là thấy ngay, không
      // phải đi tìm trong danh sách xếp theo thời gian.
      items: reviews
        .map((review) => toView(review, viewerId, helpful))
        .sort((a, b) => Number(b.mine) - Number(a.mine)),
    };
  }

  /** Thống kê của mọi mẫu — kho mẫu lấy một lần rồi tra theo slug. */
  async summarizeAll(): Promise<TemplateReviewSummary[]> {
    const rows = await this.templateReviewRepository.summarizeAll();
    return rows.map((row) => ({ ...row, average: round1(row.average) }));
  }

  /**
   * Gửi hoặc sửa đánh giá của chính mình.
   *
   * Không kiểm tra `templateSlug` có trong kho mẫu hay không, giống `Favorite`:
   * slug là định danh bền và một mẫu bị gỡ không nên làm hỏng dữ liệu đã có.
   *
   * Quyền sở hữu nằm ngay trong khoá tra cứu (`userId` lấy từ token, không lấy
   * từ body), nên không có đường nào ghi đè đánh giá của người khác.
   */
  async upsert(
    userId: string,
    templateSlug: string,
    dto: UpsertTemplateReviewDto,
  ): Promise<TemplateReviewView> {
    const existing = await this.templateReviewRepository.findOneByUser(
      userId,
      templateSlug,
    );

    const review = existing
      ? Object.assign(existing, {
          rating: dto.rating,
          comment: dto.comment ?? null,
        })
      : this.templateReviewRepository.create({
          userId,
          templateSlug,
          rating: dto.rating,
          comment: dto.comment ?? null,
        });

    const saved = await this.templateReviewRepository.save(review);

    // `save()` trên bản mới không kéo theo quan hệ `user`, mà UI cần tên người
    // viết ngay để dựng lại danh sách — đọc lại một lượt kèm quan hệ.
    const withAuthor = await this.templateReviewRepository.findOne({
      where: { id: saved.id },
      relations: { user: true },
      select: {
        id: true,
        userId: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: { id: true, fullName: true },
      },
    });

    const helpful = await this.loadHelpful([saved.id], userId);
    return toView(withAuthor ?? saved, userId, helpful);
  }

  /**
   * Bấm / bỏ bấm "Hữu ích" cho một đánh giá của **người khác**.
   *
   * Không cho bấm cho chính mình: con số này để người đọc sau biết nhận xét nào
   * đáng tin, mà tự bấm cho mình thì nó chỉ còn đo mức tự tin của người viết.
   *
   * Trả về con số mới nhất chứ không phải 204: nút cần hiện ngay số đúng, và
   * đọc lại cả danh sách chỉ vì một cú bấm là lãng phí.
   */
  async setHelpful(
    userId: string,
    reviewId: string,
    helpful: boolean,
  ): Promise<{ helpfulCount: number; helpfulByMe: boolean }> {
    const review = await this.templateReviewRepository.findOne({
      where: { id: reviewId },
      select: { id: true, userId: true },
    });
    if (!review) {
      throw new NotFoundException(ERROR_MESSAGES.REVIEW.NOT_FOUND_BY_ID);
    }
    if (review.userId === userId) {
      throw new BadRequestException(ERROR_MESSAGES.REVIEW.HELPFUL_OWN);
    }

    if (helpful) {
      // `orIgnore` thay cho "tìm rồi mới ghi": ràng buộc unique đã chặn trùng ở
      // DB, nên bấm hai lần liên tiếp chỉ là một hàng, không phải một lỗi 500.
      await this.helpfulRepository
        .createQueryBuilder()
        .insert()
        .values({ userId, reviewId })
        .orIgnore()
        .execute();
    } else {
      await this.helpfulRepository.delete({ userId, reviewId });
    }

    const counts = await this.helpfulRepository.countByReviews([reviewId]);
    return { helpfulCount: counts.get(reviewId) ?? 0, helpfulByMe: helpful };
  }

  /** Số lượt hữu ích + lượt của chính người xem, cho một lô đánh giá. */
  private async loadHelpful(
    reviewIds: string[],
    viewerId?: string,
  ): Promise<HelpfulState> {
    const [counts, mine] = await Promise.all([
      this.helpfulRepository.countByReviews(reviewIds),
      viewerId
        ? this.helpfulRepository.findMarkedByUser(viewerId, reviewIds)
        : Promise.resolve(new Set<string>()),
    ]);
    return { counts, mine };
  }

  /**
   * Bảng đánh giá của khu quản trị (mọi mẫu, mọi người viết).
   *
   * Đây là **kiểm duyệt**, không phải duyệt trước: đánh giá vẫn hiện ngay khi
   * gửi, admin chỉ can thiệp khi có nội dung không phù hợp.
   */
  async findForAdmin(query: QueryAdminTemplateReviewsDto): Promise<{
    items: AdminTemplateReviewView[];
    total: number;
  }> {
    const { items, total } = await this.templateReviewRepository.findForAdmin({
      templateSlug: query.templateSlug,
      q: query.q,
      rating: query.rating,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });

    return { items: items.map(toAdminView), total };
  }

  /**
   * Xoá bất kỳ đánh giá nào — quyền của admin, khác `remove` chỉ đụng được bản
   * của chính người gọi. Không có bước ẩn/khôi phục: một nhận xét bị gỡ là gỡ
   * hẳn, và người viết vẫn có thể gửi lại bản mới cho mẫu đó.
   */
  async removeAsAdmin(actor: AuditActor, id: string): Promise<void> {
    // Đọc trước khi xoá: nhận xét bị gỡ là gỡ hẳn, nên nếu không chụp lại nội
    // dung ở đây thì dòng nhật ký chỉ còn một uuid và không ai kiểm lại được
    // việc gỡ đó đúng hay sai.
    const review = await this.templateReviewRepository.findOne({
      where: { id },
    });
    const result = await this.templateReviewRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException(ERROR_MESSAGES.REVIEW.NOT_FOUND_BY_ID);
    }

    await this.auditService.record({
      action: 'template_review.deleted',
      actor,
      targetType: 'template_review',
      targetId: id,
      targetLabel: review?.templateSlug ?? null,
      metadata: {
        rating: review?.rating ?? null,
        comment: review?.comment ?? null,
        authorId: review?.userId ?? null,
      },
    });
  }

  /** Xoá đánh giá của chính mình; của người khác thì coi như không tồn tại. */
  async remove(userId: string, templateSlug: string): Promise<void> {
    const review = await this.templateReviewRepository.findOneByUser(
      userId,
      templateSlug,
    );
    if (!review) {
      throw new NotFoundException(ERROR_MESSAGES.REVIEW.NOT_FOUND);
    }
    await this.templateReviewRepository.delete({ id: review.id });
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function toAdminView(review: TemplateReview): AdminTemplateReviewView {
  return {
    id: review.id,
    templateSlug: review.templateSlug,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    author: {
      id: review.userId,
      email: review.user?.email ?? '',
      fullName: review.user?.fullName ?? '',
    },
  };
}

/** Lượt hữu ích của một lô đánh giá, tra theo id. */
interface HelpfulState {
  counts: Map<string, number>;
  mine: Set<string>;
}

const NO_HELPFUL: HelpfulState = { counts: new Map(), mine: new Set() };

function toView(
  review: TemplateReview,
  viewerId?: string,
  helpful: HelpfulState = NO_HELPFUL,
): TemplateReviewView {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    authorName: review.user?.fullName ?? '',
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    mine: !!viewerId && review.userId === viewerId,
    helpfulCount: helpful.counts.get(review.id) ?? 0,
    helpfulByMe: helpful.mine.has(review.id),
  };
}
