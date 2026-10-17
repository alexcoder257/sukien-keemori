import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SiteSettings } from './site-settings.entity';

@Injectable()
export class SettingsRepository extends Repository<SiteSettings> {
  constructor(private readonly dataSource: DataSource) {
    super(SiteSettings, dataSource.createEntityManager());
  }

  /**
   * Hàng cấu hình duy nhất, tự tạo bằng giá trị mặc định nếu chưa có.
   *
   * Không dựa vào seeder: mọi đường đọc cấu hình đều đi qua đây, nên một môi
   * trường mới dựng (hoặc DB vừa reset) vẫn chạy đúng thay vì ném lỗi ở lần
   * xuất bản thiệp đầu tiên.
   *
   * `orderBy created_at` để nếu có nhiều hàng do lỡ tay thì luôn đọc đúng hàng
   * đầu tiên, không phải hàng ngẫu nhiên theo thứ tự vật lý.
   */
  async findOrCreate(): Promise<SiteSettings> {
    const existing = await this.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
    if (existing) return existing;
    return this.save(this.create({}));
  }
}
