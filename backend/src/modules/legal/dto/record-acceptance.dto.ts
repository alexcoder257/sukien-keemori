import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { AcceptedDocumentDto } from './accepted-document.dto';

export class RecordAcceptanceDto {
  @IsArray()
  @ArrayMinSize(1)
  // Chỉ có sáu văn bản; một mảng dài hơn thế là request dựng tay.
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => AcceptedDocumentDto)
  documents: AcceptedDocumentDto[];
}
