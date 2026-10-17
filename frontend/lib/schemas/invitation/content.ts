import { z } from "zod";
import {
  BANK_ACCOUNT_MAX_LENGTH,
  BANK_ACCOUNT_NAME_MAX_LENGTH,
  BANK_ACCOUNT_PATTERN,
  BANK_BIN_PATTERN,
} from "@/constants/banks";
import {
  GREETING_OCCASIONS,
  GUEST_LIST_MAX_GUESTS,
  GUEST_NAME_MAX_LENGTH,
  INVITATION_BLOCKS,
  INVITATION_KINDS,
  OCCASION_FIELD_MAX_LENGTH,
  invitationKindOf,
  WISH_MAX_MESSAGE_LENGTH,
  WISH_MAX_NAME_LENGTH,
} from "@/constants/invitation";
import { fill } from "@/lib/format";
import { parseGuestNames } from "@/lib/guest-list";
import type { Dictionary } from "@/i18n/dictionaries";

export type InvitationErrors = Dictionary["invitation"]["errors"];

const requiredText = (message: string) => z.string().trim().min(1, message);
const optionalText = z.string().trim();

/**
 * Một thiệp hỗ trợ nhiều nghi lễ (ăn hỏi / vu quy / thành hôn…).
 * `kind` là key dịch, không phải text hiển thị.
 */
export const CEREMONY_KINDS = [
  "engagement",
  "bride",
  "groom",
  "other",
] as const;
export type CeremonyKind = (typeof CEREMONY_KINDS)[number];

/**
 * Loại của một mốc lịch trình — thứ quyết định **ý nghĩa** của biểu tượng,
 * không phải hình vẽ. Mỗi mẫu tự vẽ loại đó bằng icon/ảnh decor của riêng nó
 * (`components/invitation/shared/timeline-activity.ts`), nên đổi mẫu thì hình
 * đổi theo mà nghĩa vẫn giữ.
 *
 * `null`/thiếu là "Tự động": đoán từ chữ `activity`. Dùng `null` chứ không
 * dùng `undefined` cho lựa chọn đó vì React Hook Form coi `undefined` là "chưa
 * có giá trị" và trả ô chọn về giá trị mặc định cũ.
 *
 * Bản sao ở `backend/src/common/enums/invitation.enum.ts`.
 */
export const TIMELINE_ACTIVITY_KINDS = [
  "welcome",
  "ancestral",
  "procession",
  "ceremony",
  "reception",
  "toast",
  "cake",
  "photo",
  "music",
  "farewell",
] as const;
export type TimelineActivityKind = (typeof TIMELINE_ACTIVITY_KINDS)[number];

/**
 * Toạ độ đi kèm địa chỉ, có khi người dùng chọn từ gợi ý Google Places và
 * `null` khi họ tự gõ. Không bắt buộc: ô địa chỉ vẫn là text tự do vì nhiều lễ
 * diễn ra ở nơi không có trên bản đồ.
 */
export const placeRefSchema = z
  .object({
    placeId: z.string().max(255),
    latitude: z.number(),
    longitude: z.number(),
  })
  .nullable();

export const ceremonySchema = (e: InvitationErrors) =>
  z
    .object({
      kind: z.enum(CEREMONY_KINDS),
      /** Chỉ dùng khi `kind` là `other`: tên nghi lễ do người dùng tự nhập. */
      customKind: optionalText,
      dateTime: requiredText(e.required),
      venue: requiredText(e.required),
      venuePlace: placeRefSchema,
      note: optionalText,
    })
    .refine((ceremony) => ceremony.kind !== "other" || ceremony.customKind, {
      path: ["customKind"],
      message: e.required,
    });

/** Số tông màu tối đa của bảng màu trang phục — quá nhiều thì hết là gợi ý. */
export const DRESS_CODE_MAX_COLORS = 6;

/** Chỉ nhận mã hex 3 hoặc 6 ký tự; người dùng thường dán từ Figma/Canva. */
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: string) {
  return HEX_COLOR.test(value.trim());
}

