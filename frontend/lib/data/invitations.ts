import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import {
  GUEST_QUERY_PARAM,
  VISITOR_HEADER,
  DEFAULT_INVITATION_KIND,
  invitationKindOf,
  type InvitationKind,
  type InvitationStatus,
} from "@/constants/invitation";
import type { InvitationContent, Rsvp, Wish } from "@/lib/schemas/invitation";
import { stripLegacyKeys } from "@/lib/legacy-content";
import {
  REVALIDATE,
  serverFetch,
  serverFetchOrNull,
} from "./api";
import { CACHE_TAGS, cardWishesTag } from "@/constants/cache-tags";

export interface InvitationSummary {
  id: string;
  createdAt: string;
  slug: string;
  /** Tên hiển thị trong danh sách, thường là "Chú rể & Cô dâu". */
  title: string;
  /** Loại thiệp; backend cũ không trả thì là thiệp cưới. */
  kind: InvitationKind;
  templateName: string;
  templateSlug: string;
  /** Thumbnail của mẫu; `undefined` khi mẫu chưa có ảnh hoặc đã gỡ khỏi kho. */
  templateImageSrc?: string;
  /** `draft` hoặc `paid` ("đã xuất bản", link vĩnh viễn). */
  status: InvitationStatus;
  /** Đơn đang chờ thanh toán của thiệp nháp; `null` khi chưa có đơn nào. */
  pendingOrderId: string | null;
  views: number;
  /** Lời chúc đang chờ chủ thiệp duyệt — việc duy nhất danh sách này nhắc. */
  pendingWishes: number;
  /** Đang bật link mời riêng. */
  guestInviteEnabled: boolean;
  /** Số khách trong danh sách link mời riêng. */
  guestCount: number;
  /** Đang bật xác nhận tham dự — dòng thiệp mới có lối vào màn phản hồi. */
  rsvpEnabled: boolean;
}

export interface Invitation extends Omit<
  InvitationSummary,
  | "createdAt"
  | "pendingOrderId"
  | "pendingWishes"
  | "guestInviteEnabled"
  | "guestCount"
  | "rsvpEnabled"
> {
  content: InvitationContent;
}

/** Thiệp khách mời mở — kèm tên khách khi vào bằng link mời riêng. */
export interface PublicInvitation extends Invitation {
  guestName: string | null;
}

/** Một khách mời và mã link riêng của họ. */
export interface GuestLink {
  id: string;
  name: string;
  token: string;
}

// Nội dung rỗng sống ở module không-`server-only` để editor (client) dựng được
// thiệp rỗng theo loại; giữ lối export cũ cho các trang server đang dùng.
export { emptyInvitationContent } from "@/lib/empty-invitation-content";

/** Thiệp như backend trả về: `content` **không** kèm lời chúc. */
interface CardResponse {
  id: string;
  slug: string;
  title: string;
  templateSlug: string;
  status: InvitationStatus;
  viewCount: number;
  content: Omit<InvitationContent, "wishes">;
}

interface CardSummaryResponse {
  id: string;
  createdAt: string;
  slug: string;
  title: string;
  kind?: InvitationKind;
  templateSlug: string;
  templateName: string;
  templateImageSrc: string | null;
  status: InvitationStatus;
  pendingOrderId?: string | null;
  views: number;
  guestInviteEnabled: boolean;
  guestCount: number;
  rsvpEnabled: boolean;
}

/**
 * Lời chúc là bảng riêng ở backend, không nằm trong `content`: nội dung trong
 * `content` do cặp đôi soạn và bị ghi đè nguyên khối mỗi lần lưu editor, còn
 * lời chúc là dữ liệu khách gửi lên và có vòng đời duyệt riêng. Vì vậy hai thứ
 * đi hai endpoint và được ghép lại ở đây.
 */
function withWishes(
  content: Omit<InvitationContent, "wishes">,
  wishes: Wish[],
): InvitationContent {
  return { ...stripLegacyKeys(content), wishes: { items: wishes } };
}

