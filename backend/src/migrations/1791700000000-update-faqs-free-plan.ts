import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sửa chữ FAQ theo luật gói mới (`FreePlanPermanentLink1791600000000`): Free có
 * link vĩnh viễn nhưng không có RSVP/link mời riêng, còn "3 ngày / 15 người
 * xem" chỉ là bản dùng thử của Gold/Diamond chưa thanh toán. Sáu câu trả lời
 * đang nói luật cũ — câu về RSVP còn nói hẳn là không có tính năng này.
 *
 * FAQ là nội dung **CMS làm chủ**, nên migration này cố ý hẹp:
 *
 * - `UPDATE` tại chỗ chứ không xoá rồi thêm: giữ nguyên `id`, `sort_order` và
 *   `is_published` — thứ tự và việc ẩn/hiện là quyết định admin đã bấm.
 * - Chỉ ghi đè khi câu trả lời **còn đúng nguyên chữ cũ** (so cả bản vi lẫn
 *   en). Admin đã tự sửa câu nào trong CMS thì câu đó được để yên — ghi đè là
 *   xoá mất công của người vận hành mà không ai báo.
 *
 * Chữ viết thẳng trong file, không import `seeders/data/faqs.seed.ts`: migration
 * là lát cắt đông cứng, còn file seed vẫn đang được sửa (`CLAUDE.md` mục 4).
 *
 * `down` trả về chữ cũ theo đúng điều kiện ngược lại.
 */
