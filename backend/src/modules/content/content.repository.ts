import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from '@common/dto/pagination.dto';
import { CoupleShowcase } from './couple-showcase.entity';
import { Faq } from './faq.entity';
import { SiteStat } from './site-stat.entity';

@Injectable()
export class FaqRepository extends Repository<Faq> {
  constructor(private readonly dataSource: DataSource) {
    super(Faq, dataSource.createEntityManager());
  }

  findPublished(): Promise<Faq[]> {
    return this.find({
      where: { isPublished: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /** Nhánh admin: gồm cả FAQ đang tắt. */
  findAllPaged(page: PaginationDto): Promise<[Faq[], number]> {
    return this.findAndCount({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      take: page.limit,
      skip: page.offset,
    });
  }

  findById(id: string): Promise<Faq | null> {
    return this.findOne({ where: { id } });
  }
}

@Injectable()
export class CoupleShowcaseRepository extends Repository<CoupleShowcase> {
  constructor(private readonly dataSource: DataSource) {
    super(CoupleShowcase, dataSource.createEntityManager());
  }

  findPublished(): Promise<CoupleShowcase[]> {
    return this.find({
      where: { isPublished: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /** Bản admin: gồm cả ô đang tắt, giữ nguyên thứ tự của dải. */
  findAllPaged(page: PaginationDto): Promise<[CoupleShowcase[], number]> {
    return this.findAndCount({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      take: page.limit,
      skip: page.offset,
    });
  }

  findById(id: string): Promise<CoupleShowcase | null> {
    return this.findOne({ where: { id } });
  }

  async slugExists(slug: string): Promise<boolean> {
    return (await this.countBy({ slug })) > 0;
  }

  async findAllIds(): Promise<string[]> {
    const rows = await this.find({ select: { id: true } });
    return rows.map((row) => row.id);
  }

  /** Ghi `sort_order` = vị trí trong `ids` (đếm từ 1), trong một transaction. */
  async reorder(ids: string[]): Promise<void> {
    await this.manager.transaction(async (manager) => {
      for (const [index, id] of ids.entries()) {
        await manager.update(CoupleShowcase, { id }, { sortOrder: index + 1 });
      }
    });
  }
}

@Injectable()
export class SiteStatRepository extends Repository<SiteStat> {
  constructor(private readonly dataSource: DataSource) {
    super(SiteStat, dataSource.createEntityManager());
  }

  findAllOrdered(): Promise<SiteStat[]> {
    return this.find({ order: { key: 'ASC' } });
  }

  /**
   * Ghi theo khoá: hàng đã có thì cập nhật, chưa có thì thêm.
   *
   * Dùng `upsert` chứ không `findOne` rồi `save` vì một khoá trong whitelist có
   * thể chưa từng được seed — màn CMS vẫn hiện nó (giá trị 0) và người vận hành
   * vẫn phải lưu được.
   */
  async upsertMany(stats: { key: string; value: number }[]): Promise<void> {
    await this.upsert(
      stats.map((stat) => ({ key: stat.key, value: String(stat.value) })),
      ['key'],
    );
  }
}
