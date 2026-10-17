"use client";

import { forwardRef, useId, useState } from "react";
import type { ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = ComponentProps<typeof Input> & {
  label: string;
  error?: string;
};

/**
 * Nhãn kèm dấu sao đỏ khi trường bắt buộc. Chữ và dấu sao nằm chung một `span`
 * vì `Label` là flex `gap-2` — để rời ra thì dấu sao trôi cách nhãn 8px.
 *
 * Dấu sao `aria-hidden` vì `required` trên chính input đã nói điều đó với
 * screen reader rồi — đọc thêm "sao" chỉ gây nhiễu.
 */
function LabelText({ label, required }: { label: string; required?: boolean }) {
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

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>
        <LabelText label={label} required={props.required} />
      </Label>
      <Input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={className}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, FieldProps>(
  function PasswordField({ label, error, id, ...props }, ref) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const [visible, setVisible] = useState(false);
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fieldId}>
          <LabelText label={label} required={props.required} />
        </Label>
        <div className="relative">
          <Input
            ref={ref}
            id={fieldId}
            type={visible ? "text" : "password"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="pr-10"
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className={cn(
              "absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground",
              "hover:text-foreground",
            )}
          >
            {visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {error ? (
          <p id={errorId} className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
