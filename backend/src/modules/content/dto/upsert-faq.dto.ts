import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * FAQ mang **cả hai ngôn ngữ trong một bản ghi** (xem `Faq`), nên màn soạn thảo
 * bắt buộc nhập đủ bốn ô: thiếu một cột thì trang công khai bên ngôn ngữ kia
 * hiện ô trống chứ không rơi về ngôn ngữ còn lại.
 */
export class CreateFaqDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  questionVi: string;

  @IsString()
  @MinLength(1)
  answerVi: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  questionEn: string;

  @IsString()
  @MinLength(1)
  answerEn: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}
