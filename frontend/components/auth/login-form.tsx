"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/apis";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/hooks/use-auth";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { AuthCard, OrDivider } from "./auth-shell";
import {
  OAUTH_PROVIDER_LABEL,
  isOAuthProvider,
} from "@/constants/oauth";
import { OAuthButtons } from "./oauth-buttons";
import { Field, PasswordField } from "./fields";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";
import {
  clearRememberedEmail,
  readRememberedEmail,
  writeRememberedEmail,
} from "@/lib/remembered-email";

type Props = { dict: Dictionary["auth"]; locale: Locale };

export function LoginForm({ dict, locale }: Props) {
  const t = dict.login;
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLoginMutation();
  const schema = useMemo(() => loginSchema(dict.errors), [dict.errors]);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });
  const submitting = isSubmitting || loginMutation.isPending;

  // "Ghi nhớ tôi" chỉ nhớ **email** (xem `lib/remembered-email.ts`); mật khẩu
  // để trình duyệt lưu. Đọc sau khi mount chứ không đưa vào `defaultValues`:
  // server không có localStorage, điền ngay lúc render là HTML server và client
  // lệch nhau.
  useEffect(() => {
    const email = readRememberedEmail();
    if (!email) return;
    setValue("email", email);
    setValue("remember", true);
  }, [setValue]);

  // Backend đẩy người dùng về đây kèm `?error=` và `?provider=` khi luồng OAuth
  // hỏng giữa chừng (huỷ, state hết hạn, chưa cấu hình…). StrictMode gọi effect
  // hai lần trong dev nên chốt bằng ref để toast không hiện đôi.
  const oauthError = searchParams.get("error");
  const oauthProvider = searchParams.get("provider");
  const shownError = useRef<string | null>(null);
  useEffect(() => {
    if (!oauthError || shownError.current === oauthError) return;
    shownError.current = oauthError;
    const messages = dict.oauth.errors;
    const message = messages[oauthError as keyof typeof messages];
    if (!message) {
      toast.error(dict.errors.generic);
      return;
    }
    // Thiếu `provider` (link cũ, người dùng tự gõ URL) thì vẫn phải ra một câu
    // đọc được, nên rơi về tên chung thay vì để lại chỗ trống.
    toast.error(
      message.replace(
        "{provider}",
        oauthProvider && isOAuthProvider(oauthProvider)
          ? OAUTH_PROVIDER_LABEL[oauthProvider]
          : dict.oauth.providerFallback,
      ),
    );
  }, [oauthError, oauthProvider, dict]);

  // Giữ `next` khi đi tiếp sang đăng ký: người chưa có tài khoản vẫn phải
  // quay về đúng chỗ đã hỏi đăng nhập sau khi tạo xong tài khoản.
  const nextParam = searchParams.get("next");
  const signupHref =
    nextParam && nextParam.startsWith(`/${locale}`)
      ? `/${locale}/dang-ky?next=${encodeURIComponent(nextParam)}`
      : `/${locale}/dang-ky`;

  async function onSubmit(values: LoginValues) {
    try {
      await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
      // Chỉ ghi sau khi đăng nhập **thành công**: nhớ một email gõ sai chính tả
      // thì lần sau người dùng lại phải xoá nó đi. Bỏ tick là quên luôn.
      if (values.remember) writeRememberedEmail(values.email);
      else clearRememberedEmail();
      toast.success(t.success);
      // Mặc định về trang chủ chứ không phải "Thiệp của tôi": phần lớn người
      // đăng nhập xong là đi chọn mẫu, và người mới thì màn "chưa có thiệp nào"
      // là một ngõ cụt. `next` vẫn thắng — đó là đường quay lại đúng chỗ người
      // dùng đang đứng khi bị hỏi đăng nhập.
      const next = searchParams.get("next");
      const target =
        next && next.startsWith(`/${locale}`) ? next : `/${locale}`;
      router.replace(target);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : dict.errors.generic);
    }
  }

  return (
    <AuthCard title={t.title} subtitle={t.subtitle}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <OAuthButtons
          locale={locale}
          googleLabel={dict.oauth.google}
          facebookLabel={dict.oauth.facebook}
          disabled={submitting}
        />
        <OrDivider label={t.divider} />

        <Field
          type="email"
          autoComplete="email"
          label={t.email}
          placeholder={t.emailPlaceholder}
          error={errors.email?.message}
          disabled={submitting}
          {...register("email")}
        />
        <PasswordField
          autoComplete="current-password"
          label={t.password}
          placeholder={t.passwordPlaceholder}
          error={errors.password?.message}
          disabled={submitting}
          {...register("password")}
        />

        <div className="flex items-center justify-between">
          <Controller
            control={control}
            name="remember"
            render={({ field }) => (
              <Label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  disabled={submitting}
                />
                {t.remember}
              </Label>
            )}
          />
          <Link
            href={`/${locale}/quen-mat-khau`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t.forgot}
          </Link>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? t.submitting : t.submit}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t.noAccount}{" "}
          <Link
            href={signupHref}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t.signupLink}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
