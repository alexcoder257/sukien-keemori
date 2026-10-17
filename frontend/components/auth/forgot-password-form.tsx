"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/apis";
import { useForgotPasswordMutation } from "@/hooks/use-auth";
import { RECAPTCHA_SITE_KEY } from "@/lib/recaptcha";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { AuthCard } from "./auth-shell";
import { Field } from "./fields";
import { RecaptchaCheckbox } from "./recaptcha-checkbox";
import { forgotSchema, type ForgotValues } from "@/lib/schemas/auth";

type Props = { dict: Dictionary["auth"]; locale: Locale };

const RESEND_SECONDS = 60;

export function ForgotPasswordForm({ dict, locale }: Props) {
  const t = dict.forgot;
  const forgotPasswordMutation = useForgotPasswordMutation();
  const schema = useMemo(() => forgotSchema(dict.errors), [dict.errors]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const [sentTo, setSentTo] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Đổi key để buộc widget render lại — token v2 dùng một lần.
  const [captchaKey, setCaptchaKey] = useState(0);
  const captchaRequired = Boolean(RECAPTCHA_SITE_KEY);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1);
  }

  async function sendLink(email: string, isResend = false) {
    try {
      await forgotPasswordMutation.mutateAsync({
        email,
        locale,
        captchaToken: captchaToken ?? undefined,
        isResend,
      });
      setCountdown(RESEND_SECONDS);
    } finally {
      if (!isResend) resetCaptcha();
    }
  }

  function errorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      return error.status === 429 ? dict.errors.tooManyRequests : error.message;
    }
    return dict.errors.generic;
  }

  async function onSubmit(values: ForgotValues) {
    try {
      await sendLink(values.email);
      setSentTo(values.email);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const backLink = (
    <Link
      href={`/${locale}/dang-nhap`}
      className="inline-flex items-center justify-center gap-1.5 text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      <ArrowLeft className="size-3.5" />
      {t.backToLogin}
    </Link>
  );

  if (sentTo) {
    return (
      <AuthCard
        title={t.sentTitle}
        subtitle={t.sentBody.replace("{email}", sentTo)}
      >
        <div className="flex flex-col gap-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            disabled={countdown > 0 || forgotPasswordMutation.isPending}
            onClick={async () => {
              try {
                await sendLink(sentTo, true);
                toast.success(t.resent);
              } catch (error) {
                toast.error(errorMessage(error));
              }
            }}
          >
            {countdown > 0
              ? t.resendIn.replace("{seconds}", String(countdown))
              : t.resend}
          </Button>
          {backLink}
        </div>
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
        <Field
          type="email"
          autoComplete="email"
          label={t.email}
          placeholder={t.emailPlaceholder}
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register("email")}
        />
        <RecaptchaCheckbox
          key={captchaKey}
          locale={locale}
          onVerify={setCaptchaToken}
        />
        <Button
          type="submit"
          className="h-11 w-full"
          disabled={isSubmitting || (captchaRequired && !captchaToken)}
        >
          {isSubmitting ? t.submitting : t.submit}
        </Button>
        {backLink}
      </form>
    </AuthCard>
  );
}