/**
 * Danh sách "Thiệp của tôi". Hai lượt gọi song song vì số lời chúc chờ duyệt
 * nằm ở domain `interactions`, tách khỏi `cards` để hai module không phụ thuộc
 * vòng tròn vào nhau.
 */
export async function getMyInvitations(): Promise<InvitationSummary[]> {
  const [cards, pending] = await Promise.all([
    serverFetch<CardSummaryResponse[]>("/cards", { auth: true }),
    serverFetch<Record<string, number>>("/wishes/pending-count", {
      auth: true,
    }),
  ]);

  return cards.map((card) => ({
    id: card.id,
    createdAt: card.createdAt,
    slug: card.slug,
    title: card.title,
    kind: card.kind ?? DEFAULT_INVITATION_KIND,
    templateName: card.templateName,
    templateSlug: card.templateSlug,
    // `null` của SQL về `undefined` như `lib/data/templates.ts` đã làm, để
    // component chỉ phải kiểm một giá trị vắng mặt.
    templateImageSrc: card.templateImageSrc ?? undefined,
    status: card.status,
    pendingOrderId: card.pendingOrderId ?? null,
    views: card.views,
    pendingWishes: pending[card.id] ?? 0,
    guestInviteEnabled: card.guestInviteEnabled,
    guestCount: card.guestCount,
    rsvpEnabled: card.rsvpEnabled,
  }));
}

/**
 * Thiệp mà khách mời nhìn thấy. Thiệp không tồn tại thì hàm này về `undefined`
 * và trang gọi nó `notFound()`.
 *
 * Chỉ ghép lời chúc **đã duyệt**: bản chờ duyệt là việc riêng của chủ thiệp.
 *
 * Mã người xem lấy từ header `proxy.ts` gắn vào (xem `VISITOR_HEADER`) và
 * chuyển thẳng xuống backend — đó là thứ để backend biết đây là khách mới hay
 * người cũ quay lại. Không có mã (bot lấy ảnh preview) thì backend không tính.
 *
 * Bọc `cache` vẫn giữ: trang thiệp gọi hàm này hai lần trong cùng một request —
 * một lần ở `generateMetadata`, một lần ở component — và tuy giờ hai lượt đó
 * cùng một `visitorId` nên không còn đếm oan, thì vẫn không có lý do gì để hỏi
 * backend hai lần.
 */
/**
 * Lời chúc **đã duyệt** của một tấm thiệp — phần duy nhất trong trang thiệp
 * cache dùng chung được.
 *
 * Nội dung thiệp thì không: `/public/cards/:slug` vừa trả nội dung vừa **đếm
 * người xem** (phụ thuộc vào chính người đang mở link), nên một bản cache dùng
 * chung sẽ đếm thiếu.
 *
 * Lời chúc thì ngược lại: mọi khách mời nhìn thấy đúng một danh sách, và danh
 * sách đó chỉ đổi khi chủ thiệp duyệt hoặc xoá. Đó là lúc backend bắn
 * `POST /api/revalidate` với tag của riêng thiệp này, nên `REVALIDATE.wishes`
 * chỉ là lưới an toàn chứ không phải độ trễ thực tế.
 *
 * Đổi lại: một tấm thiệp được chia sẻ vào nhóm chat gia đình bớt được **một
 * truy vấn cho mỗi lượt mở**, và đó là truy vấn duy nhất trong đường đi này
 * không cần chạy lại cho từng người.
 */
async function getApprovedWishes(slug: string): Promise<Wish[]> {
  return serverFetch<Wish[]>(`/public/cards/${slug}/wishes`, {
    revalidate: REVALIDATE.wishes,
    tags: [cardWishesTag(slug)],
  });
}

