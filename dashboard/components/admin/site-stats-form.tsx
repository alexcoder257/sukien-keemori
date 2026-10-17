"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { ApiError } from "@/apis";
import { SITE_STAT_KEYS, type SiteStatKey } from "@/apis/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useSiteStatsQuery,
  useUpdateSiteStatsMutation,
} from "@/hooks/use-content";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  SITE_STAT_FIELD,
  siteStatsSchema,
  type SiteStatsValues,
} from "@/lib/schemas/admin";

type Props = {
  dict: Dictionary["admin"];
};

/** Nhóm ô theo trang để người vận hành biết số nào hiện ở đâu. */
const GROUPS: { titleKey: "homeGroup"; keys: SiteStatKey[] }[] = [
  {
    titleKey: "homeGroup",
    keys: SITE_STAT_KEYS.filter((key) => key.startsWith("home.")),
  },
];

const EMPTY = Object.fromEntries(
  SITE_STAT_KEYS.map((key) => [SITE_STAT_FIELD[key], 0]),
) as SiteStatsValues;

/**
 * Dải số liệu ở trang chủ (12.000+ thiệp, 80+ mẫu, 4,9★).
 *
 * Đây là **con số công bố**, không phải `COUNT(*)`: xem ghi chú trong
 * `SiteStat` ở backend về lý do. Form này là chỗ duy nhất đổi chúng — trước đây
 * phải sửa seeder rồi chạy lại.
 */
export function SiteStatsForm({ dict }: Props) {
  const { message } = App.useApp();
  const { data, isLoading } = useSiteStatsQuery();
  const updateMutation = useUpdateSiteStatsMutation();

  const schema = useMemo(() => siteStatsSchema(dict.errors), [dict.errors]);
  const form = useForm<SiteStatsValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });
  const { reset } = form;
  const { isDirty, errors } = form.formState;

  // Giá trị thật chỉ có sau khi query xong, mà form đã dựng từ trước — nạp lại
  // khi dữ liệu về thay vì để ô 0 nhấp nháy rồi tự điền.
  useEffect(() => {
    if (data) {
      reset(
        Object.fromEntries(
          data.map((stat) => [SITE_STAT_FIELD[stat.key], stat.value]),
        ) as SiteStatsValues,
      );
    }
  }, [data, reset]);

  const onSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(
      SITE_STAT_KEYS.map((key) => ({
        key,
        // Cột là `numeric(12,2)` và backend từ chối quá 2 chữ số thập phân;
        // làm tròn ở đây để một con số dán vào ô không biến thành lỗi 400.
        value: Math.round(values[SITE_STAT_FIELD[key]] * 100) / 100,
      })),
      {
        // Không reset ở đây: mutation ghi kết quả vào cache, effect bên trên nạp
        // lại form bằng đúng giá trị backend trả về nên `isDirty` tự về `false`.
        onSuccess: () => message.success(dict.siteStats.saved),
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
      className="space-y-8 rounded-lg border border-border bg-card p-6 shadow-card"
    >
      {GROUPS.map((group) => (
        <section key={group.titleKey} className="space-y-4">
          <h2 className="text-small font-semibold">
            {dict.siteStats[group.titleKey]}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {group.keys.map((key) => {
              const field = SITE_STAT_FIELD[key];
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={field}>{dict.siteStats.fields[key]}</Label>
                  <Input
                    id={field}
                    type="number"
                    min={0}
                    // Điểm trung bình cần một chữ số lẻ; các ô còn lại là số đếm
                    // nên bước nhảy 1 giữ mũi tên tăng/giảm dùng được.
                    step={key === "home.rating" ? 0.1 : 1}
                    disabled={isLoading}
                    {...form.register(field, { valueAsNumber: true })}
                  />
                  {errors[field] ? (
                    <p className="text-caption text-destructive">
                      {errors[field]?.message}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="text-caption text-muted-foreground">
        {dict.siteStats.cacheHint}
      </p>

      {/* Chưa sửa gì thì không có gì để lưu — nút sáng lúc đó chỉ mời người dùng
          gửi một request rỗng rồi tự hỏi mình vừa đổi cái gì. */}
      <Button
        type="submit"
        disabled={isLoading || updateMutation.isPending || !isDirty}
      >
        {dict.siteStats.save}
      </Button>
    </form>
  );
}
