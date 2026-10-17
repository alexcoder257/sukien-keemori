import type { PaginationDto } from '@common/dto/pagination.dto';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { VoucherRedemption } from './voucher-redemption.entity';
import { Voucher } from './voucher.entity';

@Injectable()
export class VoucherRepository extends Repository<Voucher> {
  constructor(private readonly dataSource: DataSource) {
    super(Voucher, dataSource.createEntityManager());
  }

  /** Mã mới nhất lên đầu — màn quản trị luôn xem chiến dịch đang chạy. */
  findAllPaged(page: PaginationDto): Promise<[Voucher[], number]> {
    return this.findAndCount({
      order: { createdAt: 'DESC' },
      take: page.limit,
      skip: page.offset,
    });
  }

  findByCode(code: string): Promise<Voucher | null> {
    return this.findOne({ where: { code } });
  }

  /** Mã đang bật và được công khai ở hộp thanh toán. */
  findCheckoutCandidates(): Promise<Voucher[]> {
    return this.find({
      where: { isActive: true, isPublic: true },
      order: { code: 'ASC' },
    });
  }

  findById(id: string): Promise<Voucher | null> {
    return this.findOne({ where: { id } });
  }

  /**
   * Cộng một lượt dùng bằng `UPDATE ... SET used_count = used_count + 1` chứ
   * không đọc-sửa-ghi: hai đơn trả cùng lúc thì đường đọc-sửa-ghi ghi đè lẫn
   * nhau và một suất của chiến dịch biến mất khỏi sổ.
   */
  async incrementUsed(id: string): Promise<void> {
    await this.increment({ id }, 'usedCount', 1);
  }
}

@Injectable()
export class VoucherRedemptionRepository extends Repository<VoucherRedemption> {
  constructor(private readonly dataSource: DataSource) {
    super(VoucherRedemption, dataSource.createEntityManager());
  }

  countByVoucherAndUser(voucherId: string, userId: string): Promise<number> {
    return this.count({ where: { voucherId, userId } });
  }

  async countsByVouchersAndUser(
    voucherIds: string[],
    userId: string,
  ): Promise<Map<string, number>> {
    if (!voucherIds.length) return new Map();
    const rows = await this.createQueryBuilder('redemption')
      .select('redemption.voucherId', 'voucherId')
      .addSelect('COUNT(*)', 'count')
      .where('redemption.userId = :userId', { userId })
      .andWhere('redemption.voucherId IN (:...voucherIds)', { voucherIds })
      .groupBy('redemption.voucherId')
      .getRawMany<{ voucherId: string; count: string }>();
    return new Map(rows.map((row) => [row.voucherId, Number(row.count)]));
  }

  existsByOrder(orderId: string): Promise<boolean> {
    return this.existsBy({ orderId });
  }
}
