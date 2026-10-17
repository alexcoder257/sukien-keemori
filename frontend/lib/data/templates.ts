import "server-only";
import {
  DEFAULT_TEMPLATE_SLUG,
  type InvitationKind,
  type PhotoSlotKey,
  type TemplateCategory,
  type TemplateColor,
  type TemplateSlug,
  type TemplateTag,
  type Tier,
} from "@/constants/invitation";
import { REVALIDATE, serverFetch, serverFetchOrNull } from "./api";
import { CACHE_TAGS } from "@/constants/cache-tags";

/** Mẫu đang hoàn thiện: chỉ mở trong `next dev`. Bỏ slug khi sẵn sàng ra mắt. */
const LOCAL_ONLY_TEMPLATE_SLUGS: readonly TemplateSlug[] = [];

function isCatalogTemplateVisible(slug: string): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    !LOCAL_ONLY_TEMPLATE_SLUGS.some((localSlug) => localSlug === slug)
  );
}

export interface WeddingTemplate {
  id: string;
  slug: TemplateSlug;
  /** Tên riêng của mẫu — không dịch. */
  name: string;
  tier: Tier;
  /**
   * Loại thiệp mẫu được dựng cho. Editor chỉ cho chọn mẫu cùng loại với thiệp,
   * và backend từ chối ghép sai loại — mẫu sinh nhật không có chỗ cho tên cô
   * dâu chú rể.
   */
  kind: InvitationKind;
  categories: TemplateCategory[];
  /** 1–2 nhóm màu chủ đạo: màu nền và màu concept. Code làm chủ, không phải CMS. */
  colorTones: TemplateColor[];
  tags: TemplateTag[];
  imagePosition: string;
  /** Ảnh riêng cho mẫu nổi bật; các mẫu chưa có ảnh riêng tiếp tục dùng atlas. */
  imageSrc?: string;
  /**
   * Các ô ảnh mà thiết kế của mẫu này dàn sẵn — đây là căn cứ xếp gói, không
   * phải con số gán tuỳ ý (`docs/business-model.md` mục 3). Free 0 ô, Gold 1–3
   * ô, Diamond 4–6 ô vì bố cục sẽ sụp nếu thiếu ảnh.
   *
   * Số ô là **thuộc tính của mẫu**, không phải lời hứa của gói: hai mẫu Gold
   * cùng giá có thể có 2 và 3 ô. Vì vậy nó chỉ hiện trên card kho mẫu và trong
   * editor, không bao giờ hiện trên trang giá (mục 1).
   */
  photoSlots: PhotoSlotKey[];
  /** Thứ tự CMS xếp tay; backend đã trả danh sách theo cột này. */
  sortOrder: number;
  /** ISO string — ngày mẫu vào kho, căn cứ của lựa chọn "Mới nhất". */
  createdAt: string;
}

/**
 * Bản backend trả về — `imageSrc` là cột nullable nên về đây là `null`.
 * `colorTones` tuỳ chọn vì backend chưa chạy migration, hoặc một bản cache cũ
 * của Next, vẫn có thể trả danh sách chưa có trường này.
 */
type TemplateResponse = Omit<
  WeddingTemplate,
  "imageSrc" | "colorTones" | "kind"
> & {
  imageSrc: string | null;
  colorTones?: WeddingTemplate["colorTones"];
  /** Tuỳ chọn vì cùng lý do với `colorTones`; vắng là mẫu cưới. */
  kind?: WeddingTemplate["kind"];
};

/**
 * `null` của SQL và `undefined` của TypeScript là hai thứ khác nhau; component
 * đang kiểm `imageSrc ?? atlas` nên phải quy về `undefined`, nếu không mẫu chưa
 * có thumbnail sẽ render `src={null}`. `colorTones` quy về `[]` để bộ lọc màu
 * không làm sập kho mẫu — mẫu thiếu màu chỉ đơn giản là không khớp ô màu nào.
 */
function toTemplate(template: TemplateResponse): WeddingTemplate {
  return {
    ...template,
    imageSrc: template.imageSrc ?? undefined,
    colorTones: template.colorTones ?? [],
    kind: template.kind ?? "wedding",
  };
}

/**
 * Kho mẫu lấy từ bảng `templates` của backend (`GET /templates`). Thứ tự hiển
 * thị do cột `sort_order` quyết định, không còn là thứ tự khai trong file.
 */
