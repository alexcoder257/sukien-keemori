import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { NotFoundNote } from "@/components/shared/not-found-note";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/request-locale";

/**
 * Trang 404 của khu vực trang khách.
 *
 * Next **không truyền `params`** cho `not-found.tsx`. Locale lấy từ
 * `getRequestLocale()` (layout ghi vào, xem `i18n/request-locale.ts`), còn
 * đường dẫn — để phân biệt link thiệp chết — đọc ở client (`NotFoundNote`).
 *
 * **Không được đọc request ở đây** (`headers()`, `cookies()`, `hasSession`):
 * Next render sẵn file này trong payload của *mọi* page dưới `[locale]`, nên
 * một lời gọi như vậy biến mọi trang tĩnh thành lỗi 500 ở bản build. `next
 * dev` render mọi thứ động nên không báo gì.
 *
 * Trang vẫn dựng đủ header và footer thay vì một khung trắng: phần lớn người
 * đến đây là gõ nhầm hoặc bấm vào link cũ, và thứ họ cần là lối đi tiếp chứ
 * không phải một thông báo lỗi. Không có `generateMetadata` vì file này không
 * hỗ trợ export đó — tiêu đề tab đặt bằng thẻ `<title>` của React, và Next tự
 * chèn `noindex` cho mọi phản hồi 404.
 */
export default async function LocaleNotFound() {
  const locale = getRequestLocale();
  const dict = await getDictionary(locale);
  const t = dict.errors.notFound;

  const links = [
    { href: `/${locale}/mau-thiep`, label: t.templates },
    { href: `/${locale}/bang-gia`, label: dict.common.nav.pricing },
    { href: `/${locale}/huong-dan`, label: t.guide },
    { href: `/${locale}/lien-he`, label: t.contact },
  ];

  return (
    <>
      <title>{t.meta}</title>
      <SiteHeader
        dict={dict.common}
        locale={locale}
      />
      <main>
        <section className="glow-surface border-b border-border bg-card">
          <div className="container-page py-20 lg:py-28">
            <p
              aria-hidden
              className="font-editorial text-[clamp(4.5rem,14vw,9rem)] leading-[0.85] font-medium tracking-[-0.03em] text-primary/25"
            >
              {t.code}
            </p>
            <p className="mt-8 flex items-center gap-3 text-eyebrow text-primary">
              <span aria-hidden className="h-px w-8 bg-primary/60" />
              {t.eyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl font-editorial text-[clamp(2.15rem,4.2vw,3.5rem)] leading-[1.12] font-medium tracking-[-0.03em]">
              {t.title}
            </h1>
            <NotFoundNote
              locale={locale}
              body={t.body}
              invitationNote={t.invitationNote}
              className="mt-5 max-w-2xl text-body-lg text-muted-foreground"
            />
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={`/${locale}`} className={buttonVariants()}>
                {t.home}
              </Link>
              <Link
                href={`/${locale}/mau-thiep`}
                className={buttonVariants({ variant: "outline" })}
              >
                {t.templates}
              </Link>
            </div>
          </div>
        </section>

        <section className="container-page py-16 lg:py-20">
          <h2 className="mb-stack font-heading text-h4 font-medium">
            {t.linksTitle}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border px-5 py-4 text-body transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {link.label}
                  <ArrowRight aria-hidden className="size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
