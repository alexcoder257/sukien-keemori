import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuditAction } from '@common/enums/audit-action.enum';
import { AuditLog } from './audit-log.entity';

export interface AuditQuery {
  action?: AuditAction;
  actorId?: string;
  targetId?: string;
  limit: number;
  offset: number;
}

@Injectable()
export class AuditRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  create(data: Partial<AuditLog>): Promise<AuditLog> {
    return this.repository.save(this.repository.create(data));
  }

  /**
   * Một trang nhật ký, mới nhất trước.
   *
   * Sắp theo `created_at` **và** `id`: nhiều dòng có thể mang cùng mốc thời gian
   * tới từng micro giây (xoá tài khoản ghi một dòng rồi dọn ảnh ghi dòng nữa),
   * và `ORDER BY` không toàn phần thì phân trang sẽ lặp hoặc bỏ sót dòng ở chỗ
   * giáp ranh giữa hai trang.
   */
  async findPage(query: AuditQuery): Promise<[AuditLog[], number]> {
    const qb = this.repository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .addOrderBy('log.id', 'DESC')
      .take(query.limit)
      .skip(query.offset);

    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }
    if (query.actorId) {
      qb.andWhere('log.actorId = :actorId', { actorId: query.actorId });
    }
    if (query.targetId) {
      qb.andWhere('log.targetId = :targetId', { targetId: query.targetId });
    }

    return qb.getManyAndCount();
  }

  /**
   * Xoá mọi dòng ghi trước `cutoff`, trả về số dòng đã xoá.
   *
   * Xoá thẳng bằng một câu `DELETE` thay vì tải lên rồi `remove()`: không có
   * hook hay quan hệ nào phải chạy theo (bảng này cố ý không có khoá ngoại), và
   * hai năm nhật ký có thể là hàng trăm nghìn dòng — tải hết vào bộ nhớ chỉ để
   * xoá là tự chuốc một cú OOM lúc 4h sáng.
   */
  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoff', { cutoff })
      .execute();

    return result.affected ?? 0;
  }
}
