"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { ApiError } from "@/apis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} from "@/hooks/use-admin";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  siteSettingsFormSchema,
  type SiteSettingsFormValues as FormValues,
} from "@/lib/schemas/admin";

type Props = {
  dict: Dictionary["admin"];
};

/** Năm ô của khối chân trang — cùng một hình dạng nên dựng từ một mảng. */
const SOCIAL_FIELDS = [
  { name: "facebookUrl", type: "url", placeholder: "https://facebook.com/keemori" },
  { name: "instagramUrl", type: "url", placeholder: "https://instagram.com/keemori" },
  { name: "tiktokUrl", type: "url", placeholder: "https://tiktok.com/@keemori" },
  { name: "zaloPhone", type: "tel", placeholder: "0358465162" },
  { name: "contactEmail", type: "email", placeholder: "hotro@keemori.com" },
] as const;

/**
 * Cấu hình thời gian tồn tại của link chưa thanh toán (spec mục 3).
 *
 * Hai con số này trước đây là hằng số biên dịch trong backend, nên đổi chính
 * sách nghĩa là sửa code và deploy. Từ đây chúng nằm ở DB và form này là chỗ
 * duy nhất đổi chúng.
 */
export function SiteSettingsForm({ dict }: Props) {
  const { message } = App.useApp();
  const { data, isLoading } = useSiteSettingsQuery();
  const updateMutation = useUpdateSiteSettingsMutation();

  const schema = useMemo(
    () => siteSettingsFormSchema(dict.errors),
    [dict.errors],
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      messengerUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      tiktokUrl: "",
      zaloPhone: "",
      contactEmail: "",
    },
  });
  const { reset } = form;
  const { isDirty } = form.formState;

  // Giá trị thật chỉ có sau khi query xong, mà form đã dựng từ trước — nạp lại
  // khi dữ liệu về thay vì để ô trống nhấp nháy rồi tự điền.
  useEffect(() => {
    if (data) {
      reset({
              messengerUrl: data.messengerUrl ?? "",
        facebookUrl: data.facebookUrl ?? "",
        instagramUrl: data.instagramUrl ?? "",
        tiktokUrl: data.tiktokUrl ?? "",
        zaloPhone: data.zaloPhone ?? "",
        contactEmail: data.contactEmail ?? "",
      });
    }
  }, [data, reset]);

  const onSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(
      {
              // Ô trống gửi lên `null` để backend xoá hẳn cấu hình, không giữ lại
        // một chuỗi rỗng mà trang khách phải tự đoán nghĩa.
        messengerUrl: values.messengerUrl.trim() || null,
        facebookUrl: values.facebookUrl.trim() || null,
        instagramUrl: values.instagramUrl.trim() || null,
        tiktokUrl: values.tiktokUrl.trim() || null,
        zaloPhone: values.zaloPhone || null,
        contactEmail: values.contactEmail.trim() || null,
      },
      {
        // Không reset ở đây: mutation ghi thẳng kết quả vào cache React Query,
        // nên `data` đổi và effect bên trên nạp lại form bằng đúng giá trị
        // backend trả về — `isDirty` về `false` và nút Lưu tự tắt.
        onSuccess: () => message.success(dict.settings.saved),
        onError: (error) =>
          message.error(
            error instanceof ApiError ? error.message : dict.errors.failed,
          ),
      },
    );
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-card"
    >
      <div className="space-y-2">
        <Label htmlFor="messengerUrl">{dict.settings.messengerUrl}</Label>
        <Input
          id="messengerUrl"
          type="url"
          inputMode="url"
          placeholder="https://m.me/fanpage"
          disabled={isLoading}
          {...form.register("messengerUrl")}
        />
        <p className="text-caption text-muted-foreground">
          {dict.settings.messengerUrlHint}
        </p>
        {form.formState.errors.messengerUrl ? (
          <p className="text-caption text-destructive">
            {form.formState.errors.messengerUrl.message}
          </p>
        ) : null}
      </div>

      <section
        aria-labelledby="footer-social-title"
        className="space-y-4 border-t border-border pt-6"
      >
        <div className="space-y-1">
          <h2 id="footer-social-title" className="text-small font-semibold">
            {dict.settings.socialTitle}
          </h2>
          <p className="text-caption text-muted-foreground">
            {dict.settings.socialHint}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(({ name, type, placeholder }) => {
            const error = form.formState.errors[name];
            return (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{dict.settings[name]}</Label>
                <Input
                  id={name}
                  type={type}
                  inputMode={type}
                  placeholder={placeholder}
                  disabled={isLoading}
                  aria-invalid={!!error}
                  {...form.register(name)}
                />
                {error ? (
                  <p className="text-caption text-destructive">
                    {error.message}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="text-caption text-muted-foreground">
          {dict.settings.zaloPhoneHint}
        </p>
        <p className="text-caption text-muted-foreground">
          {dict.settings.contactEmailHint}
        </p>
      </section>

      {/* Chưa sửa gì thì không có gì để lưu — nút sáng lúc đó chỉ mời người
          dùng gửi một request rỗng rồi tự hỏi mình vừa đổi cái gì. */}
      <Button
        type="submit"
        disabled={isLoading || updateMutation.isPending || !isDirty}
      >
        {dict.settings.save}
      </Button>
    </form>
  );
}
