import { findBankByBin } from "@/constants/banks";
import {
  INVITATION_BLOCKS,
  KIND_EDITOR_BLOCKS,
  invitationKindOf,
  type InvitationBlock,
} from "@/constants/invitation";
import { vietQrPayload } from "@/lib/vietqr";
import type {
  Ceremony,
  InvitationContent,
  TimelineItem,
  Wish,
} from "@/lib/schemas/invitation";

/** Một tài khoản nhận mừng cưới đã nhập đủ để hiện được. */
export type GiftAccount = {
  side: "groom" | "bride";
  /** Tên ngân hàng để hiển thị, tra từ BIN. Rỗng nếu BIN không còn trong bảng. */
  bank: string;
  /** Mã ngắn để tra logo; rỗng khi không tra được ngân hàng. */
  bankCode: string;
  accountNumber: string;
  accountName: string;
  /**
   * Payload VietQR, `null` khi thiếu BIN hoặc số tài khoản. Tính một lần ở đây
   * thay vì trong component: cùng một phép suy ra, và template nào cũng cần.
   */
  qrPayload: string | null;
};

export type InvitationBlockData = {
  /**
   * Block thực sự vẽ ra được: vừa được bật vừa có nội dung. Template chỉ cần
   * đọc cờ này, không tự đi kiểm tra rỗng nữa.
   */
  show: Record<InvitationBlock, boolean>;
  /** Nghi lễ đã nhập ít nhất thời gian hoặc địa điểm. */
  ceremonies: Ceremony[];
  /** Mốc lịch trình đã nhập ít nhất một trường. */
  timelineItems: TimelineItem[];
  /** Mã màu dress code đã bỏ ô trống. */
  dressCodeColors: string[];
  giftAccounts: GiftAccount[];
  /** Lời chúc đã duyệt, mới nhất trước — thứ duy nhất thiệp được vẽ ra. */
  approvedWishes: Wish[];
};

/**
 * Bật một block mà chưa nhập gì thì thiệp hiện ra một section chỉ có tiêu đề.
 * Mỗi template tự lọc lấy thì cùng một phép kiểm tra bị chép lại theo số mẫu,
 * và lệch nhau ngay lần sửa đầu tiên — nên nó nằm ở đây, tính một lần cho mọi
 * template.
 *
 * Chỉ những block có thể rỗng mới bị chặn thêm. `envelope`, `couple`,
 * `families`, `reception`, `wishes`, `rsvp` và `music` vẫn theo đúng công tắc
 * người dùng bật: chúng luôn có thứ để vẽ (tên cặp đôi, khung bản đồ, ô viết
 * lời chúc, form xác nhận tham dự, nút nhạc).
 */
const EMPTY_GIFT_ACCOUNT = { bankBin: "", accountNumber: "", accountName: "" };

/**
 * Hộp quà theo loại thiệp: thiệp cưới có hai tài khoản (chú rể, cô dâu), các
 * loại khác chỉ một — tài khoản đó nằm ở `giftBox.groom` để không phải đổi
 * hình dạng `content`. Ô `bride` còn sót từ dữ liệu cũ thì không vẽ.
 */
export function giftBoxForKind(
  content: Pick<InvitationContent, "giftBox" | "kind">,
): InvitationContent["giftBox"] {
  if (invitationKindOf(content) === "wedding") return content.giftBox;
  return { ...content.giftBox, bride: EMPTY_GIFT_ACCOUNT };
}

export function giftAccountsOf(
  giftBox: InvitationContent["giftBox"],
): GiftAccount[] {
  return (["groom", "bride"] as const)
    .map((side) => {
      const account = giftBox[side];
      const bank = findBankByBin(account.bankBin);
      return {
        side,
        // BIN chết (ngân hàng sáp nhập, đổi mã) thì mất tên và logo nhưng vẫn
        // hiện được số tài khoản để khách chuyển tay — hỏng mềm, không ẩn khối.
        bank: bank?.shortName ?? "",
        bankCode: bank?.code ?? "",
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        qrPayload: vietQrPayload(account.bankBin, account.accountNumber),
      };
    })
    .filter((account) => account.bank || account.accountNumber);
}

export function invitationBlocks(
  content: InvitationContent,
): InvitationBlockData {
  const visibility = content.visibility;

  const ceremonies = content.ceremonies.filter(
    (ceremony) => ceremony.dateTime || ceremony.venue,
  );
  const timelineItems = content.timeline.items.filter(
    (item) => item.startTime || item.endTime || item.activity,
  );
  const dressCodeColors = content.dressCode.colors.filter(Boolean);
  const giftAccounts = giftAccountsOf(giftBoxForKind(content));

  // Lời chúc chưa duyệt không được rò ra thiệp khách xem: duyệt là hàng rào
  // kiểm duyệt duy nhất của block này. Sắp mới nhất trước để lời chúc vừa được
  // duyệt nằm ngay đầu sổ.
  const approvedWishes = content.wishes.items
    .filter((wish) => wish.approved && !!wish.message)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // `weddingDate` là chuỗi người dùng nhập: rỗng hoặc sai định dạng thì đồng hồ
  // đếm ngược không có mốc nào để đếm.
  const hasWeddingDate =
    !!content.countdown.weddingDate &&
    !Number.isNaN(new Date(content.countdown.weddingDate).getTime());

  // Khối không thuộc loại thiệp (cô dâu chú rể của một thiệp sinh nhật…) không
  // bao giờ vẽ, dù công tắc của nó còn bật trong dữ liệu.
  const kindBlocks = new Set<InvitationBlock>(
    KIND_EDITOR_BLOCKS[invitationKindOf(content)],
  );
  const inKind = Object.fromEntries(
    INVITATION_BLOCKS.map((block) => [
      block,
      visibility[block] && kindBlocks.has(block),
    ]),
  ) as Record<InvitationBlock, boolean>;

  return {
    show: {
      ...inKind,
      ceremonies: inKind.ceremonies && ceremonies.length > 0,
      dressCode:
        inKind.dressCode &&
        (!!content.dressCode.description || dressCodeColors.length > 0),
      timeline: inKind.timeline && timelineItems.length > 0,
      countdown: inKind.countdown && hasWeddingDate,
      story: inKind.story && !!content.story.message,
      album: inKind.album && content.album.photos.length > 0,
      giftBox: inKind.giftBox && giftAccounts.length > 0,
      thankYou: inKind.thankYou && !!content.thankYou.message,
    },
    ceremonies,
    timelineItems,
    dressCodeColors,
    giftAccounts,
    approvedWishes,
  };
}
