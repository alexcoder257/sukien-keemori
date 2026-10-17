import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thân bài blog đổi từ danh sách khối `{ heading, paragraphs[] }` sang **tài
 * liệu ProseMirror** — định dạng của trình soạn thảo Tiptap trong CMS. Lý do:
 * bố cục cũ chỉ diễn đạt được "một tiêu đề phụ và mấy đoạn văn", không có chỗ
 * cho ảnh giữa bài, video nhúng, danh sách hay chữ đậm/nghiêng/link.
 *
 * Kiểu cột không đổi (vẫn `jsonb`), nên migration này **chỉ nắn dữ liệu**.
 * Chuyển đổi viết bằng TypeScript chứ không bằng SQL: cây node lồng nhau dựng
 * bằng `jsonb_build_object` sẽ dài và không đọc được, mà số bài viết ở đây đếm
 * trên đầu ngón tay.
 */

type LegacySection = { heading: string; paragraphs: string[] };
type Node = Record<string, unknown>;

/** Một đoạn chữ thuần — dữ liệu cũ không có định dạng nội dòng nào để giữ. */
function paragraph(text: string): Node {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function sectionsToDoc(sections: LegacySection[]): Node {
  const content: Node[] = [];
  for (const section of sections) {
    // Tiêu đề rỗng thì bỏ hẳn thẻ heading: một `h2` trống sẽ để lại khoảng
    // trắng lạ giữa bài mà biên tập không hiểu từ đâu ra.
    if (section.heading?.trim()) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: section.heading }],
      });
    }
    for (const text of section.paragraphs ?? []) {
      if (text?.trim()) content.push(paragraph(text));
    }
  }
  // `IsBlogDoc` đòi tài liệu có ít nhất một node; bài rỗng vẫn phải mở được
  // trong CMS để biên tập sửa, nên bù một đoạn trống thay vì để mảng rỗng.
  return {
    type: 'doc',
    content: content.length ? content : [{ type: 'paragraph' }],
  };
}

/**
 * Chiều ngược lại **có mất mát và không tránh được**: bố cục cũ không biểu diễn
 * nổi ảnh, video hay danh sách. Chúng bị bỏ, chữ thì gộp về các đoạn văn — nên
 * `down` ở đây là đường thoát để rollback schema, không phải một phép biến đổi
 * hai chiều.
 */
function docToSections(doc: Node): LegacySection[] {
  const nodes = Array.isArray(doc?.content) ? (doc.content as Node[]) : [];
  const sections: LegacySection[] = [];
  let current: LegacySection | null = null;

  const textOf = (node: Node): string =>
    Array.isArray(node.content)
      ? (node.content as Node[])
          .map((child) =>
            typeof child.text === 'string' ? child.text : textOf(child),
          )
          .join('')
      : '';

  for (const node of nodes) {
    if (node.type === 'heading') {
      current = { heading: textOf(node), paragraphs: [] };
      sections.push(current);
      continue;
    }
    const text = textOf(node).trim();
    if (!text) continue;
    if (!current) {
      current = { heading: '', paragraphs: [] };
      sections.push(current);
    }
    current.paragraphs.push(text);
  }

  // Bố cục cũ bắt mỗi khối có ít nhất một đoạn văn (`ArrayMinSize(1)` của DTO
  // cũ), nên khối chỉ có tiêu đề phải tự bù chính tiêu đề đó làm đoạn văn.
  return sections
    .filter((section) => section.heading || section.paragraphs.length)
    .map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs.length
        ? section.paragraphs
        : [section.heading],
    }));
}

export class AddBlogRichText1787900000000 implements MigrationInterface {
  name = 'AddBlogRichText1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const posts = (await queryRunner.query(
      `SELECT id, body FROM blog_posts`,
    )) as { id: string; body: unknown }[];
    for (const post of posts) {
      // Chạy lại migration trên cơ sở dữ liệu đã chuyển thì bỏ qua: `body` đã
      // là tài liệu chứ không còn là mảng khối.
      if (!Array.isArray(post.body)) continue;
      await queryRunner.query(`UPDATE blog_posts SET body = $1 WHERE id = $2`, [
        JSON.stringify(sectionsToDoc(post.body as LegacySection[])),
        post.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const posts = (await queryRunner.query(
      `SELECT id, body FROM blog_posts`,
    )) as { id: string; body: Node }[];
    for (const post of posts) {
      if (Array.isArray(post.body)) continue;
      await queryRunner.query(`UPDATE blog_posts SET body = $1 WHERE id = $2`, [
        JSON.stringify(docToSections(post.body)),
        post.id,
      ]);
    }
  }
}
