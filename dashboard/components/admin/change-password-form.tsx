"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { ApiError } from "@/apis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePasswordMutation } from "@/hooks/use-admin-auth";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/schemas/auth";

type Props = {
  dict: Dictionary["admin"];
  locale: Locale;
  /** Đưa vào ô `username` ẩn để trình quản lý mật khẩu biết cập nhật mục nào. */
  email: string;
};

const FIELDS = [
  { name: "currentPassword", autoComplete: "current-password" },
  { name: "newPassword", autoComplete: "new-password" },
  { name: "confirm", autoComplete: "new-password" },
] as const;

/**
 * Đổi mật khẩu của chính mình. Backend thu hồi refresh token khi đổi, nên
 * thành công thì form tự đăng xuất: phiên này sẽ chết ở lần làm mới kế tiếp dù
 * sao, để người dùng tự gặp màn đăng nhập sau 15 phút thì khó hiểu hơn nhiều.
 *
 * `redirect: "manual"` vì route đăng xuất trả 303 về trang đăng nhập — ở đây
 * chỉ cần nó xoá cookie; điều hướng toàn trang ngay sau đó xoá luôn cache
 * React Query của phiên cũ.
 */
export function ChangePasswordForm({ dict, locale, email }: Props) {
  const t = dict.account.password;
  const { message } = App.useApp();
  const mutation = useChangePasswordMutation();

  const schema = useMemo(() => changePasswordSchema(t.errors), [t.errors]);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });
  const { errors } = form.formState;

  const labels: Record<(typeof FIELDS)[number]["name"], string> = {
    currentPassword: t.current,
    newPassword: t.next,
    confirm: t.confirm,
  };

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: async () => {
          message.success(t.done);
          await fetch(`/api/auth/logout?locale=${locale}`, {
            method: "POST",
            redirect: "manual",
          }).catch(() => undefined);
          window.location.assign(
            `/${locale}/dang-nhap?notice=password_changed`,
          );
        },
        onError: (error) =>
          message.error(
            error instanceof ApiError ? error.message : dict.errors.failed,
          ),
      },
    );
  });

  return (
    <section className="max-w-2xl space-y-5 rounded-lg border border-border bg-card p-6 shadow-card">
      <div className="space-y-1">
        <h2 className="text-body-lg font-semibold">
          {t.title}
        </h2>
        <p className="text-small text-muted-foreground">{t.hint}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={email}
          readOnly
          hidden
        />
        {FIELDS.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{labels[field.name]}</Label>
            <Input
              id={field.name}
              type="password"
              autoComplete={field.autoComplete}
              aria-invalid={!!errors[field.name]}
              {...form.register(field.name)}
            />
            {errors[field.name] ? (
              <p className="text-small text-destructive">
                {errors[field.name]?.message}
              </p>
            ) : field.name === "newPassword" ? (
              <p className="text-caption text-muted-foreground">{t.rules}</p>
            ) : null}
          </div>
        ))}
        <Button type="submit" loading={mutation.isPending}>
          {t.submit}
        </Button>
      </form>
    </section>
  );
}
