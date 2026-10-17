"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { ApiError } from "@/apis";
import type { Pricing } from "@/apis/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePricingQuery, useUpdatePricingMutation } from "@/hooks/use-pricing";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/format";
import { priceConfigSchema, type PriceConfigValues } from "@/lib/schemas/admin";

type Props = {
  dict: Dictionary["admin"];
  locale: Locale;
};

function PriceForm({
  pricing,
  dict,
  locale,
}: {
  pricing: Pricing;
  dict: Dictionary["admin"];
  locale: Locale;
}) {
  const { message } = App.useApp();
  const t = dict.priceConfig;
  const schema = useMemo(() => priceConfigSchema(dict.errors), [dict.errors]);
  const updateMutation = useUpdatePricingMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<PriceConfigValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      price: pricing.price,
      discountPercent: pricing.discountPercent,
    },
  });

  function onSubmit(values: PriceConfigValues) {
    updateMutation.mutate(values, {
      onSuccess: (saved) => {
        message.success(t.saved);
        reset({ price: saved.price, discountPercent: saved.discountPercent });
      },
      onError: (error) =>
        message.error(
          error instanceof ApiError ? error.message : dict.errors.failed,
        ),
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pricing-price">{t.money}</Label>
          <Input
            id="pricing-price"
            type="number"
            min={1}
            step={1000}
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price ? (
            <p className="text-caption text-destructive">
              {errors.price.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricing-discount">{t.discount}</Label>
          <Input
            id="pricing-discount"
            type="number"
            min={0}
            max={100}
            step={1}
            placeholder={t.discountEmpty}
            {...register("discountPercent", { valueAsNumber: true })}
          />
          <p className="text-caption text-muted-foreground">
            {t.discountHint}
          </p>
          {errors.discountPercent ? (
            <p className="text-caption text-destructive">
              {errors.discountPercent.message}
            </p>
          ) : null}
        </div>
      </div>

      <p className="text-small text-muted-foreground">
        {t.finalPrice}{" "}
        <strong className="tabular-nums text-foreground">
          {formatCurrency(pricing.finalPrice, locale)}
        </strong>
      </p>

      <Button
        type="submit"
        size="sm"
        variant={isDirty ? "default" : "outline"}
        disabled={!isDirty || updateMutation.isPending}
      >
        {t.save}
      </Button>
    </form>
  );
}

/**
 * Bảng giá một gói — quyền `pricing:manage`. Giá niêm yết và khuyến mãi của
 * gói; mã giảm giá tính sau, ở màn Mã giảm giá.
 */
export function PriceConfigForm({ dict, locale }: Props) {
  const { data, isLoading } = usePricingQuery();

  if (isLoading || !data) {
    return <p className="text-small text-muted-foreground">{dict.loading}</p>;
  }

  return (
    <section className="space-y-6">
      <p className="text-small text-muted-foreground">{dict.priceConfig.hint}</p>
      {/* `key` theo giá trị đã lưu: form dựng lại khi dữ liệu server đổi. */}
      <PriceForm
        key={`${data.price}-${data.discountPercent}`}
        pricing={data}
        dict={dict}
        locale={locale}
      />
    </section>
  );
}
