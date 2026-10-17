import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutPanel } from "@/components/payment/checkout-panel";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Đơn của người đang đăng nhập — đọc theo từng lượt xem, không bao giờ là trang
 * tĩnh. Khai tường minh vì `proxy.ts` gác phiên nhưng build không tự phát hiện.
 */
export const revalidate = 0;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/thanh-toan/[orderId]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.payment.meta.title,
    description: dict.payment.meta.description,
    // Màn thanh toán của một đơn cụ thể không có gì để một cỗ máy tìm kiếm lập
    // chỉ mục, và URL chứa id đơn.
    robots: { index: false, follow: false },
  };
}

/**
 * Màn chuyển khoản của một đơn.
 *
 * `proxy.ts` gác đăng nhập ở mức route; **quyền sở hữu đơn do backend kiểm** —
 * `GET /payments/checkout/:orderId` chỉ trả về đơn của chính người đang đăng
 * nhập, nên đổi id trên URL chỉ nhận 404 chứ không xem được đơn người khác.
 */
export default async function CheckoutPage({
  params,
}: PageProps<"/[locale]/thanh-toan/[orderId]">) {
  const { locale, orderId } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <SiteHeader dict={dict.common} locale={locale} authenticated />
      <main className="container-page py-16">
        <h1 className="text-h3">{dict.payment.checkout.title}</h1>
        <p className="mb-stack mt-4 max-w-2xl text-body text-muted-foreground">
          {dict.payment.checkout.subtitle}
        </p>
        <CheckoutPanel
          orderId={orderId}
          dict={dict.payment.checkout}
          successDict={dict.payment.success}
          locale={locale}
        />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
