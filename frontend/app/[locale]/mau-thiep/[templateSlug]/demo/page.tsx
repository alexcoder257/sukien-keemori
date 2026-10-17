import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationView } from "@/components/invitation/invitation-view";
import { TemplateViewBeacon } from "@/components/template/template-view-beacon";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import {
  sampleDemoOptions,
  sampleInvitationContent,
} from "@/lib/data/invitation-sample";
import { getCatalogTemplateBySlug } from "@/lib/data/templates";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mau-thiep/[templateSlug]/demo">): Promise<Metadata> {
  const { locale, templateSlug } = await params;
  if (!isLocale(locale)) return {};

  const template = await getCatalogTemplateBySlug(templateSlug);
  if (!template) return {};

  const dict = await getDictionary(locale);
  return {
    title: fill(dict.templates.previewLabel, { name: template.name }),
    // Demo dựng bằng dữ liệu của một cặp đôi không có thật, không header/footer
    // và không có chữ nào mô tả chính mẫu thiệp — để Google lập chỉ mục là đẩy
    // một tấm thiệp giả vào kết quả tìm kiếm. Trang Google đọc là trang giới
    // thiệu mẫu ở `../page.tsx`.
    robots: NO_INDEX,
  };
}

/**
 * Demo đầy đủ của một mẫu thiệp: dựng đúng như màn khách mời thấy ở
 * `/t/[slug]` — có phong bì, có nút nhạc, không header/footer — chỉ khác ở chỗ
 * nội dung là dữ liệu mẫu.
 *
 * Khác `./xem-thu`: route kia là bản kỹ thuật cho iframe trong card (bỏ phong
 * bì, tắt nút nhạc, không cho index), còn route này là thứ người dùng thật sự
 * mở ra xem từ nút "Xem demo".
 */
/**
 * Dựng lúc có người vào lần đầu rồi cache (ISR), không dựng lúc build — cùng lý
 * do với `mau-thiep/[templateSlug]/page.tsx`. Trang chỉ có dữ liệu mẫu, không
 * đọc gì của request; thiếu dòng này thì segment động `[templateSlug]` render
 * lại ở **mỗi** lần mở nút "Xem demo".
 */
export function generateStaticParams() {
  return [];
}

export default async function TemplateDemoPage({
  params,
}: PageProps<"/[locale]/mau-thiep/[templateSlug]/demo">) {
  const { locale, templateSlug } = await params;
  if (!isLocale(locale)) notFound();

  const template = await getCatalogTemplateBySlug(templateSlug);
  if (!template) notFound();

  const dict = await getDictionary(locale);
  const demo = sampleDemoOptions(template.slug);
  const content = sampleInvitationContent({
    templateSlug: template.slug,
    photoSlots: template.photoSlots,
    kind: template.kind,
  });
  if (demo.rsvp) content.visibility = { ...content.visibility, rsvp: true };

  return (
    // Mặt bàn của công cụ là màu trắng: cả trang là bàn làm việc, thiệp là thứ
    // duy nhất có màu. Màn phong bì không còn phụ thuộc màu này nữa — nó tự tràn
    // hết bề ngang màn hình bằng `100vw`, nên không có vạt nào hở ra bên cạnh.
    //
    // Không đệm dọc: thiệp khai `min-height: 100svh` để màn phong bì đúng là một
    // màn hình, nên mọi khoảng đệm ở đây đều cộng thêm vào và đẩy trang vượt quá
    // viewport — thành thanh cuộn thứ hai ngay khi vừa mở.
    <main className="min-h-svh overflow-x-clip bg-white">
      {/* Cùng một khung với chế độ xem thử của trình chỉnh sửa (xem
          `components/editor/invitation-editor.tsx`), tối đa 640px — phần thừa
          là nền trắng của trang. Thiệp dùng container query
          nên thả tự do là nó giãn hết màn hình và bố cục loãng hẳn. Khung không
          tô nền — thiệp Aurora cắt đỉnh thành vòm, một mảng nền đặc ở đây sẽ
          hiện thành hai vạt vuông hai bên cung. `isolate` giữ thang z-index của
          mẫu thiệp nằm gọn trong khung này. */}
      <div className="isolate mx-auto w-full max-w-[640px]">
        <InvitationView
          content={content}
          guestName={demo.guestName}
          dict={dict.invitation}
          ceremonyKindsDict={dict.editor.ceremonyKinds}
          locale={locale}
          photoSlots={template.photoSlots}
          templateSlug={template.slug}
        />
      </div>
      <TemplateViewBeacon slug={template.slug} kind="demo" />
    </main>
  );
}
