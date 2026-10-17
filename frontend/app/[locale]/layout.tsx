import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { beVietnamPro, inter, playfairDisplay } from "@/assets/fonts";
import { BRAND_ASSETS } from "@/constants/brand";
import { ContextMenuGuard } from "@/components/shared/context-menu-guard";
import { IntroFlagGuard } from "@/components/shared/intro-flag-guard";
import { CursorFollower } from "@/components/shared/cursor-follower";
import { GoogleAnalytics } from "@/components/shared/google-analytics";
import { NavigationProgress } from "@/components/shared/navigation-progress";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { MessengerButton } from "@/components/shared/messenger-button";
import { VisitBeacon } from "@/components/shared/visit-beacon";
import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/contexts/react-query-provider";
import { SmoothScrollProvider } from "@/contexts/smooth-scroll-provider";
import { ThemeProvider } from "@/contexts/theme-provider";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { setRequestLocale } from "@/i18n/request-locale";
import { getPublicSettings } from "@/lib/data/settings";
import { introBootstrapScript } from "@/lib/intro-session";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "../globals.css";

/**
 * Công tắc **chỉ dành cho máy local**: đặt `NEXT_PUBLIC_CUSTOM_CURSOR=false`
 * trong `.env` để dùng con trỏ hệ thống khi dev. Biến cố ý không có trong
 * Docker/CI, nên production luôn bật con trỏ tự vẽ.
 */
const CUSTOM_CURSOR_ENABLED = process.env.NEXT_PUBLIC_CUSTOM_CURSOR !== "false";

/**
 * Metadata gốc, dựng theo **ngôn ngữ đang xem** nên phải là `generateMetadata`
 * chứ không phải hằng số `metadata`: khẩu hiệu thương hiệu và câu mô tả là chữ
 * hiển thị cho người đọc, mà quy tắc của dự án là chữ nào người dùng thấy cũng
 * phải nằm trong `dictionaries/`.
 *
 * Trang con chỉ khai title ngắn ("Bảng giá"), khuôn `template` ở đây thêm tên
 * thương hiệu vào. Gom một chỗ để không trang nào tự nối tay rồi lệch dấu phân
 * cách — và để đổi tên thương hiệu chỉ phải sửa `SITE_NAME`.
 */
export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    /**
     * Gốc để Next dựng mọi URL tuyệt đối trong metadata: canonical, `og:url`,
     * `og:image`. Thiếu nó thì `og:image` ra đường dẫn tương đối và
     * Facebook/Zalo bỏ qua — link chia sẻ mất ảnh preview.
     */
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} — ${dict.brand.tagline}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: dict.home.meta.description,
    applicationName: SITE_NAME,
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${dict.brand.tagline}`,
      description: dict.home.meta.description,
      images: [
        {
          url: BRAND_ASSETS.openGraph.dark,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
        {
          url: BRAND_ASSETS.openGraph.light,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${dict.brand.tagline}`,
      description: dict.home.meta.description,
      images: [BRAND_ASSETS.openGraph.dark],
    },
    icons: {
      // Cùng một icon cho mọi chế độ: khai mặc định để trình duyệt và crawler
      // không cần chọn theo media query. Giữ URL ổn định khi deploy.
      // Tab trình duyệt tự chọn bản nhỏ nhất đủ nét; bản 512px gốc chỉ còn
      // cho iOS — xem `BRAND_ASSETS.favicon`.
      icon: [
        { url: BRAND_ASSETS.favicon.small, type: "image/png", sizes: "48x48" },
        {
          url: BRAND_ASSETS.favicon.medium,
          type: "image/png",
          sizes: "192x192",
        },
      ],
      apple: BRAND_ASSETS.icon.lightSurface,
    },
  };
}

/**
 * Mảng rỗng: mọi trang dưới `[locale]` được dựng **lúc có người vào lần đầu**
 * rồi cache (ISR), không dựng lúc build.
 *
 * Các trang public giờ là trang tĩnh (header tự đọc phiên ở trình duyệt), nên
 * liệt kê `vi`/`en` ở đây là bảo Next dựng sẵn cả khu marketing lúc build — mà
 * `docker build` chạy trên máy không có backend. Kết quả hoặc là build hỏng,
 * hoặc tệ hơn: các hàm lấy dữ liệu "hỏng mềm" trả rỗng và trang rỗng đó được
 * cache tới hết chu kỳ `revalidate` (hàng giờ). Locale lạ vẫn ra 404 nhờ
 * `isLocale` trong layout.
 */
