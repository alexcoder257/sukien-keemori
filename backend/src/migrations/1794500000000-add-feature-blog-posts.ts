import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đợt bài blog SEO đầu tiên: 13 bài nhắm cụm "thiệp cưới online" —
 * bài trụ cột, cách gửi/ghi thiệp, các tính năng (link mời riêng, xác nhận tham
 * dự, Song Hỷ, mã QR mừng cưới) và các bộ sưu tập mẫu dựng từ chữ giới thiệu
 * của kho mẫu. Trang chủ trỏ vào sáu bài trong số này (`components/home/features.tsx`).
 *
 * Bài blog là nội dung **CMS làm chủ**, nên migration này chỉ **thêm**:
 * `ON CONFLICT ("slug") DO NOTHING` — chạy lại hay chạy trên một database đã có
 * bài cùng slug thì không ghi đè gì cả. Từ lúc chèn xong, sửa bài là việc của
 * CMS. Chỉ có bản tiếng Việt; ba cột `_en` để `NULL` (bài chưa dịch, đúng
 * CHECK `CHK_blog_posts_english_complete`).
 *
 * Thân bài viết bằng Markdown cho dễ đọc và dễ duyệt, rồi đổi sang tài liệu
 * ProseMirror ngay trong file (`markdownToDoc`). Bộ đổi nằm **trong** migration
 * chứ không ở `common/`: migration là lát cắt đông cứng, sửa một helper dùng
 * chung về sau không được làm nghĩa của nó đổi theo. Nó chỉ sinh đúng các node
 * mà `IsBlogDoc` cho phép: heading 2/3, đoạn văn, danh sách, trích dẫn, ảnh nội
 * bộ, đường kẻ, xuống dòng và ba mark bold/italic/link.
 *
 * Ảnh bìa và ảnh minh hoạ nằm trong repo ở `frontend/public/images/site/blog/`
 * (JPEG: crawler Facebook/Zalo không đọc AVIF), dựng từ poster thật của mẫu.
 *
 * `created_at` lùi dần theo thứ tự trong mảng để bài đứng đầu mảng là bài mới
 * nhất khi cùng ngày xuất bản — danh sách công khai sắp theo
 * `published_at`, rồi `created_at`.
 *
 * `down` chỉ xoá bài **chưa ai sửa** trong CMS (`updated_at = created_at`).
 */
const PUBLISHED_AT = '2026-10-11';
const AUTHOR = 'Ban biên tập';

type PostSeed = {
  slug: string;
  category: 'guide' | 'experience' | 'trend';
  title: string;
  excerpt: string;
  readingMinutes: number;
  markdown: string;
};

