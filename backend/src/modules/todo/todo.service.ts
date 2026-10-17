import { definedFields } from '@common/utils/defined-fields';
import { ERROR_MESSAGES } from '@constant/error-messages';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './todo.entity';
import { TodoRepository } from './todo.repository';

@Injectable()
export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}

  create(dto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create(dto); // tạo instance từ dto
    return this.todoRepository.save(todo); // ghi xuống DB
  }

  findAll(): Promise<Todo[]> {
    return this.todoRepository.findAllOrderByNewest();
  }

  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findOne({ where: { id } });
    if (!todo) {
      throw new NotFoundException(ERROR_MESSAGES.TODO.NOT_FOUND);
    }
    return todo;
  }

  async update(id: string, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findOne(id); // tái dùng: tự ném 404 nếu không có
    Object.assign(todo, definedFields(dto)); // gộp field mới vào
    return this.todoRepository.save(todo);
  }

  async remove(id: string): Promise<void> {
    const todo = await this.findOne(id);
    await this.todoRepository.remove(todo);
  }
}
