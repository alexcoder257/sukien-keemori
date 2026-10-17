import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Truy vấn cho `/health`. Không có entity: thứ cần hỏi là chính database chứ
 * không phải một bảng nào.
 */
@Injectable()
export class TelegramBotRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Dung lượng database hiện tại, tính bằng byte. */
  async databaseSize(): Promise<number> {
    const rows: Array<{ size: string }> = await this.dataSource.query(
      'SELECT pg_database_size(current_database()) AS size',
    );
    return Number(rows[0]?.size ?? 0);
  }
}
