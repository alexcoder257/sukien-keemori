import { Order } from '@modules/commerce/order.entity';
import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, In, Not, Repository } from 'typeorm';
import type {
  QueryAdminOrdersDto,
  QueryUnmatchedDto,
} from './dto/query-admin-payments.dto';
import { PaymentTransaction } from './payment-transaction.entity';

/** Mọi mốc ngày trong CMS là ngày theo lịch Việt Nam. */
const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cột trả cho CMS. **Không** có `rawPayload`: payload gốc mang tên và số tài
 * khoản người gửi, màn tra soát không cần tới nó, và thứ không cần thì không
 * nên rời khỏi database.
 */
const LEDGER_COLUMNS: (keyof PaymentTransaction)[] = [
  'id',
  'sepayId',
  'orderId',
  'matchStatus',
  'gateway',
  'accountNumber',
  'transferAmount',
  'content',
  'paymentCode',
  'referenceCode',
  'transactionDate',
];

/** `%` và `_` trong chữ người dùng gõ là ký tự thường, không phải wildcard. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

@Injectable()
export class PaymentsRepository extends Repository<PaymentTransaction> {
  constructor(private readonly dataSource: DataSource) {
    super(PaymentTransaction, dataSource.createEntityManager());
  }

  findBySepayId(sepayId: string): Promise<PaymentTransaction | null> {
    return this.findOne({ where: { sepayId } });
  }

  findById(id: string): Promise<PaymentTransaction | null> {
    return this.findOne({ where: { id } });
  }

  /**
   * Hàng đợi tra soát tay ở CMS: **tiền vào** đã về mà chưa gắn được vào đơn
   * nào. Tiền chuyển đi mang trạng thái `ignored` nên không bao giờ lọt vào đây.
   * Mới nhất lên đầu — người tra soát luôn xử lý từ ca vừa xảy ra.
   */
  findUnmatchedPaged(
    query: QueryUnmatchedDto,
  ): Promise<[PaymentTransaction[], number]> {
    const builder = this.createQueryBuilder('t')
      .select(LEDGER_COLUMNS.map((column) => `t.${column}`))
      .where('t.order_id IS NULL')
      .andWhere("t.match_status = 'unmatched'")
      .orderBy('t.transaction_date', 'DESC')
      .take(query.limit)
      .skip(query.offset);

    const q = query.q?.trim();
    if (q) {
      const digits = q.replace(/[.,\s₫đ]/gi, '');
      builder.andWhere(
        new Brackets((where) => {
          where
            .where('t.content ILIKE :like', { like: likePattern(q) })
            .orWhere('t.reference_code ILIKE :like')
            .orWhere('t.payment_code ILIKE :like');
          // Người gọi lên thường chỉ nhớ số tiền đã chuyển.
          if (/^\d+$/.test(digits)) {
            where.orWhere('t.transfer_amount = :amount', { amount: digits });
          }
        }),
      );
    }
    return builder.getManyAndCount();
  }

  /**
   * Đơn mua thiệp cho màn tra cứu, kèm tài khoản và thiệp của đơn.
   *
   * Truy vấn bảng `orders` từ đây chứ không từ `commerce`: màn này là **giao**
   * của đơn và tiền về, và phụ thuộc đi một chiều `payments → commerce` — đặt
   * nó bên `commerce` thì `commerce` phải biết `payment_transactions`.
   */
  findOrdersPaged(query: QueryAdminOrdersDto): Promise<[Order[], number]> {
    return this.filteredOrders(query)
      .addSelect(['u.id', 'u.email', 'u.fullName'])
      .addSelect(['c.id', 'c.slug', 'c.title', 'c.planTier', 'c.status'])
      .orderBy('o.created_at', 'DESC')
      .take(query.limit)
      .skip(query.offset)
      .getManyAndCount();
  }

  /**
   * Tổng của **toàn bộ** đơn khớp bộ lọc, không phải của trang đang xem — cùng
   * `filteredOrders` với danh sách nên hai con số không bao giờ lệch nhau.
   */
  async summarizeOrders(
    query: QueryAdminOrdersDto,
  ): Promise<{ paidCount: number; paidAmount: number }> {
    const row = await this.filteredOrders(query)
      .select(`COUNT(*) FILTER (WHERE o.status = 'paid')`, 'paidCount')
      .addSelect(
        `COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'paid'), 0)`,
        'paidAmount',
      )
      .getRawOne<{ paidCount: string; paidAmount: string }>();
    return {
      paidCount: Number(row?.paidCount ?? 0),
      paidAmount: Number(row?.paidAmount ?? 0),
    };
  }

  /**
   * Bộ lọc dùng chung của màn tra cứu đơn.
   *
   * `withDeleted` vì tài khoản bị CMS vô hiệu hoá (soft delete) vẫn phải hiện
   * email ở lịch sử đơn — đó đúng là lúc người ta cần tra.
   */
  private filteredOrders(query: QueryAdminOrdersDto) {
    const builder = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('o')
      .withDeleted()
      .leftJoin('o.user', 'u')
      .leftJoin('o.card', 'c');

    if (query.status) {
      builder.andWhere('o.status = :status', { status: query.status });
    }
    // `date AT TIME ZONE` đọc ngày đó như giờ địa phương Việt Nam rồi đổi ra
    // mốc tuyệt đối; `to` cộng một ngày để gồm trọn ngày cuối.
    if (query.from) {
      builder.andWhere(
        `o.created_at >= (CAST(:from AS date) AT TIME ZONE '${VIETNAM_TIME_ZONE}')`,
        { from: query.from },
      );
    }
    if (query.to) {
      builder.andWhere(
        `o.created_at < ((CAST(:to AS date) + 1) AT TIME ZONE '${VIETNAM_TIME_ZONE}')`,
        { to: query.to },
      );
    }

    const q = query.q?.trim();
    if (q) {
      builder.andWhere(
        new Brackets((where) => {
          where
            .where('o.payment_code ILIKE :like', { like: likePattern(q) })
            .orWhere('u.email ILIKE :like')
            .orWhere('u.full_name ILIKE :like')
            .orWhere('c.slug ILIKE :like')
            .orWhere('c.title ILIKE :like')
            .orWhere('o.voucher_code ILIKE :like')
            .orWhere('o.gateway_reference ILIKE :like')
            // Mã tham chiếu ngân hàng khách đọc từ biên lai của họ.
            .orWhere(
              `EXISTS (SELECT 1 FROM payment_transactions pt
                WHERE pt.order_id = o.id AND pt.reference_code ILIKE :like)`,
            );
          if (UUID_PATTERN.test(q)) {
            where.orWhere('o.id = :id', { id: q }).orWhere('u.id = :id');
          }
        }),
      );
    }
    return builder;
  }

  /** Tiền vào đã ghép vào các đơn này, cũ trước mới sau. */
  findByOrderIds(orderIds: string[]): Promise<PaymentTransaction[]> {
    if (orderIds.length === 0) return Promise.resolve([]);
    return this.find({
      select: Object.fromEntries(
        LEDGER_COLUMNS.map((column) => [column, true]),
      ),
      where: { orderId: In(orderIds), matchStatus: Not('ignored') },
      order: { transactionDate: 'ASC' },
    });
  }
}