const POSTS: PostSeed[] = [
  {
    slug: 'thiep-cuoi-online-la-gi',
    category: 'guide',
    title: 'Thiệp cưới online là gì? Ưu nhược điểm so với thiệp giấy',
    excerpt:
      'Thiệp cưới online là gì, gồm những phần nào, khác thiệp giấy ra sao, nhược điểm cần lường trước và cách kết hợp với thiệp giấy. Kèm cách tạo thiệp trong 3 bước.',
    readingMinutes: 9,
    markdown: `
Thiệp cưới online là gì? Đó là thiệp mời cưới dưới dạng một trang web nhỏ: hai bạn gửi cho khách một đường link hoặc mã QR, khách bấm vào là xem ngay trên điện thoại tên cô dâu chú rể, ngày giờ, địa điểm kèm bản đồ chỉ đường, ảnh cưới và nhạc nền. Nhiều người gọi nó là thiệp cưới điện tử. So với thiệp giấy, thiệp online gửi qua Zalo hay Messenger chỉ mất vài giây, sửa được cả sau khi đã gửi, và khách có thể gửi lời chúc ngay trên thiệp.

Dưới đây là một tấm thiệp online gồm những gì, nó hơn và kém thiệp giấy ở đâu, và cách kết hợp hai loại cho hợp với gia đình.

## Thiệp cưới online là gì và gồm những phần nào?

Cứ hình dung một tấm thiệp giấy được trải ra thành một trang dài, cuộn trên điện thoại, có thêm những thứ giấy không làm được. Một tấm thiệp đầy đủ thường gồm các khối dưới đây, và hai bạn bật hay tắt từng khối tuỳ nhu cầu:

- **Màn mở thiệp**: thường là một chiếc phong bì, khách mở ra mới vào thiệp, giống cảm giác bóc thiệp giấy.
- **Cô dâu chú rể và gia đình hai họ**: họ tên, tên bố mẹ, địa chỉ hai nhà, đúng những gì thiệp truyền thống vẫn ghi.
- **Nghi lễ**: lễ ăn hỏi, lễ vu quy, lễ thành hôn… Mỗi lễ có giờ, ngày, địa điểm riêng và nút chỉ đường.
- **Tiệc cưới**: địa chỉ nơi đãi tiệc kèm bản đồ và nút mở Google Maps.
- **Lịch trình ngày cưới**: các mốc như đón khách, làm lễ, khai tiệc.
- **Dress code**: gợi ý màu trang phục cho khách.
- **Đếm ngược và nút "Thêm vào lịch"**: khách lưu ngày cưới vào lịch của mình chỉ với một lần chạm.
- **Câu chuyện tình yêu và album ảnh cưới.**
- **Hộp mừng cưới**: mã QR chuyển khoản cho khách ở xa hoặc không tiện gửi phong bì.
- **Sổ lưu bút**: khách viết lời chúc, hai bạn duyệt rồi lời chúc mới hiện lên thiệp.
- **Xác nhận tham dự**: khách báo có đi hay không, đi mấy người.
- **Nhạc nền và lời cảm ơn.**

![Ba khối trong cùng một tấm thiệp cưới online mẫu Nắng Xanh: tiệc cưới kèm bản đồ, sổ lưu bút và xác nhận tham dự](/images/site/blog/thiep-cuoi-online-la-gi/khoi-tiec-cuoi-so-luu-but-xac-nhan.jpg)

Không phải đám cưới nào cũng cần đủ chừng ấy khối: đám cưới nhỏ ở quê có khi chỉ cần lễ, tiệc và bản đồ. Bố cục, phông chữ, màu sắc thường đã được thiết kế sẵn theo từng mẫu, hai bạn chỉ việc điền nội dung.

## Thiệp cưới online và thiệp giấy khác nhau ở đâu

### Thời gian chuẩn bị và gửi

Thiệp giấy phải qua nhiều khâu: chốt mẫu, đặt in, chờ nhận, ngồi ghi tên từng khách rồi chia nhau đi đưa. Riêng khâu đi đưa có khi ngốn mấy buổi tối và vài ngày cuối tuần. Thiệp online soạn xong là có link để gửi ngay.

### Chi phí in và đi đưa

Chi phí thiệp giấy tăng theo số khách, chưa kể xăng xe và công đi lại. Với thiệp online, mời thêm người gần như không làm tăng chi phí. Nhiều nơi cho tạo và xem thử miễn phí, chỉ tính phí với mẫu có ảnh cưới hoặc tính năng nâng cao; ở Keemori, quyền lợi từng gói nằm trong [bảng giá](/vi/bang-gia).

### Sửa thông tin sau khi đã gửi

Đây là khác biệt lớn nhất. Thiệp giấy in sai giờ, đổi nhà hàng, lùi ngày vì việc gia đình thì chỉ còn cách in lại hoặc gọi đính chính từng người. Thiệp online chỉ cần mở trình chỉnh sửa, sửa rồi lưu: khách mở lại đúng đường link cũ là thấy thông tin mới.

### Bản đồ và chỉ đường

Thiệp giấy ghi địa chỉ, khách tự tra đường. Thiệp online gắn sẵn bản đồ và nút mở Google Maps, nên người ở xa, người không rành đường hay người đi taxi đều tới đúng chỗ. Đám cưới tổ chức tại nhà trong ngõ nhỏ hoặc ở quê càng cần chi tiết này.

### Đếm ngược và nhắc lịch

Thiệp giấy dễ bị cất vào ngăn kéo rồi quên. Thiệp online có đồng hồ đếm ngược và nút thêm ngày cưới vào lịch, khách tự đặt lời nhắc mà hai bạn không phải nhắn từng người.

### Lời chúc và xác nhận tham dự

Thiệp giấy chỉ truyền tin một chiều. Thiệp online cho khách gửi lời chúc vào sổ lưu bút, và nếu thiệp có mục xác nhận tham dự, khách báo luôn có đi không, đi mấy người. Hai bạn có con số tương đối để chốt bàn với nhà hàng thay vì đoán. Cách hỏi khách có đến hay không mà không thấy ngại được bàn kỹ trong bài [xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi).

## Nhược điểm thật của thiệp online và cách khắc phục

### Người lớn tuổi không quen mở link

Ông bà, cô dì chú bác lớn tuổi có thể không dùng điện thoại thông minh, hoặc có dùng nhưng ngại bấm vào đường link lạ. Cách nhiều nhà vẫn làm: in một ít thiệp giấy để mời trực tiếp người lớn. Muốn họ vẫn xem được bản đồ và lịch trình thì in mã QR của thiệp online lên thiệp giấy, con cháu trong nhà quét giúp là mở được.

### Cảm giác thiếu trang trọng

Một đường link thả vào nhóm chat dễ bị xem là mời cho có. Vấn đề nằm ở cách gửi nhiều hơn ở tấm thiệp: gọi điện hoặc nhắn riêng từng người, có lời mời đàng hoàng, rồi mới gửi kèm link. Có nơi còn làm link mời riêng cho từng khách, mở ra thấy ngay tên người nhận trên màn mở thiệp; cách làm nằm trong bài [thiệp cưới ghi tên khách mời](/vi/blog/thiep-cuoi-ghi-ten-khach-moi). Gửi theo thứ tự nào, trước bao lâu, nhắn sao cho khéo thì xem [cách gửi thiệp cưới online qua Zalo](/vi/blog/cach-gui-thiep-cuoi-online-qua-zalo).

### Link dễ trôi trong khung chat

Tin mời gửi trước vài tuần dễ bị chìm. Cách khắc phục: nhắn nhắc lại 2–3 ngày trước ngày cưới, kèm lại đường link cũ. Lời mời ban đầu nên ghi luôn ngày cưới để khách vẫn nhớ dù không mở lại thiệp. Nếu chưa biết viết thế nào, bài [tin nhắn mời cưới](/vi/blog/tin-nhan-moi-cuoi) có sẵn hàng chục mẫu chia theo từng người nhận.

## Kết hợp thiệp giấy và thiệp online

Nhiều gia đình không chọn một trong hai mà dùng cả hai, chia theo người nhận:

Mã QR in lên thiệp giấy tạo được từ link thiệp bằng [công cụ tạo mã QR](/vi/cong-cu/tao-ma-qr) miễn phí.

- **Thiệp giấy** cho ông bà, họ hàng lớn tuổi, thầy cô, hàng xóm lâu năm, những người mà việc đến tận nhà đưa thiệp là một phần của lễ nghĩa. Mời thế nào còn tuỳ phong tục từng vùng và nếp nhà, nên hỏi ý bố mẹ hai bên trước.
- **Thiệp online** cho bạn bè, đồng nghiệp, người ở xa, và cả những người đã nhận thiệp giấy nhưng cần bản đồ, lịch trình.
- **Mã QR in trên thiệp giấy** là cầu nối giữa hai bản: thiệp giấy giữ phần trang trọng, mã QR dẫn tới bản online luôn được cập nhật.

Khi kết hợp, hai bản phải khớp nhau về giờ, địa điểm và cách xưng hô. Soạn bản online trước, kiểm thật kỹ, rồi mới mang nội dung đó đi in thiệp giấy là cách ít sai nhất.

## Thiệp online có riêng tư, an toàn không?

Thiệp cưới ghi tên cả nhà, địa chỉ và giờ cả nhà vắng mặt, nên khi chọn nơi làm thiệp, hãy kiểm mấy điểm sau:

- **Đường link có dễ đoán không.** Ở Keemori, đường dẫn tự sinh từ tên cô dâu chú rể kèm một mã ngẫu nhiên, người lạ không thể đoán bừa ra link thiệp của hai bạn.
- **Ảnh có mang theo vị trí không.** Ảnh chụp bằng điện thoại thường lưu kèm toạ độ GPS. Ảnh cưới tải lên Keemori được nén lại và xoá thông tin vị trí, vì thiệp là link ai có trong tay cũng mở được.
- **Khách có thấy danh sách khách khác không.** Khi dùng link mời riêng từng khách, người xem thiệp không thấy được danh sách những người được mời khác.
- **Ai đọc được lời chúc và câu trả lời.** Lời chúc chỉ hiện lên thiệp khi hai bạn duyệt, và hai bạn xoá được bất kỳ lời chúc nào. Câu trả lời xác nhận tham dự không hiện công khai, chỉ chủ thiệp xem được.

Dù vậy, đừng đăng link thiệp công khai lên trang cá nhân nếu không muốn người ngoài biết địa chỉ và giờ tổ chức. Gửi riêng cho người được mời vẫn là cách an toàn nhất.

## Có nên dùng thiệp cưới online không?

Nên, nếu phần lớn khách mời của hai bạn dùng điện thoại thông minh: bạn bè, đồng nghiệp, họ hàng trẻ. Thiệp online tiết kiệm công đi đưa, sửa được khi có thay đổi và giúp khách tìm đường. Nhưng hiếm khi nên bỏ hẳn thiệp giấy: với người lớn tuổi, tấm thiệp trao tận tay vẫn có giá trị riêng. Hiểu thiệp cưới online là gì rồi thì câu trả lời thực tế cho hầu hết các cặp đôi là: dùng cả hai, mỗi loại cho đúng người.

## Cách tạo thiệp cưới online trong 3 bước với Keemori

1. **Chọn mẫu.** Vào [kho mẫu thiệp](/vi/mau-thiep) với hơn 60 thiết kế thuộc 6 phong cách: Sang trọng, Hiện đại, Cổ điển, Tối giản, Truyền thống, Lịch sự, lọc thêm theo màu. Mở bản xem thử để thấy thiệp chạy thật trước khi chọn.
2. **Điền thông tin.** Nhập tên hai bạn, gia đình hai họ, các nghi lễ, tiệc cưới, rồi bật tắt những khối cần dùng. Giữa chừng muốn đổi sang mẫu khác cũng không mất nội dung hay ảnh đã nhập.
3. **Lưu và gửi.** Bấm "Lưu & Tạo link" để nhận link thiệp và mã QR, rồi gửi qua Zalo, Messenger, Facebook hoặc in mã QR lên thiệp giấy.

Tạo thiệp và xem thử luôn miễn phí. Chưa có ảnh cưới thì các mẫu gói Free dùng tranh minh hoạ vẽ riêng, không cần ảnh, link dùng vĩnh viễn và không giới hạn người xem; gợi ý chọn mẫu có trong bài [mẫu thiệp cưới miễn phí](/vi/blog/mau-thiep-cuoi-mien-phi). Muốn ảnh cưới của hai bạn nằm trong thiết kế, có xác nhận tham dự và link mời riêng từng khách thì chọn từ gói Gold trở lên. Sẵn sàng rồi thì bắt đầu [tạo thiệp cưới online miễn phí](/vi) ngay hôm nay.

## Câu hỏi thường gặp

### Thiệp cưới online có mất phí không?

Tuỳ nơi làm. Ở Keemori, tạo thiệp và xem thử luôn miễn phí, gói Free có link vĩnh viễn; chỉ khi muốn có ảnh cưới trong thiết kế, xác nhận tham dự hay album thì mới cần gói Gold hoặc Diamond có tính phí.

### Khách có cần cài ứng dụng để xem thiệp cưới online không?

Không. Thiệp cưới online là một trang web, khách chỉ cần bấm vào link hoặc quét mã QR bằng camera điện thoại.

### Thiệp cưới online có thay hoàn toàn được thiệp giấy không?

Với bạn bè, đồng nghiệp thì thường là được. Với ông bà và họ hàng lớn tuổi, nhiều gia đình vẫn đưa thiệp giấy tận tay, có in kèm mã QR dẫn tới bản online.

### Link thiệp cưới online dùng được bao lâu?

Ở Keemori, thiệp gói Free và thiệp đã thanh toán có link vĩnh viễn, không giới hạn người xem. Thiệp Gold hoặc Diamond chưa thanh toán là bản dùng thử: link 3 ngày, tối đa 15 người xem.

### Thiệp cưới online và thiệp cưới điện tử có khác nhau không?

Không. Hai tên gọi chỉ cùng một thứ: thiệp mời cưới gửi bằng đường link, khách xem trên điện thoại hoặc máy tính.
`,
  },
  {
    slug: 'mau-thiep-cuoi-mien-phi',
    category: 'trend',
    title: 'Mẫu thiệp cưới online miễn phí: 12 mẫu đẹp không cần ảnh cưới',
    excerpt:
      '12 mẫu thiệp cưới online miễn phí đủ sáu phong cách, không cần ảnh cưới, link vĩnh viễn; kèm giải thích thẳng gói Free có gì, thiếu gì trước khi gửi khách.',
    readingMinutes: 11,
    markdown: `
Dưới đây là 12 mẫu thiệp cưới online miễn phí thuộc gói Free của Keemori, chọn để phủ đủ sáu phong cách — tối giản, hiện đại, cổ điển, lịch sự, sang trọng, truyền thống — và nhiều tông màu từ trắng xanh, hồng phấn đến đỏ rượu, navy, vàng kim. Mẫu nào cũng dùng tranh minh hoạ vẽ riêng nên hai bạn không cần ảnh cưới, và thiệp xuất bản xong có link vĩnh viễn, không giới hạn người xem. Mỗi mẫu kèm mô tả, gợi ý hợp với ai và link xem thử.

## Gói Free được gì và không có gì

"Miễn phí" ở đây là miễn phí cho cả tấm thiệp bạn gửi đi, không phải bản dùng thử bị khoá bớt. Một thiệp gói Free có:

- Đủ nội dung: cô dâu chú rể, gia đình hai họ, nhiều nghi lễ (mỗi lễ có giờ, ngày, địa điểm riêng), tiệc cưới kèm bản đồ và nút chỉ đường, lịch trình trong ngày.
- Nhạc nền và hộp mừng cưới bằng mã QR.
- Sổ lưu bút: khách gửi lời chúc, chỉ lời chúc hai bạn duyệt mới hiện trên thiệp.
- Link vĩnh viễn, không giới hạn người xem, kèm mã QR để gửi qua Zalo, Messenger hay Facebook.

Gói Free không có ô ảnh cưới (mẫu dựng quanh tranh minh hoạ cố định), không có xác nhận tham dự (RSVP), không có link mời riêng chào đúng tên từng khách, và không có album ảnh.

Nói cách khác, mẫu thiệp cưới online miễn phí đã đủ để báo tin và mời khách. Nếu cần chốt số khách cho nhà hàng, xác nhận tham dự và link mời riêng có từ gói Gold; album ảnh thuộc gói Diamond. So sánh từng gói ở [bảng giá](/vi/bang-gia). Tạo thiệp và xem thử thì gói nào cũng miễn phí, nên cứ dựng thử trước rồi hãy quyết định.

## Mẫu thiệp cưới online miễn phí phong cách tối giản, hiện đại

### Mộc Lan: line-art trắng và lam slate

![Mẫu thiệp cưới Mộc Lan với khung hoa line-art đơn sắc trên các mảng trắng và lam slate](/images/site/blog/mau-thiep-cuoi-mien-phi/moc-lan.jpg)

Một dải giấy dọc chia mảng trắng và lam slate xen nhau, không gradient, không texture. Màn bìa là chỗ trang trí dày nhất: khung hoa vẽ nét mọc vào từ bốn mép, chừa lõi trắng rộng cho tên và ngày cưới; các màn sau chỉ còn một cụm hoa nép ở một mép. Gói Free, không có ô ảnh — phần hình hoàn toàn là nét vẽ một màu. Hợp với cặp đôi tối giản, thích nét vẽ đơn sắc hơn hoa màu nước, tiệc tông trắng – xanh.

[Xem mẫu Mộc Lan](/vi/mau-thiep/moc-lan)

### Tí Hon: tranh chibi dễ thương

![Mẫu thiệp cưới Tí Hon với tranh chibi toàn thân và hoa dại pastel trên giấy trắng ngà](/images/site/blog/mau-thiep-cuoi-mien-phi/ti-hon.jpg)

Thay ảnh cưới là một bức tranh chibi toàn thân trong khung bo nhẹ, trên nền giấy trắng ngà có hoa dại pastel chạy thưa hai mép và tiêu đề coral bo tròn. Mẫu cố ý không dùng chữ có chân: tên viết script, mọi đoạn cần đọc là chữ sans nên lướt trên điện thoại rất nhanh. Gói Free, không có ô ảnh. Hợp với cặp đôi trẻ, thích vui tươi, tổ chức tiệc thân mật.

[Xem mẫu Tí Hon](/vi/mau-thiep/ti-hon)

### Ngọc Diệp: sage dịu, điểm coral

![Mẫu thiệp cưới Ngọc Diệp, minh hoạ màu nước cặp đôi dưới vòm lá và chữ brush màu coral trên nền sage](/images/site/blog/mau-thiep-cuoi-mien-phi/ngoc-diep.jpg)

Bìa chia hai nửa lệch nhau: tranh màu nước cặp đôi dưới vòm lá, đối diện dòng tiêu đề vẽ brush màu coral. Phần trang trọng nằm trên những thẻ trắng đỉnh vòm giữa mảng sage nhạt. Coral chỉ có ở tên, tiêu đề và vài nhành tulip nhỏ, không bao giờ phủ thành mảng lớn, nên cả thiệp luôn nhẹ. Gói Free, không có ô ảnh. Hợp với tiệc ban ngày hoặc sân vườn.

[Xem mẫu Ngọc Diệp](/vi/mau-thiep/ngoc-diep)

### Mộc Yến: graphite và màu nước vẽ tay

![Mẫu thiệp cưới Mộc Yến với nét graphite và màu nước olive, hồng phấn trên dải giấy ngà](/images/site/blog/mau-thiep-cuoi-mien-phi/moc-yen.jpg)

Mộc Yến trông như thiệp tự tay vẽ: nét chì graphite hơi nguệch ngoạc, tô màu nước olive, hồng phấn, mơ không kín nét — ở vòng monogram, bàn tiệc, nhành hoa chuông. Dải giấy ngà nằm trên nền vải hoạ tiết thực vật bạc màu, chia đoạn bằng dải giấy chấm mép lượn sóng và khung nhãn như cắt tay. Gói Free, không có ô ảnh. Hợp với gu mộc mạc, tiệc sân vườn hoặc không gian vintage.

[Xem mẫu Mộc Yến](/vi/mau-thiep/moc-yen)

## Mẫu cổ điển, lãng mạn

### Vòm Ngà: vòm kiến trúc và chữ & quá khổ

![Mẫu thiệp cưới Vòm Ngà với vòm kiến trúc cổ điển màu đá, hoa gardenia trắng và lá sage](/images/site/blog/mau-thiep-cuoi-mien-phi/vom-nga.jpg)

Gần như đơn sắc: giấy ngà, nhiều khoảng trắng, tiêu đề Didone đen ngả olive cỡ rất lớn. Bìa dựng quanh một vòm kiến trúc màu đá nhạt, gardenia trắng và lá sage đi vào từ hai góc dưới; chữ "&" xám quá khổ giữa hai tên là dấu nhận diện. Gói Free, không có ô ảnh. Hợp với lễ cưới trang trọng trong không gian kiến trúc đẹp và cặp đôi thích cổ điển tiết chế.

[Xem mẫu Vòm Ngà](/vi/mau-thiep/vom-nga)

### Hoa Anh: poster hoa trắng vẽ tay

![Mẫu thiệp cưới Hoa Anh dạng poster với hai vòm hoa trắng, dây vàng và đôi uyên ương vẽ graphite](/images/site/blog/mau-thiep-cuoi-mien-phi/hoa-anh.jpg)

Một tấm poster dọc trên giấy cotton ngà loang màu nước blush, sage, peach. Hai vòm hoa trắng tràn từ hai góc trên, thả dây vàng và giọt pha lê; một bên là đèn nến với hộp nhẫn kính, bên kia là đôi uyên ương vẽ chì. Tên hai bạn viết copperplate rất lớn giữa khoảng trống. Gói Free, không có ô ảnh. Hợp với lễ nhà thờ hoặc tiệc tối trang trọng.

[Xem mẫu Hoa Anh](/vi/mau-thiep/hoa-anh)

### Ái Tình: burgundy và nét vẽ cupid

![Mẫu thiệp cưới Ái Tình tông burgundy với minh hoạ cupid, ly champagne và bánh cưới vẽ nét](/images/site/blog/mau-thiep-cuoi-mien-phi/ai-tinh.jpg)

Đỏ rượu vân lá xen giấy ivory ấm, mọi hoạ tiết là nét vẽ một màu: cupid, bó hoa, ly champagne, nhẫn, bánh cưới. Lịch trình uốn theo đường cong chữ S, mỗi mốc giờ có hình vẽ riêng thay vì lặp một bộ icon. Gói Free, không có ô ảnh. Hợp với tiệc tối, nhà hàng ấm cúng, và cặp đôi muốn gửi thiệp sớm khi ảnh cưới chưa chụp xong.

[Xem mẫu Ái Tình](/vi/mau-thiep/ai-tinh)

## Mẫu sang trọng cho tiệc tối

### Kim Sa: ivory, vàng kim và nơ satin

![Mẫu thiệp cưới Kim Sa với thẻ ivory viền vàng nhiều lớp và nơ satin trắng vắt ngang](/images/site/blog/mau-thiep-cuoi-mien-phi/kim-sa.jpg)

Hai tấm thẻ ivory lót vàng nhiều lớp, một chiếc nơ satin trắng rất lớn vắt ngang thẻ chính. Nhành cây vẽ nét vàng mọc từ mép trái, huy hiệu chữ Thọ nằm trên hai cột gia đình, phong bì đóng sáp vàng. Gói Free, không có ô ảnh; bó hoa trắng là minh hoạ cố định. Hợp với tiệc tối trang trọng và gia đình muốn giữ chữ Thọ cùng nghi thức hai họ.

[Xem mẫu Kim Sa](/vi/mau-thiep/kim-sa)

### Dạ Khúc: dạ tiệc pastel dưới pháo hoa

![Mẫu thiệp cưới Dạ Khúc với nền đêm xanh slate, pháo hoa lavender, dây bóng đèn và đèn chùm màu nước](/images/site/blog/mau-thiep-cuoi-mien-phi/da-khuc.jpg)

Trang giấy ivory hẹp đặt giữa nền đêm xanh slate có pháo hoa lavender và đốm sáng champagne. Bìa có dây bóng đèn rủ hai góc, đèn chùm màu nước ở giữa; vào phần ruột nền chuyển sang giấy sáng nên vẫn dễ đọc. Gói Free, không có ô ảnh. Hợp với tiệc tối hoặc tiệc ngoài trời buổi tối, cho ai thích pastel lãng mạn hơn vàng kim.

[Xem mẫu Dạ Khúc](/vi/mau-thiep/da-khuc)

### Dạ Lan: navy sao đêm và cẩm tú cầu

![Mẫu thiệp cưới Dạ Lan với panel navy phủ sao, giấy trắng mép xé và hoa cẩm tú cầu trắng, xanh cobalt](/images/site/blog/mau-thiep-cuoi-mien-phi/da-lan.jpg)

Giấy trắng ngà mép xé xen những mảng navy gần đen phủ hạt sao mờ. Cẩm tú cầu trắng và xanh cobalt là hình ảnh thiên nhiên duy nhất, luôn tràn vào từ một góc. Chữ căn giữa, khoảng thở rộng nên nền tối mà vẫn tĩnh. Gói Free, không có ô ảnh cặp đôi — một tranh hoa cố định đứng ở vị trí đó. Hợp với tiệc buổi tối, không gian tông lạnh.

[Xem mẫu Dạ Lan](/vi/mau-thiep/da-lan)

## Mẫu truyền thống giữ sắc hỷ sự

### Xích Duyên: đỏ son và hai chú mèo

![Mẫu thiệp cưới Xích Duyên tông đỏ son với minh hoạ cô dâu váy trắng, chú rể tuxedo và hai chú mèo](/images/site/blog/mau-thiep-cuoi-mien-phi/xich-duyen.jpg)

Nhịp đỏ · ngà · đỏ của thiệp hỷ, kể bằng giọng trẻ trung: cô dâu váy trắng, chú rể tuxedo, hai chú mèo, tấm biển chỉ đường phủ hoa hồng, và chữ Song Hỷ vẽ thành nút thắt bốn trái tim. Ruột thiệp là thẻ ngà trên khung đỏ. Gói Free, không có ô ảnh. Hợp với cặp đôi muốn giữ sắc đỏ mà vẫn vui tươi, và những nhà nuôi mèo thích có hình mèo trên thiệp.

[Xem mẫu Xích Duyên](/vi/mau-thiep/xich-duyen)

### Hồng Uyên: áo dài vẽ tay tông hồng phấn

![Mẫu thiệp cưới Hồng Uyên với đôi uyên ương áo dài vẽ tay trong vòng tròn trắng và cành đào mảnh](/images/site/blog/mau-thiep-cuoi-mien-phi/hong-uyen.jpg)

Phong bì, bìa gập và ruột cùng một chất giấy hồng phấn; đôi uyên ương áo dài xanh phấn và hồng đứng trong vòng tròn trắng, cành đào mảnh đi vào từ một mép. Chữ đỏ son chỉ dành cho tên, ngày và chữ Song Hỷ, phần đọc dài giữ mực than nên rõ ở cỡ nhỏ. Gói Free, không có ô ảnh. Hợp với lễ ăn hỏi, lễ gia tiên tại nhà ở tông hồng nhẹ.

[Xem mẫu Hồng Uyên](/vi/mau-thiep/hong-uyen)

Muốn thiệp đỏ son đúng lối xưa hơn, xem bài [mẫu thiệp cưới truyền thống](/vi/blog/mau-thiep-cuoi-truyen-thong). Các mẫu Free lấy một loài hoa làm chủ đạo như Bạch Mai, Rừng Hoa, Đỏ Thắm, Tử Ngọc nằm trong bài [mẫu thiệp cưới hoa](/vi/blog/mau-thiep-cuoi-hoa).

## Vì sao mẫu thiệp cưới không cần ảnh vẫn đẹp

Mẫu không có ô ảnh không phải mẫu có ảnh bị để trống. Ở gói Free, tranh minh hoạ được vẽ riêng cho từng mẫu — chibi ở Tí Hon, chì graphite ở Mộc Yến, cupid nét đơn ở Ái Tình — và bố cục, màu chữ, khoảng trắng được tính quanh chính bức tranh đó. Tấm thiệp gửi đi vì vậy trông đúng như lúc thiết kế, không phụ thuộc ảnh của hai bạn sáng hay tối, dọc hay ngang.

Thiệp cưới không cần ảnh đặc biệt hợp khi:

- Chưa chụp ảnh cưới hoặc ảnh còn đang chỉnh, mà đã đến lúc báo ngày cưới.
- Muốn gửi thiệp sớm để khách ở xa kịp sắp xếp công việc, đặt vé.
- Không muốn đưa ảnh riêng lên một đường link ai có cũng mở được.
- Gia đình quen thiệp giấy, thấy tranh áo dài hay chữ Song Hỷ gần gũi hơn ảnh studio.

Chỉ cần nhớ: hình trong thiệp Free là minh hoạ cố định, nên cô dâu chú rể trong tranh không phải hai bạn. Muốn khách thấy gương mặt thật, hãy chọn mẫu có ô ảnh ở gói Gold hoặc Diamond.

## Chọn mẫu nào cho đúng tiệc?

- **Tiệc tối, nhà hàng**: Dạ Khúc, Dạ Lan, Kim Sa, Ái Tình.
- **Tiệc ban ngày, sân vườn**: Ngọc Diệp, Mộc Yến.
- **Lễ nhà thờ, không gian kiến trúc**: Hoa Anh, Vòm Ngà.
- **Giữ sắc hỷ sự, chữ Song Hỷ**: Hồng Uyên, Xích Duyên.
- **Gọn gàng, dễ đọc trên điện thoại**: Mộc Lan, Tí Hon.

Mẫu thiệp cưới online miễn phí nào cũng xem thử được, nên trước khi chốt hãy mở bản xem thử trên điện thoại và nhập thử tên thật của hai bạn — tên dài hay ngắn làm màn bìa trông khác hẳn. Màu và font của mẫu là cố định, nên chọn tông gần màu tiệc ngay từ đầu.

## Cách tạo thiệp cưới online miễn phí trên Keemori

1. Vào [kho mẫu thiệp](/vi/mau-thiep), lọc theo gói Free, phong cách hoặc màu chủ đạo, mở bản xem thử từng mẫu.
2. Bấm **Dùng mẫu này**, điền tên hai bạn, gia đình hai họ, nghi lễ, địa chỉ tiệc, lịch trình, thông tin mừng cưới qua mã QR; khối nào không cần thì tắt.
3. Xuất bản để nhận link thiệp và mã QR, rồi gửi khách qua Zalo, Messenger hay Facebook.

Đường dẫn thiệp tự sinh từ tên hai bạn kèm một mã ngẫu nhiên nên người lạ không đoán được. Lần đầu làm thì xem [trang hướng dẫn](/vi/huong-dan) có ảnh chụp từng ô nhập. Sẵn sàng rồi, bắt đầu [tạo thiệp cưới online miễn phí](/vi) với mẫu hai bạn ưng nhất.

## Câu hỏi thường gặp

### Thiệp cưới miễn phí có bị giới hạn thời gian hay số người xem không?

Không. Thiệp gói Free sau khi xuất bản có link vĩnh viễn và không giới hạn người xem, gửi bao nhiêu khách cũng được.

### Mẫu thiệp miễn phí có cho khách xác nhận tham dự không?

Không. Xác nhận tham dự (RSVP) và link mời riêng từng khách có từ gói Gold. Nếu cần chốt số khách, xem thêm [cách nhận xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi).

### Có thêm ảnh cưới vào mẫu miễn phí được không?

Không, mẫu Free không có ô ảnh cặp đôi. Muốn có ảnh, hai bạn đổi sang một mẫu Gold hoặc Diamond; nội dung đã nhập không bị mất khi đổi mẫu.

### Thiệp cưới online miễn phí có nhận mừng cưới qua mã QR không?

Có. Gói Free có hộp mừng cưới bằng mã QR, cùng nhạc nền và sổ lưu bút để khách gửi lời chúc.

### Có đổi được màu hoặc font của mẫu không?

Không. Bố cục, font và màu do thiết kế cố định, hai bạn chỉ sửa nội dung. Hãy dùng bộ lọc màu trong kho mẫu để chọn mẫu hợp tông tiệc.
`,
  },
  {
    slug: 'thiep-cuoi-nha-trai-nha-gai',
    category: 'guide',
    title: 'Thiệp cưới nhà trai nhà gái: khác nhau ở đâu, làm chung hay riêng',
    excerpt:
      'Thiệp cưới nhà trai nhà gái khác nhau ở người đứng tên, lễ vu quy hay thành hôn và địa điểm tiệc. Khi nào một thiệp chung là đủ, khi nào nên làm hai?',
    readingMinutes: 8,
    markdown: `
Thiệp cưới nhà trai nhà gái là hai bộ thiệp mà mỗi nhà dùng để mời khách của riêng mình, khi hai nhà đãi tiệc ở hai nơi hoặc vào hai ngày khác nhau. Hai thiệp thường khác nhau ở bốn chỗ: ai đứng tên mời, thứ tự tên cô dâu chú rể, tên lễ (vu quy hay thành hôn) và địa điểm, giờ giấc của tiệc. Nếu hai nhà chung một tiệc thì một thiệp là đủ.

## Vì sao nhiều đám cưới cần hai bộ thiệp

Ở nhiều nơi, đám cưới không phải một bữa tiệc mà là hai. Nhà gái đãi tiệc ở quê nhà, thường vào hôm trước hoặc ngay buổi đón dâu; nhà trai đãi tiệc ở nơi mình sống. Hai nhà khác tỉnh thì chuyện hai tiệc càng phổ biến.

Khách của hai nhà cũng khác nhau. Đồng nghiệp của bố cô dâu, hàng xóm nhà gái sẽ đến tiệc nhà gái; bạn làm ăn của bố chú rể đến tiệc nhà trai. Một tấm thiệp ghi cả hai tiệc buộc khách tự đoán mình được mời bữa nào, và kết quả thường là người đến nhầm, người đi cả hai.

Thêm một lý do thực tế: nhiều gia đình mỗi nhà tự lo tiệc của mình, tự đặt số bàn theo khách của mình. Thiệp riêng giúp mỗi nhà đếm được khách nhà mình mà không phải hỏi chéo sang bên kia.

## Thiệp cưới nhà trai nhà gái khác nhau ở đâu

### Người đứng tên mời

Thiệp nhà trai do bố mẹ chú rể đứng tên, thiệp nhà gái do bố mẹ cô dâu. Phần thông tin hai họ vẫn có đủ cả hai bên, nhưng nhà phát thiệp thường đứng trước: cột bên trái hoặc dòng trên. Lời mời dự tiệc ở thiệp nào là lời của nhà đó.

### Thứ tự tên cô dâu chú rể

Trên thiệp in, thiệp nhà trai thường ghi tên chú rể trước, thiệp nhà gái ghi tên cô dâu trước. Đây là quy ước phổ biến chứ không phải luật; có gia đình giữ tên chú rể đứng trước ở cả hai thiệp. Hỏi ý bố mẹ hai bên rồi thống nhất một lần.

### Lễ vu quy và lễ thành hôn

Đây là khác biệt dễ thấy nhất giữa thiệp vu quy và thiệp thành hôn. "Vu quy" nghĩa là con gái về nhà chồng: lễ vu quy là lễ ở nhà gái, khi gia đình làm lễ gia tiên và tiễn con đi. "Thành hôn" là lễ thành vợ chồng, làm ở nhà trai khi đón dâu về. Nên thiệp nhà gái báo tin lễ vu quy, thiệp nhà trai báo tin lễ thành hôn:

![Mẫu Sen Việt ghi riêng lễ vu quy ở nhà gái và lễ thành hôn ở nhà trai, bên cạnh khối thông tin hai gia đình](/images/site/blog/thiep-cuoi-nha-trai-nha-gai/le-vu-quy-le-thanh-hon.jpg)

> Trân trọng báo tin lễ vu quy của con gái chúng tôi
>
> Trân trọng báo tin lễ thành hôn của con trai chúng tôi

Trình tự cụ thể của từng lễ có trong hai bài [nghi thức lễ cưới ở nhà gái](/vi/blog/nghi-thuc-le-cuoi-o-nha-gai) và [nghi thức lễ cưới ở nhà trai](/vi/blog/nghi-thuc-le-cuoi-o-nha-trai).

### Địa điểm và giờ tiệc

Mỗi thiệp chỉ ghi lễ và tiệc của nhà mình. Ví dụ một đám cưới hai nhà ở hai tỉnh: nhà gái làm lễ vu quy sáng thứ Sáu ở tư gia, đãi khách nhà gái tại quê; nhà trai làm lễ thành hôn sáng Chủ nhật và đãi tiệc ở thành phố. Khách nhà gái không cần biết giờ đón khách ở nhà hàng bên nhà trai, và ngược lại. Ghi thêm tiệc của nhà kia vào chỉ làm thiệp rối.

## Thiệp cưới nhà gái ghi như thế nào

Một tấm thiệp nhà gái thường đi theo thứ tự này:

1. **Thông tin hai họ**, nhà gái đứng trước: Ông, Bà (họ tên bố mẹ cô dâu) và địa chỉ; sau đó đến nhà trai.
2. **Câu báo tin**: "Trân trọng báo tin lễ vu quy của con gái chúng tôi".
3. **Tên hai bạn**, cô dâu trước: Nguyễn Phương Khanh (Trưởng nữ) và Nguyễn Hoàng Kiên (Trưởng nam).
4. **Lễ vu quy**: giờ, thứ, ngày dương và ngày âm, nơi làm lễ.
5. **Giấy mời dự tiệc nhà gái**: tên khách, giờ đón khách, giờ khai tiệc, địa chỉ.

> Lễ vu quy được cử hành tại tư gia vào lúc 8 giờ 00, thứ Sáu, ngày 20 tháng 11 năm 2026 (tức ngày 12 tháng 10 năm Bính Ngọ)

Thiệp nhà trai làm theo đúng khung đó, đảo lại: nhà trai đứng trước, tên chú rể trước, ghi lễ thành hôn và tiệc nhà trai. Cách ghi tên bố mẹ khi có người đã khuất, cách ghi ngày âm lịch và giờ khai tiệc có trong bài [cách ghi thiệp cưới](/vi/blog/cach-ghi-thiep-cuoi).

## Làm thiệp cưới chung hay riêng: khi nào một thiệp là đủ

Một thiệp chung là đủ khi:

- **Hai nhà đãi chung một tiệc**, thường ở một nhà hàng. Thiệp chung khi đó thường ghi Lễ thành hôn, thông tin hai họ đặt ngang nhau, mỗi bên một cột.
- **Hai nhà ở gần nhau** và khách quen biết cả hai bên, tiệc tổ chức một lần cho tất cả.
- **Chỉ một nhà đãi tiệc lớn**, nhà kia làm lễ gia tiên trong nội bộ gia đình. Lúc đó chỉ nhà có tiệc mới cần phát thiệp.

Còn nếu hai tiệc khác ngày hoặc khác nơi, dù chỉ cách nhau vài cây số, nên làm riêng. Khách nhận đúng thiệp của nhà đã mời mình thì không phải hỏi lại.

## Làm hai thiệp online rời nhau thì vướng ở đâu

Với thiệp online, cách đơn giản nhất để có thiệp cưới nhà trai nhà gái là tạo hai thiệp rời: một cho nhà trai, một cho nhà gái. Làm vậy được, nhưng sớm muộn sẽ gặp mấy chuyện:

- **Nhập mọi thứ hai lần**: tên, ảnh cưới, câu chuyện, lịch trình, nhạc. Đổi một chi tiết là phải nhớ sửa ở cả hai nơi, và hai thiệp lệch nhau chỉ là chuyện thời gian.
- **Hai sổ lưu bút**: lời chúc của khách nhà gái nằm một nơi, của khách nhà trai nằm một nơi, hai bạn phải mở hai chỗ để đọc và duyệt.
- **Hai đường dẫn không liên quan gì nhau**, mỗi thiệp một chỗ quản lý.

Quay về một thiệp chung ghi cả hai tiệc thì lại đúng vấn đề ban đầu: khách không biết mình được mời bữa nào.

## Thiệp riêng nhà trai – nhà gái với gói Diamond Song Hỷ

Keemori giải chỗ này bằng gói Diamond Song Hỷ. Hai bạn vẫn làm **một thiệp**, nhưng thiệp có **ba link**:

- **Link chung**, cũng chính là thiệp nhà trai.
- **Link riêng nhà trai**.
- **Link riêng nhà gái**.

Chỉ phần **tiệc cưới** được tách theo nhà. Khách mở link nhà gái thấy tiệc của nhà gái, với lời dẫn mặc định "Lễ vu quy được cử hành tại"; khách mở link nhà trai thấy tiệc nhà trai, với lời dẫn "Lễ thành hôn được cử hành tại". Lời dẫn sửa được, nếu gia đình muốn một câu khác.

Danh sách khách và xác nhận tham dự cũng quản lý riêng theo từng nhà. Nhà gái có danh sách [link mời riêng từng khách](/vi/blog/thiep-cuoi-ghi-ten-khach-moi) của nhà gái, nhà trai có danh sách của nhà trai, và câu trả lời của khách (đến hay không, đi mấy người) được tách theo nhà. Đến lúc chốt số bàn với nhà hàng bên nhà gái, con số đã tách sẵn, không phải lọc ra từ một danh sách chung.

Phần còn lại dùng chung: ảnh cưới, đếm ngược, lời chúc trong sổ lưu bút và các khối khác. Hai bạn nhập một lần, sửa một lần, và cả ba link cùng hiện bản mới. Vì là một thiệp nên hai nhà tự nhiên dùng cùng một mẫu, không phải chọn hai lần cho khớp.

Một mẹo khi gửi: link chung chính là thiệp nhà trai. Khi bố mẹ cô dâu mời khách nhà mình, hãy gửi link nhà gái, đừng chuyển tiếp link chung, nếu không khách sẽ thấy địa chỉ tiệc bên nhà trai.

Song Hỷ thuộc gói Diamond, nên thiệp cưới nhà trai nhà gái làm theo cách này có thêm album ảnh cưới và dùng được mọi mẫu trong kho. Giá gói và mức nâng cấp cho thiệp đã mua Diamond có ở [bảng giá](/vi/bang-gia). Hai bạn có thể [tạo thiệp cưới online](/vi) và xem thử miễn phí trước, rồi bật thiệp riêng nhà trai – nhà gái trong trình soạn thảo khi đã chốt kế hoạch tiệc của hai nhà.

## Câu hỏi thường gặp

### Thiệp cưới nhà gái ghi như thế nào?

Thường do bố mẹ cô dâu đứng tên, nhà gái đứng trước, tên cô dâu trước, báo tin lễ vu quy và ghi tiệc của nhà gái. Mỗi vùng có thể khác một chút, nên hỏi ý người lớn trước khi in.

### Thiệp vu quy và thiệp thành hôn khác nhau thế nào?

Thiệp vu quy do nhà gái phát, báo tin lễ tiễn con gái về nhà chồng. Thiệp thành hôn do nhà trai phát, báo tin lễ đón dâu và thành vợ chồng.

### Nên làm thiệp cưới chung hay riêng?

Hai nhà đãi chung một tiệc thì làm chung. Hai tiệc khác ngày hoặc khác nơi thì nên làm riêng để khách đến đúng tiệc của nhà đã mời mình.

### Link chung của thiệp Song Hỷ mở ra thiệp nhà nào?

Link chung mở thiệp nhà trai. Khách của nhà gái nên nhận link riêng của nhà gái.
`,
  },
  {
    slug: 'thiep-cuoi-ghi-ten-khach-moi',
    category: 'guide',
    title: 'Thiệp cưới ghi tên khách mời: cách xưng hô và link mời riêng',
    excerpt:
      'Thiệp cưới ghi tên khách mời thế nào cho đúng vai: Ông Bà, Anh Chị, Bạn, kèm gia đình hay người thương. Và cách để thiệp online chào đích danh từng người.',
    readingMinutes: 8,
    markdown: `
Thiệp cưới ghi tên khách mời ở dòng "Trân trọng kính mời: …", và cái tên đặt ở đó phải gọi đúng vai của người nhận: Ông Bà, Cô Chú, Anh Chị hay Bạn, thêm "và gia đình" nếu mời cả nhà, "và người thương" nếu mời kèm người yêu. Thiệp giấy thì viết tay hoặc in tên lên; thiệp online cần một link riêng cho từng khách thì mới chào được đích danh. Dưới đây là cách xưng hô cho từng nhóm khách, và cách làm điều đó trên thiệp online.

## Thiệp cưới ghi tên khách mời ở đâu

Trên thiệp giấy, tên khách thường nằm ở giấy mời dự tiệc, tức phần ruột hoặc tờ rời bên trong, ngay sau chữ "Trân trọng kính mời" trên một dòng chấm để trống. Nhiều nhà ghi thêm tên ngoài phong bì để người đi phát thiệp không đưa nhầm.

> Trân trọng kính mời: Ông Bà Nguyễn Văn Hùng và gia đình
>
> tới dự bữa tiệc chung vui cùng gia đình chúng tôi.

Câu sau dòng tên được in sẵn, giống nhau cho mọi khách. Chỉ có cái tên là khác, và đó là thứ duy nhất trên thiệp cho người nhận biết lời mời này dành cho họ, chứ không phải một tờ thông báo phát chung.

## Cách ghi tên khách mời trên thiệp cưới theo từng vai

Nguyên tắc chung: ghi theo cách người mời vẫn gọi người đó ngoài đời, viết hoa chữ đầu của từ xưng hô, và không viết tắt.

- **Người lớn tuổi**: "Ông Bà Nguyễn Văn Hùng" là kiểu trang trọng, thường ghi họ tên người chồng; thân hơn thì "Bác Hải", "Cô Chú Hùng Lan".
- **Họ hàng**: gọi đúng vai trong họ như Chú Thím, Cô Chú, Cậu Mợ, Dì Dượng, Bác. Cách gọi mỗi vùng một khác, chẳng hạn chồng của cô ở miền Nam thường được gọi là dượng, nên hỏi bố mẹ nếu không chắc.
- **Anh chị, đồng nghiệp lớn tuổi hơn**: "Anh Chị Tuấn Mai", "Chị Hạnh".
- **Bạn bè**: "Bạn Minh", "Bạn Linh và người thương".
- **Mời cả gia đình**: thêm "và gia đình" sau tên người đại diện, ví dụ "Anh Tuấn và gia đình".

### Khách của bố mẹ hay khách của hai bạn

Thiệp thường do bố mẹ đứng tên mời, nên khách của bố mẹ cần được ghi theo vai của bố mẹ, không phải của hai bạn. Nhiều gia đình dùng "Ông Bà …" cho khách của bố mẹ vì kiểu này trang trọng và không bao giờ sai vai; có nhà lại ghi đúng cách bố mẹ vẫn gọi hằng ngày cho thân mật. Hỏi bố mẹ muốn kiểu nào, và để bố mẹ tự duyệt danh sách khách của mình. Khách của hai bạn thì ghi theo cách hai bạn xưng hô.

### Phần đuôi sau tên cho khách biết được đi mấy người

Khách đọc phần đuôi sau tên để biết mình được đi một mình hay đi cùng ai, nên viết thêm là mời thêm:

- **Chỉ có tên**: mời riêng người đó.
- **"và gia đình"**: mời cả vợ chồng, con cái. Nếu tiệc không tiện cho trẻ nhỏ hoặc số bàn có hạn, cân nhắc trước khi thêm.
- **"và người thương"**: mời kèm người yêu hoặc bạn đời, hợp khi bạn biết người đó có đôi nhưng chưa rõ tên, hoặc khi muốn lời mời thân mật với bạn bè trẻ.

### Viết tay hay in tên

Thiệp cưới ghi tên khách mời bằng tay là cách trân trọng nhất, nhất là với ông bà và họ hàng lớn tuổi; nhờ người trong nhà viết chữ đẹp, dùng một màu mực cho cả xấp thiệp. In tên thì nhanh và đều, nhiều nhà in nhận in theo danh sách, nhưng danh sách gửi đi phải soát thật kỹ vì sai một dấu là sai cả tấm. Không ít gia đình kết hợp: in cho bạn bè, đồng nghiệp, viết tay cho người lớn.

Dù viết hay in, ba lỗi nên tránh: viết tắt kiểu "A/C" hay "Gđ", sai dấu trong tên, và gọi sai vai trong họ. Lỗi thứ ba là lỗi người nhận nhớ lâu nhất.

## Thiệp online thường mất phần chào đích danh

Thiệp online gửi đi dưới dạng link, và thường thì ai cũng nhận cùng một link. Tin nhắn kèm theo có thể gọi tên từng người, nhưng tấm thiệp mở ra thì giống hệt nhau: dòng "Trân trọng kính mời: …" của thiệp giấy biến mất. Với bạn bè cùng lứa thì không sao. Với người lớn tuổi, một link chung gửi qua Zalo dễ bị đọc như một tin nhắn gửi hàng loạt, điều mà tấm thiệp viết tay chưa bao giờ gặp.

Cách viết lời nhắn kèm link cho lịch sự có trong bài [mẫu tin nhắn mời cưới](/vi/blog/tin-nhan-moi-cuoi). Phần dưới nói về chính tấm thiệp.

## Thiệp mời có tên từng người: link mời riêng từng khách

Link mời riêng là cách đưa dòng tên đó trở lại, để thiệp cưới ghi tên khách mời không còn là chuyện riêng của thiệp giấy. Ở Keemori, tính năng này chạy như sau:

![Màn mở thiệp mẫu Đỏ Burgundy qua link mời riêng: dòng Trân trọng kính mời và tên khách Bạn Dương Phạm phía trên phong bì](/images/site/blog/thiep-cuoi-ghi-ten-khach-moi/loi-chao-ten-khach-do-burgundy.jpg)

![Màn mở thiệp mẫu Sen Việt qua link mời riêng: lời mời Anh Chị Hưng Thu nằm ngay trên tên cô dâu chú rể](/images/site/blog/thiep-cuoi-ghi-ten-khach-moi/loi-chao-ten-khach-sen-viet.jpg)

1. Trong trình soạn thảo, ở mục "Link mời riêng từng khách", bạn nhập danh sách khách, mỗi dòng một tên.
2. Lưu thiệp, mỗi khách nhận một link riêng: đường dẫn thiệp kèm đuôi "?khach=" và một mã của riêng người đó.
3. Khách mở link thấy màn mở thiệp chào đích danh, ví dụ "Trân trọng kính mời: Cô Chú Hùng Lan".
4. Hai bạn lấy link từng người ở mục Link khách mời trong Thiệp của tôi, rồi gửi qua Zalo, Messenger hay bất cứ kênh nào.

Vài điều nên biết trước khi gửi:

- **Mã giữ nguyên khi sửa danh sách.** Thêm khách lên đầu danh sách, xoá bớt người khác hay đổi thứ tự đều không làm đổi link của những người còn lại, nên link đã gửi vẫn chào đúng tên. Riêng việc sửa chữ của một cái tên sẽ tạo link mới cho người đó; link cũ vẫn mở được thiệp nhưng chỉ hiện lời chào chung. Vì vậy hãy soát chính tả trước khi gửi.
- **Khách không thấy danh sách người khác.** Mỗi người chỉ thấy tên mình; danh sách khách mời không lộ ra cho người xem thiệp.
- **Gắn với xác nhận tham dự.** Khách mở link riêng thì tên đã được điền sẵn ở phần xác nhận tham dự; gửi lại là sửa câu trả lời cũ chứ không tạo thêm dòng. Màn khách mời cho hai bạn thấy ai đã phản hồi, ai chưa, tiện để nhắn nhắc. Chi tiết ở bài [xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi).
- **Có từ gói Gold.** Gói Free không có link mời riêng và xác nhận tham dự. Thiệp Gold chưa thanh toán là bản dùng thử: link 3 ngày, tối đa 15 người xem, và link khách mời cũng tính vào giới hạn đó, nên hoàn tất thanh toán trước khi gửi hàng loạt. Xem [bảng giá](/vi/bang-gia).

## Mẹo đặt tên trong danh sách khách mời

Tên bạn gõ sẽ hiện nguyên văn ngay sau lời kính mời, nên hãy gõ đúng cách xưng hô bạn muốn khách đọc:

- Cô Chú Hùng Lan
- Anh Tuấn và gia đình
- Bạn Linh và người thương
- Ông Bà Nguyễn Văn Hùng

Thêm vài lưu ý nhỏ nhưng hay bị quên:

- **Không ghi chú nội bộ vào dòng tên.** "Tuấn, bạn bố, bàn 5" hay "Hùng (chưa chắc đi)" sẽ hiện nguyên văn trên thiệp của người đó. Ghi chú để ở một bảng tính riêng.
- **Hai người trùng tên** thì phân biệt bằng cách gọi tự nhiên, như "Anh Minh Tuấn" và "Anh Minh và chị Hoa", thay vì thêm ngoặc kiểu "(công ty)".
- **Mời cả nhà thì một hộ một dòng.** Một link gửi cho người đại diện, và phần xác nhận tham dự đã có ô số người đi.
- **Mỗi link cho đúng một người.** Đừng thả link riêng vào nhóm chat, cả nhóm sẽ thấy một lời mời gửi đích danh một người. Nhóm thì dùng link chung với lời chào chung.
- **Xem thử trước khi gửi.** Bản xem thử trong trình soạn thảo hiện lời chào của khách đầu tiên trong danh sách, nên bạn thấy được tên sẽ hiện ra thế nào trên mẫu mình chọn.

Nếu hai nhà đãi tiệc riêng, mỗi nhà cần một danh sách khách riêng; bài [thiệp cưới nhà trai nhà gái](/vi/blog/thiep-cuoi-nha-trai-nha-gai) nói cách làm việc đó trên cùng một thiệp. Còn nếu chưa có thiệp, hai bạn có thể [tạo thiệp cưới online miễn phí](/vi), điền thử danh sách và xem lời chào hiện ra trước khi chọn gói.

## Câu hỏi thường gặp

### Kính mời ai trên thiệp cưới thì ghi tên thế nào?

Ghi theo vai người mời gọi người nhận: Ông Bà, Cô Chú, Anh Chị hoặc Bạn, kèm tên riêng. Khách của bố mẹ thường ghi theo vai của bố mẹ.

### Mời cả gia đình thì ghi tên trên thiệp cưới ra sao?

Thêm "và gia đình" sau tên người đại diện, ví dụ "Anh Tuấn và gia đình". Khách sẽ hiểu là cả nhà được mời.

### Khách mở link riêng có thấy tên những người khác không?

Không. Mỗi link chỉ chào đúng một người, và danh sách khách mời không hiện cho người xem thiệp.

### Gói nào có link mời riêng từng khách?

Từ gói Gold trở lên. Gói Free có đủ nội dung thiệp nhưng không có link mời riêng và xác nhận tham dự.
`,
  },
  {
    slug: 'xac-nhan-tham-du-dam-cuoi',
    category: 'guide',
    title: 'Xác nhận tham dự đám cưới: nên hỏi gì, chốt khi nào cho đủ bàn',
    excerpt:
      'Xác nhận tham dự đám cưới giúp báo số bàn sát thực tế: form nên hỏi gì, mở và chốt khi nào, nhắc người chưa trả lời ra sao và vì sao vẫn cần bàn dự phòng.',
    readingMinutes: 9,
    markdown: `
Xác nhận tham dự đám cưới là việc hỏi trước từng khách mời xem họ có đến dự tiệc không và đi mấy người, để hai bạn báo số bàn cho nhà hàng sát với thực tế nhất. Cách gọn nhất hiện nay là đặt một form ngắn ngay trong thiệp mời, mở từ lúc gửi thiệp và chốt trước hạn báo số bàn của nhà hàng vài ngày. Kể cả khi đã đủ câu trả lời, vẫn nên chừa vài bàn dự phòng.

## RSVP đám cưới là gì?

RSVP là viết tắt của cụm tiếng Pháp *Répondez s'il vous plaît*, nghĩa là "xin vui lòng phản hồi". Trên thiệp cưới kiểu phương Tây, dòng chữ này thường đi kèm một hạn chót để khách báo lại trước ngày đó.

Ở Việt Nam, ta gọi là xác nhận tham dự đám cưới. Thiệp giấy truyền thống gần như không có phần này: ai đến ai vắng thì gia đình tự đoán theo mối quan hệ, và cách đoán ấy ngày càng khó đúng.

## Vì sao đám cưới Việt ngày càng cần xác nhận tham dự

Lý do lớn nhất là cách nhà hàng tính tiền: tiệc cưới thường được tính theo bàn, nhà hàng cần biết số bàn trước ngày cưới để chuẩn bị, và hay yêu cầu đặt cọc ngay từ lúc ký hợp đồng. Đoán dư vài bàn là trả tiền cho mâm không ai ngồi; đoán thiếu thì khách đứng chờ nhà hàng kê thêm bàn, mà không phải sảnh nào cũng còn chỗ.

Ngoài chuyện tiền, còn vài lý do khác:

- **Sắp chỗ ngồi.** Muốn xếp họ hàng nhà trai một khu, đồng nghiệp cô dâu một khu, nhóm bạn đại học một bàn thì phải biết ai thật sự đến.
- **Số thiệp không bằng số người.** Một tấm thiệp gửi "anh chị Hưng Thu" có thể là hai người, cũng có thể là bốn nếu anh chị đưa theo các cháu.
- **Khách ở xa khó đoán.** Bạn bè làm việc ở tỉnh khác hay ở nước ngoài chỉ quyết được khi đã xem lịch nghỉ.

## Cách cũ: gọi điện, nhắn tin từng người

Trước khi có thiệp online, cách duy nhất là hỏi trực tiếp, và nó tốn thời gian của cả nhà. Hai bạn hỏi bạn bè, bố mẹ hỏi họ hàng, mỗi người giữ kết quả trong điện thoại của mình; đến lúc gom lại thì rất dễ đếm sót, hoặc đếm trùng một người đã trả lời cả mẹ lẫn bạn.

Câu trả lời qua điện thoại cũng kém chắc chắn. Bị hỏi thẳng "hôm đó anh qua được không", nhiều người ngại từ chối nên nói "chắc là được", rồi đến ngày lại bận. Một form để khách tự điền giải quyết được cả hai chuyện: khách trả lời lúc tiện, nói "không" mà không khó xử, và mọi câu trả lời nằm sẵn ở một chỗ.

## Form xác nhận tham dự đám cưới nên hỏi gì

Ngắn là chìa khoá: mỗi câu hỏi thêm vào là thêm một lý do để khách để đó "lát trả lời" rồi quên. Với đám cưới Việt, ba thông tin là đủ:

1. **Tên người trả lời**, để biết ai đã phản hồi.
2. **Có đến dự hay không.**
3. **Đi mấy người**, tính cả người trả lời.

Chọn món, ghi chú dị ứng hay bài hát muốn nghe như trên form nước ngoài thường không cần, vì tiệc cưới Việt phần lớn dùng chung thực đơn theo mâm. Khách nào cần lưu ý riêng như ăn chay, cần xe đưa đón hay mang em bé thì hỏi riêng người đó.

Câu "đi mấy người" dễ khó xử nhất. Cách tế nhị để khách hiểu thiệp mời những ai là ghi đích danh trên thiệp: "Anh chị Hưng Thu và các cháu" mang nghĩa khác hẳn "Bạn Dương Phạm". Bài [thiệp cưới ghi tên khách mời](/vi/blog/thiep-cuoi-ghi-ten-khach-moi) có ví dụ xưng hô cho từng vai, kèm cách gửi mỗi khách một link mời riêng.

## Khi nào mở và chốt xác nhận tham dự đám cưới

Hãy mở form cùng lúc gửi thiệp, khi khách vừa mở thiệp và đang nhẩm lịch của mình; để vài tuần sau mới hỏi thì thiệp đã trôi mất trong hộp tin nhắn.

Hạn chốt thì tính ngược từ nhà hàng. Ngay lúc ký hợp đồng, hãy hỏi quản lý sảnh ba câu:

- Hạn cuối báo số bàn chính thức là ngày nào?
- Sau hạn đó còn tăng, giảm bàn được không, và tính phí thế nào?
- Nhà hàng có nhận bàn dự phòng không, bàn dự phòng không dùng đến thì có tính tiền không?

Có hạn báo số bàn rồi, đặt hạn xác nhận tham dự sớm hơn mốc đó vài ngày đến một tuần, để kịp nhắc người chưa trả lời, gom số liệu và thống nhất với hai bên gia đình. Ví dụ nhà hàng cần số bàn trước tiệc năm ngày thì hạn cho khách có thể là khoảng mười hai ngày trước tiệc.

Ghi hạn này ở cuối thiệp hoặc trong tin nhắn gửi kèm, bằng một câu nhẹ nhàng:

> Để chúng mình chuẩn bị chỗ ngồi chu đáo, bạn xác nhận giúp trước ngày 10/11 nhé.

Mẫu câu cho tin nhắn gửi thiệp có trong bài [tin nhắn mời cưới](/vi/blog/tin-nhan-moi-cuoi).

## Xử lý người không phản hồi

Form ngắn đến đâu cũng có người không trả lời, và đó không hẳn là thiếu lịch sự: nhiều người quen thiệp giấy, nhận thiệp là xong, không nghĩ mình cần báo lại.

Vài nguyên tắc khi nhắc:

- **Nhắc riêng từng người**, không nhắn chung vào nhóm, cùng lý do như khi [gửi thiệp cưới qua Zalo](/vi/blog/cach-gui-thiep-cuoi-online-qua-zalo): tin nhắn nhóm kiểu "ai chưa xác nhận thì xác nhận giúp mình" khiến người chưa trả lời thấy như bị điểm danh.
- **Ai mời thì người đó nhắc.** Bạn của chú rể để chú rể hỏi, họ hàng bên ngoại để mẹ cô dâu hỏi; được người thân với mình hỏi thì ai cũng thoải mái hơn.
- **Người lớn tuổi thì gọi điện.** Các bác, các cô không quen bấm form thì một cuộc gọi ngắn vẫn là cách tôn trọng nhất; hai bạn tự ghi câu trả lời giúp.
- **Chỉ nhắc một lần.** Nhắc rồi vẫn chưa có hồi âm thì đừng hỏi tiếp, chuyển người đó sang nhóm phải tự ước lượng.

Một mẫu tin nhắc có thể dùng:

> Chị Huyền ơi, em Linh đây ạ. Tuần sau là tiệc cưới của tụi em rồi, chị xem giúp em hôm đó chị qua được không, đi mấy người để em báo nhà hàng xếp chỗ nha chị.

## Người báo "có" nhưng không đến, và ngược lại

Xác nhận tham dự giúp con số sát hơn, nhưng không bao giờ khớp tuyệt đối. Sẽ có người đã báo đến rồi vắng vì ốm, kẹt việc hay mưa to, và có người không báo mà vẫn đến, thường là khách bố mẹ mời miệng hoặc người đi kèm mà khách quên tính.

Tỉ lệ vắng mặt không có con số chung: nó tuỳ vào ngày trong tuần, thời tiết, khoảng cách và độ thân của danh sách khách, nên đừng áp một "công thức phần trăm" nào cho mọi đám cưới. Hai cách thực tế hơn:

- **Hỏi kinh nghiệm của chính nhà hàng.** Quản lý sảnh đã làm nhiều tiệc ở đúng sảnh đó nên thường khuyên được sát thực tế.
- **Thoả thuận bàn dự phòng.** Nếu nhà hàng nhận, đặt thêm một vài bàn chỉ tính tiền khi thật sự mở ra dùng, để giữ an toàn mà không phải trả tiền cho mâm trống.

## Từ câu trả lời đến số bàn

### Cách ước lượng số khách đám cưới

Đến hạn chốt, chia danh sách thành ba nhóm:

1. **Đã báo đến**: cộng theo số người khách ghi, không phải theo số câu trả lời.
2. **Đã báo không đến**: gạch khỏi danh sách.
3. **Chưa trả lời**: ước theo mối quan hệ. Họ hàng gần và bạn thân thường đến, khách xã giao ở xa thì khó nói hơn. Với họ hàng, nhờ bố mẹ đoán giúp, vì người lớn thường nắm rõ ai sẽ đi hơn hai bạn.

Số khách dự kiến bằng nhóm một cộng phần ước của nhóm ba. Nên ghi riêng hai con số này: khi bàn với nhà hàng, hai bạn biết bao nhiêu bàn là chắc chắn và bao nhiêu bàn chỉ nên để ở diện dự phòng.

### Chốt số bàn tiệc cưới với nhà hàng

Lấy số khách dự kiến chia cho số ghế mỗi bàn theo quy cách của nhà hàng bạn đặt, làm tròn lên, rồi điều chỉnh: nhóm chưa trả lời còn đông thì chốt dư một chút hoặc dựa vào bàn dự phòng; nhiều người báo đến nhưng ở xa hay phải đi làm hôm đó thì có thể chốt sát hơn.

Có số người đã xác nhận rồi thì nhập vào [công cụ tính số bàn tiệc cưới](/vi/cong-cu/tinh-so-ban-tiec-cuoi): phần đã xác nhận được tính đủ, phần chưa trả lời tính theo tỉ lệ hai bạn tự ước tính, ra số bàn nên đặt và số ghế còn trống.

Trước khi gọi nhà hàng, gửi con số cho bố mẹ hai bên xem lại một lượt, vì rất hay có những vị khách bố mẹ đã mời mà hai bạn không biết.

## Làm xác nhận tham dự trên thiệp online với Keemori

Nếu hai bạn [tạo thiệp cưới online](/vi) trên Keemori, khối **Xác nhận tham dự** đã dựng sẵn đúng form ba câu ở trên: khách điền tên, chọn có đến hay không và số người đi. Vài điểm nên biết:

![Khối Xác nhận tham dự trên mẫu Nắng Xanh và Lan Trắng: khách nhập tên rồi chọn sẽ đến hoặc không đến được](/images/site/blog/xac-nhan-tham-du-dam-cuoi/form-xac-nhan-tham-du.jpg)

- **Câu trả lời không hiện công khai.** Khách khác mở thiệp không thấy ai đi ai vắng; chỉ hai bạn xem được danh sách trong mục "Thiệp của tôi".
- **Đi cùng link mời riêng.** Khi mỗi khách nhận một link riêng, khách mở ra đã được điền sẵn tên, và nếu đổi ý gửi lại thì câu trả lời cũ được sửa chứ không thành hai dòng.
- **Biết ai chưa phản hồi.** Khi dùng link mời riêng, màn quản lý khách mời cho thấy khách nào đã phản hồi, nên hai bạn chỉ cần nhắc riêng đúng những người còn lại.
- **Có từ gói Gold**, gói Free không có. Thiệp Gold chưa thanh toán là link dùng thử 3 ngày, tối đa 15 người xem, nên hãy thanh toán trước khi gửi cho cả danh sách. Chi tiết ở [bảng giá](/vi/bang-gia).
- **Song Hỷ tách theo từng nhà.** Với Diamond Song Hỷ, danh sách link mời riêng và xác nhận tham dự được quản lý riêng cho nhà trai và nhà gái, nên mỗi bên tự chốt số bàn cho tiệc của mình. Xem thêm về [thiệp cưới riêng nhà trai, nhà gái](/vi/blog/thiep-cuoi-nha-trai-nha-gai).

Không cần phần này thì cứ tắt khối đó; mọi khối trên thiệp đều bật, tắt riêng được.

## Câu hỏi thường gặp

### RSVP trên thiệp cưới nghĩa là gì?

RSVP là viết tắt của tiếng Pháp *Répondez s'il vous plaît*, nghĩa là "xin vui lòng phản hồi". Trên thiệp cưới, đó là lời nhờ khách báo trước mình có đến dự hay không.

### Nên chốt xác nhận tham dự trước đám cưới bao lâu?

Không có mốc chung cho mọi đám cưới. Hãy hỏi nhà hàng hạn cuối báo số bàn, rồi đặt hạn cho khách sớm hơn mốc đó vài ngày đến một tuần để kịp nhắc người chưa trả lời.

### Khách không trả lời xác nhận tham dự thì có nên hỏi lại?

Có, nhưng nhắn riêng từng người và chỉ một lần, tốt nhất do chính người đã mời họ hỏi. Nếu vẫn chưa có hồi âm, hãy ước lượng theo mối quan hệ thay vì hỏi tiếp.

### Thiệp cưới online miễn phí có xác nhận tham dự không?

Tuỳ dịch vụ. Trên Keemori, xác nhận tham dự và link mời riêng có từ gói Gold; gói Free không có hai tính năng này.
`,
  },
  {
    slug: 'cach-gui-thiep-cuoi-online-qua-zalo',
    category: 'experience',
    title: 'Gửi thiệp cưới qua Zalo thế nào cho lịch sự và chu đáo',
    excerpt:
      'Gửi thiệp cưới qua Zalo sao cho lịch sự: ai nên mời trực tiếp trước, gửi theo thứ tự nào, trước bao lâu, kiểm link ra sao, kèm vài mẫu tin nhắn ngắn.',
    readingMinutes: 9,
    markdown: `
Gửi thiệp cưới qua Zalo hoàn toàn có thể lịch sự, miễn là hai bạn làm đúng ba việc: mời bằng lời hoặc gọi điện trước cho người lớn và người thân thiết, nhắn riêng từng người thay vì thả link vào nhóm, và gửi khoảng 2–4 tuần trước ngày cưới rồi nhắc lại 2–3 ngày trước. Phần còn lại là câu chữ và kiểm tra link cho kỹ.

Nếu hai bạn còn đang cân nhắc giữa thiệp giấy và thiệp online, có thể đọc trước bài [thiệp cưới online là gì](/vi/blog/thiep-cuoi-online-la-gi). Bài này đi thẳng vào chuyện gửi.

## Mời cưới online có bất lịch sự không?

Lịch sự hay không tuỳ vào người nhận và cách gửi. Với bạn bè cùng trang lứa và đồng nghiệp, mời cưới qua tin nhắn kèm một đường link đã đủ đàng hoàng, nhiều người còn thấy tiện vì mở ra có sẵn bản đồ. Với ông bà, cô dì chú bác hay thầy cô cũ, một tin nhắn đứng một mình dễ bị xem là xuề xoà.

Phong tục mời cưới cũng khác nhau giữa các vùng và các gia đình: có nơi bố mẹ đi mời họ hàng, có nơi cô dâu chú rể tự đến từng nhà. Trước khi gửi, hãy hỏi ý bố mẹ hai bên xem những ai cần được mời tận nơi.

### Ai nên được mời trực tiếp hoặc gọi điện trước

- Ông bà, họ hàng lớn tuổi, nhất là những người bố mẹ coi trọng.
- Thầy cô, cấp trên trực tiếp, người có ơn với gia đình.
- Bạn thân sẽ nhận việc trong đám cưới: phù dâu, phù rể, bê tráp, dẫn chương trình.
- Người mà hai bạn đoán sẽ chạnh lòng nếu chỉ nhận một tin nhắn.

Với nhóm này, link thiệp là phần bổ sung: mời bằng lời trước, sau đó gửi link để họ có bản đồ và giờ giấc.

### Ai gửi link là đủ

Bạn bè, đồng nghiệp, bạn học cũ, người quen ở xa. Chỉ cần tin nhắn có tên người nhận và một câu mời thật lòng, đừng chỉ gửi trơn một đường link.

## Thứ tự gửi: người lớn, bạn thân, rồi đồng nghiệp

1. **Người lớn trong họ.** Thường bố mẹ là người mở lời. Hai bạn gửi link sau khi đã mời bằng lời, hoặc gửi cho con cháu trong nhà để họ mở giúp.
2. **Bạn thân.** Họ cần biết sớm để sắp xếp, nhất là người nhận việc trong đám cưới hay ở xa phải đặt vé.
3. **Đồng nghiệp và bạn bè rộng hơn.** Gửi sau, khi giờ đón khách và địa điểm đã chốt hẳn.

Lý do rất đời thường: không ai muốn nghe tin cưới của cháu mình từ người ngoài, và bạn thân mà biết cùng lúc với cả phòng ban thì khó tránh chạnh lòng.

## Nhắn riêng từng người hay gửi vào nhóm?

Nhắn riêng. Khi gửi thiệp cưới qua Zalo, một tin nhắn gọi tên người nhận cho cảm giác được mời; một đường link thả vào nhóm cho cảm giác được thông báo.

Gửi vào nhóm vẫn chấp nhận được trong vài trường hợp:

- Nhóm lớp hay nhóm bạn mà hai bạn mời tất cả mọi người. Hãy ghi rõ "mời cả nhóm" để không ai phân vân mình có được mời không.
- Nhóm gia đình nhỏ, sau khi đã gọi điện mời từng người, dùng để gửi chung thông tin.
- Tin nhắc lại sát ngày cưới cho những người đã được mời riêng từ trước.

Tránh gửi vào nhóm công ty hay nhóm đông người khi chỉ mời một phần trong đó: người không được mời đọc thấy thì ngại, người được mời lại không chắc có tính mình không.

## Gửi trước bao lâu và vào lúc nào

Thường là 2–4 tuần trước ngày cưới. Gửi quá sớm dễ bị quên, quá muộn thì khách đã kín lịch. Khách ở xa phải đặt vé hay xin nghỉ phép thì nên báo miệng sớm hơn, gửi thiệp sau.

Chọn giờ người nhận có thời gian đọc, như buổi tối hoặc giờ nghỉ trưa, tránh đêm khuya và sáng sớm. Nên chia ra gửi vài đợt để còn thời gian trả lời từng người khi họ nhắn lại chúc mừng.

## Kiểm tra link trước khi gửi thiệp cưới qua Zalo

Sai một giờ hay một số nhà mà gửi cho cả trăm người là cả trăm cuộc gọi hỏi lại. Trước đợt gửi đầu tiên:

- Tự mở link trên điện thoại, không chỉ trên máy tính, vì khách thường mở thiệp bằng điện thoại.
- Đọc lại tên hai bạn, tên bố mẹ, ngày giờ từng lễ, giờ đón khách và giờ khai tiệc.
- Bấm thử nút chỉ đường xem Google Maps có mở đúng địa điểm không.
- Mở phong bì, bật nhạc, cuộn hết thiệp để chắc không còn khối nào sót chữ mẫu.
- Gửi thử cho chính mình (mục Cloud của tôi trên Zalo) hoặc một người bạn, nhờ người thân đọc lại một lượt.
- Kiểm hạn dùng của link. Ở Keemori, thiệp gói Free có link vĩnh viễn ngay từ đầu, còn thiệp Gold hoặc Diamond chưa thanh toán chỉ là bản dùng thử: link 3 ngày, tối đa 15 người xem. Hãy hoàn tất thanh toán trước khi gửi rộng rãi; quyền lợi từng gói có ở [bảng giá](/vi/bang-gia).

Từng bước lấy link và tải mã QR có trong trang [hướng dẫn tạo thiệp](/vi/huong-dan).

## Dùng link mời riêng có tên từng khách

Cách làm một đường link bớt "đại trà" là cho mỗi người một link riêng. Ở Keemori, từ gói Gold, hai bạn nhập danh sách khách, mỗi dòng một tên; mỗi khách nhận một link riêng, mở ra là màn mở thiệp chào đích danh "Trân trọng kính mời: Anh Chị Cường Thu". Vài lưu ý khi dùng:

- Gõ tên đúng cách xưng hô muốn hiện trên thiệp: "Bạn Minh", "Cô Chú Hùng", "Bạn Linh và người thương".
- Gửi mỗi link cho đúng một người, đừng để link mang tên người này lọt sang người khác.
- Thêm khách vào danh sách về sau không làm đổi link của những người đã gửi.
- Người xem thiệp không thấy danh sách các khách mời khác.
- Khách mở link riêng gửi xác nhận tham dự sẽ được điền sẵn tên, hai bạn biết chính xác ai đã trả lời.

Link của từng khách nằm ở mục Link khách mời trong "Thiệp của tôi". Cách ghi tên khách cho đúng vai vế xem thêm ở bài [thiệp cưới ghi tên khách mời](/vi/blog/thiep-cuoi-ghi-ten-khach-moi).

## Mã QR cho người khó mở link

Có người không quen bấm link lạ, có người dùng điện thoại đời cũ. Khi đó:

Thiệp không làm trên Keemori, hoặc chỉ có đường link trong tay, thì dán link vào [công cụ tạo mã QR cho thiệp](/vi/cong-cu/tao-ma-qr) để tải mã về.

- In mã QR của thiệp lên thiệp giấy, hoặc lên một tấm thẻ nhỏ kẹp trong thiệp, để người nhà quét giúp là mở được bản đồ và lịch trình.
- Khi đến nhà mời, mở thiệp trên điện thoại của mình cho người lớn xem, chỉ cho họ chỗ ghi giờ và địa chỉ.
- Gửi link cho con cháu trong nhà người đó, nhờ chuyển lời và đưa đường giúp.

Ở Keemori, mã QR tải về dạng ảnh ở mục "Lấy link & QR", in được lên thiệp giấy hay bảng đón khách.

![Hộp Lấy link và mã QR của Keemori: đường dẫn thiệp để sao chép và mã QR để tải về](/images/site/blog/cach-gui-thiep-cuoi-online-qua-zalo/lay-link-va-ma-qr.jpg)

## Nhắc lại trước ngày cưới

Khoảng 2–3 ngày trước, nhắn một tin ngắn gồm ngày, giờ đón khách, địa điểm và gửi lại link. Tin nhắc nên ngắn hơn tin mời, không cần lặp lại lời mời dài. Nếu có thay đổi như đổi giờ hay đổi sảnh, sửa trên thiệp trước rồi mới nhắc: khách mở lại link cũ sẽ thấy thông tin mới. Thiệp có mục xác nhận tham dự thì xem ai chưa phản hồi để nhắc riêng; cách hỏi khéo có trong bài [xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi).

## Vài mẫu tin nhắn ngắn gửi kèm link

> Cháu chào bác ạ. Như bố mẹ cháu đã thưa chuyện, cháu và [tên người thương] xin gửi bác thiệp mời đám cưới vào [ngày]. Giờ giấc và đường đi có trong thiệp ạ: [link thiệp]

> [Tên] ơi, tụi mình cưới rồi nè! Tiệc lúc [giờ] ngày [ngày] tại [địa điểm]. Mong bạn đến chung vui nhé: [link thiệp]. [Tên chú rể] & [Tên cô dâu]

> Em chào anh/chị ạ. Em gửi anh/chị thiệp mời đám cưới của em và [tên người thương] vào [ngày]. Rất mong anh/chị sắp xếp đến chung vui ạ: [link thiệp]

> Nhắc nhẹ: còn 3 ngày nữa là đám cưới tụi mình rồi. Đón khách lúc [giờ] ngày [ngày] tại [địa điểm], bản đồ có trong thiệp: [link thiệp]

Cần thêm lời mời cho thầy cô, sếp, người ở xa hay lời cảm ơn khi khách xác nhận, xem bài [tin nhắn mời cưới](/vi/blog/tin-nhan-moi-cuoi) với hàng chục mẫu chia theo từng người nhận.

## Gửi thiệp cưới qua Messenger có khác Zalo không?

Nguyên tắc giống hệt: nhắn riêng, có lời mời, gửi đúng thời điểm. Messenger hợp với bạn bè quen qua Facebook hay người ở nước ngoài ít dùng Zalo. Một điều nên tránh ở cả hai nơi: đăng link thiệp công khai lên trang cá nhân. Thiệp có địa chỉ, giờ giấc, tên cả nhà, và ai có link cũng mở được, nên chỉ gửi cho người được mời.

Chưa có thiệp để gửi? Hai bạn có thể [tạo thiệp cưới online miễn phí](/vi) trên Keemori: chọn mẫu, điền thông tin, bấm "Lưu & Tạo link" là có link và mã QR để gửi qua Zalo, Messenger hay bất cứ đâu.

## Câu hỏi thường gặp

### Gửi thiệp cưới qua Zalo có bất lịch sự không?

Không, với bạn bè và đồng nghiệp, nếu hai bạn nhắn riêng kèm lời mời. Với người lớn tuổi và người thân thiết, nên mời bằng lời hoặc gọi điện trước rồi mới gửi link.

### Nên gửi thiệp cưới online trước ngày cưới bao lâu?

Thường 2–4 tuần trước, rồi nhắc lại 2–3 ngày trước ngày cưới. Khách ở xa cần đặt vé thì báo sớm hơn.

### Có nên gửi thiệp cưới vào nhóm Zalo không?

Chỉ khi hai bạn mời tất cả mọi người trong nhóm và ghi rõ điều đó. Còn lại, nhắn riêng từng người vẫn tốt hơn.

### Khách lớn tuổi không mở được link thì làm sao?

Đưa thiệp giấy có in mã QR, mở thiệp trên điện thoại của mình cho họ xem, hoặc gửi link cho con cháu trong nhà nhờ đưa đường.

### Đã gửi thiệp rồi mới phát hiện sai thông tin thì sao?

Với thiệp online, sửa trong trình chỉnh sửa rồi lưu lại, khách mở link cũ sẽ thấy thông tin đúng. Nếu sai giờ hay địa điểm, nhắn thêm một tin đính chính ngắn cho chắc.
`,
  },
  {
    slug: 'tin-nhan-moi-cuoi',
    category: 'guide',
    title: 'Tin nhắn mời cưới: 40 mẫu cho họ hàng, bạn bè, đồng nghiệp',
    excerpt:
      '40 mẫu tin nhắn mời cưới cho họ hàng, bạn bè, đồng nghiệp, thầy cô và người ở xa, kèm tin nhắc lịch, lời cảm ơn. Chỉ cần điền tên, ngày và link thiệp.',
    readingMinutes: 10,
    markdown: `
Một tin nhắn mời cưới tốt chỉ cần bốn thứ: gọi đúng tên và vai vế người nhận, báo tin vui kèm ngày cưới, một lời mời thật lòng, và chữ ký đủ tên hai bạn. Giờ giấc, địa điểm, bản đồ có thể để thiệp cưới online lo qua đường link. Dưới đây là 40 mẫu chia theo người nhận, chỉ cần thay phần trong ngoặc vuông là gửi được.

## Nguyên tắc viết tin nhắn mời cưới

1. **Xưng hô đúng vai.** Cháu với ông bà, cô chú; em với anh chị, thầy cô; tớ với cậu khi là bạn thân. Với họ hàng ít gặp, nói rõ mình là con của ai, vì tên Zalo của hai bạn chưa chắc họ nhận ra.
2. **Có ngày cưới trong tin, phần còn lại để link lo.** Nhiều người đọc tin mà chưa mở link ngay, có ngày trong tin thì họ vẫn nhớ.
3. **Mời, đừng ra lệnh.** Dùng "rất mong", "trân trọng kính mời" thay cho "nhớ đến đấy", "không đến là giận". Bạn thân trêu nhau được, nhưng đừng biến lời mời thành nghĩa vụ.
4. **Ký đủ tên hai bạn.** Người nhận có thể chỉ quen một trong hai. Một dòng "[Tên chú rể] & [Tên cô dâu]" là đủ.
5. **Ngắn và riêng.** Hai đến bốn câu, có tên người nhận. Lời lẽ dài để dành cho tấm thiệp.

Với người lớn tuổi, nhiều gia đình vẫn mời trực tiếp hoặc gọi điện trước, tin nhắn chỉ để gửi thông tin; tuỳ nếp nhà, nên hỏi ý bố mẹ. Thứ tự và thời điểm gửi có trong bài [cách gửi thiệp cưới online qua Zalo](/vi/blog/cach-gui-thiep-cuoi-online-qua-zalo).

## Tin nhắn mời cưới gửi người lớn, họ hàng

Giọng trang trọng, xưng cháu hoặc con, thường gửi sau khi bố mẹ hoặc hai bạn đã gọi điện thưa chuyện.

> Cháu chào bác ạ. Cháu là [tên], con bố [tên bố]. Cháu và [tên người thương] xin báo tin vui: chúng cháu cưới vào [ngày]. Bố mẹ cháu sẽ sang mời bác sau, cháu gửi trước thiệp để bác xem giờ và đường đi ạ: [link thiệp]

> Kính gửi cô chú, gia đình cháu trân trọng báo tin cháu [tên] thành hôn cùng [tên người thương] vào [giờ] ngày [ngày] tại [địa điểm]. Kính mời cô chú cùng gia đình đến chung vui ạ: [link thiệp]

> Con chào chú thím ạ. Như bố con đã thưa chuyện, con gửi chú thím thiệp cưới của con để tiện xem lịch trình và bản đồ. Mong chú thím về chung vui với gia đình mình ạ: [link thiệp]

> Cháu chào dì ạ. Ngày [ngày] này cháu lên xe hoa rồi, cả nhà mong dì về lắm ạ. Lễ vu quy làm tại nhà lúc [giờ], thiệp của cháu đây ạ: [link thiệp]

> Thưa bác, chúng cháu là [tên chú rể] và [tên cô dâu]. Chúng cháu trân trọng kính mời bác cùng gia đình đến dự tiệc cưới lúc [giờ] ngày [ngày] tại [địa điểm]. Có bác là niềm vui của cả nhà chúng cháu ạ: [link thiệp]

> Cháu chào ông ạ. Ngày [ngày] cháu cưới, cả nhà mong ông về chứng kiến ngày vui của cháu. Thiệp cháu gửi đây, cô [tên] sẽ mở giúp ông xem ạ: [link thiệp]

Khi người lớn không dùng điện thoại thông minh, gửi cho con cháu trong nhà:

> [Tên] ơi, anh/chị gửi em thiệp cưới nhé. Em mở cho ông bà xem giờ và đường đi giúp anh/chị với: [link thiệp]. Cuối tuần này anh/chị qua nhà mời ông bà trực tiếp.

## Mẫu tin nhắn mời cưới cho bạn bè thân

Câu mời cưới hay với bạn thân là câu nghe ra đúng giọng hai bạn: thân mật, đùa được một chút, nhưng lời mời vẫn rõ ràng.

> [Tên] ơi, cuối cùng tớ cũng "chốt đơn" rồi! Đám cưới của tớ và [tên người thương] vào [ngày], tiệc lúc [giờ] ở [địa điểm]. Ngày vui mà thiếu cậu là buồn lắm đó: [link thiệp]

> Ê [tên], nhớ hồi đó ai bảo tớ ế cả đời không? Ngày [ngày] này mời cậu đến xem tận mắt nhé. Thiệp đây: [link thiệp]

> Hai đứa mình sắp về chung một nhà rồi [tên] ơi. Tiệc cưới lúc [giờ] ngày [ngày] tại [địa điểm]. Mong bạn đến chung vui với tụi mình nhé: [link thiệp]

> Báo tin vui: tớ cưới! Ngày [ngày], tại [địa điểm]. Bản đồ có sẵn trong thiệp, đi lạc là tớ không chịu trách nhiệm đâu nha: [link thiệp]

> [Tên] ơi, bao năm toàn tớ đi ăn cưới người khác, giờ tới lượt tớ rồi. Ngày [ngày], tiệc lúc [giờ]. Đến sớm chụp hình với cô dâu nha: [link thiệp]

> [Tên] ơi, tớ và [tên người thương] cưới vào [ngày]. Cậu làm phù dâu cho tớ nhé? Tớ gửi thiệp trước để cậu xem lịch trình cả ngày: [link thiệp]

> Từ hồi còn ngồi chung bàn tới giờ, chuyện gì quan trọng của tớ cũng có cậu. Ngày [ngày] này cũng vậy nhé. Tiệc cưới tại [địa điểm] lúc [giờ]: [link thiệp]

> [Tên] ơi, tớ mời cả cậu và người thương luôn nha. Ngày [ngày], tiệc ở [địa điểm]. Hai người báo giúp tớ có đi không để tớ xếp bàn nhé: [link thiệp]

Mẫu dưới đây chỉ dùng khi hai bạn mời tất cả mọi người trong nhóm:

> Gửi cả hội [tên nhóm]: [tên chú rể] và [tên cô dâu] chính thức về chung một nhà vào [ngày]. Tụi mình mời cả hội, không sót ai hết nhé! Tiệc lúc [giờ] tại [địa điểm]: [link thiệp]

## Lời mời cưới qua tin nhắn cho đồng nghiệp, sếp

### Đồng nghiệp

> Chào cả nhà phòng [tên phòng], em xin báo tin vui: em cưới vào [ngày] tại [địa điểm]. Em rất mong được đón cả phòng đến chung vui. Thiệp của em đây ạ: [link thiệp]

> Chị [tên] ơi, em gửi chị thiệp cưới của em và [tên người thương]. Tiệc lúc [giờ] ngày [ngày] ở [địa điểm]. Làm chung bao lâu nay, em mong chị đến chung vui với em lắm ạ: [link thiệp]

> Anh [tên] ơi, [ngày] này em cưới, tiệc tối lúc [giờ] ở [địa điểm]. Có anh đến thì vui lắm. Thiệp em gửi đây nhé: [link thiệp]

Mẫu đầu chỉ hợp khi mời cả phòng; mời vài người thì nhắn riêng.

### Sếp, cấp trên

> Em chào anh [tên] ạ. Em xin phép báo tin em tổ chức lễ cưới vào ngày [ngày]. Em trân trọng kính mời anh đến dự tiệc lúc [giờ] tại [địa điểm]. Chi tiết em gửi trong thiệp ạ: [link thiệp]

> Kính gửi chị [tên], em là [tên] phòng [tên phòng]. Em và [tên người thương] trân trọng kính mời chị cùng gia đình đến dự tiệc cưới của chúng em lúc [giờ] ngày [ngày]. Rất mong được đón chị ạ: [link thiệp]

> Em chào anh ạ. Em đã xin nghỉ phép từ [ngày] để lo đám cưới. Em gửi anh thiệp mời, rất mong anh dành chút thời gian đến chung vui cùng gia đình em ạ: [link thiệp]

## Lời mời cưới gửi thầy cô

Nhắc lại mình học lớp nào, khoá nào: thầy cô có rất nhiều lứa học trò.

> Em chào cô ạ. Em là [tên], học trò lớp [lớp] khoá [năm] của cô. Ngày [ngày] em kết hôn, em trân trọng kính mời cô đến dự tiệc cưới lúc [giờ] tại [địa điểm] ạ: [link thiệp]

> Thưa thầy, em là [tên], lớp [lớp] năm thầy chủ nhiệm. Bao năm rồi em vẫn nhớ những lời thầy dặn. Ngày [ngày] em lập gia đình, em mong được thầy đến chứng kiến ạ: [link thiệp]

> Em chào cô ạ. Em và [tên người thương] đều là học trò của cô, nên ngày vui này chúng em mong có cô nhất. Tiệc cưới lúc [giờ] ngày [ngày] ạ: [link thiệp]

> Em chào thầy ạ, em là [tên], học trò cũ của thầy ở trường [tên trường]. Em sắp cưới và rất muốn báo tin với thầy. Nếu thầy sắp xếp được, em mong thầy đến dự ngày [ngày] ạ: [link thiệp]

## Gửi người ở xa không về được

Mục đích là báo tin, không phải đòi người ta về.

> [Tên] ơi, tớ biết cậu đang ở [nơi], về không tiện, nhưng tin vui này tớ vẫn muốn cậu biết: tớ cưới vào [ngày]. Thiệp đây, cậu mở xem cho vui nhé: [link thiệp]

> Anh chị ở xa chắc khó về kịp, em chỉ muốn báo tin em và [tên người thương] cưới vào [ngày]. Anh chị mở thiệp xem chuyện của tụi em nhé: [link thiệp]

> Cô ơi, ngày [ngày] con cưới. Biết cô ở bên đó không về được, con vẫn gửi thiệp để cô cùng vui với cả nhà. Hôm cưới con gọi video cho cô ạ: [link thiệp]

> Cách nửa vòng trái đất mà ngày vui của tụi mình vẫn thấy thiếu bạn đó [tên]. Thiệp cưới đây, có lời chúc gì bạn viết luôn vào sổ lưu bút trong thiệp nha: [link thiệp]

## Tin nhắn nhắc lại trước ngày cưới

Ngắn hơn tin mời, gửi khoảng 2–3 ngày trước, kèm lại link để khách khỏi lục tin cũ.

> Chào [tên], tụi mình nhắc nhẹ nè: còn 3 ngày nữa là đám cưới rồi. Đón khách lúc [giờ] ngày [ngày] tại [địa điểm]. Bản đồ trong thiệp: [link thiệp]

> Cháu chào bác ạ. Cháu xin nhắc bác: [ngày] này, gia đình cháu đón khách lúc [giờ] tại [địa điểm]. Cháu mong được gặp bác ạ.

> Mai là ngày vui của tụi mình rồi! [Tên] nhớ giờ đón khách là [giờ] nha. Chỉ đường bấm vào đây: [link thiệp]

> Chị [tên] ơi, em cập nhật chút ạ: giờ đón khách đổi thành [giờ]. Thiệp đã sửa thông tin mới, chị mở lại link cũ là thấy ạ: [link thiệp]

> Còn [số] ngày nữa thôi! Ai chưa báo có đi hay không thì trả lời giúp tụi mình, để tụi mình chuẩn bị chỗ ngồi chu đáo nha: [link thiệp]

## Lời cảm ơn sau khi khách xác nhận tham dự

Cảm ơn ngắn khi khách trả lời, kể cả khi họ báo không đến được. Lời cảm ơn sau tiệc thì xem bài [lời cảm ơn sau đám cưới](/vi/blog/loi-cam-on-sau-dam-cuoi).

> Cảm ơn [tên] đã xác nhận nhé! Tụi mình ghi [số] người rồi, hẹn gặp bạn lúc [giờ] ngày [ngày].

> Cháu cảm ơn bác đã nhận lời ạ. Cả nhà cháu mong được đón bác ngày [ngày].

> Tiếc ghê vì [tên] không đến được, nhưng cảm ơn bạn đã báo cho tụi mình. Có dịp tụi mình hẹn bạn một bữa riêng nhé.

> Em nhận được xác nhận của anh chị rồi ạ. Cảm ơn anh chị đã dành thời gian cho tụi em, hẹn gặp anh chị ở [địa điểm] ạ.

> Em cảm ơn thầy đã nhận lời. Được thầy đến dự là niềm vui lớn của em và gia đình ạ.

## Có thiệp online, lời mời ngắn được hơn

Khi giờ giấc, bản đồ, lịch trình đã nằm trong link, tin nhắn chỉ cần lời mời. Còn phân vân giữa thiệp giấy và thiệp online thì xem bài [thiệp cưới online là gì](/vi/blog/thiep-cuoi-online-la-gi).

Ở Keemori, từ gói Gold, mỗi khách có một link mời riêng, mở ra là màn chào đích danh "Trân trọng kính mời: [tên khách]"; cách ghi tên cho đúng vai vế có trong bài [thiệp cưới ghi tên khách mời](/vi/blog/thiep-cuoi-ghi-ten-khach-moi). Khách xác nhận tham dự ngay trên thiệp, hai bạn xem ai đã trả lời trong "Thiệp của tôi" để gửi những lời cảm ơn ở trên; xem thêm bài [xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi). Chưa có thiệp thì [tạo thiệp cưới online miễn phí](/vi) từ [kho hơn 60 mẫu](/vi/mau-thiep).

## Câu hỏi thường gặp

### Tin nhắn mời cưới nên dài bao nhiêu?

Hai đến bốn câu: lời chào, báo tin kèm ngày cưới, lời mời và chữ ký. Chi tiết để tấm thiệp lo.

### Đã gửi link thiệp thì có cần ghi ngày giờ trong tin nhắn không?

Nên ghi ít nhất ngày cưới, vì nhiều người đọc tin nhưng chưa mở link ngay.

### Có cần gọi điện trước khi nhắn tin mời cưới không?

Với ông bà, họ hàng lớn tuổi, thầy cô và cấp trên, nhiều gia đình vẫn mời trực tiếp hoặc gọi điện trước. Với bạn bè, đồng nghiệp, tin nhắn riêng là đủ.

### Có nên ghi số tài khoản mừng cưới trong tin nhắn mời?

Không nên, vì dễ bị hiểu là nhắc chuyện tiền mừng. Nếu thiệp có hộp mừng cưới, khách ở xa muốn gửi quà sẽ tự tìm thấy; xem thêm bài [mã QR mừng cưới](/vi/blog/ma-qr-mung-cuoi).
`,
  },
  {
    slug: 'cach-ghi-thiep-cuoi',
    category: 'guide',
    title: 'Cách ghi thiệp cưới: tên bố mẹ, ngày âm lịch và giờ tiệc',
    excerpt:
      'Cách ghi thiệp cưới đủ ý: cần những thông tin gì, xưng hô bố mẹ hai bên ra sao, ghi ngày âm lịch thế nào cho đúng, và các lỗi nên soát trước khi gửi.',
    readingMinutes: 10,
    markdown: `
Cách ghi thiệp cưới gói gọn trong năm phần: tên bố mẹ hai bên kèm địa chỉ, tên cô dâu chú rể, tên lễ (vu quy hay thành hôn) cùng giờ và nơi làm lễ, ngày tổ chức ghi cả dương lịch lẫn âm lịch, rồi địa điểm tiệc với giờ đón khách và giờ khai tiệc. Thứ tự và xưng hô mỗi vùng, mỗi nhà khác nhau một chút, nhưng khung chung giống nhau. Dưới đây là từng phần, kèm mẫu câu và những lỗi hay khiến khách đến nhầm ngày.

## Nội dung thiệp cưới gồm những gì

Một tấm thiệp cưới đầy đủ thường có sáu nhóm thông tin:

1. **Thông tin hai họ**: họ tên bố mẹ chú rể, họ tên bố mẹ cô dâu, địa chỉ nhà trai và nhà gái.
2. **Tên cô dâu và chú rể**, thường kèm thứ bậc trong nhà như Trưởng nam, Thứ nữ.
3. **Tên lễ và nơi làm lễ**: Lễ thành hôn hoặc Lễ vu quy, thường làm tại tư gia, có giờ riêng.
4. **Ngày tổ chức**: thứ trong tuần, ngày dương lịch và ngày âm lịch đi kèm.
5. **Tiệc cưới**: tên nhà hàng hoặc địa chỉ, giờ đón khách, giờ khai tiệc.
6. **Lời mời và tên người được mời**.

Thiệp giấy truyền thống thường chia hai lớp: lớp ngoài báo hỷ, ghi tên lễ và ngày; lớp trong là giấy mời dự tiệc với tên khách, giờ và nơi đãi. Lễ ở tư gia thường chỉ họ hàng thân dự, còn tiệc thì mời rộng, nên tách bạch hai phần giúp khách biết ngay mình được mời đến đâu. Phần tên khách mời có bài riêng: [cách ghi tên khách mời trên thiệp cưới](/vi/blog/thiep-cuoi-ghi-ten-khach-moi).

## Cách ghi tên bố mẹ trên thiệp cưới

Mỗi họ một cột, mở đầu bằng "Nhà trai" hoặc "Nhà gái". Bên dưới là "Ông" trước họ tên bố, "Bà" trước họ tên mẹ, rồi đến địa chỉ. Ghi đủ họ, tên đệm và tên, không viết tắt.

![Khối thông tin hai gia đình trên mẫu Ái Tình và Đỏ Truyền Thống: tên bố mẹ, địa chỉ nhà trai, nhà gái và thứ bậc của con](/images/site/blog/cach-ghi-thiep-cuoi/thong-tin-hai-gia-dinh.jpg)

> Nhà trai
>
> Ông: Nguyễn Văn Sơn
>
> Bà: Trần Thu Hà
>
> Địa chỉ: An Hòa, Phú Yên

Thiệp do nhà nào phát thì nhà đó thường đứng trước, tức cột bên trái hoặc dòng trên. Nếu hai nhà làm hai bộ thiệp riêng, xem thêm [thiệp cưới nhà trai nhà gái khác nhau ở đâu](/vi/blog/thiep-cuoi-nha-trai-nha-gai).

Ngay dưới thông tin hai họ là câu báo tin, rồi tên hai bạn kèm thứ bậc:

> Trân trọng báo tin lễ thành hôn của con chúng tôi
>
> Nguyễn Hoàng Kiên (Trưởng nam) và Nguyễn Phương Khanh (Trưởng nữ)

Một kiểu quen thuộc khác đặt tên bố mẹ vào ngay trong câu: "Ông bà Nguyễn Văn Sơn hân hạnh báo tin lễ thành hôn của con trai là…". Kiểu nào cũng được, miễn hai họ dùng cùng một kiểu.

Thứ bậc ghi theo vị trí trong nhà: Trưởng nam, Thứ nam, Út nam cho con trai; Trưởng nữ, Thứ nữ, Út nữ cho con gái. Nếu một bên ghi kèm chức danh hay học hàm trước tên bố mẹ, bên kia nên được hỏi ý, để thiệp không lệch.

### Khi bố hoặc mẹ đã mất

Đây là chỗ không có công thức chung. Ba cách thường gặp:

- Vẫn ghi tên người đã khuất, thêm chữ "Cố" phía trước hoặc "(đã mất)" phía sau, để bố hoặc mẹ vẫn có mặt trên thiệp cưới của con.
- Chỉ ghi tên bố hoặc mẹ còn sống.
- Khi cả bố và mẹ đều đã mất, người đứng tên là ông bà, chú bác hoặc anh chị cả, tức người đứng ra làm chủ hôn.

Cách nào cũng chạm tới cảm xúc của người còn lại trong nhà, nên đừng tự quyết từ bản nháp: hỏi bố hoặc mẹ còn sống và người lớn trong họ rồi mới in hay gửi. Bố mẹ đã chia tay cũng vậy, hỏi cả hai người xem ai đứng tên.

## Lễ vu quy hay lễ thành hôn: ghi theo nhà phát thiệp

Hai tên lễ này không dùng thay cho nhau được. "Vu quy" nghĩa là con gái về nhà chồng: lễ vu quy là lễ ở nhà gái, khi gia đình làm lễ gia tiên và tiễn con đi. "Thành hôn" là lễ thành vợ chồng, làm ở nhà trai khi đón dâu về. Vì vậy:

![Khối Nghi lễ trên mẫu Ái Tình và Đỏ Truyền Thống: lễ ăn hỏi, lễ vu quy ở nhà gái, lễ thành hôn ở nhà trai, mỗi lễ một giờ và địa điểm](/images/site/blog/cach-ghi-thiep-cuoi/nghi-le-vu-quy-thanh-hon.jpg)

- Thiệp nhà gái ghi **Lễ vu quy**.
- Thiệp nhà trai ghi **Lễ thành hôn** (một số nơi dùng chữ Lễ tân hôn).
- Hai nhà đãi chung một tiệc và phát chung một thiệp thì thường ghi Lễ thành hôn.

Lễ ăn hỏi, nếu có mời, là một lễ riêng với ngày giờ riêng, ghi tách hẳn. Trình tự từng lễ bên nhà gái có trong bài [nghi thức lễ cưới ở nhà gái](/vi/blog/nghi-thuc-le-cuoi-o-nha-gai).

Câu ghi lễ thường có dạng:

> Lễ thành hôn được cử hành tại tư gia vào lúc 9 giờ 00, Chủ nhật, ngày 22 tháng 11 năm 2026 (tức ngày 14 tháng 10 năm Bính Ngọ)

## Cách ghi ngày âm lịch trên thiệp cưới

Ngày âm đi ngay sau ngày dương, đặt trong ngoặc, mở đầu bằng chữ "tức". Năm âm lịch ghi bằng can chi chứ không ghi số: năm 2026 là **Bính Ngọ**, năm 2027 là **Đinh Mùi**.

Không muốn tự tra lịch thì dùng [công cụ đổi ngày âm dương](/vi/cong-cu/doi-ngay-am-duong): nhập ngày dương là ra ngày âm, thứ trong tuần và năm can chi, kèm sẵn dòng “tức ngày… năm…” để chép lên thiệp.

> Chủ nhật, ngày 22 tháng 11 năm 2026 (tức ngày 14 tháng 10 năm Bính Ngọ)

Ba chỗ dễ sai:

- **Đầu năm dương lịch, năm âm lịch chưa đổi.** Tết Đinh Mùi rơi vào ngày 6 tháng 2 năm 2027. Đám cưới vào tháng 1 năm 2027 vẫn thuộc năm Bính Ngọ: Chủ nhật 17/1/2027 là "tức ngày 10 tháng 12 năm Bính Ngọ", không phải Đinh Mùi.
- **Tên tháng.** Tháng 1 âm còn gọi là tháng Giêng, tháng 11 là tháng Một, tháng 12 là tháng Chạp. Ghi "tháng Chạp" vừa đẹp vừa rõ; nhưng "tháng Một" dễ bị đọc thành tháng 1, nên với tháng 11 âm cứ ghi số cho chắc.
- **Tháng nhuận.** Nếu ngày cưới rơi vào tháng nhuận, ghi rõ "tháng … nhuận", vì năm đó cùng một ngày âm sẽ xuất hiện hai lần.

Nếu ngày cưới do người lớn xem theo âm lịch, coi ngày âm đó là gốc rồi mới đổi sang dương, tra bằng lịch vạn niên và nhờ người đã chọn ngày đối chiếu lại. Người lớn tuổi thường đọc dòng âm lịch trước, nên sai ở đây là bị phát hiện đầu tiên.

## Ghi giờ đón khách và giờ khai tiệc

Phần tiệc nên có hai mốc giờ: **giờ đón khách** là lúc hai họ đứng đón và khách bắt đầu vào; **giờ khai tiệc** là lúc bắt đầu nghi thức trên sân khấu và lên món. Hai mốc thường cách nhau 30 phút đến một tiếng.

> Tiệc cưới tổ chức tại Trung tâm tiệc cưới …, sảnh …, số …, đường …, phường …, tỉnh …
>
> Đón khách: 17 giờ 00 · Khai tiệc: 17 giờ 30

Chỉ ghi một giờ thì nửa số khách hiểu đó là giờ đến, nửa còn lại hiểu là giờ ăn. Ghi cả hai thì ai muốn chụp ảnh, gửi quà đến sớm, ai bận vẫn kịp giờ khai tiệc. Vài chi tiết đáng thêm:

- **Tên sảnh hoặc tầng.** Trung tâm tiệc cưới thường có nhiều sảnh, nhiều đám trong cùng một ngày.
- **Một kiểu ghi giờ cho cả thiệp.** "17 giờ 30" hay "17h30" đều được, nhưng đừng để dòng trên ghi "5 giờ chiều", dòng dưới ghi "17 giờ".
- **Tư gia ở quê không có số nhà**: thêm một mốc dễ nhận như đầu ngõ, cạnh trường học, gần cây xăng.

## Những lỗi hay gặp khi ghi thiệp cưới

Phần lớn lỗi trong cách ghi thiệp cưới không nằm ở câu chữ hoa mỹ mà nằm ở con số và chính tả:

- **Thứ trong tuần không khớp ngày.** Chép thiệp năm trước rồi chỉ sửa ngày là cách nhanh nhất để có dòng "Thứ Bảy, ngày 22 tháng 11 năm 2026", trong khi ngày đó là Chủ nhật. Khách thấy hai thông tin chọi nhau sẽ không biết tin cái nào.
- **Thiếu chỉ đường.** Chỉ ghi tên nhà hàng trong khi nhà hàng có hai, ba chi nhánh; hoặc chỉ ghi "tư gia nhà trai" mà khách ở xa chưa từng đến.
- **Viết hoa tuỳ tiện.** "Lễ Thành Hôn" ở dòng này, "lễ thành hôn" ở dòng kia. Chọn một quy ước (viết hoa tên riêng và chữ đầu câu, tiêu đề lớn có thể in hoa toàn bộ) rồi giữ cho cả tấm thiệp.
- **Sai chính tả tên.** Thùy hay Thuỳ, Mỹ hay Mĩ, Kỳ hay Kì: hỏi chính người đó viết thế nào, đừng đoán. Tên bố mẹ thì đối chiếu với giấy tờ.
- **Giờ giấc ngược nhau.** Giờ đón khách muộn hơn giờ khai tiệc, hay lễ thành hôn ghi sớm hơn lễ vu quy trong cùng một buổi sáng, trong khi dâu phải được đón từ nhà gái trước.

Trước khi in hay gửi, đọc to toàn bộ thiệp cho một người khác nghe. Lỗi ngày giờ hay lọt qua mắt, nhưng hiếm khi lọt qua tai.

## Cách ghi thiệp cưới online để không sót mục nào

Thiệp giấy bắt bạn tự nhớ cho đủ mục. Thiệp online chia nội dung theo từng phần, mỗi thông tin một ô riêng. Ở Keemori chẳng hạn:

- **Thông tin cặp đôi**: họ tên đầy đủ, tên gọi thân mật và ô "Con thứ mấy" để ghi Trưởng nam, Thứ nữ.
- **Thông tin gia đình**: họ tên bố mẹ hai bên, địa chỉ nhà trai và nhà gái.
- **Nghi lễ**: chọn Lễ ăn hỏi, Lễ vu quy, Lễ thành hôn hoặc tự đặt tên cho lễ khác; một thiệp có thể có nhiều lễ, mỗi lễ có ngày giờ, địa điểm, lời thông báo và nút chỉ đường Google Maps riêng.
- **Tiệc cưới**: ngày tiệc, giờ đón khách, giờ khai tiệc, địa chỉ nhà hàng kèm bản đồ.

Mỗi giờ một ô thì khó quên một trong hai; khối nào gia đình không dùng thì tắt đi. Bố cục, phông chữ và màu do mẫu quyết định, bạn chỉ lo phần chữ. Mẫu [Đào Hoa](/vi/mau-thiep/dao-hoa) chẳng hạn chia ruột thiệp làm hai trang: trang trái cho lời mời và tên hai bạn, trang phải cho lễ thành hôn, ngày giờ và thông tin gia đình, đúng kiểu thiệp gấp truyền thống.

Lợi thế lớn nhất là sửa được sau khi đã gửi: lỡ ghi sai giờ đón khách, bạn mở thiệp trong mục Thiệp của tôi, sửa rồi lưu; đường dẫn giữ nguyên nên ai mở lại link cũ cũng thấy bản đúng. Riêng tên hai bạn và tên bố mẹ thì vẫn nên soát kỹ trước lần gửi đầu tiên.

Bạn có thể [tạo thiệp cưới online miễn phí](/vi) và xem thử ngay khi điền, hoặc mở [hướng dẫn tạo thiệp](/vi/huong-dan) để đối chiếu từng ô nhập với vị trí nó hiện trên thiệp.

## Câu hỏi thường gặp

### Thiệp cưới ghi tên bố mẹ hay tên ông bà?

Thường ghi tên bố mẹ, vì bố mẹ là người đứng ra tổ chức. Ông bà, chú bác hay anh chị cả đứng tên khi bố mẹ đã mất, hoặc khi gia đình muốn người lớn hơn làm chủ hôn.

### Cưới đầu năm 2027 thì ghi năm âm lịch là gì?

Từ ngày 6/2/2027 trở đi là năm Đinh Mùi. Đám cưới trước ngày đó, kể cả trong tháng 1/2027, vẫn ghi năm Bính Ngọ.

### Có bắt buộc ghi ngày âm lịch trên thiệp cưới không?

Không bắt buộc, nhưng phần lớn thiệp cưới Việt đều có. Người lớn tuổi quen tính ngày theo âm lịch, và ngày cưới cũng thường được chọn theo âm.

### Thiệp cưới online có sửa được sau khi đã gửi không?

Có. Bạn sửa nội dung rồi lưu; đường dẫn thiệp giữ nguyên nên khách mở lại link đã nhận là thấy thông tin mới.
`,
  },
  {
    slug: 'ma-qr-mung-cuoi',
    category: 'experience',
    title: 'Mã QR mừng cưới trên thiệp: có nên để và đặt sao cho tế nhị',
    excerpt:
      'Mã QR mừng cưới giúp khách ở xa gửi quà dễ hơn. Có nên để trên thiệp, đặt ở đâu cho tế nhị, kiểm tra tài khoản ra sao và cách nhận ra thiệp cưới giả mạo.',
    readingMinutes: 9,
    markdown: `
Có thể để mã QR mừng cưới trên thiệp mời, miễn là đặt đúng chỗ và dùng lời lẽ nhẹ nhàng: để ở cuối thiệp, dành cho người ở xa hoặc quen chuyển khoản, không đặt ở bìa và không nhắc lại trong tin nhắn mời. Nhiều khách thấy cách này tiện, nhưng một số người lớn tuổi có thể chưa quen, nên hãy hỏi ý bố mẹ hai bên trước khi quyết. Và trước khi gửi thiệp, kiểm tra thật kỹ tên chủ tài khoản rồi tự quét thử mã một lần.

## Vì sao nhiều cặp đôi thêm mã QR mừng cưới vào thiệp

Trước đây, khách không về dự được thường gửi phong bì nhờ người khác cầm hộ, hoặc gọi điện xin số tài khoản. Mừng cưới chuyển khoản không có gì mới; cái mới là thông tin đó nằm sẵn trên thiệp, để khách khỏi phải hỏi.

- **Khách ở xa không về được.** Bạn bè làm việc ở tỉnh khác, người thân ở nước ngoài, đồng nghiệp trùng lịch công tác vẫn muốn gửi chút quà mừng. Có mã QR, họ không phải nhắn hỏi số tài khoản, một câu mà nhiều người thấy ngại mở lời.
- **Nhiều người đã quen chuyển khoản.** Người trẻ ít mang tiền mặt bên mình, và với họ, quét mã là cách tự nhiên nhất.
- **Đỡ nhầm lẫn.** Đọc số tài khoản qua điện thoại hay gõ lại từ tin nhắn rất dễ sai một chữ số. Mã QR mang sẵn ngân hàng và số tài khoản, khách quét là xong.
- **Dễ cảm ơn sau đó.** Giao dịch chuyển khoản thường lưu tên người gửi kèm lời nhắn, nên hai bạn có sẵn danh sách để gửi [lời cảm ơn sau đám cưới](/vi/blog/loi-cam-on-sau-dam-cuoi) tới đúng người.

## Có nên để QR mừng cưới trên thiệp không?

Câu trả lời ngắn: nên, nếu gia đình thấy thoải mái. Nhưng hãy nghe cả hai phía trước khi quyết.

**Phía thấy tiện** thường là người trẻ, khách ở xa, khách quen thanh toán bằng điện thoại. Với họ, thiệp có QR cũng giống thiệp có bản đồ: thêm một thông tin để khỏi phải nhắn hỏi.

**Phía chưa quen** thường là một số người lớn tuổi. Với họ, tiền mừng là thứ trao tận tay trong ngày cưới, đi cùng lời chúc và cái bắt tay. Thấy mã chuyển khoản trên thiệp, có người sẽ cảm giác như đang được nhắc chuyện quà cáp. Cảm giác đó không sai, và nó là lý do để đặt QR thật khéo chứ không nhất thiết phải bỏ hẳn.

Ranh giới nằm ở cách đặt và lời dẫn, không nằm ở chiếc mã. Một mã QR ở cuối thiệp kèm câu "dành cho ai ở xa" khác rất xa một mã QR to giữa trang bìa. Nếu thiệp gửi cho cả họ hàng, hãy hỏi bố mẹ hai bên một câu trước khi bật. Mỗi gia đình một quan niệm, và đây là chuyện của cả hai nhà chứ không riêng hai bạn.

## Cách đặt mã QR mừng cưới cho tế nhị

### Đặt ở cuối thiệp, không đặt ở bìa

Thứ tự trên thiệp tự nói lên điều gì quan trọng nhất. Bìa và phần đầu dành cho lời mời, tên hai bạn, ngày giờ và địa điểm. Hộp mừng cưới nên đứng sau tất cả những thứ đó, gần sổ lưu bút và lời cảm ơn, để khách thấy nó là một lựa chọn chứ không phải điều kiện đi kèm lời mời.

### Dùng lời dẫn nhẹ nhàng, nhắm đúng người ở xa

Lời dẫn quyết định giọng của cả khối. Vài mẫu câu có thể dùng:

> Nếu không thể đến chung vui cùng chúng mình, bạn có thể gửi lời chúc qua đây.

> Dành cho những ai ở xa muốn gửi chút yêu thương tới hai đứa.

> Sự có mặt của bạn là món quà quý nhất. Nếu ở xa, bạn có thể gửi lời chúc qua đây.

Tránh những câu như "quà mừng xin gửi về", "mừng cưới vui lòng chuyển khoản", và tuyệt đối không ghi số tiền gợi ý.

### Không nhắc lại trong tin nhắn mời

Tin nhắn gửi kèm link chỉ nên làm một việc: mời. Thêm câu "thiệp có QR mừng cưới nhé" là biến lời mời thành lời nhờ. Ai cần sẽ tự thấy khi đọc đến cuối thiệp. Nếu đang soạn câu mời, xem thêm [các mẫu tin nhắn mời cưới](/vi/blog/tin-nhan-moi-cuoi) để có câu gọn mà không lạc giọng.

### Với thiệp giấy, in mã mở thiệp thay vì mã chuyển khoản

Nếu hai bạn in thêm thiệp giấy cho người lớn tuổi, mã nên in lên đó là mã QR mở thiệp online: khách quét là xem được bản đồ, giờ giấc và mọi thông tin khác. Mã chuyển khoản in thẳng lên mặt thiệp giấy trông lộ liễu hơn nhiều so với một khối nhỏ nằm cuối thiệp online.

Mã mở thiệp tạo được từ chính đường link thiệp bằng [công cụ tạo mã QR](/vi/cong-cu/tao-ma-qr), tải về ảnh PNG nền trắng đủ nét để in.

## Kiểm tra gì trước khi gửi thiệp có mã QR mừng cưới

Một mã QR sai không báo lỗi; nó chỉ lặng lẽ đưa tiền tới nhầm chỗ. Trước khi gửi:

1. **Dùng tài khoản đứng tên chính cô dâu hoặc chú rể.** Khi khách quét, ứng dụng ngân hàng sẽ hiện tên người nhận. Tên khớp với tên trên thiệp thì khách yên tâm; tên của anh chị, bạn bè hay một công ty thì khách dễ chần chừ, nhất là khi ai cũng đã quen cảnh giác với lừa đảo.
2. **Kiểm tra tên chủ tài khoản**: đúng chính tả, đúng như ngân hàng đang ghi.
3. **Kiểm tra ngân hàng và từng chữ số tài khoản.** Mã QR chỉ mã hoá đúng những gì bạn nhập: sai một số là khách chuyển nhầm người.
4. **Quét thử bằng một điện thoại khác.** Mở ứng dụng ngân hàng, quét mã trên thiệp và dừng ở bước xác nhận để xem tên người nhận hiện ra có đúng không. Nhờ thêm một người thân quét thử càng tốt.
5. **Bật thông báo biến động số dư** cho tài khoản nhận, để biết ai đã gửi mà kịp cảm ơn.

Nếu thiệp có cả tài khoản của chú rể lẫn cô dâu, hãy kiểm tra cả hai. Khách thường tự chọn gửi cho bên mình quen, nên sai ở tài khoản nào cũng là sai với một nhóm khách.

## Cảnh giác thiệp cưới giả mạo: thiệp thật chỉ là một trang web

Có một kiểu lừa đảo lợi dụng đúng thói quen nhận thiệp qua điện thoại. Kẻ gian nhắn tin qua Zalo, có khi từ tài khoản lạ, có khi từ tài khoản người quen đã bị chiếm, gửi kèm một "thiệp mời cưới online" thực chất là file cài đặt có đuôi **.apk** và giục người nhận cài vào để xem. Cài vào rồi, ứng dụng lạ đó có thể chiếm quyền điện thoại, đánh cắp thông tin và tìm cách lấy tiền trong tài khoản ngân hàng.

Vài nguyên tắc nên nhắc cả nhà, nhất là bố mẹ và ông bà:

- **Thiệp cưới online thật là một đường link web.** Bấm vào là mở bằng trình duyệt, hoặc ngay trong Zalo, Messenger. Không có tấm thiệp nào cần cài ứng dụng mới xem được.
- **Không mở file .apk** hay bất kỳ file cài đặt nào gửi qua tin nhắn, dù người gửi là ai.
- **Thiệp không bao giờ đòi đăng nhập ngân hàng, mã OTP hay mật khẩu.** Mã QR mừng cưới chỉ để khách tự quét bằng ứng dụng ngân hàng của chính mình, và chuyển hay không là quyền của khách.
- **Nghi ngờ thì gọi hỏi.** Một cuộc gọi cho người gửi mất một phút, rẻ hơn rất nhiều so với một chiếc điện thoại bị chiếm quyền.

Về phía hai bạn, cách giúp khách yên tâm là gửi thiệp từ chính tài khoản của mình, kèm vài câu mời có xưng hô riêng, và chỉ gửi link chứ không gửi file. Muốn hiểu rõ thiệp online vận hành thế nào, xem bài [thiệp cưới online là gì](/vi/blog/thiep-cuoi-online-la-gi) và hướng dẫn [gửi thiệp cưới online qua Zalo](/vi/blog/cach-gui-thiep-cuoi-online-qua-zalo).

## Khi gia đình không muốn để QR

Nếu bố mẹ không thoải mái, cứ tắt hộp mừng cưới. Đây không phải phần bắt buộc của thiệp. Người ở xa muốn gửi quà sẽ tự nhắn hỏi, và hai bạn gửi số tài khoản riêng cho đúng người đó.

Một tấm thiệp không có QR không hề thiếu sót; nó chỉ chọn cách làm truyền thống hơn. Điều quan trọng là cả hai nhà cùng thấy dễ chịu khi thiệp được chuyền tay trong nhóm họ hàng.

## Hộp mừng cưới online trên Keemori

Trên Keemori, **hộp mừng cưới (QR)** có ngay từ gói Free; quyền lợi từng gói xem ở [bảng giá](/vi/bang-gia). Hai bạn nhập ngân hàng, số tài khoản và tên chủ tài khoản cho chú rể và cô dâu, mã QR được tạo tự động từ những thông tin đó, không cần tự chụp hay tải ảnh mã lên. Như mọi khối khác trên thiệp, hộp mừng cưới bật hoặc tắt được bất cứ lúc nào.

![Hộp mừng cưới trên mẫu Sen Việt: hai phong bì của chú rể và cô dâu; chạm vào phong bì hiện mã QR, nút copy số tài khoản và tải mã QR](/images/site/blog/ma-qr-mung-cuoi/hop-mung-cuoi.jpg)

Có một chi tiết nhỏ nhưng hay bị quên: khách mở thiệp trên chính điện thoại thì không thể quét mã đang hiện trên màn hình đó. Vì vậy hộp mừng cưới có sẵn nút sao chép số tài khoản và nút tải mã QR về máy, để khách chọn ảnh mã trong ứng dụng ngân hàng hoặc chuyển khoản như bình thường.

Mỗi mẫu trình bày hộp mừng cưới theo phong cách riêng. Ở [mẫu Đỏ Burgundy](/vi/mau-thiep/do-burgundy), khách mở một chiếc phong bì để xem thẻ QR; Mận Chín đặt hộp mừng trên mảng màu mận đặc cùng tông với cả thiệp; còn Thanh Sử dùng đường viền vẽ tay hơi rung như trang sổ ký hoạ. Nếu chưa có thiệp, hai bạn có thể [tạo thiệp cưới online miễn phí](/vi), điền thử thông tin và xem hộp mừng cưới hiện ra thế nào trước khi quyết định bật hay tắt.

## Câu hỏi thường gặp

### Để mã QR mừng cưới trên thiệp có bị coi là đòi quà không?

Phần lớn tuỳ vào cách đặt. Đặt ở cuối thiệp với lời dẫn dành cho người ở xa thì khách thường hiểu đó là một lựa chọn; đặt ở bìa hoặc nhắc lại trong tin nhắn mời mới dễ gây cảm giác khó chịu.

### Nên dùng tài khoản của ai để nhận mừng cưới chuyển khoản?

Nên dùng tài khoản đứng tên chính cô dâu hoặc chú rể. Tên người nhận khớp với tên trên thiệp giúp khách yên tâm rằng mình không chuyển nhầm hay gặp kẻ mạo danh.

### Làm sao nhận biết thiệp cưới online giả mạo?

Thiệp thật là một đường link web mở bằng trình duyệt, không bắt cài ứng dụng và không hỏi thông tin ngân hàng. Tin nhắn gửi file .apk hay giục cài đặt để "xem thiệp" thì đừng mở, hãy gọi hỏi lại người gửi.

### Khách xem thiệp trên điện thoại thì quét mã QR bằng cách nào?

Khách lưu ảnh mã QR về máy rồi chọn ảnh đó trong ứng dụng ngân hàng, hoặc sao chép số tài khoản để chuyển như bình thường. Trên thiệp Keemori, hộp mừng cưới có sẵn nút tải mã QR và nút sao chép số tài khoản.

### Thiệp cưới online miễn phí có hộp mừng cưới không?

Tuỳ dịch vụ. Trên Keemori, hộp mừng cưới (QR) có ngay từ gói Free và bật, tắt được tuỳ ý gia đình.
`,
  },
  {
    slug: 'lich-trinh-ngay-cuoi',
    category: 'guide',
    title: 'Lịch trình ngày cưới từ sáng đến tối: mẫu giờ giấc cho hai nhà',
    excerpt:
      'Lịch trình ngày cưới mẫu từ trang điểm, lễ gia tiên, rước dâu đến tiệc tối, kèm mẹo dự phòng giờ di chuyển và cách chọn mốc giờ nào nên đưa lên thiệp mời.',
    readingMinutes: 9,
    markdown: `
Một lịch trình ngày cưới làm lễ ở nhà và đãi tiệc ở nhà hàng thường đi theo thứ tự: trang điểm từ sáng sớm, lễ gia tiên nhà gái, rước dâu, lễ gia tiên nhà trai, rồi đến tiệc với ba mốc đón khách, làm lễ trên sân khấu và khai tiệc. Giờ cụ thể phụ thuộc vào giờ lành gia đình chọn và quãng đường giữa hai nhà, nên các mốc trong bài chỉ là ví dụ để hai bạn chỉnh theo. Còn trên thiệp mời, khách thường chỉ cần ba mốc: giờ đón khách, giờ làm lễ và giờ khai tiệc.

## Một ngày cưới gồm những phần nào

Phần lớn các timeline đám cưới đều chia thành ba phần, dù tên gọi và chi tiết khác nhau theo vùng miền và theo từng nhà:

- **Chuẩn bị**: trang điểm, làm tóc, thay trang phục, chụp ảnh trước lễ.
- **Phần lễ ở nhà**: nhà trai sang xin dâu, lễ gia tiên nhà gái (lễ vu quy), rước dâu, lễ gia tiên nhà trai (lễ thành hôn). Chi tiết từng lễ có trong hai bài [nghi thức lễ cưới ở nhà gái](/vi/blog/nghi-thuc-le-cuoi-o-nha-gai) và [nghi thức lễ cưới ở nhà trai](/vi/blog/nghi-thuc-le-cuoi-o-nha-trai).
- **Phần tiệc**: đón khách, làm lễ trên sân khấu, khai tiệc, chào bàn, tiễn khách.

Không phải nhà nào cũng gói cả ba phần vào một ngày: có nhà tổ chức tiệc nhà gái và tiệc nhà trai vào hai ngày khác nhau, có nhà đãi cỗ ngay tại nhà, có nhà chỉ làm lễ gia tiên với họ hàng gần rồi mời bạn bè dự tiệc tối. Hai lịch trình mẫu dưới đây ứng với hai cách hay gặp.

## Giờ lành đi trước, lịch trình đi sau

Nhiều gia đình xem giờ lành cho lễ xin dâu, lễ gia tiên hoặc giờ đưa dâu ra khỏi nhà. Những mốc đó là cố định; trang điểm, xe hoa, thợ ảnh hay giờ tiệc đều phải dựng quanh chúng. Vì vậy hãy hỏi người lớn hai bên mốc nào "không được lệch" trước khi chốt giờ với ekip và nhà hàng, đừng đặt thợ trước rồi mới hỏi giờ lành.

## Lịch trình ngày cưới mẫu 1: lễ ở nhà buổi sáng, tiệc nhà hàng buổi tối

Đây là lịch trình đám cưới từ sáng đến tối cho trường hợp hai nhà cách nhau khoảng nửa tiếng đến một tiếng đi xe, làm lễ gia tiên buổi sáng và đãi tiệc tối ở nhà hàng. Giờ làm lễ lấy theo ví dụ trên thiệp mẫu của Keemori; hai bạn thay bằng giờ lành của gia đình mình.

Buổi sáng:

- 05:00 — Cô dâu trang điểm, làm tóc tại nhà gái. Nhà gái hoàn tất bàn thờ và bàn trà tiếp khách.
- 07:00 — Chú rể chuẩn bị xong, đoàn nhà trai tập trung và xuất phát.
- 08:00 — Đoàn nhà trai đến xin dâu, làm lễ gia tiên tại nhà gái.
- 09:00 — Chụp ảnh cùng gia đình nhà gái, xin phép đưa dâu.
- 09:45 — Đoàn rước lên đường về nhà trai.
- 10:30 — Đón dâu về nhà trai, lễ gia tiên nhà trai, ra mắt họ hàng bên nội.
- 11:30 — Cơm thân mật cùng gia đình, sau đó nghỉ ngơi.

Buổi chiều và tối:

- 15:00 — Cô dâu trang điểm lại, thay váy cưới; chú rể thay trang phục dự tiệc.
- 16:30 — Có mặt ở nhà hàng, chụp ảnh ở khu backdrop, duyệt lại kịch bản với MC và quản lý sảnh.
- 17:30 — Đón khách. Bố mẹ hai bên cùng cô dâu chú rể đứng ở cửa sảnh.
- 18:30 — Làm lễ trên sân khấu: MC giới thiệu, đại diện gia đình phát biểu, cô dâu chú rể làm các nghi thức theo kịch bản, rồi khai tiệc.
- 19:30 — Cô dâu chú rể đi chào từng bàn, chụp ảnh cùng gia đình và bạn bè.
- 20:30 — Tiễn khách, đối chiếu số bàn thực tế với nhà hàng.

Nếu đãi tiệc trưa thay vì tiệc tối, phần tiệc dời lên ngay sau lễ: đón khách khoảng 11:00, khai tiệc khoảng 11:30 đến 12:00. Khi đó phần lễ buổi sáng phải bắt đầu sớm hơn để cô dâu chú rể kịp có mặt ở nhà hàng, và gần như không còn khoảng nghỉ, nên hãy bàn với chuyên viên trang điểm một lớp trang điểm giữ được cả ngày.

## Lịch trình mẫu 2: chỉ có tiệc tối ở nhà hàng

Mẫu này dành cho tiệc mà khách chỉ dự phần tiệc, còn lễ gia tiên đã làm riêng hôm khác hoặc buổi sáng chỉ có hai gia đình.

- 16:00 — Cô dâu chú rể có mặt ở nhà hàng, chụp ảnh ở khu backdrop.
- 17:00 — Gia đình hai bên có mặt, duyệt lần cuối kịch bản với MC.
- 17:30 — Đón khách.
- 18:00 — Làm lễ thành hôn trên sân khấu.
- 18:30 — Khai tiệc.
- 19:30 — Chụp ảnh cùng gia đình, đi chào từng bàn.
- 20:00 — Giao lưu, văn nghệ nếu có.
- 21:00 — Tiễn khách.

Lịch trình buổi tối gọn hơn, nhưng phải tính kỹ giờ kết thúc sảnh: nhiều nhà hàng chia ca và cần trả sảnh đúng giờ, nên hãy hỏi quản lý sảnh trước khi xếp văn nghệ hay trò chơi cuối tiệc.

## Giờ đón khách tiệc cưới nên ghi thế nào

Giờ đón khách tiệc cưới là mốc khách dựa vào để tính giờ rời nhà, nên cần ghi thật rõ.

- **Ghi hai mốc tách bạch**: giờ đón khách và giờ khai tiệc. Khách biết nên đến trong khoảng nào, và người đến đúng giờ khai tiệc cũng không bị coi là muộn.
- **Để khoảng cách vừa phải.** Giữa đón khách và khai tiệc thường là nửa tiếng đến một tiếng, đủ để khách chụp ảnh, gửi quà, tìm bàn mà chưa ai phải ngồi đợi quá lâu.
- **Ghi đúng giờ khai tiệc thật.** Ghi sớm hơn "cho khách đến sớm" chỉ khiến người đúng giờ phải ngồi chờ, và lần sau chính họ sẽ chủ động đi muộn.
- **Ghi cả giờ làm lễ trên sân khấu** nếu có, để người thân muốn chứng kiến phần này biết mà đến kịp.

## Mẹo dự phòng thời gian di chuyển

Lịch trình ngày cưới hiếm khi trễ vì một việc lớn, mà vì nhiều việc nhỏ cộng dồn: chờ đủ người lên xe, đoàn xe đi chậm để bám nhau, tắc đường, quên một món đồ phải quay lại lấy. Vài cách giữ lịch:

- **Đi thử quãng đường** giữa nhà gái, nhà trai và nhà hàng vào đúng khung giờ và đúng thứ trong tuần của ngày cưới.
- **Cộng thêm 15 đến 30 phút** cho mỗi chặng so với thời gian bản đồ báo. Một đoàn xe luôn đi chậm hơn một chiếc xe đi một mình.
- **Tính dư vào ngày đẹp**, khi nhiều nhà cùng chọn cưới và đường quanh các nhà hàng tiệc cưới đông hơn hẳn.
- **Hai nhà ở xa nhau** thì tính cả giờ nghỉ dọc đường, và cân nhắc gộp lễ. Bài [rước dâu một lần hay hai lần](/vi/blog/ruoc-dau-mot-lan-hay-hai-lan) nói rõ hơn chuyện gộp lễ khi hai nhà ở xa.
- **Giao một người cầm giờ.** Một anh chị em hoặc bạn thân giữ bản lịch trình, gọi xe, nhắc thợ ảnh, để cô dâu chú rể không phải liếc đồng hồ cả ngày.
- **Có mặt trước giờ lành vài phút**, đừng canh đến đúng phút. Đến sớm còn kịp chỉnh áo, chỉnh hoa; đến sát giờ thì cả buổi lễ chạy theo nhịp vội.

## Lịch trình nào đưa lên thiệp, lịch trình nào giữ nội bộ

Hai bạn cần hai bản lịch trình: một cho khách, một cho người làm việc.

### Bản cho khách: chỉ những mốc khách cần

Lịch trình ngày cưới trên thiệp chỉ cần những mốc khách phải có mặt; không ai cần biết mấy giờ cô dâu trang điểm hay mấy giờ xe hoa xuất phát. Ba đến năm mốc là vừa, ví dụ:

- 17:30 — Đón khách
- 18:00 — Lễ thành hôn
- 18:30 — Khai tiệc
- 19:30 — Chụp ảnh cùng gia đình

Nếu mời họ hàng gần dự lễ gia tiên buổi sáng, ghi mốc đó ở phần nghi lễ kèm địa chỉ nhà riêng, tách khỏi giờ tiệc, để bạn bè chỉ dự tiệc không hiểu nhầm rằng mình phải có mặt từ sáng.

### Bản nội bộ: cho hai nhà và ekip

Bản này chi tiết đến từng mười lăm phút, ghi rõ ai phụ trách việc gì kèm số điện thoại đầu mối: ekip trang điểm, thợ ảnh, MC, đội bê tráp, tài xế xe hoa, quản lý sảnh. Gửi trước vài ngày, và in thêm vài bản giấy cho người lớn cùng người cầm giờ. Mỗi nhà nên có bản phần việc của riêng mình: nhà gái lo đón đoàn rước, nhà trai lo xe hoa và lễ gia tiên bên mình.

## Đưa lịch trình lên thiệp cưới online

Thiệp giấy in xong là cố định giờ giấc. Thiệp online thì sửa được, nên lịch trình trên đó luôn là bản mới nhất. Nếu hai bạn [tạo thiệp cưới online](/vi) trên Keemori, các mốc giờ nằm ở mấy khối sau:

- **Lịch trình**: mỗi hoạt động có giờ bắt đầu, giờ kết thúc bỏ trống được, và một loại hoạt động như đón khách, lễ gia tiên, rước dâu, lễ thành hôn, khai tiệc, cắt bánh hay chụp ảnh. Ở các mẫu có biểu tượng, mỗi hoạt động hiện một biểu tượng vẽ theo phong cách của mẫu; để chế độ tự động thì hệ thống chọn theo chữ bạn nhập.
- **Nghi lễ**: một thiệp có nhiều nghi lễ, mỗi lễ có giờ, ngày, địa điểm riêng kèm nút chỉ đường Google Maps, nên lễ gia tiên buổi sáng và tiệc buổi tối không bị trộn vào nhau.
- **Tiệc cưới**: địa chỉ kèm bản đồ và nút mở Google Maps.
- **Đếm ngược và nút "Thêm vào lịch"**, để khách lưu ngày cưới vào lịch trên điện thoại.

Mỗi mẫu trình bày lịch trình một kiểu. [Mẫu Ái Tình](/vi/mau-thiep/ai-tinh) thuộc gói Free cho các mốc giờ chạy theo một đường cong chữ S, mỗi mốc đi kèm một hình vẽ riêng; Trăm Năm xếp lịch trình theo hàng ngang; Nắng Xanh vẽ một đường đi uốn lượn qua năm trái tim. Các bước điền từng khối có trong trang [hướng dẫn tạo thiệp](/vi/huong-dan).

![Khối lịch trình ngày cưới và đếm ngược của mẫu Ái Tình: các mốc giờ chạy theo đường cong chữ S, mỗi mốc một hình vẽ](/images/site/blog/lich-trinh-ngay-cuoi/ai-tinh.jpg)

![Khối lịch trình của mẫu Nắng Xanh: đường đi uốn lượn qua năm trái tim, kèm đồng hồ đếm ngược và nút thêm vào lịch](/images/site/blog/lich-trinh-ngay-cuoi/nang-xanh.jpg)

![Khối Timeline của mẫu Trăm Năm: đón khách, lễ vu quy, tiệc cưới, tiệc tối xếp hai cột trên điện thoại](/images/site/blog/lich-trinh-ngay-cuoi/tram-nam.jpg)

## Câu hỏi thường gặp

### Tiệc cưới nên đón khách trước giờ khai tiệc bao lâu?

Thường khoảng nửa tiếng đến một tiếng. Ghi cả hai mốc trên thiệp để khách tự chọn giờ đến cho thoải mái.

### Có cần ghi giờ lành lên thiệp cưới không?

Không bắt buộc. Thiệp chỉ cần những giờ khách phải có mặt; giờ lành của lễ gia tiên chỉ nên ghi khi có mời khách dự phần lễ ở nhà.

### Cô dâu nên bắt đầu trang điểm lúc mấy giờ?

Tính ngược từ nghi lễ đầu tiên trong ngày: hỏi chuyên viên trang điểm cần bao lâu cho tóc và mặt, cộng thêm thời gian thay áo, chụp ảnh và một khoảng dự phòng.

### Đổi giờ tiệc sau khi đã gửi thiệp thì làm thế nào?

Với thiệp online, sửa giờ trong thiệp là khách mở lại link sẽ thấy giờ mới; dù vậy vẫn nên nhắn riêng cho những người đã [xác nhận tham dự](/vi/blog/xac-nhan-tham-du-dam-cuoi). Thiệp giấy thì phải báo lại từng người.
`,
  },
  {
    slug: 'mau-thiep-cuoi-truyen-thong',
    category: 'trend',
    title: 'Mẫu thiệp cưới truyền thống: 11 thiết kế đỏ hỷ, sen, trầu cau',
    excerpt:
      '11 mẫu thiệp cưới truyền thống có chữ Song Hỷ, long phụng, trầu cau, hoa sen, kèm gói, số ô ảnh và cách chọn theo bộ ảnh, màu tiệc của hai bạn.',
    readingMinutes: 12,
    markdown: `
Bài này giới thiệu 11 mẫu thiệp cưới truyền thống trong kho Keemori, chọn theo hai tiêu chí: được xếp vào phong cách Truyền thống, hoặc mang chất liệu Việt dễ nhận ra như sắc đỏ hỷ, chữ Song Hỷ, long phụng, trầu cau, hoa sen, áo dài và phố cũ Hà Nội. Danh sách có đủ ba gói: 2 mẫu Free không cần ảnh cưới, 3 mẫu Gold và 6 mẫu Diamond dựng quanh bộ ảnh của hai bạn. Mỗi mẫu đều ghi rõ gói, số ô ảnh và hợp với kiểu đám cưới nào.

## Ý nghĩa các hoạ tiết hay gặp trên thiệp cưới truyền thống

Cách hiểu dưới đây là cách hiểu phổ biến, không phải quy định:

- **Chữ Song Hỷ:** hai chữ Hỷ (vui mừng) ghép liền, thường được hiểu là niềm vui nhân đôi, cho đôi trẻ và cho cả hai bên gia đình.
- **Long phụng:** rồng và phượng thường tượng trưng cho chồng và vợ, gửi mong muốn hai người xứng đôi, hoà hợp. Hoạ tiết này hay đi cùng chữ Song Hỷ ở bìa thiệp.
- **Trầu cau:** gắn với câu "miếng trầu là đầu câu chuyện" và sự tích trầu cau về tình nghĩa gắn bó. Ở nhiều nhà, mâm trầu cau vẫn là lễ vật quen thuộc của lễ ăn hỏi.
- **Hoa sen:** loài hoa gần gũi với người Việt, thường gợi sự thanh khiết, trang nhã. Thiệp cưới hoa sen hợp với đám cưới muốn giữ nét truyền thống nhưng nhẹ hơn sắc đỏ.
- **Màu đỏ:** thường được xem là màu may mắn, vui mừng trong dịp cưới hỏi.

Mỗi vùng miền, mỗi nhà có thể coi trọng những chi tiết khác nhau. Nếu bố mẹ có mong muốn riêng, chẳng hạn nhất định phải có chữ Hỷ màu đỏ, hai bạn nên hỏi trước rồi mới chọn mẫu. Muốn hiểu thêm các lễ đi kèm, có thể đọc bài [phong tục cưới hỏi miền Bắc](/vi/blog/phong-tuc-cuoi-hoi-mien-bac).

## 11 mẫu thiệp cưới truyền thống trong kho Keemori

### Long Phụng — rồng phượng ôm chữ Song Hỷ

![Mẫu thiệp Long Phụng nền đỏ son và ngà, rồng phượng nét mảnh ôm dấu Song Hỷ vuông ở bìa](/images/site/blog/mau-thiep-cuoi-truyen-thong/long-phung.jpg)

Nếu bố mẹ muốn thiệp có đủ rồng phượng và chữ Hỷ, hãy xem mẫu này trước. Trang thiệp chạy theo nhịp đỏ son, ngà, đỏ; bìa có hai cánh giấy trắng viền lượn sóng phủ lên mặt đỏ, ở giữa là long phụng vẽ một nét quây quanh dấu Song Hỷ vuông. Ruột thiệp gọn trong khung viền đỏ kép, hoa chỉ điểm ở mép.

Gói **Free**, không có ô ảnh, toàn bộ hình là đồ hoạ. Hợp với lễ ăn hỏi, lễ gia tiên, và với những nhà chưa có ảnh cưới hay không muốn đưa ảnh lên thiệp.

[Xem mẫu Long Phụng](/vi/mau-thiep/long-phung)

### Sơn Hỷ — đỏ son, Song Hỷ và mâm lễ ăn hỏi

![Mẫu thiệp Sơn Hỷ giấy đỏ son và giấy ngà ánh kim, huy hiệu Song Hỷ, tranh mâm lễ ăn hỏi](/images/site/blog/mau-thiep-cuoi-truyen-thong/son-hy.jpg)

Sơn Hỷ mang không khí hỷ sự Bắc Bộ: giấy ngà lấp lánh ánh kim xen giữa những mảng đỏ son, chữ Song Hỷ nằm trong vành hoa văn Đông Sơn, kèm tranh cô dâu áo dài đỏ bên chú rể và các mâm lễ ăn hỏi. Ruột thiệp nền ngà viền đỏ mảnh nên phần chữ rất dễ đọc.

Gói **Free**, không có ô ảnh, tranh vẽ thay cho ảnh chụp. Hợp với nhà làm ăn hỏi và cưới theo lối miền Bắc, muốn có Song Hỷ và mâm lễ ngay trên thiệp.

[Xem mẫu Sơn Hỷ](/vi/mau-thiep/son-hy)

### Trầu Cau — xanh lá thay cho đỏ son

![Mẫu thiệp Trầu Cau mảng giấy xanh lá xen giấy ngà, cụm trầu cau màu nước ở góc thiệp](/images/site/blog/mau-thiep-cuoi-truyen-thong/trau-cau.jpg)

Trầu Cau cho thấy thiệp truyền thống không nhất thiết phải đỏ. Các mảng xanh lá dập vân vải xen với giấy ngà, trên đó tên hai bạn in màu đỏ sẫm. Trầu và cau vẽ màu nước chỉ ló vào từ một góc giấy, chữ Song Hỷ lặp thành đường viền hoặc huy hiệu nhỏ, phong bì riêng đóng sáp đỏ in chữ Hỷ.

Gói **Gold** nhưng không có ô ảnh cưới: lựa chọn cho ai muốn dùng xác nhận tham dự và link mời riêng từng khách khi chưa có ảnh. Mẫu cũng hợp với lễ ăn hỏi có mâm trầu cau và cặp đôi thích tông xanh hơn đỏ.

[Xem mẫu Trầu Cau](/vi/mau-thiep/trau-cau)

### Hỷ Sắc — áo dài trắng và bàn lễ gia tiên

![Mẫu thiệp Hỷ Sắc thẻ giấy hồng phấn, mực xanh ngọc, đôi áo dài trắng giữa vườn cúc vàng](/images/site/blog/mau-thiep-cuoi-truyen-thong/hy-sac.jpg)

Hỷ Sắc là chuỗi thẻ giấy hồng phấn viết mực xanh ngọc. Mở đầu là đôi bạn áo dài trắng giữa vườn cúc vàng; giữa thiệp có bàn lễ gia tiên và đôi tay chắp; màu đỏ chỉ thấp thoáng ở mâm lễ. Phong bì riêng gắn sáp xanh lục bảo dập chữ Song Hỷ.

Gói **Gold**, 4 ô ảnh: ảnh đôi, chân dung riêng của chú rể và cô dâu, ảnh câu chuyện (không có ô ảnh bìa). Hợp với nhà làm lễ gia tiên nhưng muốn thiệp nhẹ nhàng, tiệc ban ngày.

[Xem mẫu Hỷ Sắc](/vi/mau-thiep/hy-sac)

### Mận Chín — nhung mận và sáp vàng

![Mẫu thiệp Mận Chín trang giấy ngà trên nền nhung màu mận, phong bì lót hoa mẫu đơn, sáp vàng](/images/site/blog/mau-thiep-cuoi-truyen-thong/man-chin.jpg)

Mận Chín thuộc hai phong cách Truyền thống và Sang trọng, hợp với nhà muốn vẻ trang trọng ở một tông khác sắc đỏ hỷ. Trang giấy ngà hẹp nằm trên nền nhung màu mận; thiệp mở ra từ phong bì lót hoa mẫu đơn đóng sáp vàng, rồi tới tấm thẻ oval viền ren dập nổi.

Gói **Gold**, 2 ô ảnh trong hai khung polaroid nghiêng ngược chiều. Hợp với tiệc tối trang trọng, khi hai bạn có ít ảnh nhưng muốn từng tấm được trình bày chỉn chu.

[Xem mẫu Mận Chín](/vi/mau-thiep/man-chin)

### Đỏ Truyền Thống — sắc đỏ hỷ sự trên giấy vàng kem

![Mẫu thiệp Đỏ Truyền Thống nền giấy vàng kem, chữ đỏ sẫm, ảnh cưới lớn ở bìa kèm lời dẫn viết tay](/images/site/blog/mau-thiep-cuoi-truyen-thong/do-truyen-thong.jpg)

Đúng như tên, đây là thiệp cưới đỏ truyền thống cho ai đã có ảnh: giấy vàng kem, chữ đỏ sẫm, nhấn đỏ tươi. Bìa là ảnh cưới lớn kèm lời dẫn viết tay hai dòng hơi nghiêng. Thông tin lễ được xếp lên trước câu chuyện tình yêu, nên khách mở ra là thấy ngay giờ, ngày, địa điểm.

Gói **Diamond**, 4 ô ảnh: bìa, ảnh đôi, câu chuyện, ảnh kết. Hợp với lễ cưới có lễ gia tiên, gia đình chuộng sắc đỏ và cặp đôi có bộ ảnh áo dài.

[Xem mẫu Đỏ Truyền Thống](/vi/mau-thiep/do-truyen-thong)

### Sen Việt — hoa sen, mây đan và đèn lồng

![Mẫu thiệp Sen Việt hoa sen, lá sen xanh trầm, mây đan và đèn lồng trên nền giấy ngà](/images/site/blog/mau-thiep-cuoi-truyen-thong/sen-viet.jpg)

Sen Việt là mẫu thiệp cưới hoa sen mang không khí đầm sen: lá xanh trầm, hoa sen dịu, mây đan và đèn lồng viền quanh nền giấy ngà, điểm vài nét đỏ son. Lịch trình có hình vẽ cùng tinh thần hoa sen, còn lời cảm ơn khép lại trên cảnh hồ sen cuối ngày.

Gói **Diamond**, 4 ô ảnh và album dải ngang. Hợp nhất với ảnh áo dài, cổ phục hoặc ảnh chụp bên hồ sen.

[Xem mẫu Sen Việt](/vi/mau-thiep/sen-viet)

### Sen Ngọc — cổng trăng mở ra hồ sen

![Mẫu thiệp Sen Ngọc cổng trăng ngọc bích, hồ sen màu nước kiểu thuỷ mặc trên giấy trắng dập nổi](/images/site/blog/mau-thiep-cuoi-truyen-thong/sen-ngoc.jpg)

Sen Ngọc đậm chất đình viện Á Đông: ô cửa trăng chạm ngọc bích mở ra hồ sen vẽ theo lối thuỷ mặc, nền giấy trắng dập nổi, chữ xanh ngọc. Màn mở thiệp là hai cánh cửa gỗ; khách bấm mở thì cửa hé ra, cổng trăng trôi vào giữa thiệp, tên hai bạn cùng ngày cưới nằm trong lòng cổng.

Gói **Diamond**, 6 ô ảnh, nhiều nhất trong danh sách, có hai chân dung cô dâu chú rể trong khung vòm bán nguyệt. Hợp với bộ ảnh áo dài ở hồ sen hay nơi có kiến trúc cổ, tiệc trang trí trắng, xanh ngọc và hồng sen.

[Xem mẫu Sen Ngọc](/vi/mau-thiep/sen-ngoc)

### Trăm Năm — áo dài đỏ, giấy dó và Hồ Gươm

![Mẫu thiệp Trăm Năm tông đỏ áo dài và cửa gỗ trên giấy dó, hình Tháp Rùa và hoa sen](/images/site/blog/mau-thiep-cuoi-truyen-thong/tram-nam.jpg)

Trăm Năm đưa Hà Nội xưa vào thiệp: tông đỏ trầm của áo dài và cửa gỗ trên giấy dó, điểm Tháp Rùa, hoa sen và lá olive. Từ bìa ảnh, một mép giấy xé dẫn sang cảnh Hồ Gươm màu nâu cũ; album đặt trên nền lụa đỏ.

Gói **Diamond**, 4 ô ảnh. Hợp với cặp đôi muốn thiệp truyền thống mà trau chuốt như một ấn phẩm, có áo dài và ảnh chụp ở Hà Nội.

[Xem mẫu Trăm Năm](/vi/mau-thiep/tram-nam)

### Hà Nội Xưa — giấy ngà, mực olive hoài niệm

![Mẫu thiệp Hà Nội Xưa nền giấy ngà, chữ olive trầm, tiêu đề đặt trên ảnh bìa ở góc trái](/images/site/blog/mau-thiep-cuoi-truyen-thong/ha-noi-xua.jpg)

Không dùng đỏ, Hà Nội Xưa gợi nét cũ bằng giấy ngà và mực olive trầm. Ảnh cưới phủ kín bìa, tiêu đề nằm ngay trên ảnh ở góc trái phía trên, tên và ngày cưới dồn xuống dưới; nét chữ viết tay đi cùng chữ có chân cổ điển.

Gói **Diamond**, 4 ô ảnh. Hợp với cặp đôi mê phố cũ, đãi tiệc ở nhà cổ, biệt thự kiểu Pháp hay nhà hàng mang màu hoài niệm.

[Xem mẫu Hà Nội Xưa](/vi/mau-thiep/ha-noi-xua)

### Lô Lô Chải — mùa hoa đào nơi cực Bắc

![Mẫu thiệp Lô Lô Chải kiểu sổ dán ảnh với nhà trình tường, hoa đào và núi đá Hà Giang](/images/site/blog/mau-thiep-cuoi-truyen-thong/lo-lo-chai.jpg)

Lô Lô Chải lấy cảm hứng từ một ngôi làng cực Bắc Hà Giang: nhà trình tường, mái ngói thẫm, hoa đào, núi đá phủ sương. Cả thiệp như cuốn sổ dán ảnh trên giấy cotton, có polaroid nghiêng, mẩu băng dính giấy và dòng ghi chú viết tay.

Gói **Diamond**, 4 ô ảnh. Hợp với cặp đôi mê xê dịch, có ảnh cưới chụp ở Hà Giang, Sa Pa hoặc mùa hoa đào.

[Xem mẫu Lô Lô Chải](/vi/mau-thiep/lo-lo-chai)

## Chọn thiệp cưới online truyền thống theo bộ ảnh và màu tiệc

Mười một mẫu trên khác nhau nhiều nhất ở hai điểm: cần bao nhiêu ảnh và dùng tông màu nào.

- **Chưa có ảnh, hoặc không muốn đưa ảnh lên:** Long Phụng, Sơn Hỷ (Free) hoặc Trầu Cau (Gold). Mẫu Free có link vĩnh viễn, không giới hạn người xem, đủ nghi lễ, tiệc, gia đình, lịch trình, nhạc nền, hộp mừng cưới và sổ lưu bút, nhưng không có xác nhận tham dự và link mời riêng từng khách.
- **Có bộ ảnh áo dài, cổ phục:** Đỏ Truyền Thống, Trăm Năm, Sen Việt, Sen Ngọc, kèm album ảnh cưới của gói Diamond.
- **Chỉ có vài tấm ảnh:** Mận Chín cần 2 ảnh, Hỷ Sắc cần 4 ảnh, trong đó có hai chân dung riêng.
- **Tiệc không theo tông đỏ:** Trầu Cau xanh lá, Hỷ Sắc hồng phấn và xanh ngọc, Sen Ngọc trắng và xanh ngọc, Hà Nội Xưa olive, Lô Lô Chải xanh rêu và hồng đào.
- **Muốn biết trước ai sẽ đến:** xác nhận tham dự và link mời chào đích danh từng khách có từ gói Gold. Thiệp Gold, Diamond chưa thanh toán là link dùng thử 3 ngày, tối đa 15 người xem; thanh toán xong thì link vĩnh viễn. Chi phí xem ở [bảng giá các gói](/vi/bang-gia).
- **Nhà trai, nhà gái đãi tiệc riêng:** gói Diamond Song Hỷ cho một thiệp ba link (chung, nhà trai, nhà gái), chỉ phần tiệc cưới tách theo từng nhà. Chi tiết trong bài [thiệp cưới riêng nhà trai, nhà gái](/vi/blog/thiep-cuoi-nha-trai-nha-gai).

## Làm thiệp cưới truyền thống trên Keemori

Chỉ có ba bước: chọn mẫu, điền thông tin, rồi xuất bản để nhận link thiệp và mã QR, gửi qua Zalo, Messenger hay Facebook. Đám cưới truyền thống thường có nhiều lễ, nên một thiệp chứa được nhiều nghi lễ (lễ gia tiên, lễ vu quy, lễ thành hôn), mỗi lễ có giờ, ngày, địa điểm riêng kèm nút chỉ đường Google Maps.

Đang phân vân giữa vài mẫu? Cứ nhập nội dung trước rồi thử lần lượt: đổi mẫu không làm mất chữ hay ảnh đã nhập, ảnh nào mẫu mới không có ô thì được giữ lại, chỉ tạm không hiển thị. Cách viết lời mời của hai họ và xưng hô có trong bài [cách ghi thiệp cưới](/vi/blog/cach-ghi-thiep-cuoi). Hai bạn có thể [tạo thiệp cưới online miễn phí](/vi) và xem thử trước khi chọn gói.

Muốn xem thêm ngoài danh sách mẫu thiệp cưới truyền thống này, vào [kho mẫu thiệp cưới](/vi/mau-thiep) và lọc phong cách Truyền thống hoặc lọc theo màu. Nếu thích khoảng trắng và ít hoạ tiết, xem bài [mẫu thiệp cưới tối giản](/vi/blog/mau-thiep-cuoi-toi-gian).

## Câu hỏi thường gặp

### Thiệp cưới truyền thống thường dùng màu gì?

Thiệp cưới đỏ truyền thống, thường phối với vàng kem, vẫn quen thuộc nhất vì màu đỏ hay được gắn với may mắn, vui mừng. Nhiều mẫu ngày nay giữ hoạ tiết Việt nhưng đổi sang xanh lá, hồng phấn hay olive, như Trầu Cau, Hỷ Sắc, Hà Nội Xưa.

### Mẫu thiệp cưới truyền thống có bắt buộc phải có ảnh cưới không?

Không. Long Phụng, Sơn Hỷ (Free) và Trầu Cau (Gold) dùng tranh minh hoạ thay ảnh, nên hai bạn gửi thiệp được cả khi chưa chụp ảnh cưới.

### Thiệp cưới hoa sen hợp với bộ ảnh nào?

Sen Việt và Sen Ngọc hợp nhất với ảnh áo dài, cổ phục hoặc ảnh chụp bên hồ sen. Sen Ngọc có 6 ô ảnh, Sen Việt có 4 ô ảnh, cả hai thuộc gói Diamond nên có thêm album.

### Gửi thiệp cưới online truyền thống cho người lớn tuổi thế nào cho phải phép?

Nhiều gia đình gửi link qua Zalo kèm lời mời ngắn, xưng hô đúng vai vế, và gọi điện báo trước với người lớn trong họ. Ai không quen dùng điện thoại thì nhờ con cháu mở thiệp giúp hoặc mời trực tiếp.

### Nhà trai và nhà gái đãi tiệc riêng có dùng chung một thiệp được không?

Được, với gói Diamond Song Hỷ: một thiệp có link chung, link nhà trai và link nhà gái, mỗi link hiện tiệc của đúng nhà đó. Ảnh, đếm ngược và lời chúc dùng chung.
`,
  },
  {
    slug: 'mau-thiep-cuoi-hoa',
    category: 'trend',
    title: 'Mẫu thiệp cưới hoa: 12 mẫu hồng, ly, lan, tulip, cúc, đào',
    excerpt:
      '12 mẫu thiệp cưới hoa, mỗi mẫu một loài hoa chủ đạo: hồng, mẫu đơn, ly, lan, tulip, cẩm tú cầu, đào; kèm ý nghĩa từng loài và cách chọn theo mùa cưới.',
    readingMinutes: 11,
    markdown: `
Bài này chọn 12 mẫu thiệp cưới hoa trên Keemori, mỗi mẫu lấy một loài hoa cụ thể làm hình ảnh chủ đạo: hoa hồng, mẫu đơn, hoa ly, lan trắng, tulip, cẩm tú cầu, cúc dại, hoa đào và tử đằng. Năm mẫu dùng tranh vẽ nên không cần ảnh cưới, bảy mẫu còn lại có từ 4 đến 6 ô ảnh — đủ để hai bạn chọn theo loài hoa yêu thích, màu tiệc và số ảnh đang có. Cuối bài là ý nghĩa thường gặp của từng loài hoa và cách chọn hoa theo mùa cưới.

Năm mẫu Hoa Hồng, Hoa Ly, Hoa Tulip, Hoa Cẩm Tú Cầu và Hoa Cúc thuộc cùng một bộ thiệp hoa nên có chung khung sườn: gói Diamond, 4 ô ảnh (bìa, ảnh đôi, câu chuyện, ảnh kết), mép giấy xé dẫn sang lời ngỏ và câu chuyện, một tấm Polaroid cặp đôi đặt cạnh ảnh hoa chụp cận. Hoa nằm ở lớp nền riêng và bìa tự cao lên theo độ dài tên, nên chữ không bao giờ đè lên gương mặt trong ảnh. Chúng khác nhau ở loài hoa, bảng màu và khung ảnh bìa.

## Thiệp cưới hoa hồng và mẫu đơn

### Hoa Hồng: hồng leo trên giấy hồng đất

![Mẫu thiệp cưới Hoa Hồng với hồng leo trên nền giấy hồng đất và ảnh bìa tràn ngang](/images/site/blog/mau-thiep-cuoi-hoa/hoa-hong.jpg)

Hồng leo chạy suốt tấm thiệp trên nền giấy hồng đất ấm, chữ nâu trầm, điểm hồng nâu. Bìa dùng khung ảnh tràn hết bề ngang nên ảnh cưới của hai bạn chiếm trọn màn đầu. Gói Diamond, 4 ô ảnh cưới. Hợp với cặp đôi yêu hoa hồng, tiệc lãng mạn ở nhà hàng hoặc sân vườn, muốn nét cổ điển mà không cầu kỳ.

[Xem mẫu Hoa Hồng](/vi/mau-thiep/hoa-hong)

### Hồng Viên: vòm hồng màu nước, 5 ô ảnh

![Mẫu thiệp cưới Hồng Viên với vòm hoa hồng, mẫu đơn, tử đằng màu nước và ảnh bìa trong khung vòm viền vàng](/images/site/blog/mau-thiep-cuoi-hoa/hong-vien.jpg)

Đầu bìa là một vòm hoa màu nước dày — hồng, mẫu đơn, tử đằng — trên giấy ngà phớt hồng; ảnh cưới nằm trong khung vòm viền vàng cổ, bên trên có vương miện nét vàng. Các ảnh sau tràn hết chiều ngang, nối vào giấy bằng mép xé sợi. Gói Gold, 5 ô ảnh: bìa, ảnh đôi, chân dung cô dâu, câu chuyện, ảnh kết. Hợp với cặp đôi có bộ ảnh ngoại cảnh muốn kể thành câu chuyện dài, tiệc sân vườn hoặc tông hồng đất.

[Xem mẫu Hồng Viên](/vi/mau-thiep/hong-vien)

### Rừng Hoa: hồng và mẫu đơn trên vườn tối

![Mẫu thiệp cưới Rừng Hoa với hoa hồng, mẫu đơn mọc dày quanh mảng giấy ivory bo vòm trên nền vườn tối](/images/site/blog/mau-thiep-cuoi-hoa/rung-hoa.jpg)

Những mảng giấy ivory bo vòm lớn đặt trên tranh một khu vườn cổ điển tối; hoa hồng, mẫu đơn và lá rừng mọc dày từ mép vào, vài thiên thần cherub nhỏ điểm trên giấy. Nhịp trang đi từ vườn tối sang giấy sáng, qua một mảng xanh rừng rồi kết bằng cận cảnh hoa phủ kín khung. Gói Free, không có ô ảnh — tranh vườn hoa là minh hoạ cố định. Hợp với tiệc tối sang trọng và gu cổ điển châu Âu.

[Xem mẫu Rừng Hoa](/vi/mau-thiep/rung-hoa)

### Đỏ Thắm: mẫu đơn trên nền đỏ rượu

![Mẫu thiệp cưới Đỏ Thắm với hoa mẫu đơn trắng, hồng, đỏ thẫm trên các mảng đỏ rượu vang mép xé](/images/site/blog/mau-thiep-cuoi-hoa/do-tham.jpg)

Mẫu đơn trắng, hồng phấn và đỏ thẫm tràn từ mép vào, mỗi cụm một số bông và một hướng mọc riêng. Nền là mảng đỏ rượu vang xen giấy trắng lạnh, ranh giới là mép giấy xé thô. Gói Free, không có ô ảnh — một tranh hoa cố định làm tâm điểm. Hợp với cặp đôi thích sắc đỏ sang trọng kiểu phương Tây hơn đỏ son, tiệc tối trong khách sạn.

[Xem mẫu Đỏ Thắm](/vi/mau-thiep/do-tham)

## Mẫu thiệp cưới hoa trắng: ly, lan và đại đoá

### Hoa Ly: lily trắng trang trọng

![Mẫu thiệp cưới Hoa Ly với lily trắng trên giấy ngà và ảnh bìa trong khung vòm bo tròn](/images/site/blog/mau-thiep-cuoi-hoa/hoa-ly.jpg)

Lily trắng là loài hoa trang trọng nhất trong bộ thiệp hoa. Giấy ngà trung tính, chữ nâu xám, điểm olive nhạt; bìa dùng khung vòm bo tròn viền mảnh, ảnh cưới nằm gọn bên trong. Gói Diamond, 4 ô ảnh. Hợp với cặp đôi thích hoa trắng thanh lịch hơn màu rực rỡ, cưới ở nhà thờ hay nhà hàng đều hợp.

[Xem mẫu Hoa Ly](/vi/mau-thiep/hoa-ly)

### Lan Trắng: lan trắng và nơ lụa xanh

![Mẫu thiệp cưới Lan Trắng với phong bì hoa lan trắng, nơ lụa xanh và sáp olive](/images/site/blog/mau-thiep-cuoi-hoa/lan-trang.jpg)

Khách mở thiệp từ một phong bì thắt nơ lụa xanh, gắn sáp olive và bó lan trắng. Bên trong là giấy cotton màu ngà, chữ và hoạ tiết xanh olive, ảnh chú rể và cô dâu dạng Polaroid xếp so le, lịch cưới trên nền olive và một album ảnh lớn. Gói Diamond, 6 ô ảnh: bìa, ảnh đôi, chân dung chú rể, chân dung cô dâu, câu chuyện, ảnh kết. Hợp với tiệc sân vườn, ngoài trời và cặp đôi có sẵn bộ ảnh ngoại cảnh.

[Xem mẫu Lan Trắng](/vi/mau-thiep/lan-trang)

### Bạch Mai: khung hoa trắng màu nước

![Mẫu thiệp cưới Bạch Mai với khung hoa trắng màu nước gồm đại đoá, lan trắng và lá sage](/images/site/blog/mau-thiep-cuoi-hoa/bach-mai.jpg)

Mỗi màn được đóng khung bằng hoa màu nước dày mọc vào từ bốn mép: đại đoá trắng và lan trắng làm chủ, điểm hồng bụi, bông rủ xanh tím, lá sage — khung hoa gần như một màu mà vẫn có chiều sâu. Chữ nằm trong một cột hẹp nhiều khoảng trắng; màn mở thiệp là tấm thẻ giấy cotton trên nền olive rêu. Gói Free, không có ô ảnh — cặp đôi được vẽ màu nước nét mảnh. Hợp với tiệc sân vườn, nhà thờ hoặc nhà hàng tông trung tính.

[Xem mẫu Bạch Mai](/vi/mau-thiep/bach-mai)

## Hoa sắc pastel: tulip, cẩm tú cầu, cúc dại

### Hoa Tulip: tulip hồng phấn

![Mẫu thiệp cưới Hoa Tulip với tulip hồng trên giấy hồng phấn và ảnh bìa trong khung vòm](/images/site/blog/mau-thiep-cuoi-hoa/hoa-tulip.jpg)

Tulip hồng trên nền giấy hồng phấn ấm, chữ nâu đỏ trầm; bìa dùng khung vòm bo tròn ôm lấy ảnh cưới. Gói Diamond, 4 ô ảnh. Hợp với tiệc ban ngày hoặc nhà hàng tông sáng, cho cặp đôi muốn một mẫu hoa ngọt ngào, tươi tắn mà không rườm rà.

[Xem mẫu Hoa Tulip](/vi/mau-thiep/hoa-tulip)

### Hoa Cẩm Tú Cầu: xanh sương dịu mát

![Mẫu thiệp cưới Hoa Cẩm Tú Cầu với hoa cẩm tú cầu xanh trên giấy xanh sương và chữ navy](/images/site/blog/mau-thiep-cuoi-hoa/hoa-cam-tu-cau.jpg)

Cẩm tú cầu xanh trên nền giấy xanh sương rất nhạt, chữ navy trầm, bìa khung vòm bo tròn ôm ảnh cưới. Một mẫu hoa nhẹ nhàng nhưng vẫn để ảnh của hai bạn làm trung tâm. Gói Diamond, 4 ô ảnh. Hợp với cặp đôi yêu sắc xanh dịu, tiệc sân vườn hoặc nhà hàng tông xanh – trắng.

[Xem mẫu Hoa Cẩm Tú Cầu](/vi/mau-thiep/hoa-cam-tu-cau)

### Hoa Cúc: cúc dại mộc mạc

![Mẫu thiệp cưới Hoa Cúc với cúc dại trên giấy kem ngả vàng và ảnh bìa tràn ngang](/images/site/blog/mau-thiep-cuoi-hoa/hoa-cuc.jpg)

Cúc dại — loài hoa mộc mạc nhất trong bộ — trên giấy kem ngả vàng, chữ xanh rêu, nhấn olive. Bìa dùng ảnh tràn ngang thay vì khung vòm, nên ảnh cưới mở rộng ngay màn đầu. Gói Diamond, 4 ô ảnh. Hợp với tiệc sân vườn, ngoài trời hay ở quê, và những bộ ảnh ngoại cảnh nhiều nắng.

[Xem mẫu Hoa Cúc](/vi/mau-thiep/hoa-cuc)

## Hoa Á Đông: đào và tử đằng

### Đào Hoa: nhành đào và áo dài

![Mẫu thiệp cưới Đào Hoa với nhành đào màu nước, tranh đôi áo dài và chữ Song Hỷ hồng nhạt](/images/site/blog/mau-thiep-cuoi-hoa/dao-hoa.jpg)

Thiệp gấp ba bằng giấy hồng phấn và ivory, mép cổng scallop lớn lồng vào nhau; nhành đào màu nước đi từ mép giấy vào, điểm chấm ánh kim. Tâm điểm bìa là đôi áo dài đứng trước chữ Song Hỷ hồng nhạt. Mẫu thuộc gói Gold nhưng không có ô ảnh — tranh áo dài thay cho ảnh chụp — và vẫn có xác nhận tham dự, link mời riêng như mọi thiệp Gold. Hợp với lễ ăn hỏi, lễ thành hôn tại gia, cho ai muốn chất thiệp Việt ở tông hồng thay vì đỏ son.

[Xem mẫu Đào Hoa](/vi/mau-thiep/dao-hoa)

### Tử Ngọc: tử đằng và sắc tím

![Mẫu thiệp cưới Tử Ngọc với hoa tử đằng, mẫu đơn, chuông vàng và cặp đôi áo tím thêu vàng](/images/site/blog/mau-thiep-cuoi-hoa/tu-ngoc.jpg)

Một tấm poster giấy hồng phấn bao quanh bởi tử đằng, mẫu đơn, lá xám lục và chuông vàng rủ từ mép trên. Cặp đôi mặc áo tím thêu vàng đứng lệch trái, chữ nằm bên phải; giữa các phần là dấu ngắt hình hoa sen vàng. Gói Free, không có ô ảnh. Hợp với tiệc tông tím hoặc buổi tối, cặp đôi thích không khí lễ nghi phương Đông.

[Xem mẫu Tử Ngọc](/vi/mau-thiep/tu-ngoc)

## Ý nghĩa thường gặp của các loài hoa trong đám cưới

Đây là cách hiểu phổ biến, không phải quy tắc; mỗi nơi, mỗi nhà có thể hiểu khác.

- **Hoa hồng**: biểu tượng quen thuộc nhất của tình yêu; hồng phấn, hồng đất dịu dàng hơn hồng đỏ.
- **Mẫu đơn**: trong quan niệm Á Đông thường gắn với phú quý, sung túc.
- **Hoa ly**: tên Hán Việt là bách hợp, hay được hiểu là "trăm năm hoà hợp".
- **Lan**: thường tượng trưng cho vẻ thanh cao, sang trọng.
- **Tulip**: hay được dùng để nói lời yêu và một khởi đầu mới.
- **Cẩm tú cầu**: ý nghĩa được hiểu khá khác nhau tuỳ nơi, nên nhiều người chọn vì vẻ đẹp — chùm hoa lớn, sắc xanh mát mắt.
- **Cúc dại**: gợi sự giản dị, trong trẻo.
- **Hoa đào**: gắn với mùa xuân và ngày Tết, nhất là ở miền Bắc, thường được xem là điềm may cho khởi đầu mới.
- **Tử đằng**: chùm hoa rủ dài hay được ví với tình yêu bền bỉ.
- **Hoa sen**: thanh khiết, gần gũi với văn hoá Việt, hay có mặt trên thiệp truyền thống; các mẫu thiệp cưới hoa sen được giới thiệu ở bài [mẫu thiệp cưới truyền thống](/vi/blog/mau-thiep-cuoi-truyen-thong).

Nếu ông bà, bố mẹ có kiêng kỵ riêng về loài hoa hay màu hoa trên đồ cưới, nên hỏi ý trước khi chốt mẫu.

## Chọn hoa theo mùa cưới và màu tiệc

Một mẫu thiệp cưới đẹp là mẫu ăn khớp với chính buổi tiệc. Theo mùa, có thể tham khảo:

- **Mùa xuân, quanh Tết**: hoa đào của Đào Hoa hoặc tulip hồng của Hoa Tulip.
- **Mùa hè**: sắc xanh mát của Hoa Cẩm Tú Cầu, hoặc hoa trắng lá xanh của Hoa Ly, Lan Trắng.
- **Mùa thu**: hồng đất, nâu ấm của Hoa Hồng, Hồng Viên, hay kem vàng của Hoa Cúc.
- **Cuối năm, tiệc tối**: tông đậm của Đỏ Thắm, Rừng Hoa, Tử Ngọc.

Theo màu tiệc thì làm ngược lại: hỏi bên trang trí màu hoa chính của cổng hoa, bàn gallery, rồi chọn mẫu cùng họ màu để khách cầm thiệp và bước vào tiệc thấy liền một mạch. Trong [kho mẫu thiệp](/vi/mau-thiep), bộ lọc màu chủ đạo cho chọn nhiều màu cùng lúc và chỉ trả về mẫu mang đủ các màu đó. Khối dress code trên thiệp cũng nên lấy màu từ hoa để gợi ý khách mặc hợp tông. Cuối cùng, đếm số ảnh cưới đang có: chưa có ảnh thì chọn Đào Hoa hoặc bốn mẫu Free; có bộ ảnh ngoại cảnh thì Lan Trắng (6 ô) hay Hồng Viên (5 ô) sẽ dùng hết được.

Trên Keemori, tạo thiệp và xem thử luôn miễn phí với mọi mẫu: chọn mẫu, điền thông tin, xuất bản để nhận link thiệp và mã QR gửi khách. Quyền lợi từng gói có ở [bảng giá](/vi/bang-gia), cách làm từng bước ở [trang hướng dẫn](/vi/huong-dan). Ưng mẫu nào thì bắt đầu [làm thiệp cưới online](/vi) với mẫu hoa đó ngay.

## Câu hỏi thường gặp

### Mẫu thiệp cưới hoa nào không cần ảnh cưới?

Rừng Hoa, Đỏ Thắm, Bạch Mai, Tử Ngọc (gói Free) và Đào Hoa (gói Gold) dùng tranh vẽ thay ảnh. Xem thêm lựa chọn ở bài [mẫu thiệp cưới online miễn phí](/vi/blog/mau-thiep-cuoi-mien-phi).

### Có mẫu thiệp cưới hoa sen không?

Có. Hoa sen thường xuất hiện trên các mẫu truyền thống, được giới thiệu riêng trong bài mẫu thiệp cưới truyền thống. Trong bài này, Tử Ngọc dùng hoa sen vàng làm dấu ngắt giữa các phần.

### Mẫu thiệp cưới hoa nào hợp tiệc sân vườn?

Lan Trắng, Bạch Mai, Hoa Cẩm Tú Cầu, Hoa Cúc và Hồng Viên đều hợp tiệc sân vườn. Hoa Cúc thiên về mộc mạc, Lan Trắng thanh lịch hơn.

### Đổi sang mẫu hoa khác có mất ảnh đã tải lên không?

Không. Đổi mẫu không làm mất nội dung hay ảnh; ảnh nào mẫu mới không có ô thì được giữ lại, chỉ tạm không hiển thị.

### Có đổi được màu hoa trên mẫu không?

Không. Bố cục, font và màu của mẫu là cố định, hai bạn chỉ sửa nội dung. Muốn hoa màu khác, hãy chọn mẫu có sẵn tông đó.
`,
  },
  {
    slug: 'mau-thiep-cuoi-toi-gian',
    category: 'trend',
    title: 'Mẫu thiệp cưới tối giản: 11 thiết kế hiện đại, tông trắng',
    excerpt:
      '11 mẫu thiệp cưới tối giản, hiện đại: nhiều khoảng trắng, ít màu, chữ và ảnh làm điểm nhấn. Kèm gói, số ô ảnh và cách chọn theo bộ ảnh, màu tiệc.',
    readingMinutes: 11,
    markdown: `
Bài này gom 11 mẫu thiệp cưới tối giản trong kho Keemori: những mẫu được xếp vào phong cách Tối giản hoặc Hiện đại, dùng nền trắng, ngà hay xám nhạt, chỉ một hai màu nhấn và để chữ hoặc ảnh cưới làm điểm nhấn. Danh sách có đủ ba gói: 2 mẫu Free không cần ảnh, 6 mẫu Gold từ 1 đến 6 ô ảnh và 3 mẫu Diamond 3 đến 4 ô ảnh. Mỗi mẫu ghi rõ cảm giác chính, gói, số ô ảnh và hợp với ai.

## Thế nào là một mẫu thiệp cưới tối giản, và khi nào nên chọn

Tối giản không có nghĩa là trống trơn. Một tấm thiệp tối giản làm tốt thường có bốn đặc điểm:

- **Nhiều khoảng trắng:** nội dung tách bằng khoảng trống thay vì khung, viền hay hoạ tiết dày. Trên điện thoại, khoảng trắng giúp ngày giờ và địa điểm nổi lên rõ hơn.
- **Ít màu:** thường một màu nền (trắng, ngà, xám ngà) cộng một màu nhấn như đỏ rượu, xanh sương hay xanh lam, đặt đúng chỗ cần nhấn.
- **Chữ làm điểm nhấn:** tên cô dâu chú rể cỡ lớn, tiêu đề mục nhỏ; độ chênh cỡ chữ tự tạo thứ bậc, không cần thêm đường kẻ.
- **Hoạ tiết nhỏ và có chủ đích:** một monogram, một nhành lá, một nét vẽ tay, thay vì hoa lá phủ kín.

Nên chọn thiệp tối giản khi hai bạn có ảnh cưới đẹp và muốn ảnh tự nói, khi tiệc ở không gian sáng, tông trung tính như nhà hàng hiện đại, sân vườn hay bãi biển, hoặc khi chỉ đơn giản thích thông tin rõ, đọc nhanh. Nếu bố mẹ mong có chữ Song Hỷ và sắc đỏ, nên hỏi ý gia đình trước rồi tham khảo thêm bài [mẫu thiệp cưới truyền thống](/vi/blog/mau-thiep-cuoi-truyen-thong).

## 11 mẫu thiệp cưới tối giản và hiện đại đáng xem

### Tí Hon — tranh chibi trên giấy trắng ngà

![Mẫu thiệp Tí Hon dải giấy trắng ngà, hoa dại pastel ở hai mép và tranh chibi cô dâu chú rể](/images/site/blog/mau-thiep-cuoi-toi-gian/ti-hon.jpg)

Tí Hon là kiểu tối giản dễ thương: dải giấy trắng ngà liền mạch, hoa dại pastel lác đác dọc hai mép, tiêu đề màu san hô bo tròn. Tranh chibi cô dâu chú rể nằm trong một khung bo nhẹ, thay cho ảnh chụp. Phần nội dung chỉ dùng chữ không chân nên lướt đọc rất nhanh trên điện thoại.

Gói **Free**, không có ô ảnh. Hợp với cặp đôi trẻ, tiệc thân mật, khi muốn thiệp vui tươi mà chưa có ảnh cưới.

[Xem mẫu Tí Hon](/vi/mau-thiep/ti-hon)

### Ngọc Diệp — xanh sage dịu, điểm san hô

![Mẫu thiệp Ngọc Diệp giấy trắng ánh xanh trên nền sage, tranh màu nước cặp đôi dưới vòm lá](/images/site/blog/mau-thiep-cuoi-toi-gian/ngoc-diep.jpg)

Ngọc Diệp đặt dải giấy trắng ánh xanh rất nhạt lên nền sage. Bìa bố cục lệch: một nửa là tranh màu nước hai bạn dưới vòm lá, nửa kia là tiêu đề viết cọ màu san hô cùng ngày cưới. Màu san hô chỉ dành cho tên, tiêu đề và vài nhành hoa nhỏ, không bao giờ thành mảng lớn, nên cả thiệp luôn nhẹ.

Gói **Free**, không có ô ảnh. Hợp với tiệc ban ngày hoặc sân vườn, cặp đôi thích sắc xanh sage.

[Xem mẫu Ngọc Diệp](/vi/mau-thiep/ngoc-diep)

### Tình Khôi — trắng, đen và một nét xanh sương

![Mẫu thiệp Tình Khôi giấy cotton trắng, mực đen, ảnh vuông bên trái và khối tên chữ có chân bên phải](/images/site/blog/mau-thiep-cuoi-toi-gian/tinh-khoi.jpg)

Tình Khôi dành cho gu tối giản nghiêm ngặt: giấy cotton trắng lạnh, chữ đen, và chỉ một màu nhấn duy nhất là xanh sương. Bìa đặt ảnh vuông bo góc bên trái, tên và ngày cưới dựng thành khối chữ có chân cỡ lớn bên phải. Monogram, trái tim và đôi nhẫn chỉ xuất hiện ở cỡ rất nhỏ.

Gói **Gold**, 1 ô ảnh ở bìa. Hợp với thiệp cưới tông trắng cho tiệc hiện đại trong không gian sáng, khi hai bạn chỉ có một tấm ảnh muốn nó thật nổi bật.

[Xem mẫu Tình Khôi](/vi/mau-thiep/tinh-khoi)

### Nét Thương — giấy ngà và một nhấn đỏ rượu

![Mẫu thiệp Nét Thương dải giấy ngà, chữ nâu đen, nhấn đỏ rượu ở trái tim và dấu sáp](/images/site/blog/mau-thiep-cuoi-toi-gian/net-thuong.jpg)

Nét Thương gần như đơn sắc: giấy ngà thớ mịn, chữ nâu đen, còn đỏ rượu chỉ hiện ở trái tim, những chấm mốc giờ và dấu sáp. Ngoài ảnh cưới, thiệp chỉ có tranh bút chì vẽ địa điểm và một dải nơ màu trung tính; không hoa, không lá, không ren, không kim tuyến.

Gói **Gold**, 2 ô ảnh dọc: chân dung ba phần tư ở bìa và một ảnh cận cảnh khép thiệp. Hợp với tiệc trong nhà tông trung tính, khi hai bạn có hai tấm ảnh đẹp chụp chung một buổi.

[Xem mẫu Nét Thương](/vi/mau-thiep/net-thuong)

### Khuynh Diệp — lá bạch đàn và monogram

![Mẫu thiệp Khuynh Diệp lá bạch đàn màu nước xanh xám, monogram hai chữ lồng trong vòng lá](/images/site/blog/mau-thiep-cuoi-toi-gian/khuynh-diep.jpg)

Khuynh Diệp lấy lá bạch đàn vẽ màu nước, xanh xám như phủ bụi bạc, trải trên giấy ngà và tràn thẳng ra mép thay cho khung ảnh. Điểm tựa của mẫu là monogram ghép chữ cái đầu tên hai bạn trong vòng lá, lặp lại ở mỗi chỗ ngắt mục. Tiêu đề mục nhỏ, tên lớn, nên thiệp không cần đường kẻ nào.

Gói **Gold**, 2 ô ảnh (ảnh bìa và ảnh đôi), kèm phong bì riêng đóng dấu monogram. Hợp với tiệc sân vườn hoặc không gian trung tính.

[Xem mẫu Khuynh Diệp](/vi/mau-thiep/khuynh-diep)

### Thanh Sử — sổ ký hoạ mực xanh xám

![Mẫu thiệp Thanh Sử mặt giấy ngà, mực xanh xám, tranh nét đơn sắc về địa điểm như sổ ký hoạ](/images/site/blog/mau-thiep-cuoi-toi-gian/thanh-su.jpg)

Thanh Sử là một mặt giấy ngà liền mạch, mực xanh xám như cuốn sổ ký hoạ du lịch; địa điểm và cảnh thiên nhiên vẽ nét một màu, cắt vào từ mép trang. Phần đếm ngược, lịch và hộp mừng cưới viền nét hơi rung như vẽ tay thay cho thẻ bo tròn kiểu ứng dụng. Không vàng kim, không hoa màu, không nền tối.

Gói **Gold**, 2 ô ảnh (ảnh đôi và ảnh câu chuyện) hậu kỳ tông xanh sương. Hợp với tiệc nhỏ, không gian giản dị và cặp đôi thích chất du ký.

[Xem mẫu Thanh Sử](/vi/mau-thiep/thanh-su)

### Nắng Xanh — hiện đại, vui tươi, vẽ tay

![Mẫu thiệp Nắng Xanh dải giấy trắng trên nền xanh trời, bìa polaroid dán băng giấy và hình vẽ tay](/images/site/blog/mau-thiep-cuoi-toi-gian/nang-xanh.jpg)

Nắng Xanh cho thấy thiệp cưới hiện đại không cần nghiêm nghị: giấy trắng trên nền xanh trời, chỉ hai màu mực xanh lam và vàng bơ như hai cây bút. Bìa là tấm polaroid dán băng giấy giữa những hình vẽ cưới nhỏ; các phần sau nối nhau bằng khoảng trắng, còn lịch trình là con đường uốn lượn qua năm trái tim.

Gói **Gold**, 1 ô ảnh ở bìa. Hợp với cặp đôi trẻ, tiệc ban ngày, ngoài trời hoặc tiệc biển.

[Xem mẫu Nắng Xanh](/vi/mau-thiep/nang-xanh)

### Hải Lam — tạp chí cưới biển

![Mẫu thiệp Hải Lam ảnh cưới biển dọc tràn khung, dải ba ảnh ngang và đường sóng bọt trắng](/images/site/blog/mau-thiep-cuoi-toi-gian/hai-lam.jpg)

Hải Lam dùng chính ảnh cưới làm bộ khung: ảnh bìa dọc tràn khung, một dải ba ảnh ngang nối liền, lưới ảnh hai cột và cụm ảnh ghép cuối trang. Nền chuyển từ lam rất nhạt sang xanh biển sâu, giữa các phần chỉ có một nét thẳng hay vệt sóng bọt trắng, chữ có chân cỡ lớn đứng giữa nhiều khoảng trắng.

Gói **Gold**, 6 ô ảnh, gồm cả chân dung riêng của cô dâu và chú rể. Hợp với đám cưới biển, resort và cặp đôi có bộ ảnh biển đầy đặn.

[Xem mẫu Hải Lam](/vi/mau-thiep/hai-lam)

### Dạo Phố — xám ngà, để ảnh tự kể chuyện

![Mẫu thiệp Dạo Phố giấy xám ngà, chữ xám đậm, ảnh cưới lớn phủ kín phần bìa](/images/site/blog/mau-thiep-cuoi-toi-gian/dao-pho.jpg)

Dạo Phố gần như đơn sắc với giấy xám ngà và chữ xám đậm, cố ý nhường toàn bộ màu sắc cho ảnh cưới. Bìa là một ảnh lớn giữ trọn khuôn hình hai bạn chọn; câu chuyện tình yêu đứng trước thông tin lễ, ảnh được sắp tay chứ không xếp lưới đều.

Gói **Diamond**, 4 ô ảnh kèm album ảnh cưới. Hợp với gu tối giản không hoa lá, ảnh chụp phố hoặc chụp đời thường.

[Xem mẫu Dạo Phố](/vi/mau-thiep/dao-pho)

### Sóng — sổ ảnh biển trên giấy ngà

![Mẫu thiệp Sóng kiểu sổ dán ảnh biển với vỏ sò, dây thừng, gỗ trôi trên giấy cotton ngà](/images/site/blog/mau-thiep-cuoi-toi-gian/song.jpg)

Sóng giống cuốn sổ dán ảnh bên bờ biển với bảng màu dịu: giấy ngà, mực nâu, xanh biển ngả xám, điểm vỏ sò, dây thừng và gỗ trôi. Thiệp mở đầu bằng tờ giấy xé cạnh trên mặt bàn gỗ; ảnh bìa lượn xuống nền gỗ như mép sóng, câu chuyện của hai bạn viết trên một lá thư kèm bưu ảnh vịnh biển.

Gói **Diamond**, 3 ô ảnh: ảnh bìa, ảnh đôi, ảnh câu chuyện. Hợp với đám cưới miền biển, cặp đôi thích vẻ mộc và thư thả hơn là lộng lẫy.

[Xem mẫu Sóng](/vi/mau-thiep/song)

### Cà Phê — nâu ấm, ảnh làm trung tâm

![Mẫu thiệp Cà Phê giấy kem ngả nâu, chữ nâu đậm, ảnh cưới lớn tràn khung ở bìa](/images/site/blog/mau-thiep-cuoi-toi-gian/ca-phe.jpg)

Cà Phê giữ cách bố cục lấy ảnh làm chính nhưng chuyển sang tông ấm: giấy kem ngả nâu, chữ nâu đậm, nhấn nâu sữa. Ảnh bìa phủ từ mép trên xuống, không bị dải màu nào che mất phần đầu ảnh; sau đó là lời mời hai họ, nghi lễ, ảnh câu chuyện sắp tay, đếm ngược và lịch cưới.

Gói **Diamond**, 4 ô ảnh. Hợp với tiệc ở nhà hàng ấm cúng hoặc không gian gỗ, khi hai bạn muốn bộ ảnh tự kể chuyện.

[Xem mẫu Cà Phê](/vi/mau-thiep/ca-phe)

## Chọn mẫu thiệp cưới tối giản theo ảnh và màu tiệc

Cách lọc nhanh nhất là đếm số ảnh hai bạn thật sự ưng, rồi đối chiếu với tông trang trí của tiệc.

Theo số ảnh:

- **Chưa có ảnh:** Tí Hon, Ngọc Diệp (Free). Mẫu Free có link vĩnh viễn, không giới hạn người xem, nhưng không có xác nhận tham dự và link mời riêng từng khách. Xem thêm lựa chọn trong bài [mẫu thiệp cưới miễn phí](/vi/blog/mau-thiep-cuoi-mien-phi).
- **Một tấm:** Tình Khôi, Nắng Xanh.
- **Hai tấm:** Nét Thương, Khuynh Diệp, Thanh Sử.
- **Ba đến bốn tấm và muốn có album:** Sóng, Dạo Phố, Cà Phê (Diamond; album có giới hạn số ảnh theo chính sách).
- **Cả một bộ ảnh biển:** Hải Lam với 6 ô ảnh.

Theo màu tiệc:

- **Thiệp cưới tông trắng, trung tính:** Tình Khôi, Nét Thương, Dạo Phố, Tí Hon.
- **Xanh lam, xanh biển:** Thanh Sử, Nắng Xanh, Hải Lam, Sóng.
- **Xanh lá:** Khuynh Diệp, Ngọc Diệp.
- **Nâu ấm:** Cà Phê.

Lưu ý về gói: thiệp Gold, Diamond chưa thanh toán là link dùng thử 3 ngày, tối đa 15 người xem; thanh toán xong thì link vĩnh viễn, không giới hạn người xem. Chi phí xem ở [bảng giá](/vi/bang-gia).

## Giữ tấm thiệp gọn cả ở phần nội dung

Một thiệp cưới online đơn giản mà đẹp cần gọn cả chữ lẫn hình. Trên Keemori, mỗi khối nội dung bật tắt riêng: không cần câu chuyện tình yêu, dress code hay nhạc nền thì tắt đi, để khách chỉ thấy lời mời, nghi lễ và tiệc cưới kèm bản đồ, nút mở Google Maps. Lời mời cũng nên ngắn, ví dụ:

> Trân trọng kính mời. Chúng tôi rất hân hạnh được đón tiếp bạn trong ngày vui của gia đình.

Phân vân giữa vài mẫu thì cứ nhập nội dung một lần rồi thử lần lượt: đổi mẫu không làm mất chữ hay ảnh đã nhập, ảnh nào mẫu mới không có ô thì được giữ lại, chỉ tạm không hiển thị. Ảnh tải lên được nén lại và xoá thông tin vị trí GPS. Xuất bản xong, hai bạn nhận link và mã QR để gửi qua Zalo hay Messenger. Các bước chi tiết có trong [hướng dẫn tạo thiệp từng bước](/vi/huong-dan); muốn bắt đầu ngay thì [tạo thiệp cưới online miễn phí](/vi) và xem thử trước.

Muốn xem thêm, vào [kho mẫu thiệp cưới](/vi/mau-thiep) rồi lọc phong cách Tối giản, Hiện đại hoặc lọc theo màu.

## Câu hỏi thường gặp

### Mẫu thiệp cưới tối giản có bị đơn điệu không?

Không, nếu thiệp có một điểm nhấn rõ: tên cỡ lớn, một màu nhấn hay chính ảnh cưới. Nét Thương chỉ dùng một nhấn đỏ rượu trên nền ngà, Dạo Phố để ảnh là thứ duy nhất có màu.

### Thiệp cưới online đơn giản mà đẹp cần những thông tin gì?

Tối thiểu là tên cô dâu chú rể, lời mời của hai họ, giờ, ngày, địa điểm từng lễ và địa chỉ tiệc kèm bản đồ. Câu chuyện tình yêu, album hay nhạc nền là phần thêm, tắt được nếu muốn thiệp thật gọn.

### Thiệp cưới tông trắng hợp với tiệc cưới nào?

Hợp với tiệc ở không gian sáng như nhà hàng hiện đại, sân vườn hay bãi biển, trang trí trắng, xanh hoặc trung tính. Tình Khôi, Nét Thương và Dạo Phố là ba mẫu tông trắng, ngà, xám dễ phối nhất trong danh sách.

### Thiệp cưới hiện đại khác thiệp tối giản thế nào?

Hiện đại nói về tinh thần thiết kế, như bố cục kiểu tạp chí, sổ dán ảnh hay hình vẽ tay; tối giản nói về sự tiết chế màu và hoạ tiết. Nhiều mẫu mang cả hai phong cách, như Tình Khôi, Hải Lam hay Sóng.

### Mẫu thiệp cưới tối giản có cần ảnh cưới không?

Không bắt buộc. Tí Hon và Ngọc Diệp không có ô ảnh, còn Tình Khôi và Nắng Xanh chỉ cần một tấm.
`,
  },
];

