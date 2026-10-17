import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { TemplateReviewTable } from "@/components/admin/template-review-table";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAdminSession } from "@/lib/data/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/danh-gia-mau">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.admin.templateReviews.title, robots: { index: false } };
}

/**
 * Đánh giá mẫu thiệp do người dùng gửi — kiểm duyệt sau, không duyệt trước.
 * Khác hẳn "Đánh giá trang chủ" (`/danh-gia`) là trích dẫn biên tập tự soạn.
 */
export default async function AdminTemplateReviewsPage({
  params,
}: PageProps<"/[locale]/danh-gia-mau">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const session = await getAdminSession();

  return (
    <AdminShell
      dict={dict.admin}
      locale={locale}
      active="templateReviews"
      session={session}
      title={dict.admin.templateReviews.title}
      subtitle={dict.admin.templateReviews.subtitle}
    >
      <TemplateReviewTable dict={dict.admin} locale={locale} />
    </AdminShell>
  );
}
