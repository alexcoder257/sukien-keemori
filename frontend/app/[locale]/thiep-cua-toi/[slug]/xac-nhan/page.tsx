import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { RsvpManager } from "@/components/my-cards/rsvp-manager";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import { getMyRsvps } from "@/lib/data/invitations";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/thiep-cua-toi/[slug]/xac-nhan">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.myCards.rsvp.meta.title, robots: NO_INDEX };
}

/**
 * Phản hồi tham dự của một thiệp. Đứng riêng khỏi editor cùng lý do với màn lời
 * chúc: đếm khách là việc làm nhiều lần trong những tuần trước đám cưới.
 *
 * Route được `proxy.ts` gác đăng nhập; quyền sở hữu thiệp do backend kiểm tra.
 */
export default async function InvitationRsvpsPage({
  params,
}: PageProps<"/[locale]/thiep-cua-toi/[slug]/xac-nhan">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const data = await getMyRsvps(slug);
  if (!data) notFound();

  const dict = await getDictionary(locale);
  const t = dict.myCards.rsvp;
  const { invitation, rsvps } = data;

  return (
    <>
      <SiteHeader dict={dict.common} locale={locale} authenticated />
      <main className="container-page max-w-3xl py-16">
        <Link
          href={`/${locale}/thiep-cua-toi`}
          className="mb-8 inline-flex items-center gap-2 text-small text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t.back}
        </Link>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-h3">{t.title}</h1>
            <p className="max-w-2xl text-small text-muted-foreground">
              {fill(t.subtitle, { title: invitation.title })}
            </p>
          </div>
          <Link
            href={`/${locale}/t/${invitation.slug}`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-2",
            })}
          >
            <ExternalLink aria-hidden className="size-4" />
            {t.viewCard}
          </Link>
        </div>

        {!invitation.rsvpEnabled ? (
          <p className="mb-6 rounded-xl bg-warning/12 px-4 py-3 text-small">
            {t.disabled}
          </p>
        ) : null}

        <RsvpManager
          cardId={invitation.id}
          rsvps={rsvps}
          dict={dict.editor.blocks.rsvp}
          locale={locale}
        />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
