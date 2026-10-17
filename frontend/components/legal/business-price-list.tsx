import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PackagePricing } from "@/lib/data/pricing";
import { formatCurrency } from "@/lib/format";

type Props = {
  locale: Locale;
  pricing: PackagePricing;
  dict: Dictionary["legal"]["businessInfo"]["prices"];
};

/**
 * Giá niêm yết cho mục "Dịch vụ cung cấp". Website chỉ bán **một** dịch vụ —
 * thiệp mời thiết kế riêng, thanh toán bằng chuyển khoản ngay trong website —
 * nên bảng chỉ có một dòng; giá lấy từ cùng nguồn (`GET /pricing`) với trang
 * `/bang-gia` để hai trang không bao giờ lệch nhau. Niêm yết là giá gốc:
 * khuyến mãi gói và mã giảm giá là ưu đãi có thời hạn, hiện ở trang bảng giá.
 */
export function BusinessPriceList({ locale, pricing, dict }: Props) {
  return (
    <div className="space-y-4 pt-2">
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left">
          <caption className="sr-only">{dict.caption}</caption>
          <thead className="bg-foreground/4 text-small text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium sm:px-6">
                {dict.plan}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-medium sm:px-6"
              >
                {dict.price}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th
                scope="row"
                className="px-4 py-4 align-top font-normal sm:px-6"
              >
                <p className="text-body font-medium text-foreground">
                  {dict.item}
                </p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  {dict.itemNote}
                </p>
              </th>
              <td className="px-4 py-4 text-right align-top sm:px-6">
                <p className="text-body font-semibold text-foreground tabular-nums">
                  {formatCurrency(pricing.price, locale)}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Link
        href={`/${locale}/bang-gia`}
        className="inline-flex items-center gap-1.5 text-small font-medium text-foreground underline decoration-primary underline-offset-4 dark:text-primary dark:no-underline dark:hover:underline"
      >
        {dict.seeFull}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}
