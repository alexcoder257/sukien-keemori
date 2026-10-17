"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { App } from "antd";
import { ApiError } from "@/apis";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} from "@/hooks/use-admin";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ShowcaseKind } from "@/constants/showcase";
import { CardPicker } from "./card-picker";

type Props = { dict: Dictionary["admin"] };

type FormValues = { demoCardSlug: string; demoCardKind: ShowcaseKind };

/**
 * Thiệp mà nút "Xem thiệp mẫu" ở hero trang chủ dẫn tới.
 *
 * Đứng riêng một màn chứ không nằm chung với "Cấu hình link": đây là một quyết
 * định **biên tập** — mẫu nào đang đẹp nhất để chào hàng — cùng loại với hai
 * màn kia trong nhóm Trang chủ, không phải một hằng số vận hành như số ngày
 * sống của link.
 *
 * Không cần Zod: form đúng một trường, và giá trị của nó chỉ đến từ `CardPicker`
 * (chọn trong danh sách thiệp đã xuất bản) hoặc từ nút bỏ chọn. Không có ô chữ
 * nào để gõ sai.
 */
export function HomepageHeroForm({ dict }: Props) {
  const { message } = App.useApp();
  const t = dict.homepageHero;
  const { data, isLoading } = useSiteSettingsQuery();
  const updateMutation = useUpdateSiteSettingsMutation();

  const form = useForm<FormValues>({
    defaultValues: { demoCardSlug: "", demoCardKind: "card" },
  });
  const { reset } = form;
  const { isDirty } = form.formState;

  // Giá trị thật chỉ có sau khi query xong, mà form đã dựng từ trước.
  useEffect(() => {
    if (data) {
      reset({
        demoCardSlug: data.demoCardSlug ?? "",
        demoCardKind: data.demoCardKind,
      });
    }
  }, [data, reset]);

  const onSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(
      // Bỏ trống gửi lên `null` để backend xoá hẳn cấu hình, còn trang chủ rơi
      // về thiệp mẫu mặc định trong code thay vì trỏ nút vào `/t/` rỗng.
      {
        demoCardSlug: values.demoCardSlug.trim() || null,
        demoCardKind: values.demoCardKind,
      },
      {
        // Không reset ở đây: mutation ghi kết quả vào cache React Query, effect
        // bên trên nạp lại form và `isDirty` tự về `false`.
        onSuccess: () => message.success(t.saved),
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
      className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-card"
    >
      <div className="space-y-2">
        <Label>{t.demoCard}</Label>
        <Controller
          control={form.control}
          name="demoCardSlug"
          render={({ field }) => (
            <CardPicker
              value={{
                kind: form.getValues("demoCardKind"),
                slug: field.value,
              }}
              onChange={(next) => {
                // `kind` đi cùng `slug` như một cặp: đổi một nửa mà quên nửa
                // kia là nút hero trỏ vào đúng slug nhưng sai loại đường dẫn.
                form.setValue("demoCardKind", next.kind, { shouldDirty: true });
                field.onChange(next.slug);
              }}
              labels={dict.coupleShowcase.picker}
            />
          )}
        />
        <p className="text-caption text-muted-foreground">{t.demoCardHint}</p>
      </div>

      {/* Chưa sửa gì thì không có gì để lưu — nút sáng lúc đó chỉ mời người
          dùng gửi một request rỗng rồi tự hỏi mình vừa đổi cái gì. */}
      <Button
        type="submit"
        disabled={isLoading || updateMutation.isPending || !isDirty}
      >
        {t.save}
      </Button>
    </form>
  );
}
