import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Order } from './order.entity';

@Injectable()
export class CommerceRepository extends Repository<Order> {
  constructor(private readonly dataSource: DataSource) {
    super(Order, dataSource.createEntityManager());
  }

  findByUser(userId: string): Promise<Order[]> {
    return this.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findOneForUser(id: string, userId: string): Promise<Order | null> {
    return this.findOne({ where: { id, userId } });
  }

  /** Số liệu mua bán của **một** tài khoản, cho màn chi tiết người dùng ở CMS. */
  async summaryForUser(userId: string): Promise<{
    orders: number;
    paidOrders: number;
    spentVnd: number;
  }> {
    const row = await this.createQueryBuilder('order')
      .select('COUNT(*)', 'orders')
      .addSelect(`COUNT(*) FILTER (WHERE order.status = 'paid')`, 'paid_orders')
      .addSelect(
        `COALESCE(SUM(order.amount) FILTER (WHERE order.status = 'paid'), 0)`,
        'spent_vnd',
      )
      .where('order.user_id = :userId', { userId })
      .getRawOne<{
        orders: string;
        paid_orders: string;
        spent_vnd: string;
      }>();

    return {
      orders: Number(row?.orders ?? 0),
      paidOrders: Number(row?.paid_orders ?? 0),
      spentVnd: Number(row?.spent_vnd ?? 0),
    };
  }

  /** Đơn đang chờ thanh toán của một thiệp — mỗi thiệp chỉ nên có một. */
  findPendingForCard(cardId: string): Promise<Order | null> {
    return this.findOne({ where: { cardId, status: 'pending' } });
  }

  /**
   * Tra đơn theo mã trong nội dung chuyển khoản. Chỉ nhận đơn **đang chờ**: mã
   * của một đơn đã trả rồi mà khớp lần nữa nghĩa là khách chuyển trùng, và
   * khoản đó phải rơi vào hàng đợi tra soát để hoàn tiền, không phải lặng lẽ
   * được nuốt vào đơn cũ.
   */
  findPendingByPaymentCode(paymentCode: string): Promise<Order | null> {
    return this.findOne({ where: { paymentCode, status: 'pending' } });
  }

  existsByPaymentCode(paymentCode: string): Promise<boolean> {
    return this.existsBy({ paymentCode });
  }

  countPaid(): Promise<number> {
    return this.countBy({ status: 'paid' });
  }
}
