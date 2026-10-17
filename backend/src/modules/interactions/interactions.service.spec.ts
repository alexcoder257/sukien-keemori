import { AuditService } from '@modules/audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TemplateReviewService } from './interactions.service';
import type {
  TemplateReviewHelpfulRepository,
  TemplateReviewRepository,
} from './interactions.repository';
import type { TemplateReview } from './template-review.entity';

const OWNER = 'user-1';
const OTHER = 'user-2';

function review(partial: Partial<TemplateReview>): TemplateReview {
  const createdAt = partial.createdAt ?? new Date('2026-01-01T00:00:00Z');
  return {
    id: 'review-1',
    userId: OTHER,
    templateSlug: 'nang-xanh',
    rating: 5,
    comment: null,
    createdAt,
    updatedAt: partial.updatedAt ?? createdAt,
    user: { fullName: 'Người dùng' },
    ...partial,
  } as TemplateReview;
}

function makeService(
  repository: Partial<TemplateReviewRepository>,
  helpful: Partial<TemplateReviewHelpfulRepository> = {},
) {
  return new TemplateReviewService(
    repository as TemplateReviewRepository,
    {
      countByReviews: jest.fn().mockResolvedValue(new Map()),
      findMarkedByUser: jest.fn().mockResolvedValue(new Set()),
      ...helpful,
    } as unknown as TemplateReviewHelpfulRepository,
    { record: jest.fn() } as unknown as AuditService,
  );
}

/** Admin giả lập — chỉ đi vào dòng nhật ký, không đổi nhánh nào. */
const ADMIN_ACTOR = {
  userId: 'actor-1',
  email: 'admin@keemori.vn',
  role: 'admin',
};

