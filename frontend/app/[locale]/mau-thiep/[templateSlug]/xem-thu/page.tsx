import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmbedFlag } from "@/components/shared/embed-flag";
import { InvitationView } from "@/components/invitation/invitation-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { sampleInvitationContent } from "@/lib/data/invitation-sample";
import { getCatalogTemplateBySlug } from "@/lib/data/templates";

/** Trang kỹ thuật dùng trong dialog preview và để chụp thumbnail toàn chiều dài. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Bản chạy thử của một mẫu thiệp với dữ liệu mockup. Dialog chi tiết nhúng route
 * này bằng iframe; quy trình dựng mẫu cũng chụp toàn trang ở đây thành đúng một
 * `thumbnail.avif` dùng chung cho gallery và homepage.
 *
 * Bỏ block phong bì: iframe trong dialog không nhận chuột, còn thumbnail phải
 * bắt đầu thẳng từ nội dung thiệp thay vì màn "Mở thiệp".
 */
/**
 * Dựng lúc có người vào lần đầu rồi cache (ISR), không dựng lúc build — cùng lý
 * do với `mau-thiep/[templateSlug]/page.tsx`. Trang chỉ có dữ liệu mẫu, không
 * đọc gì của request; thiếu dòng này thì segment động `[templateSlug]` render
 * lại ở **mỗi** lần mở iframe trong dialog chi tiết mẫu.
 */
export function generateStaticParams() {
  return [];
}

export default async function TemplatePreviewPage({
  params,
}: PageProps<"/[locale]/mau-thiep/[templateSlug]/xem-thu">) {
  const { locale, templateSlug } = await params;
  if (!isLocale(locale)) notFound();

  const template = await getCatalogTemplateBySlug(templateSlug);
  if (!template) notFound();

  const dict = await getDictionary(locale);
  const sample = sampleInvitationContent({
    templateSlug: template.slug,
    photoSlots: template.photoSlots,
    kind: template.kind,
  });
  const content = {
    ...sample,
    visibility: { ...sample.visibility, envelope: false },
  };

  return (
    // Nền trắng như `../demo`: mẫu nào để nền trong suốt (Aurora cắt đỉnh thành
    // vòm) sẽ lộ nền của chính document iframe, mà mặc định của body là `paper`
    // — ngả be. Bản xem thử phải cùng mặt bàn với demo thì màu mới khớp nhau.
    <main className="min-h-svh bg-white">
      <EmbedFlag />
      <InvitationView
        content={content}
        dict={dict.invitation}
        ceremonyKindsDict={dict.editor.ceremonyKinds}
        locale={locale}
        photoSlots={template.photoSlots}
        templateSlug={template.slug}
        showMusicToggle={false}
      />
    </main>
  );
}
