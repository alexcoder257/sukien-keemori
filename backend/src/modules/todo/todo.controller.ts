import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoService } from './todo.service';

@Controller('todos') // mọi route bắt đầu bằng /todos
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post() // POST /todos
  create(@Body() dto: CreateTodoDto) {
    return this.todoService.create(dto);
  }

  @Get() // GET /todos
  findAll() {
    return this.todoService.findAll();
  }

  @Get(':id') // GET /todos/:id
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.todoService.findOne(id);
  }

  @Patch(':id') // PATCH /todos/:id
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTodoDto) {
    return this.todoService.update(id, dto);
  }

  @Delete(':id') // DELETE /todos/:id
  @HttpCode(HttpStatus.NO_CONTENT) // trả 204, không body
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.todoService.remove(id);
  }
}