export async function getTemplates(): Promise<WeddingTemplate[]> {
  const templates = await serverFetch<TemplateResponse[]>("/templates", {
    revalidate: REVALIDATE.config,
    tags: [CACHE_TAGS.templates],
  });
  return templates
    .filter((template) => isCatalogTemplateVisible(template.slug))
    .map(toTemplate);
}

/**
 * Dải mẫu nổi bật ở trang chủ, do CMS quyết định (`/mau-thiep-noi-bat`): *mẫu
 * nào* và *thứ tự* là cờ `featuredOnHome` + `homepageOrder` của từng mẫu, và
 * mọi mẫu đã chọn đều hiện. Chưa chọn mẫu nào thì backend rơi về
 * `site_settings.homepageTemplateCount` mẫu đầu kho.
 *
 * Từng có một bản lọc cứng "chỉ mẫu Diamond" ở đây: màn CMS vẫn lưu được nhưng
 * trang chủ không đọc, nên mọi lựa chọn của vận hành im lặng mất tác dụng.
 *
 * Nghe cả hai tag: chọn mẫu revalidate `templates`, còn số mẫu của nhánh dự
 * phòng nằm ở `site-settings`.
 */
export async function getHomepageTemplates(): Promise<WeddingTemplate[]> {
  const templates = await serverFetch<TemplateResponse[]>(
    "/templates/homepage",
    {
      revalidate: REVALIDATE.config,
      tags: [CACHE_TAGS.templates, CACHE_TAGS.siteSettings],
    },
  );
  return templates
    .filter((template) => isCatalogTemplateVisible(template.slug))
    .map(toTemplate);
}

/**
 * Mẫu dựng sẵn cho mọi loại thiệp (`DEFAULT_TEMPLATE_SLUG`) — không có hàng
 * nào trong bảng `templates`, nên không nằm trong kho mẫu và không có trang
 * `/mau-thiep/<slug>`. Renderer không có bản dựng riêng cho slug này nên rơi về
 * `templates/classic/`, bản tự đổi khối và chữ theo loại thiệp. Gói Free, không
 * có ô ảnh: bố cục không dàn quanh ảnh nào, album vẫn đi theo gói của thiệp.
 * Backend nhận cùng slug này ở `POST /cards`.
 */
export const DEFAULT_TEMPLATE: WeddingTemplate = {
  id: DEFAULT_TEMPLATE_SLUG,
  slug: DEFAULT_TEMPLATE_SLUG,
  name: "Keemori",
  tier: "free",
  // Mẫu dựng sẵn hợp với mọi loại — editor không lọc nó theo `kind`.
  kind: "wedding",
  categories: [],
  colorTones: [],
  tags: [],
  imagePosition: "50% 50%",
  imageSrc: "/images/site/placeholder.avif",
  photoSlots: [],
  sortOrder: 0,
  createdAt: "2026-10-17T00:00:00.000Z",
};

/** Dùng cho landing, demo, preview và chọn mẫu trong editor. */
export async function getCatalogTemplateBySlug(
  slug: string,
): Promise<WeddingTemplate | undefined> {
  if (slug === DEFAULT_TEMPLATE_SLUG) return undefined;
  if (!isCatalogTemplateVisible(slug)) return undefined;
  return getTemplateBySlug(slug);
}

/** Editor mở được cả mẫu dựng sẵn lẫn mẫu trong kho. */
export async function getEditorTemplateBySlug(
  slug: string,
): Promise<WeddingTemplate | undefined> {
  if (slug === DEFAULT_TEMPLATE_SLUG) return DEFAULT_TEMPLATE;
  return getCatalogTemplateBySlug(slug);
}

/** Thiệp đã lưu vẫn cần metadata của mẫu, kể cả khi mẫu bị ẩn khỏi kho. */
export async function getTemplateBySlug(
  slug: string,
): Promise<WeddingTemplate | undefined> {
  if (slug === DEFAULT_TEMPLATE_SLUG) return DEFAULT_TEMPLATE;
  const template = await serverFetchOrNull<TemplateResponse>(
    `/templates/${slug}`,
    { revalidate: REVALIDATE.config, tags: [CACHE_TAGS.templates] },
  );
  return template ? toTemplate(template) : undefined;
}
