import type { MetadataRoute } from "next";
import { getTemplates } from "@/lib/data/templates";
import { BUSINESS_INFO_PAGE, LEGAL_DOCUMENTS } from "@/constants/legal";
import { TOOLS, TOOLS_PATH } from "@/constants/tools";
import { absoluteUrl, localeAlternates } from "@/lib/seo";
import { templatePageCopy } from "@/lib/template-page-copy";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Nhịp làm mới sitemap. Dài vì nội dung của nó chỉ đổi khi có mẫu thiệp mới —
 * việc tính bằng tuần, không phải bằng phút.
 */
export const revalidate = 86400;

/**
 * Trang tĩnh, kèm mức ưu tiên tương đối và tần suất đổi.
 *
 * `priority` chỉ là gợi ý **giữa các trang trong cùng site** — nó không đẩy thứ
 * hạng lên so với site khác. Ở đây nó nói đúng một điều: kho mẫu và bảng giá là
 * nơi khách vào, còn văn bản pháp lý thì hiếm khi đổi và không ai tìm.
 */
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/mau-thiep", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tao-thiep", priority: 0.9, changeFrequency: "monthly" },
  { path: "/bang-gia", priority: 0.9, changeFrequency: "monthly" },
  { path: "/huong-dan", priority: 0.7, changeFrequency: "monthly" },
  { path: "/cau-hoi-thuong-gap", priority: 0.7, changeFrequency: "monthly" },
  { path: TOOLS_PATH, priority: 0.6, changeFrequency: "monthly" },
  ...TOOLS.map((tool) => ({
    path: `${TOOLS_PATH}/${tool.slug}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  })),
  { path: "/lien-he", priority: 0.5, changeFrequency: "yearly" },
  { path: "/thong-tin-doanh-nghiep", priority: 0.3, changeFrequency: "yearly" },
  { path: "/dieu-khoan", priority: 0.3, changeFrequency: "yearly" },
  { path: "/chinh-sach-bao-mat", priority: 0.3, changeFrequency: "yearly" },
  { path: "/thanh-toan-hoan-tien", priority: 0.3, changeFrequency: "yearly" },
];

/**
 * `/sitemap.xml`.
 *
 * Mỗi bản ngôn ngữ có một mục URL riêng, cùng bộ hreflang gồm chính nó và
 * các bản còn lại. Hreflang liên kết các bản dịch, không thay cho mục URL.
 *
 * **Thiệp của khách (`/t/<slug>`) cố ý không có mặt ở đây**, và đó là quyết
 * định riêng tư chứ không phải kỹ thuật: đưa vào sitemap là chủ động mời Google
 * lập chỉ mục tên, ngày giờ và địa chỉ nhà của từng cặp đôi. Xem thêm
 * `app/robots.ts`.
 *
 * Hỏng mềm ở nguồn mẫu: backend chết thì trả về phần tĩnh thay vì để cả
 * `/sitemap.xml` đổ 500.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [templates, dictionaries] = await Promise.all([
    getTemplates().catch(() => []),
    Promise.all(locales.map((locale) => getDictionary(locale))),
  ]);

  /**
   * `<lastmod>` chỉ khai khi có **ngày sửa thật**. Không bao giờ dùng thời điểm
   * sinh sitemap: bản đầu tiên làm vậy, và một lastmod đổi mỗi ngày dù trang
   * không đổi dạy Google bỏ qua trường này cho **cả site**.
   *
   * Nguồn đáng tin hiện có: `updatedAt` của văn bản pháp lý (tăng tay cùng phiên
   * bản). Trang chủ, kho mẫu, bảng giá… dựng từ nhiều nguồn không có
   * mốc chung nên để trống — thiếu lastmod thì Google tự lên lịch, còn lastmod
   * sai thì làm hại.
   */
  const lastModifiedByPath = new Map<string, string>([
    ...Object.values(LEGAL_DOCUMENTS).map(
      (doc) => [doc.path, doc.updatedAt] as const,
    ),
    [BUSINESS_INFO_PAGE.path, BUSINESS_INFO_PAGE.updatedAt],
  ]);
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap((route) =>
    locales.map((locale) => ({
      url: absoluteUrl(`/${locale}${route.path}`),
      lastModified: lastModifiedByPath.get(route.path),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: localeAlternates(route.path) },
    })),
  );

  /**
   * Trang mẫu thiệp: **chỉ những mẫu đã có chữ giới thiệu**. Trang đích của một
   * mẫu là `/mau-thiep/<slug>`, và nó chỉ bỏ `noindex` khi mẫu có mục
   * trong `templatePages.items` (xem `lib/template-page-copy.ts`). Mẫu chưa có
   * chữ thì trang quá mỏng nên đã khai `noindex` — đưa vào sitemap là nộp cho
   * Google đúng URL mình vừa bảo nó đừng lưu. `/demo` và `/xem-thu` thì không
   * bao giờ vào đây: đó là tấm thiệp dựng bằng dữ liệu của cặp đôi giả.
   */
  const templateEntries: MetadataRoute.Sitemap = templates.flatMap((template) =>
    locales.flatMap((locale, index) => {
      if (!templatePageCopy(dictionaries[index], template.slug)) return [];
      const path = `/mau-thiep/${template.slug}`;
      return [
        {
          url: absoluteUrl(`/${locale}${path}`),
          changeFrequency: "monthly" as const,
          priority: 0.7,
          alternates: { languages: localeAlternates(path) },
        },
      ];
    }),
  );

  return [...staticEntries, ...templateEntries];
}
