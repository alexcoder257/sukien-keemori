import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { GuestLinkList } from "@/components/my-cards/guest-link-list";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import { getMyGuestLinks } from "@/lib/data/invitations";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/thiep-cua-toi/[slug]/khach-moi">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.myCards.guests.meta.title, robots: NO_INDEX };
}

/**
 * Link mời riêng của từng khách. Đứng riêng khỏi editor vì đây là việc làm
 * **sau khi lưu**: gửi link cho từng người là việc lặp lại nhiều ngày, và editor
 * thì chưa có mã link nào cho tới khi backend lưu xong danh sách.
 *
 * Route được `proxy.ts` gác đăng nhập; quyền sở hữu thiệp do backend kiểm tra.
 */
export default async function InvitationGuestLinksPage({
  params,
}: PageProps<"/[locale]/thiep-cua-toi/[slug]/khach-moi">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const data = await getMyGuestLinks(slug);
  if (!data) notFound();

  const dict = await getDictionary(locale);
  const t = dict.myCards.guests;
  const { invitation, guests, rsvps } = data;
  // Chỉ phản hồi gửi từ link riêng mới gắn được vào một dòng khách. Vẫn hiện
  // trạng thái khi block đã tắt nhưng từng có phản hồi — tắt không xoá gì cả.
  const responses = new Map(
    rsvps.flatMap((rsvp) => (rsvp.guestId ? [[rsvp.guestId, rsvp]] : [])),
  );
  const showResponses = invitation.rsvpEnabled || responses.size > 0;

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
            href={`/${locale}/editor/${invitation.templateSlug}?thiep=${invitation.id}`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-2",
            })}
          >
            <Pencil aria-hidden className="size-4" />
            {t.editList}
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-3">
          {invitation.status === "draft" ? (
            <p className="rounded-xl bg-warning/12 px-4 py-3 text-small">
              {t.draft}
            </p>
          ) : null}
          {!invitation.guestInviteEnabled ? (
            <p className="rounded-xl bg-warning/12 px-4 py-3 text-small">
              {t.disabled}
            </p>
          ) : null}
          <p className="text-small text-muted-foreground">{t.shareHint}</p>
        </div>

        {guests.length > 0 ? (
          <GuestLinkList
            guests={guests}
            path={`/${locale}/t/${invitation.slug}`}
            dict={t}
            responses={showResponses ? responses : undefined}
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-foreground/20 px-6 py-10 text-center text-small text-muted-foreground">
            {t.empty}
          </p>
        )}
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
