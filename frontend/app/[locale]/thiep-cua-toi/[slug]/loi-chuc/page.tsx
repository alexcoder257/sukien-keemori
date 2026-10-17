import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { WishManager } from "@/components/my-cards/wish-manager";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import { getMyInvitationBySlug } from "@/lib/data/invitations";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/thiep-cua-toi/[slug]/loi-chuc">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.myCards.wishes.meta.title, robots: NO_INDEX };
}

/**
 * Màn quản lý sổ lưu bút của một thiệp. Cùng danh sách kiểm duyệt với thẻ trong
 * editor, nhưng đứng riêng: duyệt lời chúc là việc lặp lại nhiều lần sau khi
 * thiệp đã gửi đi, không ai muốn mở cả trình chỉnh sửa chỉ để bấm Duyệt.
 *
 * Route được `proxy.ts` gác đăng nhập; quyền sở hữu thiệp do backend kiểm tra.
 */
export default async function InvitationWishesPage({
  params,
}: PageProps<"/[locale]/thiep-cua-toi/[slug]/loi-chuc">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  // Bản của chủ thiệp: kèm cả lời chúc **chờ duyệt**, thứ mà trang công khai
  // không được thấy. Backend kiểm quyền sở hữu chứ không phải trang này.
  const invitation = await getMyInvitationBySlug(slug);
  if (!invitation) notFound();

  const dict = await getDictionary(locale);
  const t = dict.myCards.wishes;

  return (
    <>
      <SiteHeader dict={dict.common} locale={locale} authenticated />
      <main className="container-page py-16">
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

        <WishManager
          cardId={invitation.id}
          wishes={invitation.content.wishes.items}
          dict={dict.editor.blocks.wishes}
          locale={locale}
        />
      </main>
      <SiteFooter dict={dict.common} locale={locale} />
    </>
  );
}
