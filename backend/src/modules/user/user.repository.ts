import type { UserRole } from '@common/enums/user-role.enum';
import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  /** Chỉ những cột cần để gửi thư. Tài khoản đã xoá mềm tự bị loại. */
  findMailRecipients(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.find({
      where: { id: In(ids) },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailNotifications: true,
      },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  /**
   * Tra email kể cả tài khoản đã bị xoá mềm — dùng ở đăng ký.
   *
   * `findByEmail` cố tình bỏ qua hàng đã xoá (đó là ý nghĩa của soft delete),
   * nhưng đăng ký lại cần biết địa chỉ đó **đã có chủ**: unique index vẫn tính
   * cả hàng đã xoá, nên không hỏi ở đây thì lỗi rơi xuống tầng database dưới
   * dạng 500 thay vì một câu "email đã được đăng ký".
   */
  findByEmailIncludingDeleted(email: string): Promise<User | null> {
    return this.findOne({ where: { email }, withDeleted: true });
  }

  findByGoogleIdIncludingDeleted(googleId: string): Promise<User | null> {
    return this.findOne({ where: { googleId }, withDeleted: true });
  }

  findByFacebookIdIncludingDeleted(facebookId: string): Promise<User | null> {
    return this.findOne({ where: { facebookId }, withDeleted: true });
  }

  /**
   * Bảng người dùng của CMS: lọc theo quyền, tìm theo email/họ tên, phân trang.
   *
   * `ILIKE` để tìm không phân biệt hoa thường — người vận hành gõ "Nguyen" phải
   * ra "nguyen@…". Trả kèm tổng số vì bảng cần biết còn bao nhiêu trang.
   */
  async search(params: {
    role?: UserRole;
    q?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: User[]; total: number }> {
    const query = this.createQueryBuilder('user').orderBy(
      'user.created_at',
      'DESC',
    );

    if (params.role) {
      query.andWhere('user.role = :role', { role: params.role });
    }
    if (params.q) {
      query.andWhere('(user.email ILIKE :q OR user.full_name ILIKE :q)', {
        q: `%${params.q}%`,
      });
    }

    const [items, total] = await query
      .take(params.limit)
      .skip(params.offset)
      .getManyAndCount();
    return { items, total };
  }

  // Bao gồm cả cột passwordHash (select:false ở entity) — dùng khi xác thực.
  findByEmailWithSecret(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  // Cùng mục đích với `findByEmailWithSecret` nhưng tra theo id — dùng cho
  // đường đổi mật khẩu, nơi người dùng đã đăng nhập nên chỉ có `userId` trong
  // token chứ không có email.
  findByIdWithSecret(id: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  // Bao gồm cột refreshTokenHash — dùng khi refresh/rotate token.
  findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }
}
