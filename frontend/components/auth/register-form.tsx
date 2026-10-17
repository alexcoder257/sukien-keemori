"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError } from "@/apis";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRegisterMutation } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { AuthCard, OrDivider } from "./auth-shell";
import { OAuthButtons } from "./oauth-buttons";
import { Field, PasswordField } from "./fields";
import { TermsConsentDialog, type LegalTab } from "./terms-consent-dialog";
import { PhoneField } from "@/components/shared/phone-field";
import { DEFAULT_PHONE_COUNTRY, findPhoneCountry, toE164 } from "@/constants";
import {
  LEGAL_DOCUMENTS,
  LEGAL_DOCUMENT_API_TYPE,
  SIGNUP_LEGAL_DOCUMENTS,
} from "@/constants/legal";
import { passwordStrength } from "@/lib/password";
import { registerSchema, type RegisterValues } from "@/lib/schemas/auth";

const BAR_COLORS = [
  "bg-border",
  "bg-destructive",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-emerald-500",
] as const;

type Props = {
  dict: Dictionary["auth"];
  phoneFieldDict: Dictionary["common"]["phoneField"];
  /**
   * Nội dung hai văn bản pháp lý, để hộp chấp thuận hiện được ngay tại chỗ.
   * Truyền từ Server Component thay vì gọi API: đây là dictionary có sẵn, và
   * người dùng phải đọc được nó cả khi mạng đang chập chờn.
   */
  termsDict: Dictionary["legal"]["terms"];
  privacyDict: Dictionary["legal"]["privacy"];
  legalSharedDict: Dictionary["legal"]["shared"];
  locale: Locale;
};

