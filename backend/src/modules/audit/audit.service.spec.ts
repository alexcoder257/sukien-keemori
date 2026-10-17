import { Test, type TestingModule } from '@nestjs/testing';
import { AuditRepository } from './audit.repository';
import { AUDIT_LOG_RETENTION_MONTHS, AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  // `deleteOlderThan` được khai kiểu tường minh vì bài kiểm tra dưới đọc lại
  // đối số của nó — mốc thời gian chính là thứ đang được kiểm.
  const deleteOlderThan = jest.fn<Promise<number>, [cutoff: Date]>();
  const repository = {
    create: jest.fn(),
    findPage: jest.fn(),
    deleteOlderThan,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AuditRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  describe('record', () => {
    // Luật quan trọng nhất của module: ghi nhật ký hỏng không được làm hỏng
    // thao tác đã thành công đứng ngay trước nó.
    it('nuốt lỗi của repository thay vì ném lên', async () => {
      repository.create.mockRejectedValueOnce(new Error('db down'));

      await expect(
        service.record({
          action: 'user.delete' as never,
          actor: null,
          targetType: 'user',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('purgeExpired', () => {
    it('xoá theo đúng mốc 24 tháng đã công bố', async () => {
      deleteOlderThan.mockResolvedValueOnce(3);

      const before = new Date();
      const purged = await service.purgeExpired();
      const after = new Date();

      expect(purged).toBe(3);

      const [cutoff] = deleteOlderThan.mock.calls[0];
      const lower = new Date(before);
      lower.setMonth(lower.getMonth() - AUDIT_LOG_RETENTION_MONTHS);
      const upper = new Date(after);
      upper.setMonth(upper.getMonth() - AUDIT_LOG_RETENTION_MONTHS);

      expect(cutoff.getTime()).toBeGreaterThanOrEqual(lower.getTime());
      expect(cutoff.getTime()).toBeLessThanOrEqual(upper.getTime());
    });

    // Ngược với `record`: không ai đang chờ, nên lỗi phải nổi lên tới cron để
    // có một dòng log đỏ thay vì im lặng.
    it('để lỗi của repository ném lên', async () => {
      deleteOlderThan.mockRejectedValueOnce(new Error('db down'));

      await expect(service.purgeExpired()).rejects.toThrow('db down');
    });
  });
});
