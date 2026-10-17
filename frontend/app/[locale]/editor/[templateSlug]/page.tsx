import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InvitationEditor } from "@/components/editor/invitation-editor";
import {
  DEFAULT_TEMPLATE_SLUG,
  INVITATION_KIND_QUERY_PARAM,
  invitationKindFromSlug,
  invitationKindOf,
  type InvitationKind,
} from "@/constants/invitation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { emptyInvitationContentFor } from "@/lib/empty-invitation-content";
import { getMyInvitationById } from "@/lib/data/invitations";
import {
  DEFAULT_TEMPLATE,
  getEditorTemplateBySlug,
  getTemplates,
} from "@/lib/data/templates";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/editor/[templateSlug]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.editor.meta.title, robots: NO_INDEX };
}

/**
 * Editor cho một thiệp mới dựa trên mẫu đã chọn, hoặc mở lại thiệp đã lưu qua
 * `?thiep=<id>`.
 *
 * Id đi ở query chứ không nằm trong đường dẫn vì mẫu vẫn là thứ định danh URL
 * của editor: đổi mẫu giữa chừng chỉ thay một đoạn `replaceState` và không phải
 * dựng lại trang. Thiếu `?thiep` nghĩa là dựng thiệp mới — nút lưu sẽ tạo thiệp
 * mới chứ không ghi đè cái nào.
 *
 * Loại thiệp: thiệp đã lưu mang loại trong `content.kind`. Thiệp mới trên mẫu
 * dựng sẵn đọc `?loai=<slug>` từ bước chọn loại (`/tao-thiep`) — thiếu hoặc sai
 * thì quay lại bước đó, vì mẫu dựng sẵn không tự nói nó là thiệp gì. Thiệp mới
 * trên một mẫu trong kho mang đúng loại của mẫu (`template.kind`); `?loai` nói
 * một loại khác thì mẫu đó không dựng được thiệp này, nên cũng về bước chọn loại.
 */
export default async function EditorPage({
  params,
  searchParams,
}: PageProps<"/[locale]/editor/[templateSlug]">) {
  const { locale, templateSlug } = await params;
  if (!isLocale(locale)) notFound();

  const query = await searchParams;
  const thiep = query.thiep;
  const loai = query[INVITATION_KIND_QUERY_PARAM];
  const cardId = typeof thiep === "string" ? thiep : undefined;
  const card = cardId ? await getMyInvitationById(cardId) : undefined;
  // URL nói rõ đang mở một thiệp cụ thể; không lấy được nó thì mở form rỗng là
  // đánh tráo, người dùng sẽ tưởng thiệp cũ trống trơn và gõ đè lên.
  if (cardId && !card) notFound();

  const queryKind = invitationKindFromSlug(
    typeof loai === "string" ? loai : undefined,
  );
  if (!card && templateSlug === DEFAULT_TEMPLATE_SLUG && !queryKind) {
    redirect(`/${locale}/tao-thiep`);
  }
  const template = await getEditorTemplateBySlug(templateSlug);
  if (!template) notFound();

  const isBuiltIn = template.slug === DEFAULT_TEMPLATE_SLUG;
  if (!card && !isBuiltIn && queryKind && queryKind !== template.kind) {
    redirect(`/${locale}/tao-thiep`);
  }
  const kind: InvitationKind = card
    ? invitationKindOf(card.content)
    : isBuiltIn
      ? (queryKind ?? "wedding")
      : template.kind;

  const dict = await getDictionary(locale);
  // Chỉ mẫu cùng loại: dựng thiệp sinh nhật bằng một mẫu cưới là vẽ ra khối cô
  // dâu chú rể rỗng. Mẫu dựng sẵn thì hợp với mọi loại. Backend chặn lại lần nữa
  // ở `POST /cards` và lúc đổi mẫu.
  const catalog = (await getTemplates()).filter((item) => item.kind === kind);

  return (
    <InvitationEditor
      initialContent={card?.content ?? emptyInvitationContentFor(kind)}
      kind={kind}
      cardId={cardId}
      cardSlug={card?.slug}
      paid={card?.status === "paid"}
      templates={[DEFAULT_TEMPLATE, ...catalog].map((item) => ({
        slug: item.slug,
        name:
          item.slug === DEFAULT_TEMPLATE_SLUG
            ? dict.editor.defaultTemplateName
            : item.name,
        photoSlots: item.photoSlots,
        image: item.imageSrc
          ? {
              // Editor previews are fixed cards; the full-page thumbnail is
              // only needed for the catalog's scrolling preview.
              src: item.imageSrc.replace(/\/thumbnail\.avif$/, "/poster.avif"),
            }
          : {
              src: "/images/site/template-atlas.avif",
              position: item.imagePosition,
            },
      }))}
      templateSlug={template.slug}
      dict={dict.editor}
      invitationDict={dict.invitation}
      commonDict={dict.common}
      paymentDict={dict.payment.upgrade}
      locale={locale}
    />
  );
}
