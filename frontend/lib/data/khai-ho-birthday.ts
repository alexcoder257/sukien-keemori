import type { InvitationContent } from "@/lib/schemas/invitation";

/**
 * Thiệp sinh nhật Khải Hồ — thiệp custom đầu tiên, và là nội dung mà mẫu
 * Burgundy (`burgundy-birthday`) được dựng ra từ đó. Giờ nó là **nội dung trưng
 * bày** của mẫu (trang demo, iframe `xem-thu`). Thiệp thật của khách là một
 * hàng `wedding_cards` sửa bằng editor; link cũ `/t/khai-ho` chuyển hướng sang
 * đó qua `card_slug_aliases`.
 *
 * Chỉ ghi đè những gì thiệp thật có; phần còn lại giữ của nội dung nền.
 */
export function withKhaiHoBirthday(base: InvitationContent): InvitationContent {
  return {
    ...base,
    kind: "birthday",
    occasion: {
      ...base.occasion!,
      name: "Khải Hồ",
      nickname: "",
      age: "",
      organizer: "",
    },
    // Rỗng để mẫu dùng lời chào và lời mời mặc định của chính nó.
    envelope: { greeting: "", invitation: "" },
    photos: {
      cover: "/images/templates/burgundy-birthday/photos/chan-dung-sinh-nhat.jpg",
    },
    reception: {
      date: "02/11/2026",
      welcomeTime: "",
      startTime: "17:00",
      venueAddress: "Nhà hàng Century, 170 Wuu, Pleiku, Gia Lai",
      venueLabel: "",
      venuePlace: null,
      mapUrl: "",
    },
    countdown: {
      weddingDate: "2026-11-02T17:00:00+07:00",
      googleCalendar: true,
      appleCalendar: true,
    },
    // Mỗi dòng `Nhãn: màu · màu` là một cột của khối dress code; mỗi tên màu
    // khác nhau lấy một ô trong `colors` theo thứ tự xuất hiện đầu tiên (đỏ
    // rượu, rồi đen) — xem `dressGroups` của mẫu.
    dressCode: {
      title: "Dress code",
      description: "Nữ: Đỏ rượu\nNam: Đen · Đỏ rượu",
      colors: ["#7b1c2c", "#121010"],
    },
    // Mẫu Burgundy in lời cảm ơn ở cột "Tiệc sinh nhật".
    thankYou: {
      message:
        "Rất hân hạnh được đón tiếp và cùng nhau tạo nên một buổi tiệc thật ý nghĩa.",
    },
    music: { trackId: "how-deep-is-your-love" },
    visibility: {
      ...base.visibility,
      // Màn giấy gấp cổng của Đỏ Burgundy mở đầu thiệp.
      envelope: true,
      reception: true,
      countdown: false,
      dressCode: true,
      thankYou: true,
      music: true,
      // Thiết kế thật chỉ có một màn: không đếm ngược, lịch trình, lời nhắn
      // hay hộp quà.
      timeline: false,
      story: false,
      giftBox: false,
    },
  };
}
