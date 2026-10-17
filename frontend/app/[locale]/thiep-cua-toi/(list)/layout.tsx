import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Khung của "Thiệp của tôi": header, tiêu đề và footer đứng yên trong lúc
 * `loading.tsx` bên cạnh hiện skeleton cho danh sách thiệp. Cùng cách dựng với
 * `mau-thiep/(catalog)/layout.tsx` — xem lý do ở đó.
 *
 * Group `(list)` giữ layout này khỏi các màn con theo thiệp (`[slug]/...`).
 *
 * `authenticated` truyền thẳng: `proxy.ts` đã chặn khách chưa đăng nhập trước
 * khi tới đây, nên header không cần nhịp "chưa biết" của `useSession`.
 */
export default async function MyCardsLayout({
  children,
  params,
}: LayoutProps<"/[locale]/thiep-cua-toi">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <>
      <SiteHeader dict={dict.common} locale={locale} authenticated />
      <main className="container-page py-16">
        <h1 className="mb-8 text-h3">{dict.myCards.title}</h1>
        {children}
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
