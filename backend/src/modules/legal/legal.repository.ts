import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LegalAcceptance } from './legal-acceptance.entity';

@Injectable()
export class LegalRepository extends Repository<LegalAcceptance> {
  constructor(private readonly dataSource: DataSource) {
    super(LegalAcceptance, dataSource.createEntityManager());
  }

  /** Toàn bộ sổ chấp thuận của một người, mới nhất trước. */
  findAllForUser(userId: string): Promise<LegalAcceptance[]> {
    return this.find({ where: { userId }, order: { acceptedAt: 'DESC' } });
  }

  /**
   * Ghi một loạt chấp thuận, bỏ qua hàng đã có.
   *
   * `orIgnore()` chứ không phải kiểm tra trước rồi ghi: hai tab đăng ký cùng
   * lúc, hoặc một cú bấm lặp, sẽ đâm vào unique index — và một lỗi khoá trùng
   * ở bước phụ này không được phép làm hỏng việc tạo tài khoản.
   */
  async recordMany(rows: Partial<LegalAcceptance>[]): Promise<void> {
    if (!rows.length) return;
    await this.createQueryBuilder()
      .insert()
      .into(LegalAcceptance)
      .values(rows)
      .orIgnore()
      .execute();
  }
}