const FAQ_UPDATES: {
  questionVi: string;
  oldAnswerVi: string;
  oldAnswerEn: string;
  answerVi: string;
  answerEn: string;
}[] = [
  {
    questionVi: 'Tạo thiệp cưới như thế nào?',
    oldAnswerVi:
      'Ba bước: chọn một mẫu trong kho mẫu, nhập nội dung của bạn (cô dâu chú rể, nghi lễ, tiệc cưới, ảnh), rồi bấm xuất bản để nhận link và mã QR chia sẻ cho khách. Bạn tạo và xem thử miễn phí, chỉ trả tiền khi muốn link dùng vĩnh viễn.',
    oldAnswerEn:
      'Three steps: pick a template, fill in your content (couple, ceremonies, reception, photos), then publish to get a shareable link and QR code. Creating and previewing are free — you only pay to make the link permanent.',
    answerVi:
      'Ba bước: chọn một mẫu trong kho mẫu, nhập nội dung của bạn (cô dâu chú rể, nghi lễ, tiệc cưới, ảnh), rồi bấm xuất bản để nhận link và mã QR chia sẻ cho khách. Tạo và xem thử luôn miễn phí; mẫu Free dùng miễn phí mãi, còn mẫu Gold và Diamond trả tiền để link dùng vĩnh viễn.',
    answerEn:
      'Three steps: pick a template, fill in your content (couple, ceremonies, reception, photos), then publish to get a shareable link and QR code. Creating and previewing are always free; Free designs stay free for good, while Gold and Diamond designs are paid to make the link permanent.',
  },
  {
    questionVi: 'Xem thử trước khi trả tiền được không?',
    oldAnswerVi:
      'Được. Bạn tạo thiệp, nhập nội dung và xem thử đầy đủ mà không mất phí. Chỉ khi muốn link dùng vĩnh viễn và bỏ trần 15 người xem thì mới cần thanh toán.',
    oldAnswerEn:
      'Yes. Build the invitation and preview it in full for free. You only pay when you want the link to be permanent and the 15-viewer limit removed.',
    answerVi:
      'Được. Bạn tạo thiệp, nhập nội dung và xem thử đầy đủ mà không mất phí. Với mẫu Gold và Diamond, link chưa thanh toán dùng thử được 3 ngày với tối đa 15 người xem; thanh toán thì link dùng vĩnh viễn và bỏ giới hạn đó.',
    answerEn:
      'Yes. Build the invitation and preview it in full for free. On Gold and Diamond designs an unpaid link works as a 3-day trial for up to 15 viewers; paying makes it permanent and removes that limit.',
  },
  {
    questionVi: 'Thiệp miễn phí có giới hạn gì?',
    oldAnswerVi:
      'Link thiệp chưa thanh toán tồn tại 3 ngày và cho tối đa 15 người xem. Sau khi thanh toán, link dùng vĩnh viễn và bỏ giới hạn người xem.',
    oldAnswerEn:
      'An unpaid link lasts 3 days and allows up to 15 viewers. Once paid, the link is permanent and the view limit is removed.',
    answerVi:
      'Thiệp gói Free có link vĩnh viễn và không giới hạn người xem. Gói Free không có xác nhận tham dự (RSVP) và link mời riêng từng khách — hai tính năng này có từ gói Gold.',
    answerEn:
      'A Free invitation has a permanent link with no viewer limit. The Free plan does not include RSVP or personal guest links — those start from the Gold plan.',
  },
  {
    questionVi: 'Giới hạn 15 lượt xem được tính thế nào?',
    oldAnswerVi:
      'Đếm theo số người xem chứ không phải số lần tải trang. Một khách mở đi mở lại nhiều lần vẫn tính là một người. Khách đã từng xem thì luôn mở lại được, kể cả khi đã đủ 15 người.',
    oldAnswerEn:
      'By unique viewers, not page loads. Someone who opens the invitation several times still counts once, and anyone who has already viewed it can always open it again.',
    answerVi:
      'Giới hạn này chỉ áp cho thiệp Gold và Diamond chưa thanh toán. Đếm theo số người xem chứ không phải số lần tải trang. Một khách mở đi mở lại nhiều lần vẫn tính là một người. Khách đã từng xem thì luôn mở lại được, kể cả khi đã đủ 15 người.',
    answerEn:
      'It only applies to unpaid Gold and Diamond invitations, and counts unique viewers, not page loads. Someone who opens the invitation several times still counts once, and anyone who has already viewed it can always open it again.',
  },
  {
    questionVi: 'Hết 3 ngày thì thiệp thế nào?',
    oldAnswerVi:
      'Link ngừng hoạt động và khách mở ra sẽ thấy trang báo hết hạn. Nội dung thiệp vẫn còn nguyên trong tài khoản của bạn — thanh toán xong là link sống lại vĩnh viễn.',
    oldAnswerEn:
      'The link stops working and guests see an expiry page. Your content is untouched — paying brings the same link back permanently.',
    answerVi:
      'Áp cho thiệp Gold và Diamond chưa thanh toán: link ngừng hoạt động và khách mở ra sẽ thấy trang báo hết hạn. Nội dung thiệp vẫn còn nguyên trong tài khoản của bạn — thanh toán xong là link sống lại vĩnh viễn.',
    answerEn:
      'For unpaid Gold and Diamond invitations, the link stops working and guests see an expiry page. Your content is untouched — paying brings the same link back permanently.',
  },
  {
    questionVi: 'Khách có xác nhận tham dự được không?',
    oldAnswerVi:
      'Không có tính năng xác nhận tham dự. Điều duy nhất khách viết được là lời chúc trong sổ lưu bút.',
    oldAnswerEn:
      'There is no RSVP feature. The one thing a guest can write is a wish in the guestbook.',
    answerVi:
      'Được, với thiệp gói Gold và Diamond: khách báo có đi hay không và đi mấy người, chỉ bạn xem được danh sách này. Gói Free không có xác nhận tham dự; khách vẫn gửi lời chúc qua sổ lưu bút.',
    answerEn:
      'Yes, on Gold and Diamond invitations: guests say whether they are coming and how many people, and only you can see the list. The Free plan has no RSVP; guests can still leave wishes in the guestbook.',
  },
];

export class UpdateFaqsFreePlan1791700000000 implements MigrationInterface {
  name = 'UpdateFaqsFreePlan1791700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const faq of FAQ_UPDATES) {
      await queryRunner.query(
        `UPDATE "faqs"
         SET "answer_vi" = $1, "answer_en" = $2, "updated_at" = now()
         WHERE "question_vi" = $3 AND "answer_vi" = $4 AND "answer_en" = $5`,
        [
          faq.answerVi,
          faq.answerEn,
          faq.questionVi,
          faq.oldAnswerVi,
          faq.oldAnswerEn,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const faq of FAQ_UPDATES) {
      await queryRunner.query(
        `UPDATE "faqs"
         SET "answer_vi" = $1, "answer_en" = $2, "updated_at" = now()
         WHERE "question_vi" = $3 AND "answer_vi" = $4 AND "answer_en" = $5`,
        [
          faq.oldAnswerVi,
          faq.oldAnswerEn,
          faq.questionVi,
          faq.answerVi,
          faq.answerEn,
        ],
      );
    }
  }
}
