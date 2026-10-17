import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TimelinePlayground } from "@/components/invitation/timeline-playground";
import { isLocale } from "@/i18n/config";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = { robots: NO_INDEX };
/** Internal reference page, matching the ceremonies/details galleries. */
export default async function TimelinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="container-page py-12">
      <header className="max-w-3xl">
        <h1 className="text-h2">Timeline ngày cưới</h1>
        <p className="mt-4 text-body-lg text-muted-foreground">
          Ba bố cục dùng chung dữ liệu. Mỗi mục luôn có icon hoặc ảnh decor
          truyền vào; font, màu và kích thước có thể thay độc lập. Thiết kế ưu
          tiên 1–5 mục.
        </p>
      </header>
      <TimelinePlayground />
    </div>
  );
}