type Mark = { type: 'bold' | 'italic' | 'link'; attrs?: { href: string } };
type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: Mark[];
  text?: string;
};

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
const BLOCK_START = /^(#{2,3} |---$|!\[|>|- |\d+\. )/;

function inline(source: string, marks: Mark[] = []): DocNode[] {
  const nodes: DocNode[] = [];
  const pushText = (text: string, withMarks: Mark[]) => {
    if (!text) return;
    nodes.push(
      withMarks.length
        ? { type: 'text', text, marks: withMarks }
        : { type: 'text', text },
    );
  };
  let last = 0;
  for (const match of source.matchAll(INLINE)) {
    const [whole, linkText, href, bold, italic] = match;
    pushText(source.slice(last, match.index), marks);
    if (linkText !== undefined) {
      nodes.push(
        ...inline(linkText, [...marks, { type: 'link', attrs: { href } }]),
      );
    } else if (bold !== undefined) {
      nodes.push(...inline(bold, [...marks, { type: 'bold' }]));
    } else {
      pushText(italic, [...marks, { type: 'italic' }]);
    }
    last = match.index + whole.length;
  }
  pushText(source.slice(last), marks);
  return nodes;
}

/** Các dòng liền nhau của một đoạn trích dẫn giữ nguyên chỗ xuống dòng. */
function linesWithBreaks(lines: string[]): DocNode[] {
  return lines.flatMap((line, index) =>
    index === 0 ? inline(line) : [{ type: 'hardBreak' }, ...inline(line)],
  );
}

function markdownToDoc(markdown: string): DocNode {
  const lines = markdown.split('\n').map((line) => line.trim());
  const content: DocNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) {
      i++;
      continue;
    }
    const heading = line.match(/^(#{2,3}) (.+)$/);
    if (heading) {
      content.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: inline(heading[2]),
      });
      i++;
      continue;
    }
    if (line === '---') {
      content.push({ type: 'horizontalRule' });
      i++;
      continue;
    }
    const image = line.match(/^!\[([^\]]*)\]\((\/[^)\s]+)\)$/);
    if (image) {
      content.push({ type: 'image', attrs: { src: image[2], alt: image[1] } });
      i++;
      continue;
    }
    if (line.startsWith('>')) {
      const paragraphs: string[][] = [[]];
      while (i < lines.length && lines[i].startsWith('>')) {
        const text = lines[i].replace(/^>\s?/, '');
        if (text) paragraphs[paragraphs.length - 1].push(text);
        else paragraphs.push([]);
        i++;
      }
      content.push({
        type: 'blockquote',
        content: paragraphs
          .filter((group) => group.length > 0)
          .map((group) => ({
            type: 'paragraph',
            content: linesWithBreaks(group),
          })),
      });
      continue;
    }
    const list = line.match(/^(-|\d+\.) /);
    if (list) {
      const ordered = list[1] !== '-';
      const itemPattern = ordered ? /^\d+\. (.+)$/ : /^- (.+)$/;
      const items: DocNode[] = [];
      while (i < lines.length) {
        const item = lines[i].match(itemPattern);
        if (!item) break;
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: inline(item[1]) }],
        });
        i++;
      }
      content.push(
        ordered
          ? { type: 'orderedList', attrs: { start: 1 }, content: items }
          : { type: 'bulletList', content: items },
      );
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i] && !BLOCK_START.test(lines[i])) {
      paragraph.push(lines[i]);
      i++;
    }
    content.push({ type: 'paragraph', content: inline(paragraph.join(' ')) });
  }
  return { type: 'doc', content };
}

export class AddFeatureBlogPosts1794500000000 implements MigrationInterface {
  name = 'AddFeatureBlogPosts1794500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [index, post] of POSTS.entries()) {
      await queryRunner.query(
        `INSERT INTO "blog_posts" (
          "slug", "category", "title", "excerpt", "reading_minutes",
          "published_at", "author", "cover_src", "body",
          "created_at", "updated_at"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb,
          now() - make_interval(secs => $10), now() - make_interval(secs => $10)
        )
        ON CONFLICT ("slug") DO NOTHING`,
        [
          post.slug,
          post.category,
          post.title,
          post.excerpt,
          post.readingMinutes,
          PUBLISHED_AT,
          AUTHOR,
          `/images/site/blog/${post.slug}.jpg`,
          JSON.stringify(markdownToDoc(post.markdown)),
          index,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "blog_posts"
      WHERE "slug" = ANY($1) AND "updated_at" = "created_at"`,
      [POSTS.map((post) => post.slug)],
    );
  }
}
