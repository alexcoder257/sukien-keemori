import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Khung của kho mẫu: header, phần mở đầu và footer.
 *
 * Tách ra layout để `loading.tsx` bên cạnh **chỉ thay lưới mẫu**: `loading.tsx`
 * được bọc bên trong layout của cùng segment, nên thứ gì nằm ở đây vẫn đứng
 * yên lúc skeleton hiện. Để header trong `page.tsx` như các route khác thì
 * skeleton thay luôn cả header, và header nháy mất một nhịp mỗi lần chuyển
 * trang.
 *
 * Route group `(catalog)` giữ URL `/mau-thiep` và giữ layout này khỏi
 * `[templateSlug]` — trang giới thiệu từng mẫu tự vẽ header riêng.
 */
export default async function TemplateCatalogLayout({
  children,
  params,
}: LayoutProps<"/[locale]/mau-thiep">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <SiteHeader
        dict={dict.common}
        locale={locale}
      />
      <main>
        <section className="border-b border-border bg-card">
          <div className="container-page space-y-4 py-16 max-mobile:space-y-3 max-mobile:py-10">
            <h1 className="text-h3 max-mobile:text-h4">
              {dict.templates.title}
            </h1>
            <p className="max-w-2xl text-body-lg text-muted-foreground max-mobile:text-body">
              {dict.templates.subtitle}
            </p>
          </div>
        </section>
        {children}
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
