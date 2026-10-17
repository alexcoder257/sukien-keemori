import {
  DEFAULT_GUEST_INVITE,
  INVITATION_BLOCKS,
  KIND_EDITOR_BLOCKS,
  MUSIC_TRACKS,
  kindHasGuestInvite,
  type InvitationKind,
} from "@/constants/invitation";
import type { InvitationContent, Occasion } from "@/lib/schemas/invitation";

const allVisible = Object.fromEntries(
  INVITATION_BLOCKS.map((block) => [block, true]),
) as InvitationContent["visibility"];

/**
 * Nội dung mặc định của một thiệp cưới trống. Backend cũng có một bản
 * (`createEmptyContent`) và đó mới là bản dùng khi tạo thiệp thật; bản này chỉ
 * để form trong editor có giá trị khởi tạo trước khi có dữ liệu về.
 *
 * Không mang khoá `kind`: vắng khoá là thiệp cưới, đúng như thiệp lưu trước khi
 * có loại — nên thiệp cưới mới và thiệp cưới cũ có cùng một hình dạng.
 */
export const emptyInvitationContent: InvitationContent = {
  photos: {},
  // Khớp `createEmptyContent` ở backend.
  envelope: {
    greeting: "Trân trọng kính mời",
    invitation:
      "Chúng tôi rất hân hạnh được đón tiếp bạn trong ngày vui của gia đình.",
  },
  couple: {
    groomFullName: "",
    brideFullName: "",
    groomNickname: "",
    brideNickname: "",
    groomChildOrder: "",
    brideChildOrder: "",
  },
  families: {
    groomFather: "",
    groomMother: "",
    brideFather: "",
    brideMother: "",
    groomAddress: "",
    brideAddress: "",
  },
  ceremonies: [
    {
      kind: "groom",
      customKind: "",
      dateTime: "",
      venue: "",
      venuePlace: null,
      note: "",
    },
  ],
  reception: {
    date: "",
    welcomeTime: "",
    startTime: "",
    venueAddress: "",
    venueLabel: "",
    venuePlace: null,
    mapUrl: "",
  },
  // Bản sao của `createEmptyContent` ở backend — sửa một bên thì sửa cả bên kia.
  dressCode: { title: "Dresscode", description: "", colors: [] },
  timeline: { title: "Lịch trình ngày cưới", items: [], autoTranslate: false },
  countdown: { weddingDate: "", googleCalendar: true, appleCalendar: true },
  story: { message: "" },
  album: { photos: [] },
  giftBox: {
    groom: { bankBin: "", accountNumber: "", accountName: "" },
    bride: { bankBin: "", accountNumber: "", accountName: "" },
  },
  wishes: { items: [] },
  // Bài đầu tiên của thư viện — khớp `createEmptyContent` ở backend.
  music: { trackId: MUSIC_TRACKS[0].id },
  thankYou: { message: "" },
  guestInvite: { ...DEFAULT_GUEST_INVITE },
  // Mọi block đều bật, kể cả xác nhận tham dự — khớp `createEmptyContent`.
  visibility: { ...allVisible },
};

export const emptyOccasion: Occasion = {
  name: "",
  nickname: "",
  age: "",
  school: "",
  major: "",
  classOf: "",
  organizer: "",
  years: "",
  sender: "",
  greetingOccasion: "other",
  message: "",
};

/**
 * Lời chào và lời mời điền sẵn theo loại — bản sao của `createEmptyContent`
 * ở backend. Thiệp cưới giữ câu của `emptyInvitationContent`.
 */
const KIND_ENVELOPE: Record<
  Exclude<InvitationKind, "wedding">,
  InvitationContent["envelope"]
> = {
  birthday: {
    greeting: "Trân trọng mời bạn",
    invitation: "Rất mong bạn đến chung vui trong tiệc sinh nhật của mình.",
  },
  graduation: {
    greeting: "Trân trọng mời bạn",
    invitation: "Rất mong bạn đến chung vui trong ngày tốt nghiệp của mình.",
  },
  event: {
    greeting: "Trân trọng kính mời",
    invitation:
      "Rất hân hạnh được đón tiếp quý khách tại sự kiện của chúng tôi.",
  },
  anniversary: {
    greeting: "Trân trọng mời bạn",
    invitation: "Rất mong bạn đến chung vui trong ngày kỷ niệm của chúng tôi.",
  },
  greeting: {
    greeting: "Gửi đến bạn",
    invitation: "Một lời chúc nhỏ, gửi trọn yêu thương.",
  },
};

/** Tiêu đề lịch trình điền sẵn — cùng lý do với tiêu đề của thiệp cưới. */
const KIND_TIMELINE_TITLE: Record<Exclude<InvitationKind, "wedding">, string> =
  {
    birthday: "Lịch trình buổi tiệc",
    graduation: "Lịch trình buổi lễ",
    event: "Chương trình sự kiện",
    anniversary: "Lịch trình buổi tiệc",
    greeting: "Lịch trình",
  };

/**
 * Nội dung rỗng của một thiệp mới thuộc loại `kind` — bản đối chiếu của
 * `createEmptyContent(kind)` ở backend.
 *
 * Khối không thuộc loại vẫn có mặt (để `visibility` và `content` đủ khoá) nhưng
 * tắt sẵn; thiệp khác thiệp cưới không có nghi lễ nào. Trả về object mới mỗi
 * lần gọi vì form sửa nó tại chỗ.
 */
export function emptyInvitationContentFor(
  kind: InvitationKind,
): InvitationContent {
  const base = structuredClone(emptyInvitationContent);
  if (kind === "wedding") return base;

  const blocks = new Set<string>(KIND_EDITOR_BLOCKS[kind]);
  const visibility = Object.fromEntries(
    INVITATION_BLOCKS.map((block) => [block, blocks.has(block)]),
  ) as InvitationContent["visibility"];

  return {
    ...base,
    kind,
    occasion: { ...emptyOccasion },
    envelope: { ...KIND_ENVELOPE[kind] },
    ceremonies: [],
    timeline: { ...base.timeline, title: KIND_TIMELINE_TITLE[kind] },
    guestInvite: {
      ...base.guestInvite,
      enabled: kindHasGuestInvite(kind) && base.guestInvite.enabled,
    },
    visibility,
  };
}
