import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Todo } from './todo.entity';

@Injectable()
export class TodoRepository extends Repository<Todo> {
  constructor(private readonly dataSource: DataSource) {
    // Kế thừa toàn bộ method của TypeORM: find, findOne, save, delete...
    super(Todo, dataSource.createEntityManager());
  }

  // Có thể thêm query tùy biến ở đây, ví dụ:
  findAllOrderByNewest(): Promise<Todo[]> {
    return this.find({ order: { createdAt: 'DESC' } });
  }
}
