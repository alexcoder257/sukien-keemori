import {
  Cake,
  Camera,
  CarFront,
  DoorOpen,
  Heart,
  HouseHeart,
  Music2,
  UsersRound,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";
import type {
  TimelineActivityKind,
  TimelineItem,
} from "@/lib/schemas/invitation";

/**
 * Biểu tượng của một mốc lịch trình đi theo **nghĩa**, không theo vị trí.
 *
 * Người dùng chọn loại hoạt động (`TimelineItem.kind`); để trống thì đoán từ
 * chữ họ gõ. Mỗi mẫu khai một `TimelineDecorSet` bằng chính icon/ảnh decor của
 * nó, nên đổi mẫu thì hình đổi theo mà nghĩa vẫn giữ.
 *
 * Luật an toàn: loại nào mẫu **không có hình hợp nghĩa** thì dùng `neutral` —
 * một hoạ tiết không mang nghĩa hoạt động nào (đồng hồ, nhành hoa, số thứ tự).
 * Không bao giờ mượn hình của loại khác cho đủ chỗ: "Đón dâu" hiện nốt nhạc là
 * sai nội dung thiệp chứ không phải chuyện thẩm mỹ.
 */
export type TimelineActivitySource = Pick<TimelineItem, "activity" | "kind">;

export type TimelineDecorSet<T> = {
  byKind: Partial<Record<TimelineActivityKind, T>>;
  neutral: T;
};

/**
 * Thứ tự quy tắc là có chủ đích: loại cụ thể đứng trước loại chung. "Đón dâu"
 * phải bắt trước "đón khách", "Đón khách tại trung tâm **tiệc** cưới" phải ra
 * đón khách chứ không ra khai tiệc, "Tea ceremony" là lễ gia tiên chứ không phải
 * lễ thành hôn, "Tiệc tối & giao lưu" là văn nghệ.
 */
const KIND_RULES: readonly (readonly [TimelineActivityKind, RegExp])[] = [
  ["farewell", /tien khach|ket thuc|chia tay|farewell|send.?off|departure/],
  [
    "procession",
    /don dau|ruoc dau|ruoc nang|bride.*(pick.?up|procession)|(pick.?up|procession).*bride/,
  ],
  ["welcome", /don khach|chao don|check.?in|welcome|arrival/],
  ["photo", /chup|photo|portrait/],
  ["cake", /cat banh|banh cuoi|\bcake/],
  ["toast", /nang ly|nang coc|ruou|champagne|toast|cheers/],
  ["music", /nhac|van nghe|khieu vu|giao luu|music|danc/],
  [
    "ancestral",
    /gia tien|vu quy|an hoi|dam ngo|tan hon|tea ceremony|ancestral|engagement/,
  ],
  ["ceremony", /thanh hon|hon le|lam le|nghi le|trao nhan|ceremony|vows?\b/],
  ["reception", /tiec|bua an|dinner|banquet|meal|reception|lunch/],
];

/** Đoán loại từ chữ tự do; không khớp quy tắc nào thì `undefined`. */
export function inferTimelineKind(
  activity: string,
): TimelineActivityKind | undefined {
  const text = activity
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
  return KIND_RULES.find(([, pattern]) => pattern.test(text))?.[0];
}

/** Lựa chọn của người dùng thắng; "Tự động" (`null`/thiếu) thì đoán từ chữ. */
export function timelineActivityKind(
  item: TimelineActivitySource,
): TimelineActivityKind | undefined {
  return item.kind ?? inferTimelineKind(item.activity);
}

export function timelineDecorFor<T>(
  item: TimelineActivitySource,
  set: TimelineDecorSet<T>,
): T {
  const kind = timelineActivityKind(item);
  const match = kind ? set.byKind[kind] : undefined;
  return match === undefined ? set.neutral : match;
}

/**
 * Bộ icon lucide đủ mười loại. Dùng cho ô chọn trong editor, và làm nền cho
 * mẫu vẽ bằng lucide: mẫu trải bộ này rồi ghi đè những loại nó đã có hình
 * riêng. Mẫu vẽ bằng ảnh decor hoặc SVG tay **không** được trải bộ này — nét
 * lucide đứng cạnh nét vẽ tay là hai ngôn ngữ hình.
 */
export const TIMELINE_KIND_ICONS: Record<TimelineActivityKind, LucideIcon> = {
  welcome: UsersRound,
  ancestral: HouseHeart,
  procession: CarFront,
  ceremony: Heart,
  reception: UtensilsCrossed,
  toast: Wine,
  cake: Cake,
  photo: Camera,
  music: Music2,
  farewell: DoorOpen,
};
