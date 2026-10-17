import type { Faq } from '@modules/content/faq.entity';

/**
 * FAQ của trang chủ, viết theo mô hình **một gói duy nhất**: thiệp custom do
 * Keemori dựng, thanh toán chuyển khoản ngoài hệ thống trước khi bắt đầu thiết
 * kế. Không còn câu nào về gói Free/Gold/Diamond, dùng thử 3 ngày, trần 15 người
 * xem, thanh toán online, mã giảm giá hay Song Hỷ.
 *
 * Seed chỉ chạy trên database trống. Sửa chữ FAQ trên database đang có dữ liệu
 * thì đi bằng migration (hoặc nhờ biên tập viên sửa trong CMS) — mẫu:
 * `1791700000000-update-faqs-free-plan.ts`. Bản FAQ đang chạy trên production vẫn
 * mang chữ của mô hình cũ cho tới khi có người cập nhật.
 *
 * Số tiền 899.000 ₫ có **bản sao có chủ đích** ở `frontend/constants/pricing.ts`
 * (`CUSTOM_CARD_PRICE`): đổi giá thì sửa cả hai nơi.
 */
export type FaqSeed = Pick<
  Faq,
  'questionVi' | 'answerVi' | 'questionEn' | 'answerEn'
>;

export const FAQ_SEEDS: FaqSeed[] = [
  {
    questionVi: 'Tạo thiệp cưới như thế nào?',
    answerVi:
      'Bạn liên hệ Keemori và chuyển khoản gói thiệp custom trước khi bắt đầu thiết kế. Sau khi nhận tiền, đội ngũ Keemori dựng thiệp ngay trên tài khoản của bạn từ thông tin và ảnh bạn gửi (cô dâu chú rể, nghi lễ, tiệc cưới, ảnh). Bạn xem lại, yêu cầu chỉnh sửa, rồi xuất bản để nhận link và mã QR chia sẻ cho khách.',
    questionEn: 'How do I create a wedding invitation?',
    answerEn:
      'Contact Keemori and pay for the custom invitation by bank transfer before design starts. Once the payment is received, the Keemori team builds the invitation on your account from the details and photos you send (couple, ceremonies, reception, photos). You review it, ask for changes, then publish to get a shareable link and QR code.',
  },
  {
    questionVi: 'Làm một tấm thiệp mất bao lâu?',
    answerVi:
      'Thời gian phụ thuộc vào mức độ phức tạp của thiết kế và việc bạn gửi đủ thông tin, ảnh. Đội ngũ Keemori sẽ báo thời gian dự kiến khi nhận đơn. Nội dung được lưu liên tục nên có thể chỉnh sửa bất cứ lúc nào.',
    questionEn: 'How long does it take to make one?',
    answerEn:
      'It depends on how complex the design is and how quickly you send all the details and photos. The Keemori team gives you an estimate when the order is received. Your content is saved continuously, so it can be edited at any time.',
  },
  {
    questionVi: 'Xuất bản rồi còn sửa được nội dung không?',
    answerVi:
      'Sửa được bất cứ lúc nào. Thiệp cập nhật ngay trên chính link cũ, nên khách đã nhận link vẫn thấy bản mới nhất — bạn không phải gửi lại link.',
    questionEn: 'Can I edit after publishing?',
    answerEn:
      'Yes, any time. The invitation updates on the same link, so guests who already have it always see the latest version — no need to resend anything.',
  },
  {
    questionVi: 'Xem thử trước khi đặt được không?',
    answerVi:
      'Thiết kế bắt đầu sau khi bạn chuyển khoản, nên chưa có bản dựng riêng cho bạn trước đó. Bạn có thể xem trang Mẫu thiệp và các thiệp tham khảo trên website để hình dung phong cách, rồi liên hệ Keemori để trao đổi trước khi đặt.',
    questionEn: 'Can I see examples before ordering?',
    answerEn:
      'Design starts after you pay by transfer, so there is no build made for you before that. You can browse the Templates page and the reference invitations on the website to get a feel for the style, then contact Keemori to talk it through before ordering.',
  },
  {
    questionVi: 'Thiệp xem trên điện thoại có đẹp không?',
    answerVi:
      'Thiệp được thiết kế cho điện thoại trước, vì gần như toàn bộ khách mời mở link từ Zalo, Messenger hay Facebook trên máy của họ. Trên máy tính vẫn hiển thị đầy đủ.',
    questionEn: 'Does the invitation look good on phones?',
    answerEn:
      'It is designed mobile-first, since almost every guest opens the link from Zalo, Messenger or Facebook on their phone. It still displays fully on desktop.',
  },
  {
    questionVi: 'Link thiệp có hết hạn hay giới hạn người xem không?',
    answerVi:
      'Không. Link thiệp là vĩnh viễn và không giới hạn số người xem. Thiệp nào cũng có đủ tính năng: xác nhận tham dự (RSVP), link mời riêng từng khách, sổ lưu bút, album ảnh, hộp mừng cưới và nhạc nền.',
    questionEn: 'Does the link expire or limit the number of viewers?',
    answerEn:
      'No. The invitation link is permanent with no viewer limit, and every invitation has all features: RSVP, personal guest links, guestbook, photo album, gift box and background music.',
  },
  {
    questionVi: 'Tôi có thể đưa ảnh cưới lên thiệp không?',
    answerVi:
      'Có. Mẫu thiệp có sẵn các ô ảnh nằm trong thiết kế, và thiệp nào cũng có thêm album ảnh cưới. Bạn gửi ảnh cho Keemori hoặc tự tải lên khi chỉnh sửa.',
    questionEn: 'Can I put our wedding photos on the invitation?',
    answerEn:
      'Yes. Templates have built-in photo slots, and every invitation also has a wedding photo album. Send the photos to Keemori or upload them yourself when editing.',
  },
  {
    questionVi: 'Album ảnh cưới chứa được bao nhiêu ảnh?',
    answerVi:
      'Album có trần số ảnh theo chính sách, không phải vô hạn, vì thiệp là link vĩnh viễn và ảnh nào cũng tốn chi phí lưu trữ vĩnh viễn.',
    questionEn: 'How many photos fit in the album?',
    answerEn:
      'The album has a policy cap on the number of photos — it is not unlimited, because the invitation is a permanent link and every photo has a permanent storage cost.',
  },
  {
    questionVi: 'Một thiệp có ghi được nhiều nghi lễ không?',
    answerVi:
      'Có. Bạn thêm bao nhiêu nghi lễ cũng được — ăn hỏi, vu quy, thành hôn — mỗi nghi lễ có ngày giờ và địa điểm riêng.',
    questionEn: 'Can one invitation cover several ceremonies?',
    answerEn:
      "Yes. Add as many ceremonies as you need — engagement, bride's or groom's ceremony — each with its own date, time and venue.",
  },
  {
    questionVi: 'Tôi có sửa được font và màu của mẫu thiệp không?',
    answerVi:
      'Thiệp đã được thiết kế sẵn bố cục và font để đạt chất lượng đẹp và hài hòa nhất nên không thể chỉnh sửa font và bố cục. Tuy nhiên phần còn lại là ở bạn, hãy khám phá nhé.',
    questionEn: "Can I change the template's fonts and colours?",
    answerEn:
      'Each template comes with a layout and fonts designed to look their best together, so those cannot be changed. Everything else is up to you — go explore.',
  },
  {
    questionVi: 'Đổi mẫu thiệp thì nội dung đã nhập có mất không?',
    answerVi:
      'Không mất. Đổi mẫu giữ nguyên toàn bộ nội dung, kể cả ảnh mà mẫu mới không có ô để hiển thị — ảnh vẫn được giữ, chỉ là không vẽ ra.',
    questionEn: 'If I switch templates, do I lose what I typed?',
    answerEn:
      'Nothing is lost. Switching keeps all your content, including photos whose slot the new template lacks — they are kept, just not rendered.',
  },
  {
    questionVi: 'Thiệp gồm những phần nào?',
    answerVi:
      'Thiệp gồm các khối bật tắt được: phong bì mở đầu, cô dâu chú rể, gia đình, nghi lễ, tiệc cưới, dress code, timeline, đếm ngược, chuyện tình yêu, album, hộp mừng cưới, sổ lưu bút, nhạc nền và lời cảm ơn.',
    questionEn: 'What sections does an invitation have?',
    answerEn:
      'Every block can be switched on or off: envelope, couple, families, ceremonies, reception, dress code, timeline, countdown, love story, album, gift box, guestbook, background music and thank-you.',
  },
  {
    questionVi: 'Khách có xác nhận tham dự được không?',
    answerVi:
      'Được, với mọi thiệp: khách báo có đi hay không và đi mấy người, chỉ bạn xem được danh sách này. Khách cũng gửi lời chúc qua sổ lưu bút.',
    questionEn: 'Can guests RSVP?',
    answerEn:
      'Yes, on every invitation: guests say whether they are coming and how many people, and only you can see the list. Guests can also leave wishes in the guestbook.',
  },
  {
    questionVi: 'Lời chúc của khách hiện lên thiệp ngay à?',
    answerVi:
      'Không. Mọi lời chúc đều ở trạng thái chờ duyệt và chỉ hiện trên thiệp sau khi cặp đôi duyệt. Cặp đôi cũng xoá được bất kỳ lời chúc nào.',
    questionEn: "Do guests' wishes appear immediately?",
    answerEn:
      'No. Every wish arrives pending and only appears once the couple approves it. The couple can also delete any wish.',
  },
  {
    questionVi: 'Duyệt lời chúc ở đâu?',
    answerVi:
      'Trong trình soạn thiệp, hoặc ở trang lời chúc của thiệp trong mục thiệp của tôi.',
    questionEn: 'Where do I approve wishes?',
    answerEn:
      'In the editor, or on the wishes page of the invitation under My invitations.',
  },
  {
    questionVi: 'Tôi đổi được đường dẫn thiệp không?',
    answerVi:
      'Không. Đường dẫn do hệ thống tạo ở lần xuất bản đầu tiên và không đổi, nên link bạn đã gửi cho khách luôn mở được — kể cả link cũ của những thiệp từng đổi đường dẫn trước đây.',
    questionEn: 'Can I change the invitation link?',
    answerEn:
      'No. The link is generated by the system on first publish and never changes, so a link you have shared with guests always opens — including old links of invitations that once had their link changed.',
  },
  {
    questionVi: 'Đường dẫn thiệp được tạo lúc nào?',
    answerVi:
      'Lúc xuất bản lần đầu, dựa trên tên cô dâu chú rể cộng một hậu tố ngẫu nhiên để người lạ không đoán được link.',
    questionEn: 'When is the invitation link created?',
    answerEn:
      "On first publish, from the couple's names plus a random suffix so strangers cannot guess the link.",
  },
  {
    questionVi: 'Có hộp mừng cưới trên thiệp không?',
    answerVi:
      'Có. Khối hộp mừng cưới cho phép hiện mã QR và thông tin tài khoản ngân hàng để khách mừng cưới trực tuyến.',
    questionEn: 'Is there an online gift box?',
    answerEn:
      'Yes. The gift box block shows a QR code and bank account details so guests can send their gift online.',
  },
  {
    questionVi: 'Thanh toán bằng cách nào?',
    answerVi:
      'Bằng chuyển khoản ngân hàng trực tiếp tới tài khoản của Keemori (thông tin ghi ở trang Thông tin doanh nghiệp), trước khi bắt đầu thiết kế. Website không có bước thanh toán trực tuyến.',
    questionEn: 'How do I pay?',
    answerEn:
      "By bank transfer straight to Keemori's account (details are on the Business information page), before design starts. The website has no online checkout.",
  },
  {
    questionVi: 'Chuyển khoản xong bao lâu thì thiết kế bắt đầu?',
    answerVi:
      'Sau khi Keemori xác nhận đã nhận tiền, đội ngũ sẽ bắt đầu dựng thiệp trên tài khoản của bạn và báo lại cho bạn.',
    questionEn: 'How soon does design start after I pay?',
    answerEn:
      'Once Keemori confirms the payment has arrived, the team starts building the invitation on your account and lets you know.',
  },
  {
    questionVi: 'Tôi chuyển khoản sai nội dung thì sao?',
    answerVi:
      'Bạn liên hệ Keemori kèm biên lai chuyển khoản để được đối soát thủ công.',
    questionEn: 'What if I put the wrong transfer reference?',
    answerEn:
      'Contact Keemori with your transfer receipt and we will reconcile it manually.',
  },
  {
    questionVi: 'Sau khi xuất bản có đổi được tên cô dâu chú rể không?',
    answerVi:
      'Bạn đổi được trong 15 ngày kể từ lần xuất bản đầu tiên. Sau đó tên cô dâu chú rể bị khoá, mọi nội dung khác vẫn sửa tự do. Cần đổi tên sau mốc này thì liên hệ Keemori để được hỗ trợ.',
    questionEn: 'Can I change the couple names after publishing?',
    answerEn:
      'You can change them within 15 days of the first publish. After that the couple names are locked while everything else stays editable. If you need a change later, contact Keemori for help.',
  },
  {
    questionVi: 'Đăng nhập bằng Google hay Facebook được không?',
    answerVi:
      'Được. Nếu trùng email thì vẫn là cùng một tài khoản. Riêng tài khoản Facebook đăng ký bằng số điện thoại và không có email thì không đăng nhập được.',
    questionEn: 'Can I sign in with Google or Facebook?',
    answerEn:
      'Yes. Accounts sharing an email are treated as one. A Facebook account registered with a phone number and no email cannot be used to sign in.',
  },
  {
    questionVi: 'Tôi quên mật khẩu thì làm sao?',
    answerVi:
      'Dùng chức năng quên mật khẩu ở trang đăng nhập; hệ thống gửi email đặt lại mật khẩu cho bạn.',
    questionEn: 'I forgot my password — what now?',
    answerEn:
      'Use the forgot-password link on the sign-in page and we will email you a reset link.',
  },
  {
    questionVi: 'Xoá tài khoản thì dữ liệu thế nào?',
    answerVi:
      'Bạn tự xoá tài khoản thì dữ liệu bị xoá thật và email được giải phóng để đăng ký lại sau này.',
    questionEn: 'What happens to my data if I delete my account?',
    answerEn:
      'Deleting your own account really deletes the data, and the email is freed up so you can register again later.',
  },
  {
    questionVi: 'Thiệp giá bao nhiêu?',
    answerVi:
      'Thiệp custom có một mức giá duy nhất là 899.000 ₫, trả một lần qua chuyển khoản, không có phí hàng tháng.',
    questionEn: 'How much does an invitation cost?',
    answerEn:
      'The custom invitation has a single price of 899,000 ₫, paid once by bank transfer, with no monthly fee.',
  },
];
