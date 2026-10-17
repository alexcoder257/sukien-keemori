import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TableCalculator } from "@/components/tools/table-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { toolPath } from "@/constants/tools";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

const TOOL = "tables";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cong-cu/tinh-so-ban-tiec-cuoi">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const meta = dict.tools.items[TOOL].meta;
  return buildMetadata({
    locale,
    path: toolPath(TOOL),
    title: meta.title,
    description: meta.description,
  });
}

/** Công cụ tính số bàn tiệc cưới từ danh sách khách. Trang tĩnh: không đọc request, phần tương tác chạy ở client. */
export default async function Page({
  params,
}: PageProps<"/[locale]/cong-cu/tinh-so-ban-tiec-cuoi">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <ToolPage toolKey={TOOL} dict={dict} locale={locale}>
      <TableCalculator dict={dict.tools.items[TOOL].widget} />
    </ToolPage>
  );
}