export function RegisterForm({
  dict,
  phoneFieldDict,
  termsDict,
  privacyDict,
  legalSharedDict,
  locale,
}: Props) {
  const t = dict.register;
  const s = dict.reset.strength;
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerMutation = useRegisterMutation();
  const schema = useMemo(() => registerSchema(dict.errors), [dict.errors]);
  const [consentTab, setConsentTab] = useState<LegalTab>("terms");
  const [consentOpen, setConsentOpen] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneCountry: DEFAULT_PHONE_COUNTRY,
      phone: "",
      password: "",
      confirm: "",
      terms: false as unknown as true,
    },
  });

  const password = useWatch({ control, name: "password" });
  const score = passwordStrength(password);
  const strengthLabel = [s.weak, s.weak, s.fair, s.good, s.strong][score];
  const strengthHint =
    score > 0 && score < 4 ? ` — ${score <= 1 ? s.hintWeak : s.hintFair}` : "";
  const submitting = isSubmitting || registerMutation.isPending;

  const openConsent = (tab: LegalTab) => {
    setConsentTab(tab);
    setConsentOpen(true);
  };

  async function onSubmit(values: RegisterValues) {
    try {
      const national = values.phone.trim();
      await registerMutation.mutateAsync({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
        // Gửi kèm **phiên bản đang hiển thị trên chính màn hình này**, không
        // phải phiên bản backend đang chạy: hai giá trị lệch nhau đúng vào lúc
        // vừa deploy bản legal mới trong khi có người đang mở dở form. Sổ chấp
        // thuận phải ghi lại chữ người dùng thật sự đã đọc.
        acceptedDocuments: SIGNUP_LEGAL_DOCUMENTS.map((key) => ({
          type: LEGAL_DOCUMENT_API_TYPE[key],
          version: LEGAL_DOCUMENTS[key].version,
        })),
        // Lưu dạng E.164 để số nào cũng gọi được từ nước khác.
        phone: national
          ? toE164(findPhoneCountry(values.phoneCountry).dial, national)
          : undefined,
      });
      toast.success(t.success);
      // Về trang chủ, giống lối đăng nhập: người vừa đăng ký chắc chắn chưa
      // có thiệp nào, đẩy thẳng vào màn danh sách rỗng là một ngõ cụt. `next`
      // vẫn thắng — người bị hỏi đăng nhập giữa chừng (đăng ký giữa lúc
      // đang thanh toán chẳng hạn) phải quay lại đúng chỗ đang đứng.
      const next = searchParams.get("next");
      router.replace(next && next.startsWith(`/${locale}`) ? next : `/${locale}`);
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
          googleLabel={dict.oauth.googleSignup}
          facebookLabel={dict.oauth.facebookSignup}
          disabled={submitting}
        />
        {/* Chấp thuận bằng hành vi cho nhánh OAuth: nhà cung cấp không trả về
            ô tick nào, nên câu này chính là bằng chứng người dùng được cho
            biết trước khi bấm. Backend ghi sổ nhánh đó với `source: 'oauth'`
            để sau này phân biệt được hai mức bằng chứng. */}
        <p className="text-center text-xs text-muted-foreground">
          {t.oauthConsent}
        </p>

        <OrDivider label={t.divider} />

        <Field
          autoComplete="name"
          label={t.fullName}
          placeholder={t.fullNamePlaceholder}
          error={errors.fullName?.message}
          disabled={submitting}
          required
          {...register("fullName")}
        />
        <Field
          type="email"
          autoComplete="email"
          label={t.email}
          placeholder={t.emailPlaceholder}
          error={errors.email?.message}
          disabled={submitting}
          required
          {...register("email")}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Controller
              control={control}
              name="phoneCountry"
              render={({ field: countryField }) => (
                <PhoneField
                  locale={locale}
                  label={t.phone}
                  placeholder={t.phonePlaceholder}
                  countryDict={phoneFieldDict}
                  country={countryField.value}
                  onCountryChange={countryField.onChange}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.phone?.message}
                  disabled={submitting}
                />
              )}
            />
          )}
        />

        <div className="flex flex-col gap-2">
          <PasswordField
            autoComplete="new-password"
            label={t.password}
            placeholder={t.passwordPlaceholder}
            error={errors.password?.message}
            disabled={submitting}
            required
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
          placeholder={t.confirmPlaceholder}
          error={errors.confirm?.message}
          disabled={submitting}
          required
          {...register("confirm")}
        />

        <Controller
          control={control}
          name="terms"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox
                  id="terms"
                  aria-labelledby="terms-label"
                  checked={field.value}
                  onCheckedChange={(v) => {
                    // Đồng ý thì phải đi qua bản văn: bật ô này mở hộp chấp
                    // thuận, và chỉ nút xác nhận trong đó mới ghi `true`. Bỏ
                    // đồng ý thì ngược lại — rút lại là quyền vô điều kiện,
                    // không bắt đọc lại gì cả.
                    if (v === true) openConsent("terms");
                    else field.onChange(false);
                  }}
                  disabled={submitting}
                  className="mt-0.5"
                  aria-invalid={errors.terms ? true : undefined}
                />
                <span id="terms-label">
                  {t.agreePrefix}{" "}
                  {/* Nút chứ không phải link: rời trang giữa chừng là mất sạch
                      những gì vừa nhập vào form này. */}
                  <button
                    type="button"
                    onClick={() => openConsent("terms")}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    {t.terms}
                  </button>{" "}
                  {t.and}{" "}
                  <button
                    type="button"
                    onClick={() => openConsent("privacy")}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    {t.privacy}
                  </button>
                </span>
              </div>
              {errors.terms ? (
                <p className="text-xs text-destructive">
                  {errors.terms.message}
                </p>
              ) : null}
            </div>
          )}
        />

        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? t.submitting : t.submit}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t.hasAccount}{" "}
          <Link
            href={`/${locale}/dang-nhap`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t.loginLink}
          </Link>
        </p>
      </form>

      {/* Chỉ dựng khi mở: hai văn bản pháp lý là hơn hai mươi mục nội dung,
          không nên nằm sẵn trong DOM của một form đăng ký. */}
      {consentOpen ? (
        <TermsConsentDialog
          open
          onOpenChange={setConsentOpen}
          tab={consentTab}
          onTabChange={setConsentTab}
          onAgree={() => {
            setValue("terms", true as RegisterValues["terms"], {
              shouldValidate: true,
            });
            setConsentOpen(false);
          }}
          dict={t.consent}
          termsDict={termsDict}
          privacyDict={privacyDict}
          sharedDict={legalSharedDict}
          locale={locale}
        />
      ) : null}
    </AuthCard>
  );
}