export function generateStaticParams() {
  return [];
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Cho `not-found.tsx`, file duy nhất không nhận `params`.
  setRequestLocale(locale);
  const dictionary = await getDictionary(locale);
  const { messengerUrl } = await getPublicSettings();

  // `dark` có sẵn trong HTML từ server chứ không đợi script của next-themes:
  // script đó bọc `localStorage.getItem` trong try/catch, và ở webview không
  // cho đọc storage (trình duyệt trong app Facebook/Messenger) nó ném lỗi rồi
  // bỏ qua, trang rơi về `:root` là nền sáng. Người đã chọn sáng thì script
  // vẫn gỡ `dark` và gắn `light` trước khi nội dung được vẽ.
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${playfairDisplay.variable} ${beVietnamPro.variable} dark h-full antialiased`}
      data-intro="pending"
      suppressHydrationWarning
    >
      {/* Tiện ích mở rộng của trình duyệt (trình quản lý mật khẩu, trợ lý AI,
          trình dịch) hay gắn thuộc tính lạ vào `<body>` **trước khi** React
          hydrate — ví dụ `__processed_<uuid>__="true"`. React thấy DOM khác bản
          server dựng nên báo hydration mismatch, dù code của mình không hề đụng
          tới. Cờ này chỉ bỏ qua chênh lệch **thuộc tính của chính thẻ này**,
          không lan xuống con, nên nó không che giấu lỗi hydrate thật ở bên
          trong. Cùng lý do với `suppressHydrationWarning` trên `<html>` phía
          trên (ở đó là do script chốt chế độ mở màn tự đặt dataset). */}
      <body className="min-h-full" suppressHydrationWarning>
        {/* Trạng thái `pending` đã có ngay trên thẻ `<html>` của response SSR,
            nên hero không thể lóe ra trước màn mở thiệp. Script thuần này là
            node đầu tiên của body và chạy đồng bộ trong lúc parse: homepage
            đổi sang `full`/`short`, route khác gỡ cờ trước khi có nội dung để
            vẽ. Đây chỉ là bootstrap của lần mở document; điều hướng mềm do
            `HeroStage` xử lý theo vòng đời component. */}
        <script
          id="intro-bootstrap"
          dangerouslySetInnerHTML={{
            __html: introBootstrapScript(`/${locale}`),
          }}
        />
        {/* Không có JavaScript thì không có animation để kết thúc. Trả nội dung
            về trạng thái đọc được thay vì giữ người dùng sau lớp mở đầu. */}
        <noscript>
          <style>{`html[data-intro] [data-reveal-loader]{display:none}html[data-intro] [data-reveal-item],html[data-intro] [data-reveal-card-wrap],html[data-intro] header{opacity:1}html[data-intro] [data-app-chrome]{visibility:visible}`}</style>
        </noscript>
        {/* Hai script dưới đây phải chạy **trước lần vẽ đầu tiên**, nên dùng
            `next/script` với `strategy="beforeInteractive"`: Next nhấc chúng lên
            HTML do server dựng và chạy trước mọi module của app, dù ở đây chúng
            được khai trong `<body>`. Không dùng thẻ `<script>` trần — React
            không bao giờ chạy thẻ script do chính nó dựng ở phía client, nên
            lúc điều hướng mềm nó vừa vô tác dụng vừa bị React cảnh báo ở
            console. `id` là bắt buộc với script inline để Next theo dõi và chỉ
            chèn một lần. */}
        {/* Gắn cờ "có JS" để CSS ẩn sẵn các khối reveal (xem `globals.css`),
            tránh nháy chữ trong khoảng SSR → hydrate. Hẹn giờ gỡ cờ là lưới an
            toàn: nếu bundle GSAP hỏng và animation không bao giờ chạy, nội dung
            vẫn hiện ra thay vì mất hẳn. Lúc chạy bình thường GSAP đã đặt inline
            style nên việc gỡ cờ vô hại. */}
        <Script
          id="motion-flag"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.motion="js";setTimeout(function(){delete document.documentElement.dataset.motion},3000)`,
          }}
        />
        {/* Ngay trong `<body>` và ngoài mọi provider: nó chỉ dọn một thuộc
            tính trên `<html>` mà điều hướng mềm đặt lại (xem
            `lib/intro-session.ts`), và phải chạy dù provider nào lỗi. */}
        <IntroFlagGuard />
        {/* Bọc ngoài cùng để `Toaster` (đọc `useTheme` của next-themes) và mọi
            nút chuyển chế độ đều nằm trong cùng một provider. */}
        <ThemeProvider>
          <ReactQueryProvider>
            <SmoothScrollProvider>
              {children}
              {/* Trong provider để nút dùng chung instance Lenis của trang. */}
              <ScrollToTop label={dictionary.common.actions.backToTop} />
              <MessengerButton
                dict={dictionary.common.support}
                messengerUrl={messengerUrl}
              />
            </SmoothScrollProvider>
          </ReactQueryProvider>
          {/* Ngoài mọi provider: chỉ gắn một listener ở `document`, không đọc
              theme, không đọc query cache. */}
          <NavigationProgress />
          <ContextMenuGuard />
          {CUSTOM_CURSOR_ENABLED ? (
            <CursorFollower label={dictionary.common.cursor.view} />
          ) : null}
          <VisitBeacon />
          <GoogleAnalytics />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