/**
 * Hai dòng chữ trên mặt thiệp demo ở hero trang chủ (lời chào, địa điểm).
 *
 * Không dùng `getInvitationBySlug`: hàm đó dành cho khách mời mở link — nó đọc
 * `headers()` để đếm người xem và không cache, nên gọi nó từ trang chủ là kéo
 * trang chủ về render động ("Page changed from static to dynamic", 500 ở bản
 * build). Ở đây không gửi mã người xem nên backend không tính lượt xem, và kết
 * quả được cache như mọi cấu hình trang chủ khác: đổi thiệp demo là đổi
 * `site_settings`, nên tag `siteSettings` làm mới nó.
 *
 * Hỏng mềm về `undefined`: thiếu hai dòng chữ này thì mặt thiệp vẫn vẽ được,
 * không đáng làm hỏng cả trang chủ.
 */
export async function getDemoCardContent(
  slug: string,
): Promise<CardResponse["content"] | undefined> {
  try {
    const result = await serverFetchOrNull<{ card: CardResponse }>(
      `/public/cards/${slug}`,
      { revalidate: REVALIDATE.config, tags: [CACHE_TAGS.siteSettings] },
    );
    return result?.card.content;
  } catch {
    return undefined;
  }
}

export const getInvitationBySlug = cache(async function getInvitationBySlug(
  slug: string,
  /** Mã trong link mời riêng (`?khach=`). Sai hay hết hiệu lực thì backend bỏ qua. */
  guestToken?: string,
): Promise<PublicInvitation | undefined> {
  const visitorId = (await headers()).get(VISITOR_HEADER);
  const query = guestToken
    ? `?${new URLSearchParams({ [GUEST_QUERY_PARAM]: guestToken })}`
    : "";
  const result = await serverFetchOrNull<{
    card: CardResponse;
    guestName: string | null;
  }>(
    `/public/cards/${slug}${query}`,
    visitorId ? { headers: { [VISITOR_HEADER]: visitorId } } : {},
  );
  if (!result) return undefined;

  const { card } = result;
  // Theo đường dẫn chung (`card.slug`) chứ không theo `slug` trên URL: link cũ
  // (đường dẫn nhà trai / nhà gái của Song Hỷ đã gỡ) dùng chung một sổ lưu bút,
  // và cache lời chúc được làm mới theo tag của đường dẫn chung.
  const wishes = await getApprovedWishes(card.slug);
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    kind: invitationKindOf(card.content),
    templateName: card.templateSlug,
    templateSlug: card.templateSlug,
    status: card.status,
    views: card.viewCount,
    content: withWishes(card.content, wishes),
    guestName: result.guestName,
  };
});

/**
 * Thiệp của chính mình cùng danh sách link mời riêng, cho màn "Link khách mời".
 * `undefined` khi slug không thuộc người đang đăng nhập — backend kiểm quyền.
 */
export async function getMyGuestLinks(slug: string): Promise<
  | {
      invitation: Pick<
        InvitationSummary,
        | "id"
        | "slug"
        | "title"
        | "templateSlug"
        | "status"
        | "guestInviteEnabled"
        | "rsvpEnabled"
      >;
      guests: GuestLink[];
      /**
       * Phản hồi tham dự của thiệp, để danh sách link cho biết khách nào đã trả
       * lời. Nạp cùng lúc chứ không để client tự gọi: màn này là việc gửi link
       * lặp lại nhiều ngày, và nhìn một lượt ai chưa phản hồi là lý do mở nó.
       */
      rsvps: Rsvp[];
    }
  | undefined
> {
  const cards = await serverFetch<CardSummaryResponse[]>("/cards", {
    auth: true,
  });
  const summary = cards.find((card) => card.slug === slug);
  if (!summary) return undefined;

  const [guests, rsvps] = await Promise.all([
    serverFetch<GuestLink[]>(`/cards/${summary.id}/guests`, { auth: true }),
    serverFetch<Rsvp[]>(`/cards/${summary.id}/rsvps`, { auth: true }),
  ]);
  return {
    invitation: {
      id: summary.id,
      slug: summary.slug,
      title: summary.title,
      templateSlug: summary.templateSlug,
      status: summary.status,
      guestInviteEnabled: summary.guestInviteEnabled,
      rsvpEnabled: summary.rsvpEnabled,
    },
    guests,
    rsvps,
  };
}