describe('TemplateReviewService', () => {
  describe('findByTemplate', () => {
    it('tính trung bình và phân bố sao từ danh sách đã lấy', async () => {
      const service = makeService({
        findByTemplate: jest
          .fn()
          .mockResolvedValue([
            review({ id: 'a', rating: 5 }),
            review({ id: 'b', rating: 4 }),
            review({ id: 'c', rating: 4 }),
          ]),
      });

      const { summary } = await service.findByTemplate('nang-xanh');

      expect(summary.count).toBe(3);
      // 13/3 = 4.333… → làm tròn một chữ số thập phân đúng như UI hiển thị.
      expect(summary.average).toBe(4.3);
      expect(summary.distribution).toEqual([0, 0, 0, 2, 1]);
    });

    it('mẫu chưa có đánh giá trả về 0, không phải NaN', async () => {
      const service = makeService({
        findByTemplate: jest.fn().mockResolvedValue([]),
      });

      const { summary, items } = await service.findByTemplate('nang-xanh');

      expect(summary).toEqual({
        templateSlug: 'nang-xanh',
        count: 0,
        average: 0,
        distribution: [0, 0, 0, 0, 0],
      });
      expect(items).toEqual([]);
    });

    it('đưa đánh giá của người xem lên đầu và đánh dấu `mine`', async () => {
      const service = makeService({
        findByTemplate: jest
          .fn()
          .mockResolvedValue([
            review({ id: 'a', userId: OTHER }),
            review({ id: 'b', userId: OWNER }),
          ]),
      });

      const { items } = await service.findByTemplate('nang-xanh', OWNER);

      expect(items.map((item) => item.id)).toEqual(['b', 'a']);
      expect(items[0].mine).toBe(true);
      expect(items[1].mine).toBe(false);
    });

    it('khách chưa đăng nhập thì không đánh giá nào là của mình', async () => {
      const service = makeService({
        findByTemplate: jest
          .fn()
          .mockResolvedValue([review({ id: 'a', userId: OWNER })]),
      });

      const { items } = await service.findByTemplate('nang-xanh');

      expect(items[0].mine).toBe(false);
    });

    it('không lộ userId hay dữ liệu tài khoản ra ngoài', async () => {
      const service = makeService({
        findByTemplate: jest.fn().mockResolvedValue([review({ id: 'a' })]),
      });

      const { items } = await service.findByTemplate('nang-xanh');

      expect(Object.keys(items[0]).sort()).toEqual([
        'authorName',
        'comment',
        'createdAt',
        'helpfulByMe',
        'helpfulCount',
        'id',
        'mine',
        'rating',
        'updatedAt',
      ]);
    });
  });

  describe('upsert', () => {
    it('gửi lần hai thì ghi đè bản cũ chứ không tạo thêm', async () => {
      const existing = review({ id: 'a', userId: OWNER, rating: 3 });
      const save = jest.fn().mockResolvedValue(existing);
      const create = jest.fn();
      const service = makeService({
        findOneByUser: jest.fn().mockResolvedValue(existing),
        save,
        create,
        findOne: jest.fn().mockResolvedValue({ ...existing, rating: 5 }),
      });

      await service.upsert(OWNER, 'nang-xanh', { rating: 5, comment: 'Đẹp' });

      expect(create).not.toHaveBeenCalled();
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a', rating: 5, comment: 'Đẹp' }),
      );
    });

    it('gắn `userId` từ token, không nhận từ body', async () => {
      const created = review({ id: 'new', userId: OWNER });
      const create = jest.fn().mockReturnValue(created);
      const service = makeService({
        findOneByUser: jest.fn().mockResolvedValue(null),
        create,
        save: jest.fn().mockResolvedValue(created),
        findOne: jest.fn().mockResolvedValue(created),
      });

      await service.upsert(OWNER, 'nang-xanh', { rating: 4 });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: OWNER,
          templateSlug: 'nang-xanh',
          rating: 4,
          // Không viết nhận xét thì lưu `null`, không lưu chuỗi rỗng.
          comment: null,
        }),
      );
    });
  });

  describe('remove', () => {
    it('không xoá được đánh giá của người khác', async () => {
      const del = jest.fn();
      const service = makeService({
        // Tra theo cặp (userId, slug) nên đánh giá của người khác đơn giản là
        // không tìm thấy — không có nhánh nào chạm tới bản ghi đó.
        findOneByUser: jest.fn().mockResolvedValue(null),
        delete: del,
      });

      await expect(service.remove(OTHER, 'nang-xanh')).rejects.toThrow(
        NotFoundException,
      );
      expect(del).not.toHaveBeenCalled();
    });
  });

  describe('setHelpful', () => {
    it('không cho tự bấm hữu ích cho đánh giá của chính mình', async () => {
      const service = makeService({
        findOne: jest.fn().mockResolvedValue(review({ userId: OWNER })),
      });

      await expect(service.setHelpful(OWNER, 'review-1', true)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('bỏ bấm thì xoá hàng và trả về con số mới', async () => {
      const del = jest.fn().mockResolvedValue({ affected: 1 });
      const service = makeService(
        { findOne: jest.fn().mockResolvedValue(review({ userId: OTHER })) },
        {
          delete: del,
          countByReviews: jest
            .fn()
            .mockResolvedValue(new Map([['review-1', 2]])),
        },
      );

      const result = await service.setHelpful(OWNER, 'review-1', false);

      expect(del).toHaveBeenCalledWith({ userId: OWNER, reviewId: 'review-1' });
      expect(result).toEqual({ helpfulCount: 2, helpfulByMe: false });
    });
  });

  describe('removeAsAdmin', () => {
    it('xoá được đánh giá của bất kỳ ai', async () => {
      const del = jest.fn().mockResolvedValue({ affected: 1 });
      // `findOne` là bước chụp nội dung trước khi xoá, để dòng nhật ký còn đọc
      // được sau khi bản ghi biến mất.
      const service = makeService({
        delete: del,
        findOne: jest.fn().mockResolvedValue({
          id: 'review-1',
          templateSlug: 'tin-vui',
          rating: 4,
          comment: 'Đẹp',
          userId: 'user-9',
        }),
      });

      await service.removeAsAdmin(ADMIN_ACTOR, 'review-1');

      expect(del).toHaveBeenCalledWith({ id: 'review-1' });
    });

    it('báo không tồn tại khi id không khớp bản ghi nào', async () => {
      const service = makeService({
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        findOne: jest.fn().mockResolvedValue(null),
      });

      await expect(service.removeAsAdmin('review-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findForAdmin', () => {
    it('trả kèm email người viết và mặc định 20 dòng mỗi trang', async () => {
      const findForAdmin = jest.fn().mockResolvedValue({
        items: [
          review({
            id: 'a',
            rating: 3,
            comment: 'Nền hơi tối',
            user: { email: 'ai@do.com', fullName: 'Ai Đó' },
          }),
        ],
        total: 1,
      });
      const service = makeService({ findForAdmin });

      const { items, total } = await service.findForAdmin({});

      expect(findForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20, offset: 0 }),
      );
      expect(total).toBe(1);
      expect(items[0].author).toEqual({
        id: OTHER,
        email: 'ai@do.com',
        fullName: 'Ai Đó',
      });
    });
  });
});
