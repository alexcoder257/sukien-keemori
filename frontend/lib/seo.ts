import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { BRAND_ASSETS } from "@/constants/brand";
import type { Metadata } from "next";

/**
 * Tên miền công khai của trang khách.
 *
 * Bắt buộc phải là URL **tuyệt đối**: `metadataBase` của Next dùng nó để dựng
 * `og:image`, `og:url` và thẻ canonical, mà Facebook/Zalo không đọc được đường
 * dẫn tương đối — thiếu nó thì mọi link chia sẻ mất ảnh preview.
 *
 * `NEXT_PUBLIC_*` nên giá trị bị **nướng vào bundle lúc build**: đổi tên miền
 * là phải build lại image, không phải restart container (cùng bẫy với
 * `NEXT_PUBLIC_API_URL`, xem `frontend/Dockerfile`).
 *
 * Mặc định `http://localhost:3000` để dev chạy được ngay. Trên production mà
 * quên khai thì canonical sẽ trỏ về localhost và Google bỏ qua toàn bộ trang —
 * vì vậy `buildMetadata` cảnh báo ở log server khi thấy localhost trong bản
 * production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "Keemori";

/**
 * Ảnh chia sẻ mặc định khi một trang không tự khai ảnh riêng.
 *
 * **Phải là `.jpg`, không được là `.avif`.** Crawler của Facebook và Zalo không
 * giải mã được AVIF — đăng link lên là mất ảnh preview, đúng vào kênh phát tán
 * chính của sản phẩm. Đây cũng là lý do ảnh chia sẻ phải ra JPEG trong khi
 * ảnh thiệp ra AVIF.
 */
export const DEFAULT_OG_IMAGE = BRAND_ASSETS.openGraph.dark;

/**
 * Khối `robots` cho trang **không được lập chỉ mục**: khu sau đăng nhập và
 * thiệp riêng của khách.
 *
 * `follow: false` chứ không phải `true` như nhánh `noIndex` của `buildMetadata`:
 * ở đây con bò không chỉ không nên lưu trang, nó còn không nên đi tiếp theo các
 * link bên trong — một tấm thiệp dẫn sang thiệp khác, một trang tài khoản dẫn
 * vào editor, và không đường nào trong số đó có gì để lập chỉ mục.
 *
 * Đây là lớp thứ hai, độc lập với `robots.txt`: `robots.txt` xin con bò đừng
 * **tải** trang, thẻ này nói với con bò đã tải rồi rằng đừng **lưu**. Cần cả
 * hai vì một URL bị chặn ở `robots.txt` mà có backlink từ ngoài vẫn có thể xuất
 * hiện trong kết quả tìm kiếm dưới dạng một dòng trống.
 */
export const NO_INDEX = { index: false, follow: false } as const;

let warnedAboutLocalhost = false;

/** Đường dẫn tương đối → URL tuyệt đối trên tên miền chính. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Đường dẫn của cùng một trang ở mọi ngôn ngữ.
 *
 * `path` là phần **sau** locale (`/bang-gia`), truyền chuỗi rỗng cho trang chủ.
 * Trả về đúng hình dạng `alternates.languages` mà Next cần, kèm `x-default`
 * trỏ về ngôn ngữ mặc định: đó là bản Google phục vụ cho người mà nó không suy
 * ra được ngôn ngữ.
 *
 * `available` là những ngôn ngữ trang này **thật sự có nội dung** — mặc định là
 * mọi ngôn ngữ, vì chữ giao diện luôn đủ hai bản. Nội dung biên tập thì không:
 * trang chưa dịch chỉ khai `vi`. Khai `en` cho một URL mang chữ tiếng Việt là
 * tín hiệu hreflang Google bỏ qua, và nó còn gộp hai URL thành nội dung trùng.
 */
export function localeAlternates(
  path: string,
  available: readonly Locale[] = locales,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of available) {
    languages[locale] = absoluteUrl(`/${locale}${path}`);
  }
  const fallback = available.includes(defaultLocale)
    ? defaultLocale
    : available[0];
  languages["x-default"] = absoluteUrl(`/${fallback}${path}`);
  return languages;
}

type BuildMetadataInput = {
  locale: Locale;
  /** Đường dẫn sau locale, ví dụ `/bang-gia`. Trang chủ truyền `""`. */
  path: string;
  title: string;
  description: string;
  /** Ảnh chia sẻ riêng của trang; bỏ trống thì dùng ảnh mặc định. */
  image?: string;
  /** `article` cho bài viết, còn lại để mặc định `website`. */
  type?: "website" | "article";
  publishedTime?: string;
  /** Trang không muốn Google lập chỉ mục (thiệp riêng, khu tài khoản). */
  noIndex?: boolean;
  /**
   * Ngôn ngữ trang này có bản thật; bỏ trống là mọi ngôn ngữ. Xem
   * `localeAlternates`.
   */
  locales?: readonly Locale[];
};

/**
 * Dựng khối `Metadata` đầy đủ cho một trang: title, description, canonical,
 * hreflang, Open Graph và Twitter Card.
 *
 * Gom vào một chỗ vì bốn thứ này phải **nhất quán với nhau**: canonical trỏ một
 * URL còn `og:url` trỏ URL khác là tự mâu thuẫn, và đó đúng là lỗi hay gặp khi
 * mỗi trang tự khai tay từng khối.
 *
 * Canonical luôn là đường dẫn **không kèm query**: `/mau-thiep?category=x` và
 * `/mau-thiep` là cùng một trang nội dung, khai riêng thì Google chia nhỏ tín
 * hiệu xếp hạng ra nhiều URL trùng nhau.
 */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
  publishedTime,
  noIndex,
  locales: available,
}: BuildMetadataInput): Metadata {
  if (
    process.env.NODE_ENV === "production" &&
    SITE_URL.includes("localhost") &&
    !warnedAboutLocalhost
  ) {
    warnedAboutLocalhost = true;
    console.warn(
      "[seo] NEXT_PUBLIC_SITE_URL chưa được khai — canonical đang trỏ về localhost.",
    );
  }

  const url = absoluteUrl(`/${locale}${path}`);
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: localeAlternates(path, available),
    },
    // `noIndex` vẫn cho `follow`: trang không đáng lập chỉ mục nhưng link bên
    // trong nó vẫn dẫn tới trang đáng — chặn cả hai là cắt luôn đường bò.
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
