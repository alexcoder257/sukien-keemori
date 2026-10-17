/**
 * Một đoạn trong thân văn bản pháp lý: đoạn văn, hoặc một danh sách gạch đầu
 * dòng đã gộp.
 */
export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] };

const BULLET = "- ";

/**
 * Gom các dòng liền nhau cùng loại thành khối: đoạn văn ra `<p>`, gạch đầu
 * dòng ra một `<ul>` duy nhất.
 *
 * Đánh dấu gạch đầu dòng bằng tiền tố `- ` ngay trong chuỗi thay vì thêm một
 * khoá `list` riêng vì dictionary là JSON và người dịch làm việc trực tiếp
 * trên nó — một mảng chuỗi phẳng giữ cho hai bản `vi`/`en` không bao giờ lệch
 * cấu trúc.
 *
 * Gộp ở đây chứ không ở lúc render vì một danh sách bị cắt thành nhiều `<ul>`
 * sẽ được trình đọc màn hình đọc thành nhiều danh sách một phần tử.
 *
 * File riêng vì cả trang pháp lý (Server Component) lẫn hộp chấp thuận lúc
 * đăng ký (Client Component) đều dùng.
 */
export function toLegalBlocks(body: string[]): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  for (const line of body) {
    if (line.startsWith(BULLET)) {
      const item = line.slice(BULLET.length);
      const last = blocks.at(-1);
      if (last?.kind === "ul") last.items.push(item);
      else blocks.push({ kind: "ul", items: [item] });
    } else {
      blocks.push({ kind: "p", text: line });
    }
  }
  return blocks;
}
