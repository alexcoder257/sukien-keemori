import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LunarConverter } from "@/components/tools/lunar-converter";
import { ToolPage } from "@/components/tools/tool-page";
import { toolPath } from "@/constants/tools";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

const TOOL = "lunar";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cong-cu/doi-ngay-am-duong">): Promise<Metadata> {
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

/** Công cụ đổi ngày dương ↔ âm lịch, kèm dòng ghi ngày âm cho thiệp. Trang tĩnh: không đọc request, phần tương tác chạy ở client. */
export default async function Page({
  params,
}: PageProps<"/[locale]/cong-cu/doi-ngay-am-duong">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <ToolPage toolKey={TOOL} dict={dict} locale={locale}>
      <LunarConverter dict={dict.tools.items[TOOL].widget} />
    </ToolPage>
  );
}
