import { IsBoolean } from 'class-validator';

/** Admin mở (`true`) hoặc khoá lại (`false`) việc sửa tên cô dâu chú rể. */
export class SetCoupleNamesLockDto {
  @IsBoolean()
  unlocked: boolean;
}
