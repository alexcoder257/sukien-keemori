import { BaseEntity } from '@configuration/base-entity/base.entity';
import { Column, Entity } from 'typeorm';

/**
 * Câu hỏi thường gặp.
 *
 * FAQ **là text giao diện** — nó trả lời về sản phẩm nên phải dịch, trước đây nằm trong
 * `dictionaries.home.faq`. Vì vậy mỗi bản ghi mang cả hai ngôn ngữ thay vì một,
 * và API chọn cột theo `?locale=`.
 *
 * Lý do chuyển khỏi dictionary: nội dung FAQ đổi theo **chính sách sản phẩm**
 * (chính sách, tính năng), không đổi theo đợt dịch giao diện. Để trong dictionary
 * thì mỗi lần đổi chính sách phải sửa file và deploy lại frontend — và thực tế
 * nó đã lệch so với chính sách thật.
 */
@Entity('faqs')
export class Faq extends BaseEntity {
  @Column({ name: 'question_vi', type: 'varchar', length: 500 })
  questionVi: string;

  @Column({ name: 'answer_vi', type: 'text' })
  answerVi: string;

  @Column({ name: 'question_en', type: 'varchar', length: 500 })
  questionEn: string;

  @Column({ name: 'answer_en', type: 'text' })
  answerEn: string;

  /** Thứ tự hiển thị; nhỏ hơn đứng trước. */
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;
}
