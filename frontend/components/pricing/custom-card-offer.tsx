import Link from "next/link";
import { Check, PenTool } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { PackagePricing } from "@/lib/data/pricing";
import { fill, formatCurrency } from "@/lib/format";

const priceClass =
  "font-heading text-h2 leading-none font-medium tracking-[-0.015em] tabular-nums";
const subPriceClass = "text-caption text-muted-foreground";

/** Danh sách tính năng — dấu check căn giữa dòng đầu, khoảng cách đều nhau. */
function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-2.5">
      {features.map((feature) => (
        <li key={feature} className="flex gap-2.5 text-small leading-snug">
          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Thẻ **thiệp custom** — gói duy nhất đang bán. Giá (và khuyến mãi gói nếu
 * admin đang bật) đọc từ `GET /pricing`; thanh toán diễn ra ngay trong website
 * sau khi khách soạn thiệp, nên nút chính dẫn tới bước chọn loại thiệp, còn
 * liên hệ tư vấn là lối phụ.
 */
export function CustomCardOffer({
  dict,
  pricing,
  locale,
}: {
  dict: Dictionary["pricing"]["custom"];
  pricing: PackagePricing;
  locale: Locale;
}) {
  const discounted = pricing.finalPrice < pricing.price;
  return (
    // Đệm rộng hơn `pricingCard`: lý do 16px của thẻ gói là bề ngang ~270px,
    // còn thẻ này trải cả hàng.
    <Card className="ring-1 ring-primary/30 [--card-spacing:--spacing(6)] md:[--card-spacing:--spacing(8)]">
      <CardContent className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-eyebrow text-foreground dark:text-primary">
            <PenTool aria-hidden className="size-4 shrink-0" />
            {dict.eyebrow}
          </p>
          <div className="space-y-2">
            <h2 data-ui-heading className="text-h4 font-medium">
              {dict.title}
            </h2>
            <p className="max-w-2xl text-small text-muted-foreground">
              {dict.body}
            </p>
          </div>
          <FeatureList features={dict.features} />
        </div>

        <div className="space-y-4 md:min-w-56 md:border-l md:border-border md:pl-10">
          <div className="space-y-1">
            {discounted ? (
              <p className="flex items-center gap-2 text-small text-muted-foreground">
                <span className="line-through tabular-nums">
                  {formatCurrency(pricing.price, locale)}
                </span>
                {pricing.discountPercent ? (
                  <span className="rounded-sm bg-success/10 px-1.5 py-0.5 text-caption font-medium text-success">
                    {fill(dict.discountBadge, {
                      percent: pricing.discountPercent,
                    })}
                  </span>
                ) : null}
              </p>
            ) : null}
            <p className={priceClass}>
              {formatCurrency(pricing.finalPrice, locale)}
            </p>
            <p className={subPriceClass}>{dict.priceNote}</p>
          </div>
          <div className="space-y-2">
            <Link
              href={`/${locale}/tao-thiep`}
              className={buttonVariants({
                size: "default",
                className: "w-full",
              })}
            >
              {dict.createCta}
            </Link>
            <Link
              href={`/${locale}/lien-he`}
              className={buttonVariants({
                variant: "outline",
                size: "default",
                className: "w-full",
              })}
            >
              {dict.cta}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
