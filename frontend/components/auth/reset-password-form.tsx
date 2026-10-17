"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { ApiError } from "@/apis";
import { Button } from "@/components/ui/button";
import { useResetPasswordMutation } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { AuthCard } from "./auth-shell";
import { PasswordField } from "./fields";
import { passwordStrength } from "@/lib/password";
import { resetSchema, type ResetValues } from "@/lib/schemas/auth";

type Props = { dict: Dictionary["auth"]; locale: Locale; token: string | null };

const BAR_COLORS = [
  "bg-border",
  "bg-destructive",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-emerald-500",
] as const;

export function ResetPasswordForm({ dict, locale, token }: Props) {
  const t = dict.reset;
  const s = t.strength;
  const router = useRouter();
  const resetPasswordMutation = useResetPasswordMutation();
  const schema = useMemo(() => resetSchema(dict.errors), [dict.errors]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const password = useWatch({ control, name: "password" });
  const score = passwordStrength(password);
  const strengthLabel = [s.weak, s.weak, s.fair, s.good, s.strong][score];
  const strengthHint =
    score > 0 && score < 4 ? ` — ${score <= 1 ? s.hintWeak : s.hintFair}` : "";
  const submitting = isSubmitting || resetPasswordMutation.isPending;

  async function onSubmit(values: ResetValues) {
    if (!token) return;
    try {
      await resetPasswordMutation.mutateAsync({
        token,
        password: values.password,
      });
      toast.success(t.success);
      router.push(`/${locale}/dang-nhap`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : dict.errors.generic,
      );
    }
  }

  // Link thiếu token (người dùng mở thẳng URL) → không hiện form.
  if (!token) {
    return (
      <AuthCard title={t.invalidTitle} subtitle={t.invalidBody}>
        <Link
          href={`/${locale}/quen-mat-khau`}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t.requestNew}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.title} subtitle={t.subtitle}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <PasswordField
            autoComplete="new-password"
            label={t.newPassword}
            placeholder={t.passwordPlaceholder}
            error={errors.password?.message}
            disabled={submitting}
            {...register("password")}
          />
          {password ? (
            <>
              <div className="flex gap-1.5" aria-hidden>
                {[1, 2, 3, 4].map((bar) => (
                  <span
                    key={bar}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      bar <= score ? BAR_COLORS[score] : "bg-border",
                    )}
                  />
                ))}
              </div>
              <p className="text-[10.5px] text-muted-foreground">
                {s.label} {strengthLabel}
                {strengthHint}
              </p>
            </>
          ) : null}
        </div>

        <PasswordField
          autoComplete="new-password"
          label={t.confirmPassword}
          placeholder={t.passwordPlaceholder}
          error={errors.confirm?.message}
          disabled={submitting}
          {...register("confirm")}
        />

        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? t.submitting : t.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
