import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { inter } from "@/assets/fonts";
import { AntdProvider } from "@/contexts/antd-config-provider";
import { ReactQueryProvider } from "@/contexts/react-query-provider";
import { ThemeProvider } from "@/contexts/theme-provider";
import { isLocale, locales } from "@/i18n/config";
import "../globals.css";

export const metadata: Metadata = {
  title: "CMS — Keemori",
  description: "Khu quản trị nội dung và vận hành của Keemori.",
  // Khu quản trị không bao giờ nên nằm trong kết quả tìm kiếm.
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        {/* `ThemeProvider` phải bọc ngoài `AntdProvider`: provider của antd đọc
            chế độ hiện tại để chọn thuật toán màu. */}
        <ThemeProvider>
          <AntdRegistry>
            <AntdProvider>
              <ReactQueryProvider>{children}</ReactQueryProvider>
            </AntdProvider>
          </AntdRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
