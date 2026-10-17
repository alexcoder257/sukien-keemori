import { BadRequestException } from '@nestjs/common';
import { LegalService } from './legal.service';
import type { LegalAcceptance } from './legal-acceptance.entity';
import type { LegalRepository } from './legal.repository';

/**
 * `jest.fn()` không có tham số trả về `Mock<any, any>`, và mọi thứ đọc ra từ
 * `mock.calls` sau đó đều là `any` — lint của dự án chặn. Bọc lại bằng một
 * `jest.fn(implementation)` để kiểu suy ra từ chính hàm truyền vào.
 */
function recordManyMock(
  implementation: (rows: Partial<LegalAcceptance>[]) => Promise<void> = () =>
    Promise.resolve(),
) {
  return jest.fn(implementation);
}

function makeService(recordMany = recordManyMock()) {
  const repository = {
    recordMany,
    findAllForUser: jest.fn().mockResolvedValue([]),
  };
  return {
    service: new LegalService(repository as unknown as LegalRepository),
    repository,
  };
}

describe('LegalService.assertSignupDocuments', () => {
  it('cho qua khi có đủ Điều khoản và Chính sách bảo mật', () => {
    const { service } = makeService();

    expect(() =>
      service.assertSignupDocuments([
        { type: 'terms', version: '2.0' },
        { type: 'privacy', version: '2.0' },
      ]),
    ).not.toThrow();
  });

  it('chặn khi thiếu một trong hai văn bản bắt buộc', () => {
    const { service } = makeService();

    // Gửi thừa một văn bản khác không bù được cho văn bản còn thiếu — đây đúng
    // là hình dạng của một request dựng tay để lách ô tick ở frontend.
    expect(() =>
      service.assertSignupDocuments([
        { type: 'terms', version: '2.0' },
        { type: 'payment_refund', version: '1.0' },
      ]),
    ).toThrow(BadRequestException);
  });
});

describe('LegalService.record', () => {
  it('ghi mỗi văn bản một hàng, cùng một mốc thời gian', async () => {
    const { service, repository } = makeService();

    await service.record(
      'user-1',
      [
        { type: 'terms', version: '2.0' },
        { type: 'privacy', version: '2.0' },
      ],
      'register',
    );

    const [rows] = repository.recordMany.mock.calls[0];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      userId: 'user-1',
      documentType: 'terms',
      documentVersion: '2.0',
      source: 'register',
    });
    expect(rows[0].acceptedAt).toEqual(rows[1].acceptedAt);
  });

  it('nuốt lỗi của sổ, không làm hỏng thao tác đã thành công', async () => {
    // Tới lúc gọi `record` thì tài khoản đã tồn tại. Ném lỗi ở đây nghĩa là
    // người dùng nhận màn hình lỗi cho một tài khoản đã tạo xong, và lần thử
    // lại sẽ vấp "email đã được đăng ký".
    const { service } = makeService(
      recordManyMock(() => Promise.reject(new Error('db down'))),
    );

    await expect(
      service.record('user-1', [{ type: 'terms', version: '2.0' }], 'oauth'),
    ).resolves.toBeUndefined();
  });
});