/** Chuẩn hoá mã màu dán vào: thêm `#`, bỏ khoảng trắng, viết thường. */
export function normalizeHexColor(value: string) {
  const trimmed = value.trim().replace(/^#/, "");
  return trimmed ? `#${trimmed.toLowerCase()}` : "";
}

/**
 * Dress code là gợi ý trang phục: một tiêu đề, vài dòng mô tả và bảng tông màu.
 * Không ràng buộc kiểu trang phục cố định — mỗi đám cưới diễn đạt một khác, nên
 * chữ do cặp đôi viết còn màu thì chọn trực tiếp.
 */
export const dressCodeSchema = (e: InvitationErrors) =>
  z.object({
    /** Bỏ trống thì thiệp dùng nhãn mặc định trong dictionary. */
    title: optionalText,
    description: optionalText,
    colors: z
      .array(z.string().trim().regex(HEX_COLOR, e.hexInvalid))
      .max(DRESS_CODE_MAX_COLORS),
  });

/**
 * `endTime` là **tuỳ chọn**, và đó là hợp đồng chung của cả kho mẫu: mọi
 * template render mốc giờ bằng `[startTime, endTime].filter(Boolean)`,
 * `weddingTimelineData` hạ chuỗi rỗng về `undefined`, và
 * `WeddingTimelineData.items[].endTime` khai `?`. Lịch trình cưới thật thường
 * chỉ ghi mốc bắt đầu ("17:30 Đón khách"), nên bắt buộc nhập giờ kết thúc chỉ
 * khiến người soạn bịa ra một con số không ai dùng.
 */
export const timelineItemSchema = (e: InvitationErrors) =>
  z.object({
    startTime: requiredText(e.required),
    endTime: optionalText,
    activity: requiredText(e.required),
    /** Tuỳ chọn: thiệp tạo trước khi có trường này không mang nó. */
    kind: z.enum(TIMELINE_ACTIVITY_KINDS).nullable().optional(),
  });

/**
 * Một lời chúc trong sổ lưu bút. Đây là dữ liệu **khách** gửi lên chứ không
 * phải nội dung cặp đôi soạn, nên trong form của chủ thiệp nó chỉ đọc và duyệt
 * — không có field nào sửa được nội dung người khác viết.
 *
 * `createdAt` giữ nguyên chuỗi ISO của backend; định dạng hiển thị là việc của
 * lớp trình bày, khác nhau theo locale.
 */
export const wishSchema = z.object({
  id: z.string(),
  name: optionalText,
  message: optionalText,
  createdAt: z.string(),
  /** Chỉ lời chúc đã duyệt mới hiện trên thiệp. Backend là nơi chốt thật. */
  approved: z.boolean(),
});

/**
 * Form khách mời gửi lời chúc. Tách khỏi `wishSchema` vì hai thứ khác nhau:
 * đây là *đầu vào* cần validate, còn `wishSchema` là *bản ghi* đã có id và
 * trạng thái duyệt do backend cấp.
 */
export const wishFormSchema = (e: InvitationErrors) =>
  z.object({
    name: requiredText(e.required).max(
      WISH_MAX_NAME_LENGTH,
      fill(e.tooLong, { max: WISH_MAX_NAME_LENGTH }),
    ),
    message: requiredText(e.required).max(
      WISH_MAX_MESSAGE_LENGTH,
      fill(e.tooLong, { max: WISH_MAX_MESSAGE_LENGTH }),
    ),
  });

export type Wish = z.infer<typeof wishSchema>;
export type WishForm = z.infer<ReturnType<typeof wishFormSchema>>;

/**
 * Tài khoản nhận mừng cưới. **Khoá là `bankBin`, không phải tên ngân hàng**:
 * payload VietQR định danh ngân hàng bằng BIN 6 số của NAPAS, nên chuỗi
 * "Vietcombank" người dùng tự gõ không sinh được QR (xem `constants/banks.ts`).
 * Tên hiển thị suy ra từ BIN lúc render.
 *
 * Chỉ kiểm **định dạng**, không kiểm BIN có trong bảng: bảng ngân hàng là ảnh
 * chụp một thời điểm, ngân hàng sáp nhập hay đổi mã thì thiệp cũ vẫn phải lưu
 * được. Select trong editor mới là nơi giới hạn giá trị hợp lệ.
 *
 * `accountName` **không đi vào QR** — app ngân hàng tự tra tên chủ tài khoản từ
 * BIN + số tài khoản. Nó chỉ hiện cạnh mã để khách đối chiếu trước khi chuyển,
 * vì sinh QR offline không xác minh được số tài khoản có thật hay không.
 */
export const bankAccountSchema = (e: InvitationErrors) =>
  z.object({
    bankBin: optionalText.refine(
      (value) => value === "" || BANK_BIN_PATTERN.test(value),
      e.bankBinInvalid,
    ),
    accountNumber: optionalText
      .max(
        BANK_ACCOUNT_MAX_LENGTH,
        fill(e.tooLong, { max: BANK_ACCOUNT_MAX_LENGTH }),
      )
      .refine(
        (value) => value === "" || BANK_ACCOUNT_PATTERN.test(value),
        e.accountNumberInvalid,
      ),
    accountName: optionalText.max(
      BANK_ACCOUNT_NAME_MAX_LENGTH,
      fill(e.tooLong, { max: BANK_ACCOUNT_NAME_MAX_LENGTH }),
    ),
  });

/** Bật/tắt hiển thị từng block trên thiệp. */
export const blockVisibilitySchema = z.object(
  Object.fromEntries(
    INVITATION_BLOCKS.map((block) => [block, z.boolean()]),
  ) as Record<(typeof INVITATION_BLOCKS)[number], z.ZodBoolean>,
);

/** Tiệc cưới (`reception`). */
const receptionSchema = (e: InvitationErrors) =>
  z.object({
    date: optionalText,
    welcomeTime: optionalText,
    startTime: optionalText,
    venueAddress: optionalText,
    /**
     * Nhãn đứng trên tên nơi tổ chức ("Lễ thành hôn được cử hành tại"). Trống
     * thì dùng chữ mặc định của dictionary. Optional vì thiệp lưu trước khi có
     * trường này được nạp thẳng vào form, không trộn với nội dung rỗng.
     */
    venueLabel: optionalText.optional(),
    venuePlace: placeRefSchema,
    mapUrl: z.union([z.literal(""), z.string().url(e.urlInvalid)]),
  });

/**
 * Ô danh sách khách mời: mỗi dòng một khách. Giữ nguyên văn ô nhập nên không
 * `trim` cả chuỗi, kẻo dòng trống người dùng vừa Enter xuống bị nuốt ngay lúc
 * gõ. Trần số khách tính riêng cho từng ô — mỗi nhà một danh sách.
 */
const guestListSchema = (e: InvitationErrors) =>
  z.string().superRefine((value, ctx) => {
    const names = parseGuestNames(value);
    if (names.length > GUEST_LIST_MAX_GUESTS) {
      ctx.addIssue({
        code: "custom",
        message: fill(e.guestListTooLong, { max: GUEST_LIST_MAX_GUESTS }),
      });
    }
    if (names.some((name) => name.length > GUEST_NAME_MAX_LENGTH)) {
      ctx.addIssue({
        code: "custom",
        message: fill(e.guestNameTooLong, { max: GUEST_NAME_MAX_LENGTH }),
      });
    }
  });

/**
 * Khối "Thông tin chính" của các loại thiệp khác thiệp cưới — người được mừng,
 * tên sự kiện, người nhận lời chúc… Mỗi loại chỉ dùng vài trường
 * (`KIND_OCCASION_FIELDS`); phần còn lại để rỗng. Bản đối chiếu: `OccasionDto`.
 */
const occasionText = (field: keyof typeof OCCASION_FIELD_MAX_LENGTH, e: InvitationErrors) =>
  optionalText.max(
    OCCASION_FIELD_MAX_LENGTH[field],
    fill(e.tooLong, { max: OCCASION_FIELD_MAX_LENGTH[field] }),
  );

const occasionSchema = (e: InvitationErrors) =>
  z.object({
    name: occasionText("name", e),
    nickname: occasionText("nickname", e),
    age: occasionText("age", e),
    school: occasionText("school", e),
    major: occasionText("major", e),
    classOf: occasionText("classOf", e),
    organizer: occasionText("organizer", e),
    years: occasionText("years", e),
    sender: occasionText("sender", e),
    greetingOccasion: z.enum(GREETING_OCCASIONS),
    message: occasionText("message", e),
  });

/**
 * Giá trị mặc định luôn được truyền tường minh (xem `emptyInvitationContent`),
 * nên schema không dùng `.default()` — nhờ vậy kiểu input và output trùng nhau
 * và dùng trực tiếp được với React Hook Form.
 *
 * Phần **bắt buộc theo loại** nằm ở `superRefine` cuối: thiệp cưới cần tên cô
 * dâu chú rể và ít nhất một nghi lễ (y như trước khi có loại), các loại khác
 * cần `occasion.name`. Backend kiểm lại cùng luật lúc lưu.
 */
export function invitationContentSchema(e: InvitationErrors) {
  return invitationContentShape(e).superRefine((content, ctx) => {
    if (invitationKindOf(content) === "wedding") {
      for (const field of ["groomFullName", "brideFullName"] as const) {
        if (!content.couple[field]) {
          ctx.addIssue({
            code: "custom",
            path: ["couple", field],
            message: e.required,
          });
        }
      }
      if (content.ceremonies.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["ceremonies"],
          message: e.ceremonyRequired,
        });
      }
      return;
    }
    if (!content.occasion?.name) {
      ctx.addIssue({
        code: "custom",
        path: ["occasion", "name"],
        message: e.required,
      });
    }
  });
}

