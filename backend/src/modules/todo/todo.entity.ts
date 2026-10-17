import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('todos') // tên bảng trong Postgres
export class Todo extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted: boolean;
}
