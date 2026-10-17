import { PartialType } from '@nestjs/mapped-types';
import { CreateTodoDto } from './create-todo.dto';

/**
 * PartialType biến mọi field của CreateTodoDto thành optional.
 * Tức là khi update, client gửi field nào thì cập nhật field đó.
 */
export class UpdateTodoDto extends PartialType(CreateTodoDto) {}
