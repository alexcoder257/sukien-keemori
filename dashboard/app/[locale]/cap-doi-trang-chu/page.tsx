import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { CoupleShowcaseTable } from "@/components/admin/couple-showcase-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cap-doi-trang-chu">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.coupleShowcase.title, robots: { index: false } };
}

/**
 * Dải "Cặp đôi đã tạo thiệp" ở trang chủ — chọn thiệp nào lên dải, ảnh nào và
 * theo thứ tự nào. Khác màn "Mẫu trên trang chủ": cái kia chọn **mẫu** trong
 * kho, cái này chọn **thiệp đã dựng** để khoe sản phẩm thật.
 */
export default async function AdminCoupleShowcasePage({
  params,
}: PageProps<"/[locale]/cap-doi-trang-chu">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="coupleShowcase"
      session={session}
      title={dict.admin.coupleShowcase.title}
      subtitle={dict.admin.coupleShowcase.subtitle}
    >
      <CoupleShowcaseTable dict={dict.admin} commonDict={dict.common} />
    </AdminShell>
  );
}
