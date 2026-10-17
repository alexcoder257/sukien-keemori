"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { vi } from "date-fns/locale/vi";
import { formatDateValue, parseDateValue } from "@/lib/invitation-date";

type BaseProps = {
  label: string;
  error?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
};

/**
 * Ô nhập trong editor nằm trên thẻ Ivory — gần như cùng sắc với nền trang, nên
 * mặc định trong suốt của design system bị chìm. Ở đây ô nhập dùng bề mặt lõm
 * và viền đậm hơn, còn placeholder nhạt hẳn đi để không bị nhầm với chữ đã nhập.
 */
export const editorFieldSurface =
  "border-foreground/30 bg-foreground/5 placeholder:text-foreground/35";

/**
 * Nhãn kèm dấu sao đỏ khi trường bắt buộc, cùng quy ước với màn đăng ký tài
 * khoản (`components/auth/fields.tsx`). Dấu sao `aria-hidden` vì `aria-invalid`
 * trên input đã đủ nói điều đó với screen reader.
 */
export function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span>
      {label}
      {required ? (
        <span aria-hidden className="text-destructive">
          *
        </span>
      ) : null}
    </span>
  );
}

/** Field một dòng dùng chung cho mọi block trong editor. */
export function EditorField({
  label,
  error,
  placeholder,
  className,
  required,
  type = "text",
  registration,
}: BaseProps & {
  type?: "text" | "number" | "date" | "time" | "datetime-local";
  registration: React.ComponentProps<"input">;
}) {
  const id = useId();

  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2">
        <FieldLabel label={label} required={required} />
      </Label>
      <Input
        id={id}
        type={type}
        className={editorFieldSurface}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...registration}
      />
      {error ? (
        <p className="mt-2 text-caption text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

/** Field nhiều dòng: lời mời, lời thông báo nghi lễ, lời cảm ơn. */
export function EditorTextareaField({
  label,
  error,
  placeholder,
  className,
  required,
  rows = 3,
  registration,
}: BaseProps & {
  rows?: number;
  registration: React.ComponentProps<"textarea">;
}) {
  const id = useId();

  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2">
        <FieldLabel label={label} required={required} />
      </Label>
      <Textarea
        id={id}
        rows={rows}
        className={editorFieldSurface}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...registration}
      />
      {error ? (
        <p className="mt-2 text-caption text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

type PickerProps = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
};

/** Calendar picker dùng chung cho các ngày trong nội dung thiệp. */
export function EditorDateField({
  label,
  value = "",
  onChange,
  error,
  placeholder = "Chọn ngày",
  className,
  required,
}: PickerProps) {
  const id = useId();
  const selected = parseDateValue(value);
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2">
        <FieldLabel label={label} required={required} />
      </Label>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              aria-invalid={!!error}
              className={`${editorFieldSurface} h-11 w-full justify-between px-4 font-normal`}
            />
          }
          aria-label={label}
        >
          <span
            className={selected ? "text-foreground" : "text-muted-foreground"}
          >
            {selected ? formatDateValue(selected) : placeholder}
          </span>
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            locale={vi}
            selected={selected}
            onSelect={(date) => date && onChange(formatDateValue(date))}
          />
        </PopoverContent>
      </Popover>
      {error ? (
        <p className="mt-2 text-caption text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

/**
 * Bước phút của bộ chọn giờ. Đám cưới Việt hầu như chỉ dùng giờ tròn hoặc rưỡi
 * ("11:00", "17:30"), nên bước 5 phút đã dư; liệt kê đủ 60 phút chỉ làm danh
 * sách dài ra mà không ai dùng tới.
 */
const MINUTE_STEP = 5;
const HOURS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, index) =>
  String(index * MINUTE_STEP).padStart(2, "0"),
);

/**
 * Bộ chọn giờ **24 giờ**, dựng bằng hai select thay vì `input[type="time"]`.
 *
 * Lý do bỏ input gốc: nó hiện 12 giờ hay 24 giờ là do **locale của trình duyệt
 * và hệ điều hành**, trang web không ép được (Chrome bỏ qua cả thuộc tính
 * `lang`). Hệ quả là máy đặt tiếng Anh thì editor hiện "05:30 PM" trong khi
 * thiệp in ra "17:30" — cùng một dữ liệu, hai cách đọc, và người soạn thiệp
 * không có cách nào biết cái nào sẽ lên thiệp. Người Việt đọc giờ theo 24 giờ,
 * nên đây là chỗ phải chắc chắn chứ không phải chỗ để trình duyệt tự quyết.
 *
 * Giá trị vẫn là chuỗi `HH:mm` y như trước, nên dữ liệu đã lưu không đổi.
 */
export function EditorTimeField({
  label,
  value = "",
  onChange,
  error,
  className,
  required,
}: PickerProps) {
  const [hour = "", minute = ""] = value.split(":");

  // Chỉ báo ra ngoài khi đã đủ cả giờ lẫn phút: một nửa giá trị ("17:") không
  // phải giờ hợp lệ, mà form thì đang theo dõi từng ký tự để dựng preview.
  function emit(nextHour: string, nextMinute: string) {
    onChange(nextHour && nextMinute ? `${nextHour}:${nextMinute}` : "");
  }

  return (
    <div className={className}>
      <Label className="mb-2">
        <FieldLabel label={label} required={required} />
      </Label>
      <div
        role="group"
        aria-label={label}
        className="flex min-w-0 items-center gap-1"
      >
        <Select
          value={hour}
          onValueChange={(next: string | null) =>
            emit(next ?? "", minute || "00")
          }
        >
          <SelectTrigger
            className={`${editorFieldSurface} min-w-0 flex-1 gap-1 px-2.5`}
            aria-label={`${label} (HH)`}
            // Cả hai ô giờ/phút đều mang cờ lỗi: editor tìm `aria-invalid` đầu
            // tiên để đưa người dùng tới ô lỗi khi bấm lưu, và ô giờ đứng trước.
            aria-invalid={!!error}
          >
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span aria-hidden className="text-body text-muted-foreground">
          :
        </span>

        <Select
          value={minute}
          onValueChange={(next: string | null) =>
            emit(hour || "00", next ?? "")
          }
        >
          <SelectTrigger
            className={`${editorFieldSurface} min-w-0 flex-1 gap-1 px-2.5`}
            aria-label={`${label} (mm)`}
            aria-invalid={!!error}
          >
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error ? (
        <p className="mt-2 text-caption text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

/** Hàng field chia đều, tự xuống dòng trên mobile. */
export function EditorRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:[&>*]:min-w-0">{children}</div>
  );
}