function invitationContentShape(e: InvitationErrors) {
  return z.object({
    /** Loại thiệp — thiếu là thiệp cưới (thiệp lưu trước khi có loại). */
    kind: z.enum(INVITATION_KINDS).optional(),
    /** Thông tin chính của các loại khác thiệp cưới. */
    occasion: occasionSchema(e).optional(),
    envelope: z.object({
      greeting: optionalText,
      invitation: optionalText,
    }),
    couple: z.object({
      /** Bắt buộc với thiệp cưới — xem `superRefine` ở `invitationContentSchema`. */
      groomFullName: optionalText,
      brideFullName: optionalText,
      /** Bỏ trống thì tên gọi thân mật được trích từ họ tên đầy đủ. */
      groomNickname: optionalText,
      brideNickname: optionalText,
      groomChildOrder: optionalText,
      brideChildOrder: optionalText,
    }),
    families: z.object({
      groomFather: optionalText,
      groomMother: optionalText,
      brideFather: optionalText,
      brideMother: optionalText,
      groomAddress: optionalText,
      brideAddress: optionalText,
    }),
    /** Thiệp cưới cần ít nhất một nghi lễ; loại khác để `[]`. */
    ceremonies: z.array(ceremonySchema(e)),
    reception: receptionSchema(e),
    dressCode: dressCodeSchema(e),
    timeline: z.object({
      title: optionalText,
      items: z.array(timelineItemSchema(e)),
      autoTranslate: z.boolean(),
    }),
    countdown: z.object({
      weddingDate: optionalText,
      googleCalendar: z.boolean(),
      appleCalendar: z.boolean(),
    }),
    /** Chuyện tình của cặp đôi — đoạn văn tự do, đứng ngay trước album. */
    story: z.object({
      message: optionalText,
    }),
    /**
     * Ảnh trong thiết kế, khoá theo `slotKey` chứ không theo thứ tự. Đây là
     * loại ảnh do **mẫu** quy định; giữ dạng map để đổi mẫu thì ảnh nào có ô
     * tương ứng vẫn nằm đúng chỗ, và ảnh của ô mà mẫu mới không có thì được
     * giữ lại chứ không xoá — đổi mẫu không được làm mất nội dung
     * (`docs/business-model.md` mục 4).
     */
    photos: z.record(z.string(), z.string()),
    /** Optional: thiệp cũ giữ Open Graph Keemori cho tới khi chủ thiệp chọn. */
    sharePreview: z
      .object({
        mode: z.enum(["auto", "photo", "brand"]),
        photoUrl: z.string().max(2048),
        positionY: z.number().int().min(0).max(100),
        sourceUrl: z.string().max(2048).optional(),
        imageUrl: z.string().max(2048).optional(),
      })
      .optional(),
    album: z.object({
      /**
       * Ảnh album — loại ảnh thứ hai, có trong mọi thiệp. Trần thật
       * (`ALBUM_PHOTO_CAP`) do backend kiểm tra.
       */
      photos: z.array(z.string()),
    }),
    giftBox: z.object({
      groom: bankAccountSchema(e),
      bride: bankAccountSchema(e),
    }),
    /**
     * Sổ lưu bút. Danh sách này do khách viết, chủ thiệp chỉ duyệt hoặc xoá —
     * xem `wishSchema`. Nằm trong content vì nó là một block bật/tắt được như
     * mọi block khác; phần dữ liệu thật sẽ do backend trả về.
     */
    wishes: z.object({
      items: z.array(wishSchema),
    }),
    music: z.object({
      trackId: optionalText,
    }),
    thankYou: z.object({
      message: optionalText,
    }),
    /**
     * Link mời riêng cho từng khách. Không phải block trong `visibility`: nó
     * không vẽ section nào, chỉ đổi lời chào màn mở đầu.
     */
    guestInvite: z.object({
      enabled: z.boolean(),
      guestList: guestListSchema(e),
    }),
    visibility: blockVisibilitySchema,
  });
}

export type Occasion = NonNullable<InvitationContent["occasion"]>;
export type InvitationContent = z.infer<
  ReturnType<typeof invitationContentSchema>
>;
export type Reception = InvitationContent["reception"];
export type Ceremony = InvitationContent["ceremonies"][number];
export type DressCode = InvitationContent["dressCode"];
export type TimelineItem = InvitationContent["timeline"]["items"][number];
export type BlockVisibility = InvitationContent["visibility"];
