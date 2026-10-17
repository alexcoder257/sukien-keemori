import type { Metadata } from "next";
import { sharePreviewImage } from "@/lib/share-preview";
import { notFound, redirect } from "next/navigation";
import { InvitationView } from "@/components/invitation/invitation-view";
import { GUEST_QUERY_PARAM } from "@/constants/invitation";
import { invitationMetaCopy } from "@/components/invitation/shared/invitation-display-name";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import { getCanonicalSlug, getInvitationBySlug } from "@/lib/data/invitations";
import { getTemplateBySlug } from "@/lib/data/templates";
import { DEFAULT_OG_IMAGE, NO_INDEX, SITE_NAME, absoluteUrl } from "@/lib/seo";

/**
 * Mã link mời riêng trên URL (`?khach=`). Lặp khoá thì lấy giá trị đầu — một
 * link dán qua vài ứng dụng chat có thể bị nối thêm query lần nữa.
 */
function guestTokenOf(value: string | string[] | undefined) {
  const token = Array.isArray(value) ? value[0] : value;
  return token?.trim() || undefined;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/t/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);
  // Cùng tham số với lượt gọi trong component để `cache` gộp thành một request
  // — khác tham số là hỏi backend hai lần.
  const guestToken = guestTokenOf((await searchParams)[GUEST_QUERY_PARAM]);
  const invitation = await getInvitationBySlug(slug, guestToken);
  if (!invitation) return {};

  const { title, description: cardDescription } = invitationMetaCopy(
    dict.invitation,
    invitation.content,
  );
  // Link mời riêng: dòng mô tả trong ô xem trước của Zalo/Messenger gọi đúng
  // tên khách — chính là lời mời người đó nhìn thấy trước cả khi mở thiệp.
  // `guestName` chỉ có khi mã khớp một khách thật; mã sai thì về mô tả chung.
  const description = invitation.guestName
    ? fill(dict.invitation.guestMetaDescription, {
        guest: invitation.guestName,
      })
    : cardDescription;
  // Vắng lựa chọn/JPEG nghĩa là thiệp cũ: giữ nguyên ảnh Keemori.
  const template = invitation.content.sharePreview?.imageUrl
    ? await getTemplateBySlug(invitation.templateSlug)
    : undefined;
  const image =
    sharePreviewImage(invitation.content, template?.photoSlots ?? []) ??
    DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    /**
     * **Không lập chỉ mục, nhưng vẫn có preview đầy đủ.** Hai việc này độc lập
     * nhau và tấm thiệp cần đúng tổ hợp đó: nó được dán vào nhóm chat gia đình
     * nên phải hiện ảnh và tên hai họ, còn nằm trong kết quả tìm kiếm Google
     * thì không — thiệp mang ngày giờ, địa chỉ nhà và có khi cả số tài khoản
     * nhận mừng cưới.
     *
     * Đây là chốt chặn **duy nhất**: `robots.txt` cố ý không Disallow `/*​/t/`
     * — chặn ở đó thì bot của Facebook không đọc được `og:*`, và Google cũng
     * không thấy được thẻ này (xem `app/robots.ts`).
     */
    robots: NO_INDEX,
    // `openGraph` của page **thay hẳn** khối của layout chứ không gộp, nên
    // `siteName`/`locale` phải khai lại — thiếu thì Facebook/Discord mất dòng
    // "Keemori" phía trên tiêu đề preview.
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      title,
      description,
      // Link mời riêng giữ `?khach=` trong `og:url`: Facebook coi `og:url` là
      // địa chỉ chuẩn và đọc lại thẻ từ đó — bỏ mã là ô xem trước quay về mô
      // tả chung, mất tên khách.
      url: absoluteUrl(
        invitation.guestName && guestToken
          ? `/${locale}/t/${slug}?${new URLSearchParams({ [GUEST_QUERY_PARAM]: guestToken })}`
          : `/${locale}/t/${slug}`,
      ),
      images: [
        {
          url: absoluteUrl(image),
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
  };
}

/**
 * Thiệp khách mời thấy — không có header/footer của trang bán hàng để giữ
 * trọn cảm giác một tấm thiệp.
 */
export default async function InvitationPage({
  params,
  searchParams,
}: PageProps<"/[locale]/t/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const guestToken = guestTokenOf((await searchParams)[GUEST_QUERY_PARAM]);
  const invitation = await getInvitationBySlug(slug, guestToken);
  if (!invitation) {
    // Có thể là đường dẫn cũ của một thiệp đã đổi link. Link thiệp cưới đã in
    // lên giấy và gửi vào nhóm chat gia đình, nên nó phải tiếp tục mở được —
    // chuyển hướng sang đường dẫn hiện tại thay vì trả 404. Mang theo mã khách
    // mời: link riêng đã gửi trước lúc đổi đường dẫn vẫn phải chào đúng người.
    const canonical = await getCanonicalSlug(slug);
    if (canonical) {
      const query = guestToken
        ? `?${new URLSearchParams({ [GUEST_QUERY_PARAM]: guestToken })}`
        : "";
      redirect(`/${locale}/t/${canonical}${query}`);
    }
    notFound();
  }

  const dict = await getDictionary(locale);

  const template = await getTemplateBySlug(invitation.templateSlug);

  return (
    <main className="min-h-svh overflow-x-clip bg-white">
      {/* Tấm thiệp rộng tối đa 640px ở mọi màn hình, phần thừa hai bên là nền
          trắng của trang. Cùng khung với demo và preview desktop trong editor:
          các mẫu dùng container query, nên chiều rộng khung phải khớp để khách
          mở link thật thấy đúng bố cục người soạn đã xem. */}
      <div className="isolate mx-auto w-full max-w-[640px]">
        <InvitationView
          content={invitation.content}
          dict={dict.invitation}
          ceremonyKindsDict={dict.editor.ceremonyKinds}
          locale={locale}
          photoSlots={template?.photoSlots ?? []}
          templateSlug={invitation.templateSlug}
          // Đường dẫn chính thức của thiệp, không phải `slug` trên URL: vào bằng
          // link cũ thì trang này đã chuyển hướng, nhưng lấy đúng slug hiện tại
          // giữ cho lời chúc luôn ghi vào thiệp qua một đường duy nhất.
          cardSlug={invitation.slug}
          guestName={invitation.guestName}
          // Chỉ mã mà backend đã khớp ra một khách. Mã sai thì trang đã hỏng mềm
          // về lời chào chung, và xác nhận tham dự cũng phải ghi như link chung.
          guestToken={invitation.guestName ? guestToken : undefined}
        />
      </div>
    </main>
  );
}
