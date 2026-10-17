import {
  INVITATION_BLOCKS,
  PHOTO_SLOT_KEYS,
} from '@common/enums/invitation.enum';
import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * `photos` và `visibility` là map chứ không phải object cố định, nên
 * `whitelist: true` của ValidationPipe không đụng tới key bên trong chúng —
 * ValidationPipe chỉ lọc field của class. Hai decorator dưới đây tự kiểm key,
 * nếu không thì client gửi key lạ là nó nằm im trong cột JSONB.
 */

/**
 * Map ô ảnh trong thiết kế: khoá phải thuộc `PHOTO_SLOT_KEYS`, giá trị là URL
 * ảnh. Cho phép thiếu khoá — mẫu nào có ô nào là việc của mẫu, và ảnh của ô mà
 * mẫu hiện tại không có vẫn được giữ (`docs/business-model.md` mục 4).
 */
export function IsPhotoSlotMap(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isPhotoSlotMap',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (
            typeof value !== 'object' ||
            value === null ||
            Array.isArray(value)
          ) {
            return false;
          }
          return Object.entries(value).every(
            ([key, item]) =>
              PHOTO_SLOT_KEYS.includes(
                key as (typeof PHOTO_SLOT_KEYS)[number],
              ) && typeof item === 'string',
          );
        },
        defaultMessage: () =>
          `photos chỉ nhận các ô: ${PHOTO_SLOT_KEYS.join(', ')}`,
      },
    });
}

/**
 * Bật/tắt từng block. Đòi **đủ cả 14 khoá**, không cho gửi thiếu: thiếu một
 * khoá thì block đó thành `undefined` và lớp hiển thị phải tự đoán mặc định.
 */
export function IsBlockVisibility(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isBlockVisibility',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (
            typeof value !== 'object' ||
            value === null ||
            Array.isArray(value)
          ) {
            return false;
          }
          const keys = Object.keys(value);
          return (
            keys.length === INVITATION_BLOCKS.length &&
            INVITATION_BLOCKS.every(
              (block) =>
                typeof (value as Record<string, unknown>)[block] === 'boolean',
            )
          );
        },
        defaultMessage: () =>
          `visibility phải khai đủ ${INVITATION_BLOCKS.length} block: ${INVITATION_BLOCKS.join(', ')}`,
      },
    });
}
