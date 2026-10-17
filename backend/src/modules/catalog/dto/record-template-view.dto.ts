import { IsIn } from 'class-validator';
import {
  TEMPLATE_VIEW_KINDS,
  type TemplateViewKind,
} from '../template-daily-view.entity';

/** Một lượt xem mẫu do trình duyệt báo lên — không có định danh nào ở đây. */
export class RecordTemplateViewDto {
  @IsIn(TEMPLATE_VIEW_KINDS)
  kind: TemplateViewKind;
}
