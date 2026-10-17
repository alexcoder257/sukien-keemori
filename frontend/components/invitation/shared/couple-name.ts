import type { InvitationContent } from "@/lib/schemas/invitation";

type Couple = InvitationContent["couple"];

/**
 * Tên gọi thân mật dùng trên phong bì, hero và các mục nhỏ. Ưu tiên tên người
 * dùng tự nhập; bỏ trống thì trích tự động từ họ tên đầy đủ (từ cuối cùng).
 * `stacked` dành cho phần trình bày của mẫu; chuỗi dữ liệu như metadata, lịch
 * và tiêu đề trong editor giữ mặc định `inline`.
 */
export function shortName(fullName: string, nickname = ""): string {
  const custom = nickname.trim();
  if (custom) return custom;

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : "";
}

/**
 * Khoảng trắng BÊN TRONG một tên đổi thành NBSP, chỉ ở dạng `stacked`.
 *
 * Dạng đó dựa vào `\n` để xuống dòng, và `invitation-opening.module.css` bật
 * `white-space: pre-line` cho bìa lẫn section đầu của **mọi** mẫu. `pre-line`
 * tôn trọng `\n` nhưng vẫn cho ngắt thêm ở khoảng trắng thường, nên một biệt
 * danh hai chữ ("Thành Tùng") bị bẻ làm đôi ở khung hẹp và tấm thiệp đọc ra
 * như bốn cái tên. NBSP không phải chỗ ngắt, nên nó khoá đúng phần cần khoá mà
 * không đụng tới `\n`.
 *
 * Vá ở chuỗi chứ không ở CSS vì hai lẽ: `white-space: pre` phải thắng được một
 * selector dùng chung cố ý đặt mạnh (mỗi mẫu một lần, 50 chỗ), và ở các section
 * phía sau — nơi white-space là `normal` — CSS đó không giúp gì trong khi NBSP
 * vẫn giữ tên nguyên vẹn.
 *
 * Chỉ `stacked`: dạng `inline` đi vào metadata, lịch và tiêu đề trong trình
 * chỉnh sửa, tức chuỗi dữ liệu — ở đó NBSP là ký tự lạ lọt vào dữ liệu.
 */
export function keepNameOnOneLine(name: string): string {
  return name.replace(/\s+/g, "\u00a0");
}

/**
 * Tên gọi thân mật đã khoá khoảng trắng bên trong, dành cho mẫu tự dựng bố cục
 * tên thay vì dùng chuỗi `stacked` — cùng lý do với [keepNameOnOneLine].
 */
export function displayShortName(fullName: string, nickname = ""): string {
  return keepNameOnOneLine(shortName(fullName, nickname));
}

/**
 * Chữ cái cho monogram và dấu sáp: chữ đầu của **từ cuối**, vì tên người Việt
 * đứng cuối — "Hoàng Phong" là "P", không phải "H". Tên gọi thân mật hai chữ
 * cũng theo luật đó. NFC trước khi cắt để chữ gõ bằng bộ gõ tổ hợp dấu không
 * bị tách khỏi dấu của nó.
 */
export function nameInitial(name: string): string {
  const lastWord = name.normalize("NFC").trim().split(/\s+/).at(-1) ?? "";
  return (Array.from(lastWord)[0] ?? "").toLocaleUpperCase("vi");
}

export function coupleShortNames(
  couple: Couple,
  layout: "inline" | "stacked" = "inline",
): string {
  const names = [
    shortName(couple.groomFullName, couple.groomNickname),
    shortName(couple.brideFullName, couple.brideNickname),
  ].filter(Boolean);

  if (layout === "inline") return names.join(" & ");

  return names.map(keepNameOnOneLine).join("\n&\n");
}