/**
 * Thiệp của chính mình cùng mọi phản hồi tham dự, cho màn "Xác nhận tham dự".
 * `undefined` khi slug không thuộc người đang đăng nhập — backend kiểm quyền.
 */
export async function getMyRsvps(slug: string): Promise<
  | {
      invitation: Pick<
        InvitationSummary,
        | "id"
        | "slug"
        | "title"
        | "templateSlug"
        | "status"
        | "rsvpEnabled"
      >;
      rsvps: Rsvp[];
    }
  | undefined
> {
  const cards = await serverFetch<CardSummaryResponse[]>("/cards", {
    auth: true,
  });
  const summary = cards.find((card) => card.slug === slug);
  if (!summary) return undefined;

  const rsvps = await serverFetch<Rsvp[]>(`/cards/${summary.id}/rsvps`, {
    auth: true,
  });
  return {
    invitation: {
      id: summary.id,
      slug: summary.slug,
      title: summary.title,
      templateSlug: summary.templateSlug,
      status: summary.status,
      rsvpEnabled: summary.rsvpEnabled,
    },
    rsvps,
  };
}

/**
 * Đường dẫn đang hiệu lực của một thiệp từng dùng `slug`, hoặc `undefined`.
 *
 * Chỉ gọi khi tra theo đường dẫn chính đã trượt: đây là đường của những link cũ
 * đã in lên thiệp giấy hoặc gửi vào nhóm chat từ trước khi cặp đôi đổi link.
 */
export async function getCanonicalSlug(
  slug: string,
): Promise<string | undefined> {
  const result = await serverFetchOrNull<{ slug: string }>(
    `/public/cards/${slug}/canonical`,
  );
  return result?.slug;
}

/**
 * Thiệp của chính mình theo id, để mở lại trong editor.
 *
 * Không kèm lời chúc: editor sửa nội dung cặp đôi soạn, còn duyệt lời chúc là
 * màn riêng. Trả `undefined` khi id không tồn tại hoặc không thuộc người đang
 * đăng nhập — backend trả 404 cho cả hai trường hợp, và đó là điều đúng: không
 * xác nhận sự tồn tại của thiệp người khác.
 */
export async function getMyInvitationById(
  id: string,
): Promise<Invitation | undefined> {
  const card = await serverFetchOrNull<CardResponse>(`/cards/${id}`, {
    auth: true,
  });
  if (!card) return undefined;

  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    kind: invitationKindOf(card.content),
    templateName: card.templateSlug,
    templateSlug: card.templateSlug,
    status: card.status,
    views: card.viewCount,
    content: withWishes(card.content, []),
  };
}

/**
 * Thiệp của chính mình, kèm **toàn bộ** lời chúc gồm cả bản chờ duyệt — dùng
 * cho màn kiểm duyệt. Tách khỏi `getInvitationBySlug` vì bản công khai không
 * được phép thấy lời chúc chưa duyệt; gộp hai thứ là để lộ dữ liệu chờ duyệt ra
 * trang khách mời.
 */
export async function getMyInvitationBySlug(
  slug: string,
): Promise<Invitation | undefined> {
  const cards = await serverFetch<CardSummaryResponse[]>("/cards", {
    auth: true,
  });
  const summary = cards.find((card) => card.slug === slug);
  if (!summary) return undefined;

  const [card, wishes] = await Promise.all([
    serverFetch<CardResponse>(`/cards/${summary.id}`, { auth: true }),
    serverFetch<Wish[]>(`/cards/${summary.id}/wishes`, { auth: true }),
  ]);

  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    kind: invitationKindOf(card.content),
    templateName: summary.templateName,
    templateSlug: card.templateSlug,
    status: card.status,
    views: card.viewCount,
    content: withWishes(card.content, wishes),
  };
}
