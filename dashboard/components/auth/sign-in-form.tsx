"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { hashPassword } from "@/apis/crypto";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import styles from "./sign-in-page.module.css";

type Props = {
  dict: Dictionary["auth"];
  locale: Locale;
  next: string | null;
};

type LoginError = "invalid" | "throttled" | "unavailable";

function isLoginError(value: unknown): value is LoginError {
  return value === "invalid" || value === "throttled" || value === "unavailable";
}

/**
 * Gửi tới `/api/auth/login` của **chính dashboard**, không gọi thẳng backend:
 * route đó mới đặt được cookie `httpOnly` cho refresh token.
 *
 * Thành công thì điều hướng toàn trang (`location.assign`) chứ không
 * `router.push`: `proxy.ts` phải chạy lại để thấy cookie mới, và layout vừa
 * render lúc chưa đăng nhập không được giữ lại.
 */
export function SignInForm({ dict, locale, next }: Props) {
  const t = dict.login;
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<LoginError | null>(null);

  const schema = useMemo(() => loginSchema(dict.errors), [dict.errors]);
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: await hashPassword(values.password),
          next,
          locale,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        redirect?: string;
        error?: unknown;
      } | null;
      if (response.ok && data?.redirect) {
        window.location.assign(data.redirect);
        return;
      }
      setServerError(isLoginError(data?.error) ? data.error : "unavailable");
    } catch {
      setServerError("unavailable");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      {serverError ? (
        <p role="alert" className={styles.alert}>
          {dict.errors[serverError]}
        </p>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          {t.email}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          className={styles.input}
          aria-invalid={!!errors.email}
          {...form.register("email")}
        />
        {errors.email ? (
          <p className={styles.fieldError}>{errors.email.message}</p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          {t.password}
        </label>
        <div className={styles.inputWrap}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className={styles.input}
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? t.hidePassword : t.showPassword}
          >
            {showPassword ? (
              <EyeOff aria-hidden size={18} />
            ) : (
              <Eye aria-hidden size={18} />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className={styles.fieldError}>{errors.password.message}</p>
        ) : null}
      </div>

      <button type="submit" className={styles.button} disabled={isSubmitting}>
        <LogIn aria-hidden size={18} />
        {isSubmitting ? t.submitting : t.submit}
      </button>
    </form>
  );
}
