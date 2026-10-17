import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đợt bài blog SEO thứ hai: 9 bài nhóm lập kế hoạch cưới (checklist,
 * dự toán chi phí, danh sách khách, lời chúc, bài phát biểu, gửi thiệp trước bao
 * lâu, chọn ngày cưới, save the date, chọn web tạo thiệp). Các bài link sang
 * công cụ miễn phí ở `/cong-cu/*` và về cụm bài thiệp của đợt một.
 *
 * Cùng luật với `AddFeatureBlogPosts1794500000000`: chỉ **thêm**
 * (`ON CONFLICT ("slug") DO NOTHING`), bài thuộc về CMS từ lúc chèn, chỉ có bản
 * tiếng Việt, và bộ đổi Markdown → ProseMirror nằm ngay trong file — lặp lại
 * bộ đổi của đợt một là **có chủ đích**: mỗi migration là một lát cắt đông
 * cứng, không dựa vào file của migration khác.
 *
 * Tách migration riêng để đợt này deploy độc lập: vài ảnh bìa ở đây là ảnh tạm
 * chờ thay bằng ảnh minh hoạ thật (cùng đường dẫn, chỉ cần ghi đè file).
 *
 * `created_at` lùi thêm một giờ so với đợt một, để khi cùng ngày xuất bản thì
 * ba bài trụ cột của đợt một vẫn đứng đầu danh sách và trang chủ.
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
    slug: 'checklist-chuan-bi-dam-cuoi',
    category: 'guide',
    title: 'Checklist chuẩn bị đám cưới: việc cần làm từ 6 tháng trước',
    excerpt:
      'Checklist chuẩn bị đám cưới chia theo mốc từ 6 tháng trước tới sau ngày cưới: mỗi mốc một danh sách việc cụ thể, kèm những chỗ hai nhà cần thống nhất sớm.',
    readingMinutes: 11,
    markdown: `
Checklist chuẩn bị đám cưới dễ theo nhất là chia việc theo mốc, tính ngược từ ngày cưới. Khoảng sáu tháng trước, chốt ngày, ngân sách, danh sách khách và nơi đãi tiệc. Ba đến bốn tháng trước, đặt ekip, trang phục và ảnh cưới; hai tháng trước lo thiệp và lễ ăn hỏi; một tháng trước gửi thiệp; hai tuần cuối chốt số bàn và lịch trình. Dưới đây là từng mốc với danh sách việc cụ thể, kèm những chỗ hai nhà nên ngồi lại thống nhất trước khi đặt cọc bất cứ thứ gì.

## Chuẩn bị đám cưới cần những gì

Gom lại, chuẩn bị đám cưới là lo bảy nhóm việc. Nhóm nào cũng có việc phải làm sớm và việc để sát ngày, nên checklist chuẩn bị đám cưới bên dưới xếp theo thời gian chứ không theo nhóm:

- **Người lớn và nghi lễ**: ngày cưới, giờ lành, các lễ sẽ làm (dạm ngõ, ăn hỏi, lễ cưới), lễ vật.
- **Tiền**: ngân sách tổng, nhà nào chi khoản nào, lịch đặt cọc và thanh toán.
- **Khách mời**: danh sách của mỗi nhà, số bàn, thiệp mời, xác nhận tham dự.
- **Địa điểm và dịch vụ**: nơi đãi tiệc, trang trí, chụp ảnh và quay phim, trang điểm, MC, xe.
- **Trang phục**: váy cưới, áo dài, vest, nhẫn, trang phục của bố mẹ và phù dâu phù rể.
- **Giấy tờ**: đăng ký kết hôn, hợp đồng và biên nhận cọc với từng dịch vụ.
- **Ngày cưới và sau cưới**: lịch trình, phân việc, lời cảm ơn, thanh toán nốt.

Các mốc dưới đây là gợi ý cho đám cưới đãi tiệc ở nhà hàng. Số lễ và thứ tự lễ khác nhau theo vùng và theo từng nhà, nên cứ dời mốc cho hợp nếp nhà mình, miễn giữ đúng thứ tự trước sau.

## Dựng checklist chuẩn bị đám cưới chung cho hai nhà

Một kế hoạch chuẩn bị đám cưới hay rối không phải vì nhiều việc, mà vì mỗi người giữ một mảnh thông tin. Ba thứ nên dựng ngay từ ngày đầu:

- **Một bảng tính dùng chung** với các cột: việc, hạn, người phụ trách, trạng thái, ghi chú. Danh sách khách và bảng chi phí để ở hai trang riêng trong cùng bảng đó.
- **Mỗi nhà một người đầu mối** để nói chuyện với nhà kia, thường là chính hai bạn. Hai người này chốt, những người khác góp ý qua họ, tránh cảnh bố mẹ hai bên mỗi người nghe một phiên bản.
- **Một thư mục giữ hợp đồng và biên nhận cọc**, chụp lại từng tờ để lúc thanh toán nốt có cái đối chiếu.

## 6 tháng trước: chốt khung cho cả đám cưới

Đây là mốc nặng nhất của lịch chuẩn bị đám cưới 6 tháng: những gì chốt ở đây quyết định mọi việc phía sau.

- **Thưa chuyện với bố mẹ hai bên** về quy mô đám cưới, những lễ sẽ làm, đãi tiệc ở nhà hay nhà hàng, một tiệc chung hay mỗi nhà một tiệc.
- **Chọn ngày cưới.** Nhiều gia đình nhờ người lớn xem ngày, xem giờ. Nên có sẵn hai, ba ngày dự phòng, vì những ngày nhiều nhà cùng chọn thì sảnh tiệc kín rất sớm.
- **Lập ngân sách tổng** và chia thành các khoản lớn: tiệc, lễ vật, trang phục, ảnh, dịch vụ, cộng một khoản dự phòng để riêng.
- **Lập danh sách khách nháp** cho từng nhà để ra số bàn ước tính. Cách chia nhóm, các cột cần có và cách cắt bớt có trong bài [cách lập danh sách khách mời đám cưới](/vi/blog/cach-lap-danh-sach-khach-moi-dam-cuoi).
- **Đi xem và đặt nơi đãi tiệc.** Trước khi cọc, hỏi số bàn tối thiểu, số ghế mỗi bàn, hạn cuối báo số bàn, chính sách bàn dự phòng và mọi khoản phụ phí.
- **Chọn studio ảnh cưới** nếu hai bạn chụp ảnh trước ngày cưới, vì vào mùa cưới lịch chụp kín sớm.

![Bố mẹ hai bên ngồi quanh bàn trà gỗ, bàn bạc chuyện cưới bên cuốn sổ ghi chép](/images/site/blog/checklist-chuan-bi-dam-cuoi/hai-nha-ban-chuyen-cuoi.jpg)

**Hai nhà cần thống nhất:** ngày và giờ của từng lễ; số khách và số bàn mỗi bên; tiệc chung hay tiệc riêng; nhà nào chi khoản nào. Riêng chuyện tiền nên nói rõ từ buổi đầu, vì mỗi vùng, mỗi nhà có một nếp chia khác nhau và không có cách nào là đúng duy nhất.

## 3–4 tháng trước: đặt ekip, trang phục, ảnh cưới

- **Chụp ảnh cưới**, nếu có. Muốn đưa ảnh lên thiệp thì tính cả thời gian studio chỉnh và giao ảnh, để kịp làm thiệp ở mốc hai tháng.
- **Đặt ekip ngày cưới**: chụp ảnh và quay phim phóng sự, trang điểm cô dâu, MC, trang trí nhà (cổng hoa, phông lễ gia tiên), xe hoa, đội bê tráp nếu cần.
- **Trang phục cô dâu chú rể**: váy cưới, áo dài cho lễ gia tiên, vest. May đo thì cần thử nhiều lần; thuê thì giữ lịch sớm với mẫu mình thích.
- **Nhẫn cưới**: đặt sớm nếu cần khắc chữ hay chỉnh cỡ.
- **Mời phù dâu, phù rể** và thống nhất với họ về trang phục.
- **Trang phục bố mẹ hai bên**, nhất là áo dài may, để cả nhà đứng chung một tông trong ảnh.

**Hai nhà cần thống nhất:** lễ ăn hỏi làm ngày nào và gồm những gì (số tráp, lễ vật, đoàn mỗi bên bao nhiêu người); đoàn rước dâu đi mấy xe; nghi lễ nào làm ở nhà. Lễ vật và cách làm lễ mỗi vùng một khác, nên để người lớn hai bên bàn trực tiếp với nhau, còn hai bạn ghi lại kết quả vào bảng chung.

## 2 tháng trước: thiệp mời và lễ ăn hỏi

- **Chọn mẫu thiệp và soạn nội dung**: tên bố mẹ hai bên, ngày dương và ngày âm, giờ đón khách, giờ khai tiệc, địa chỉ. Soạn bản online trước, nhờ bố mẹ hai bên duyệt, rồi mới mang đúng nội dung đó đi in thiệp giấy để hai bản khớp nhau.
- **Đặt in thiệp giấy** cho những người sẽ được mời tận nhà, thường là ông bà, họ hàng lớn tuổi, hàng xóm lâu năm; bạn bè, đồng nghiệp và người ở xa nhận thiệp online.
- **Chốt danh sách khách lần hai** với bố mẹ trước khi in, vì in rồi mới thêm người là phải in bù.
- **Lễ ăn hỏi**, nếu nhà bạn làm trước lễ cưới. Có nhà làm cách lễ cưới vài tháng, có nhà làm sát ngày hoặc gộp chung một ngày; hỏi ý người lớn để biết lịch của nhà mình.
- **Đăng ký kết hôn**: hỏi trước nơi làm thủ tục cần mang những giấy tờ gì để không phải đi lại nhiều lần.
- **Thử váy lần đầu và trang điểm thử**, chụp lại kiểu tóc ưng ý để gửi chuyên viên.

**Hai nhà cần thống nhất:** ai đứng tên mời trên thiệp của mỗi nhà, thiệp ghi lễ vu quy hay lễ thành hôn, và những người lớn nào phải đến tận nhà mời.

## 1 tháng trước: gửi thiệp và mở xác nhận tham dự

- **Mời người lớn trước**: bố mẹ hoặc hai bạn đến nhà đưa thiệp giấy, gọi điện cho người ở xa.
- **Gửi thiệp cho bạn bè, đồng nghiệp**, thường khoảng hai đến bốn tuần trước ngày cưới. Mốc cho từng nhóm khách có trong bài [gửi thiệp cưới trước bao lâu](/vi/blog/gui-thiep-cuoi-truoc-bao-lau); thứ tự gửi và chuyện nhắn riêng hay gửi nhóm có trong bài [cách gửi thiệp cưới online qua Zalo](/vi/blog/cach-gui-thiep-cuoi-online-qua-zalo); lời nhắn kèm link thì lấy ở bài [tin nhắn mời cưới](/vi/blog/tin-nhan-moi-cuoi).
- **Mở xác nhận tham dự cùng lúc gửi thiệp**, đặt hạn trả lời sớm hơn hạn báo số bàn của nhà hàng vài ngày đến một tuần. Form nên hỏi gì, nhắc người chưa trả lời ra sao có trong bài [xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi).
- **Làm kịch bản tiệc với MC và nhà hàng**: thứ tự nghi thức trên sân khấu, nhạc, ai phát biểu.
- **Ăn thử và chốt thực đơn** nếu nhà hàng có buổi ăn thử.
- **Chuẩn bị nhà cửa**: bàn thờ gia tiên, chỗ tiếp khách, chỗ đậu xe cho đoàn.
- **Thử váy lần cuối** hoặc nhận đồ đã sửa.

**Hai nhà cần thống nhất:** giờ lành của từng lễ, giờ đoàn nhà trai đến và lộ trình rước dâu, người phát biểu đại diện mỗi nhà.

## 2 tuần trước: chốt số bàn và lịch trình

- **Đóng xác nhận tham dự**: nhắn riêng người chưa trả lời, ước số khách, rồi báo số bàn cho nhà hàng đúng hạn.
- **Viết lịch trình ngày cưới** thành hai bản: bản ngắn cho khách trên thiệp, bản chi tiết từng mười lăm phút cho hai nhà và ekip. Bài [lịch trình ngày cưới](/vi/blog/lich-trinh-ngay-cuoi) có hai lịch trình mẫu để chỉnh theo.
- **Gọi xác nhận lại từng ekip**: giờ có mặt, địa chỉ từng nơi, số điện thoại người liên hệ ở mỗi nhà.
- **Phân việc cho người thân** theo danh sách ở mục ngày cưới bên dưới, kèm người đón khách ở cửa sảnh và người lo xe.
- **Xếp chỗ ngồi** nếu muốn chia khu: họ hàng mỗi nhà, bạn của bố mẹ, bạn của hai bạn, đồng nghiệp.

**Hai nhà cần thống nhất:** số bàn cuối cùng của mỗi bên, cách tính tiền nếu đãi chung một tiệc, và khu ngồi của mỗi họ.

## Tuần cuối: rà lại và giữ sức

- **Nhắc khách** khoảng hai, ba ngày trước bằng một tin ngắn gồm giờ đón khách, địa điểm và lại link thiệp.
- **Nhận trang phục**, kiểm tra cúc, khoá, độ dài váy, giày.
- **Chuẩn bị tiền thanh toán phần còn lại** cho từng dịch vụ, chia sẵn và ghi tên người nhận.
- **Soạn túi đồ ngày cưới**: giấy tờ, sạc dự phòng, kim chỉ, kẹp tăm, một đôi giày đế bệt, thuốc cá nhân, khăn giấy.
- **Gửi lịch trình nội bộ** cho mọi người có tên trong đó, in thêm vài bản cho người lớn.
- **Ngủ đủ**, tránh thử mỹ phẩm hay kiểu tóc mới trong tuần này.

**Hai nhà cần thống nhất:** cùng đọc lại lịch trình nội bộ lần cuối, nhất là giờ đoàn xuất phát và số người trong đoàn.

## Ngày cưới: giao việc để hai bạn được có mặt

Đến ngày cưới, việc của hai bạn là có mặt trọn vẹn chứ không phải điều phối, nên checklist của ngày này chủ yếu là việc đã giao từ trước:

- **Người cầm giờ** giữ lịch trình, gọi xe, nhắc thợ ảnh và MC.
- **Người giữ đồ** giữ nhẫn, giấy tờ và túi đồ dự phòng của cô dâu.
- **Người giữ tiền mừng** cho mỗi nhà, có hộp khoá được, bàn giao lại ngay sau tiệc.
- **Bữa sáng và nước uống** cho cô dâu chú rể; ngày cưới dài hơn hai bạn tưởng.
- **Cuối tiệc**, một người của mỗi nhà cùng quản lý sảnh đếm số bàn thực tế đã dùng, đối chiếu với số đã báo rồi mới ký.

## Sau cưới: cảm ơn, thanh toán, cất giữ

- **Thanh toán nốt** các dịch vụ, đối chiếu với hợp đồng và biên nhận cọc.
- **Trả đồ thuê** đúng hạn.
- **Gửi lời cảm ơn** tới khách, người thân đã phụ giúp và ekip. Mẫu câu cho từng người nhận có trong bài [lời cảm ơn sau đám cưới](/vi/blog/loi-cam-on-sau-dam-cuoi).
- **Ghi lại danh sách quà mừng** nếu nhà bạn có nếp này, để sau còn đi lại cho chu đáo.
- **Nhận ảnh, video và sao lưu** ở ít nhất hai nơi.
- **Khép lại thiệp online**: sửa lời cảm ơn trên thiệp cho hợp với lúc tiệc đã xong, duyệt nốt lời chúc khách gửi vào sổ lưu bút.

## Còn ít hơn 6 tháng thì làm sao

Ba tháng vẫn đủ cho một đám cưới chu đáo, chỉ là nhiều mốc phải chạy song song:

- **Dồn mốc sáu tháng và ba tháng vào hai tuần đầu**: chốt ngày, ngân sách, danh sách khách, nơi đãi tiệc, rồi đặt ngay ekip.
- **Giữ chỗ trước những thứ có lịch hạn chế** như sảnh tiệc, trang điểm, chụp và quay phim ngày cưới. Trang phục thuê và thiệp online thì làm nhanh được.
- **Bỏ bớt việc không bắt buộc.** Không kịp chụp ảnh cưới trước thì chọn một mẫu thiệp minh hoạ không cần ảnh.
- **Giữ nguyên các mốc từ một tháng trước trở đi**, vì khách vẫn cần thời gian sắp xếp và nhà hàng vẫn có hạn báo số bàn.

## Phần thiệp mời trong checklist, làm trên Keemori

Nếu hai bạn [tạo thiệp cưới online](/vi) trên Keemori, các việc ở mốc hai tháng và một tháng gọn hơn:

- **Tạo thiệp và xem thử miễn phí.** Đổi mẫu không làm mất chữ hay ảnh đã nhập, nên có thể soạn nội dung trước, chọn mẫu sau.
- **Một thiệp, nhiều nghi lễ.** Mỗi lễ có giờ, ngày, địa điểm và nút chỉ đường Google Maps riêng, cùng khối lịch trình, đếm ngược và nút "Thêm vào lịch".
- **Sửa sau khi đã gửi.** Đổi giờ hay đổi sảnh thì sửa trên thiệp, khách mở lại link là thấy thông tin mới.
- **Xác nhận tham dự và link mời riêng từng khách có từ gói Gold.** Thiệp Gold chưa thanh toán là bản dùng thử 3 ngày, tối đa 15 người xem, nên hãy thanh toán trước khi gửi cho cả danh sách. Gói Free không có hai tính năng này, nhưng link vĩnh viễn và không giới hạn người xem.

## Câu hỏi thường gặp

### Nên bắt đầu chuẩn bị đám cưới trước bao lâu?

Khoảng sáu tháng là thoải mái với phần lớn đám cưới có tiệc ở nhà hàng, vì sảnh tiệc và ekip hay kín lịch sớm. Ba tháng vẫn kịp nếu chạy song song nhiều việc.

### Chuẩn bị đám cưới cần làm gì đầu tiên?

Thưa chuyện với bố mẹ hai bên để chốt ngày cưới, quy mô và ngân sách. Có ba thứ này rồi mới lập danh sách khách và đi đặt nơi đãi tiệc.

### Khi nào nên gửi thiệp cưới?

Thường khoảng hai đến bốn tuần trước ngày cưới. Người lớn tuổi và khách ở xa cần đặt vé, xin nghỉ thì nên được báo miệng sớm hơn.

### Ngày cưới nên giao những việc gì cho người khác?

Cầm giờ, giữ nhẫn và giấy tờ, giữ tiền mừng, đón khách và đối chiếu số bàn với nhà hàng. Mỗi việc một người, giao trước ít nhất một tuần.
`,
  },
  {
    slug: 'du-toan-chi-phi-dam-cuoi',
    category: 'guide',
    title: 'Dự toán chi phí đám cưới: các khoản cần tính và cách lập bảng',
    excerpt:
      'Dự toán chi phí đám cưới theo từng nhóm khoản: lễ hỏi, tiệc, trang phục, ảnh, thiệp; khoản nào phải cọc sớm, cách lập bảng so báo giá và mẹo tiết kiệm thực tế.',
    readingMinutes: 10,
    markdown: `
Dự toán chi phí đám cưới là liệt kê mọi khoản sẽ chi theo từng nhóm, lấy hai, ba báo giá cho mỗi khoản, rồi ghi rõ khoản nào đã cọc, còn lại bao nhiêu và nhà nào chi. Khoản lớn nhất thường là tiệc, mà tiệc tính theo số bàn, nên con số đáng tin nhất bắt đầu từ danh sách khách mời. Bài này không đưa giá, vì giá mỗi nơi, mỗi mùa một khác; thay vào đó là khung bảng dự toán và cách điền để ra con số của chính hai bạn.

## Chi phí đám cưới gồm những gì

Dưới đây là mười nhóm khoản thường gặp. Không nhà nào chi đủ cả, nhưng đi qua hết một lượt giúp hai bạn không quên khoản nào rồi giật mình vào tuần cuối:

- **Lễ dạm ngõ và lễ ăn hỏi**: tráp lễ vật, đội bê tráp và trang phục của đội, trang trí nhà gái, mâm cơm tiếp đoàn, cùng khoản lễ đen ở những nơi có tục này. Lễ vật mỗi vùng một khác, nên hỏi người lớn danh sách cụ thể của nhà mình.
- **Lễ cưới tại nhà**: cổng hoa, phông lễ gia tiên, bàn ghế hoặc rạp nếu đãi ở nhà, mâm lễ gia tiên, nước và bánh kẹo tiếp khách.
- **Tiệc cưới**: tiền mâm theo số bàn, đồ uống (nhiều nơi tính riêng theo thực tế), trang trí sảnh, sân khấu, âm thanh ánh sáng, MC, văn nghệ, bánh cưới.
- **Trang phục**: váy cưới, áo dài lễ gia tiên, vest, giày, trang phục bố mẹ, phù dâu phù rể.
- **Ảnh cưới và quay phim**: chụp ảnh cưới trước ngày cưới, chụp và quay phóng sự ngày cưới, ảnh lớn đặt ở tiệc, album in.
- **Trang điểm và làm tóc**: cho lễ hỏi, cho ngày cưới (có khi hai lần trong ngày nếu đổi trang phục), cho mẹ và phù dâu.
- **Thiệp mời**: in thiệp giấy, phong bì, công đi đưa, thiệp online.
- **Nhẫn, quà và lễ vật**: nhẫn cưới, trang sức nhiều nhà trao trong lễ gia tiên, quà cảm ơn phù dâu phù rể và người phụ giúp.
- **Đi lại và chỗ ở**: xe hoa, xe đưa đoàn rước dâu, xe đón họ hàng ở xa, phòng nghỉ cho khách từ tỉnh khác.
- **Dự phòng**: bàn kê thêm, phụ phí quá giờ, đồ hỏng phải mua lại, những thứ "tiện thể" phát sinh trong tuần cuối.

Tuần trăng mật, nếu có, nên để ở một bảng riêng. Gộp vào thì rất dễ bị cắt đầu tiên mỗi khi phần tiệc vượt dự toán.

## Khoản nào phải đặt cọc sớm

Lập ngân sách đám cưới không chỉ là tính tổng, mà còn là biết tiền phải có sẵn vào lúc nào. Những khoản dưới đây thường phải cọc từ nhiều tháng trước, vì lịch của họ có hạn:

- **Sảnh tiệc hoặc nhà hàng**: cọc lúc ký hợp đồng, thường là việc đầu tiên sau khi chốt ngày.
- **Studio ảnh cưới, ekip chụp và quay ngày cưới**: mùa cưới kín lịch sớm.
- **Chuyên viên trang điểm và MC**: người được nhiều cặp tìm thì lịch hết nhanh.
- **Váy cưới, áo dài may đo**: cọc khi đặt may.
- **Trang trí nhà, rạp, xe hoa**: cọc để giữ ngày.

Những khoản như thiệp in, tráp lễ vật, đồ uống tiệc thường đặt hoặc trả sát ngày hơn. Nhiều dịch vụ thu phần còn lại vào ngày cưới hoặc ngay sau tiệc, nên tuần cuối là lúc hai bạn cần nhiều tiền mặt nhất.

Trước khi đưa cọc cho bất kỳ ai, hỏi đủ bốn câu và ghi câu trả lời vào hợp đồng:

1. Cọc bao nhiêu, phần còn lại trả khi nào và trả cho ai?
2. Đổi ngày hoặc huỷ thì khoản cọc được xử lý ra sao?
3. Giá báo đã gồm thuế và phí phục vụ chưa?
4. Những phụ phí nào có thể phát sinh, và tính theo cách nào?

## Cách lập bảng dự toán chi phí đám cưới

Một bảng tính đơn giản là đủ, miễn mỗi dòng là một hạng mục và có đủ các cột sau:

1. **Nhóm khoản**: một trong mười nhóm ở trên.
2. **Hạng mục**: ví dụ "Trang điểm ngày cưới", "Xe hoa".
3. **Báo giá 1, Báo giá 2, Báo giá 3**: mỗi cột ghi số tiền kèm tên nơi báo và ngày báo, vì báo giá thường chỉ giữ trong một thời gian.
4. **Giá chốt**: con số của nơi hai bạn chọn.
5. **Đã cọc**: số tiền và ngày cọc.
6. **Còn lại**: giá chốt trừ đã cọc, để công thức tự tính.
7. **Hạn trả nốt**.
8. **Ai chi**: nhà trai, nhà gái hay hai bạn.
9. **Ghi chú**: phụ phí, điều khoản huỷ, số điện thoại người liên hệ.

Cách điền:

- **Đi hết mười nhóm, xoá những dòng nhà mình không làm.** Xoá còn hơn để trống, vì dòng trống dễ bị hiểu là "chưa tính".
- **Hạng mục lớn lấy ít nhất hai báo giá**, và so cùng một gói: cùng số giờ, cùng số ảnh giao, cùng số món trong mâm.
- **Cộng tổng theo cột "Ai chi"** để mỗi bên thấy ngay phần của mình, không phải nhẩm lại mỗi lần hỏi.
- **Thêm một cột "Thực chi"** điền sau đám cưới. Hai cột đặt cạnh nhau cho hai bạn biết dự toán lệch ở đâu, và là bảng tham khảo quý cho anh chị em cưới sau.

### Tính tiền tiệc theo số bàn

Tiền tiệc thường bằng số bàn nhân giá một bàn theo thực đơn đã chọn, cộng đồ uống và các khoản tính theo sảnh. Phần khó là số bàn, vì lúc lập dự toán chưa ai biết chắc bao nhiêu khách sẽ đến.

Cách làm thực tế là tính ba kịch bản từ danh sách khách:

- **Kịch bản cao**: mọi người trong danh sách đều đến, tính cả người đi kèm.
- **Kịch bản dự kiến**: người chắc chắn đến cộng phần hai bạn ước cho những người còn lại.
- **Kịch bản thấp**: chỉ họ hàng gần và bạn thân.

Lấy kịch bản dự kiến để ghi vào bảng, nhưng kiểm xem kịch bản cao có vượt quá sức hai nhà không. Số khách chia cho số ghế mỗi bàn của nhà hàng, làm tròn lên, ra số bàn. [Công cụ tính số bàn tiệc cưới](/vi/cong-cu/tinh-so-ban-tiec-cuoi) làm phép tính này cho bạn: nhập số khách mời, số người đã xác nhận và tỉ lệ bạn tự ước cho nhóm chưa trả lời. Danh sách khách gọn từ đầu thì cả ba kịch bản đều sát; cách lập có trong bài [cách lập danh sách khách mời đám cưới](/vi/blog/cach-lap-danh-sach-khach-moi-dam-cuoi).

### Để riêng một khoản dự phòng

Lời khuyên ở đây là có một dòng dự phòng tách khỏi các hạng mục ngay từ đầu, và chỉ dùng khi thật sự phát sinh. Bao nhiêu là đủ tuỳ quy mô và độ chắc chắn của các báo giá: bảng càng nhiều chỗ ghi "tuỳ thực tế" thì dòng này càng nên rộng. Phần dự phòng không dùng đến là khoản để dành cho sau cưới.

## Ai chi khoản nào: hai nhà nên bàn sớm

Cách chia chi phí đám cưới khác nhau theo vùng và theo từng nhà, không có công thức nào đúng cho mọi đám cưới. Có nhà để nhà trai lo phần lễ vật và rước dâu, mỗi nhà lo tiệc của mình; có nhà đãi chung rồi chia theo số bàn mỗi bên mời; có nhà để hai bạn tự lo phần lớn. Điều quan trọng là bàn sớm, trước khi bất kỳ ai đặt cọc.

Những câu nên có câu trả lời rõ ngay từ buổi đầu:

- Tiệc chung hay riêng? Nếu chung thì chia tiền theo cách nào?
- Lễ vật, trang trí, xe rước dâu thuộc phần nhà nào?
- Hai bạn tự chi những gì? Nhiều cặp tự lo ảnh cưới, nhẫn, trang phục và tuần trăng mật.
- Tiền mừng của khách bên nào thì về nhà đó, hay gộp lại? Nhiều gia đình có nếp riêng, nên hỏi thẳng mà nhẹ nhàng.

Một lưu ý về tiền mừng: đừng lập dự toán chi phí đám cưới dựa trên tiền mừng dự kiến. Con số đó không biết trước, và chỉ có sau tiệc, trong khi phần lớn khoản cọc phải trả từ nhiều tháng trước.

Bàn xong thì ghi kết quả vào cột "Ai chi" và gửi bản tóm tắt cho cả hai nhà. Một bảng chung mà ai cũng xem được giúp tránh hiểu lầm hơn mọi lời giải thích sau này.

## Cách tiết kiệm chi phí đám cưới mà không thấy bị bớt

Tiết kiệm hiệu quả nhất là bớt những thứ không ai nhớ, giữ nguyên những thứ hai bạn và khách sẽ nhớ.

- **Chốt số bàn bằng xác nhận tham dự, đừng đoán.** Tiệc là khoản lớn nhất, và mỗi bàn đặt dư là một bàn trả tiền mà không ai ngồi. Mở xác nhận tham dự cùng lúc gửi thiệp, chốt trước hạn báo số bàn của nhà hàng; cách làm có trong bài [xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi).
- **Thiệp online thay một phần thiệp giấy.** In thiệp giấy cho người lớn được mời tận nhà, gửi thiệp online cho bạn bè, đồng nghiệp, người ở xa. Số thiệp in và công đi đưa giảm hẳn, mà người lớn vẫn nhận được tấm thiệp trang trọng. Bài [thiệp cưới online là gì](/vi/blog/thiep-cuoi-online-la-gi) nói kỹ cách kết hợp hai loại.
- **So nhiều báo giá, so cùng một gói.** Báo giá thấp mà giao ít ảnh hơn, ít giờ hơn hay ít món hơn thì không rẻ hơn.
- **Hỏi rõ phụ phí trước khi ký**: phí phục vụ, thuế, đồ uống, phí mang rượu hay bánh từ ngoài vào, phí quá giờ, phụ phí ngày lễ, phụ phí trang điểm sớm hoặc đi xa. Phần lớn chuyện "đội giá" đến từ đây chứ không từ giá gói.
- **Thuê thay vì mua** những gì chỉ dùng một ngày: váy cưới, vest, trang phục đội bê tráp, đồ trang trí.
- **Hỏi giá ngày thường.** Nhiều nhà hàng và ekip có giá khác cho ngày thường hoặc ngoài mùa cưới, nếu ngày gia đình chọn cho phép.
- **Mỗi người chọn ba thứ quan trọng nhất.** Dồn tiền vào đó, những hạng mục còn lại chọn mức vừa phải.

## Phần thiệp trong dự toán, làm với Keemori

Nếu hai bạn [tạo thiệp cưới online miễn phí](/vi) trên Keemori, dòng "thiệp online" trong bảng có thể là số không: tạo thiệp, xem thử và xuất bản với gói Free không mất phí, link vĩnh viễn, không giới hạn người xem. Mẫu Free là mẫu minh hoạ vẽ riêng, không cần ảnh cưới, nên không phụ thuộc lịch giao ảnh của studio.

Nếu muốn có xác nhận tham dự để chốt số bàn sát hơn, hoặc link mời riêng chào đích danh từng khách, hai tính năng này có từ gói Gold. Mức giá từng gói xem ở [bảng giá](/vi/bang-gia).

## Câu hỏi thường gặp

### Chi phí đám cưới gồm những khoản nào?

Thường gồm lễ ăn hỏi, lễ cưới tại nhà, tiệc, trang phục, ảnh và quay phim, trang điểm, thiệp, nhẫn và lễ vật, đi lại, cộng một khoản dự phòng. Mỗi nhà chỉ chi một phần trong số đó, tuỳ số lễ và quy mô.

### Nên lập ngân sách đám cưới từ khi nào?

Ngay khi chốt ngày cưới, trước khi đặt cọc bất kỳ dịch vụ nào, thường khoảng sáu tháng trước. Các mốc việc còn lại có trong bài [checklist chuẩn bị đám cưới](/vi/blog/checklist-chuan-bi-dam-cuoi).

### Có nên tính tiền mừng vào ngân sách đám cưới không?

Không nên dựa vào tiền mừng để chi trước. Con số này không biết trước và chỉ có sau tiệc, còn các khoản cọc phải trả từ nhiều tháng trước.

### Chưa biết bao nhiêu khách đến thì dự toán tiền tiệc thế nào?

Tính ba kịch bản cao, dự kiến và thấp từ danh sách khách, ghi kịch bản dự kiến vào bảng. Khi có câu trả lời xác nhận tham dự, tính lại số bàn để chốt với nhà hàng.
`,
  },
  {
    slug: 'cach-lap-danh-sach-khach-moi-dam-cuoi',
    category: 'guide',
    title: 'Danh sách khách mời đám cưới: cách lập, chia nhóm, chốt số bàn',
    excerpt:
      'Cách lập danh sách khách mời đám cưới: chia theo nhà và theo nhóm, các cột cần có, cắt bớt khi vượt số bàn, khách kèm người thương, con nhỏ và khách ở xa.',
    readingMinutes: 10,
    markdown: `
Danh sách khách mời đám cưới dễ quản lý nhất khi chia làm ba phần: khách nhà trai, khách nhà gái và bạn bè của hai bạn; trong mỗi phần lại chia theo nhóm như họ hàng, bạn của bố mẹ, đồng nghiệp, bạn bè. Mỗi dòng là một người hoặc một hộ, ghi cách xưng hô sẽ đặt trên thiệp, số người đi, tiệc được mời, đã gửi thiệp chưa và đã xác nhận chưa. Nên lập ngay sau khi chốt ngày cưới, vì số khách quyết định số bàn, và số bàn quyết định phần lớn chi phí.

## Khi nào lập danh sách khách mời đám cưới

Danh sách khách mời đi qua ba bản, mỗi bản gắn với một mốc chuẩn bị:

1. **Bản nháp**, khoảng sáu tháng trước, ngay sau khi chốt ngày: để ước số bàn trước khi đặt cọc sảnh tiệc.
2. **Bản để in thiệp**, khoảng hai tháng trước: chốt người được mời và cách xưng hô, vì in rồi mới thêm người là phải in bù.
3. **Bản chốt số bàn**, khoảng hai tuần trước: cập nhật theo câu trả lời xác nhận tham dự, rồi báo nhà hàng.

Ba mốc này nằm chung với các việc khác trong bài [checklist chuẩn bị đám cưới](/vi/blog/checklist-chuan-bi-dam-cuoi).

## Mời bao nhiêu khách đám cưới là vừa

Không có con số đúng cho mọi đám cưới. Số khách vừa với nhà mình là con số nằm dưới cả ba giới hạn sau:

- **Ngân sách tiệc**: hai nhà chi được tối đa bao nhiêu bàn. Bài [dự toán chi phí đám cưới](/vi/blog/du-toan-chi-phi-dam-cuoi) có cách tính tiền tiệc theo số bàn.
- **Sức chứa nơi đãi tiệc**: sảnh hay nhà riêng xếp được bao nhiêu bàn mà khách vẫn đi lại thoải mái.
- **Quan hệ thực tế**: những người hai bạn và bố mẹ thật sự muốn có mặt.

Cách tính ngược cho gọn: số bàn tối đa nhân số ghế mỗi bàn ra trần số khách, rồi chia trần đó cho từng nhà trước khi ai bắt đầu liệt kê. Chia trước thì mỗi nhà tự cân danh sách của mình; liệt kê trước rồi mới chia thì bên nào cũng thấy mình bị cắt.

Lưu ý thêm: trần là số **người**, không phải số thiệp. Một tấm thiệp "Anh Tuấn và gia đình" có thể là bốn người.

## Chia khách mời theo nhóm: theo nhà trước, theo quan hệ sau

### Ba danh sách theo nhà

- **Nhà trai**: khách của bố mẹ chú rể, họ hàng bên nội và bên ngoại của chú rể.
- **Nhà gái**: tương tự, phía cô dâu.
- **Bạn của hai bạn**: bạn học, đồng nghiệp, bạn chung của cả hai.

Tách phần bạn bè ra riêng vì đây là phần hai bạn tự quyết, còn khách của bố mẹ thì để bố mẹ tự duyệt. Nếu hai nhà đãi tiệc riêng, phần này còn phải ghi thêm bạn nào dự tiệc nhà nào.

### Các nhóm trong mỗi nhà

- **Họ hàng gần**: ông bà, cô dì chú bác ruột, anh chị em họ thân. Nhóm này thường được mời cả phần lễ ở nhà.
- **Họ hàng xa**: những nhà ít gặp nhưng vẫn qua lại dịp giỗ, Tết.
- **Bạn của bố mẹ và hàng xóm**.
- **Đồng nghiệp**: của bố mẹ và của hai bạn.
- **Bạn bè**: bạn thân, bạn học từng cấp, các nhóm hay đi chơi chung.

Chia nhóm có hai cái lợi. Khi phải cắt bớt, hai bạn cắt theo khối thay vì cân nhắc từng người. Khi xếp chỗ, mỗi nhóm ngồi một khu, ai cũng có người quen cùng bàn.

## Cách lập danh sách khách mời: các cột cần có

Một bảng tính dùng chung là đủ, mỗi dòng một người hoặc một hộ. Các cột nên có:

1. **Tên trong danh bạ**: tên hai bạn vẫn lưu, để tìm cho nhanh.
2. **Cách xưng hô trên thiệp**: "Cô Chú Hùng Lan", "Bạn Linh và người thương". Ghi đúng cách người mời gọi người nhận; ví dụ cho từng vai có trong bài [thiệp cưới ghi tên khách mời](/vi/blog/thiep-cuoi-ghi-ten-khach-moi).
3. **Nhà và nhóm**: nhà trai, nhà gái hay bạn hai bạn; họ hàng, đồng nghiệp hay bạn bè.
4. **Người mời**: bố, mẹ, cô dâu hay chú rể. Người này gửi thiệp và cũng là người nhắc nếu khách chưa trả lời.
5. **Mức ưu tiên**: "chắc chắn mời" hay "mời nếu còn chỗ". Cột này là thứ giúp cắt bớt nhanh về sau.
6. **Số người dự kiến**: tính cả người đi kèm và trẻ em có ngồi ghế riêng.
7. **Mời tiệc nào**: lễ ở nhà, tiệc nhà gái, tiệc nhà trai.
8. **Cách mời**: đưa thiệp giấy tận nhà, gửi thiệp online, hay gọi điện trước rồi gửi sau.
9. **Đã gửi thiệp chưa**: ghi ngày gửi.
10. **Đã xác nhận chưa**: có đến không, đi mấy người.
11. **Ghi chú**: ăn chay, cần xe đón, ở tỉnh xa, cần phòng nghỉ.

Mời cả nhà thì một hộ một dòng, số người ghi ở cột riêng. Đừng tách mỗi thành viên một dòng, vì như vậy khi đếm thiệp và đếm người sẽ lẫn vào nhau.

## Cắt bớt khi danh sách vượt số bàn

Gần như đám cưới nào cũng có lúc danh sách dài hơn số bàn. Vài cách cắt mà ít làm mất lòng:

- **Cắt theo nhóm, không cắt lẻ.** "Đồng nghiệp chỉ mời cùng phòng", "bạn học chỉ mời nhóm còn liên lạc" dễ giải thích hơn việc mời người này mà bỏ người ngồi cạnh.
- **Dùng cột mức ưu tiên.** Cắt hết nhóm "mời nếu còn chỗ" trước khi đụng tới nhóm "chắc chắn mời".
- **Để bố mẹ tự cắt khách của bố mẹ.** Hai bạn chỉ báo con số cần giảm, người lớn biết rõ ai không thể thiếu hơn.
- **Rà lại phần đuôi sau tên.** "Và gia đình" thành tên vợ chồng, hay "và người thương" thành tên riêng, cũng là bớt người. Chỉ làm khi chắc chắn không gây hiểu lầm, và áp dụng giống nhau cho cả nhóm.
- **Cân lại giữa hai nhà.** Nhà này dư suất, nhà kia thiếu thì bàn để chia lại, đừng để mỗi bên tự cắt trong im lặng.

Cắt hết các cách trên mà vẫn vượt, đó là lúc hai nhà cùng quyết: tăng ngân sách, đổi nơi đãi tiệc, hay đổi hình thức tiệc.

## Khách mời kèm người thương, kèm con nhỏ

**Người thương.** Đặt một luật chung cho cả danh sách rồi giữ đúng luật đó, ví dụ: bạn đã kết hôn hoặc đã đính hôn thì mời cả đôi, bạn đang có đôi lâu năm thì cũng mời cả đôi. Luật rõ ràng giúp hai bạn khỏi phải cân từng trường hợp, và khách cũng thấy công bằng. Trên thiệp, "và người thương" là cách mời kèm khi chưa biết tên người kia.

**Trẻ nhỏ.** Ghi "và gia đình" nghĩa là mời cả các cháu, nên phải tính các cháu vào số người dự kiến. Nếu tiệc không tiện cho trẻ nhỏ hoặc số bàn có hạn, chỉ ghi tên hai vợ chồng, và nếu cần thì nói khéo với những nhà thân. Hỏi nhà hàng cách tính chỗ cho trẻ em, vì mỗi nơi một quy định.

Trong cả hai trường hợp, câu "đi mấy người" ở phần xác nhận tham dự cho hai bạn con số thật để cập nhật vào bảng. Cách hỏi khéo và cách chốt số có trong bài [xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi).

## Khách ở xa

Khách ở tỉnh khác hay ở nước ngoài là nhóm khó đoán nhất, nên cần thêm vài bước:

- **Báo miệng sớm hơn** mốc gửi thiệp, để họ kịp xin nghỉ, đặt vé.
- **Ghi rõ ở cột ghi chú** ai cần phòng nghỉ, ai cần xe đón, để tính vào chi phí đi lại.
- **Ghi rõ mời tiệc nào** khi hai nhà ở hai nơi xa nhau, tránh để khách tự đoán nên về tiệc nhà nào.
- **Hỏi xác nhận sớm và tách riêng khi ước số.** Gộp chung với khách ở gần thì số dự kiến dễ bị đẩy cao.

## Từ danh sách khách mời đến link mời riêng

Nếu hai bạn [tạo thiệp cưới online](/vi) trên Keemori, cột "Cách xưng hô trên thiệp" đi thẳng vào thiệp. Ở mục **Link mời riêng từng khách** trong trình soạn thảo, hai bạn dán danh sách vào, mỗi dòng một tên. Lưu thiệp xong, mỗi khách có một link riêng; khách mở ra thấy màn mở thiệp chào đích danh "Trân trọng kính mời: Cô Chú Hùng Lan".

Vài điều nên biết trước khi dán:

- **Chỉ dán cột xưng hô.** Tên gõ thế nào hiện nguyên văn thế ấy, nên đừng để lẫn ghi chú nội bộ như "bạn bố, bàn 5".
- **Link không xáo trộn khi sửa danh sách.** Thêm khách lên đầu hay xoá bớt người khác không làm đổi link của những người còn lại. Riêng việc sửa chữ một cái tên sẽ tạo link mới cho người đó, nên soát chính tả trước khi gửi.
- **Lấy link từng người** ở mục Link khách mời trong Thiệp của tôi. Màn này cho thấy khách nào đã phản hồi xác nhận tham dự, để hai bạn cập nhật cột "Đã xác nhận" và chỉ nhắc đúng người chưa trả lời.
- **Có từ gói Gold.** Thiệp Gold chưa thanh toán là bản dùng thử 3 ngày, tối đa 15 người xem, và link khách mời cũng tính vào giới hạn đó; xem [bảng giá](/vi/bang-gia) và thanh toán trước khi gửi cho cả danh sách.

Hai nhà đãi tiệc riêng thì mỗi nhà một danh sách. Với gói Diamond Song Hỷ, danh sách link mời riêng và xác nhận tham dự được quản lý riêng cho nhà trai và nhà gái trên cùng một thiệp; chi tiết ở bài [thiệp cưới nhà trai nhà gái](/vi/blog/thiep-cuoi-nha-trai-nha-gai).

## Từ danh sách khách mời đám cưới đến số bàn

![Sảnh tiệc cưới trước giờ đón khách, những bàn tròn phủ khăn ngà xếp sẵn thẻ chỗ ngồi để trống](/images/site/blog/cach-lap-danh-sach-khach-moi-dam-cuoi/ban-tiec-cuoi-xep-cho.jpg)

Đến hạn chốt, cộng cột "Số người dự kiến" theo từng tiệc, tách ba nhóm: đã báo đến, đã báo không đến, chưa trả lời. Nhóm chưa trả lời thì ước theo mối quan hệ, và nhờ bố mẹ đoán giúp phần họ hàng. [Công cụ tính số bàn tiệc cưới](/vi/cong-cu/tinh-so-ban-tiec-cuoi) làm phần còn lại: nhập số khách mời, số đã xác nhận và tỉ lệ bạn tự ước cho nhóm chưa trả lời, công cụ ra số bàn cần đặt. Hai nhà đãi riêng thì tính riêng cho từng tiệc.

![Công cụ tính số bàn tiệc cưới: 320 khách mời, 150 người đã xác nhận, ước tính 70% số còn lại sẽ đến, ra 28 bàn nên đặt](/images/site/blog/cach-lap-danh-sach-khach-moi-dam-cuoi/tinh-so-ban.jpg)

Cuối cùng, dùng chính cột nhà và nhóm để xếp chỗ: họ hàng mỗi nhà một khu, đồng nghiệp một khu, các nhóm bạn mỗi nhóm một bàn. Danh sách lập cẩn thận từ đầu thì bước này gần như chỉ còn là sắp lại các dòng.

## Câu hỏi thường gặp

### Lập danh sách khách mời đám cưới bắt đầu từ đâu?

Bắt đầu từ số bàn tối đa hai nhà chi được, đổi ra trần số khách rồi chia cho từng nhà. Sau đó mỗi nhà liệt kê theo nhóm: họ hàng, bạn của bố mẹ, đồng nghiệp, bạn bè.

### Mời bao nhiêu khách đám cưới là hợp lý?

Không có con số chung. Số hợp lý là số nằm dưới ngân sách tiệc, sức chứa nơi đãi tiệc và những người hai nhà thật sự muốn mời.

### Có nên mời kèm người yêu của bạn bè không?

Nên đặt một luật chung cho cả danh sách, ví dụ đã kết hôn, đính hôn hoặc có đôi lâu năm thì mời cả đôi, rồi áp dụng giống nhau cho mọi người.

### Khách mời đi kèm trẻ em có tính vào số bàn không?

Có, nếu trẻ ngồi ghế riêng. Hãy hỏi nhà hàng cách tính chỗ cho trẻ em và cộng các cháu vào số người dự kiến của hộ đó.

### Danh sách khách mời có dùng lại được cho thiệp online không?

Được. Trên Keemori, từ gói Gold, cột cách xưng hô dán thẳng vào mục link mời riêng từng khách, mỗi dòng một tên, và mỗi khách nhận một link chào đích danh.
`,
  },
  {
    slug: 'chon-ngay-cuoi',
    category: 'guide',
    title: 'Chọn ngày cưới cần lưu ý gì: mùa cưới, thời tiết, ngày âm',
    excerpt:
      'Chọn ngày cưới cần lưu ý gì ngoài xem tuổi: lịch nhà hàng mùa cưới, thời tiết từng miền, ngày lễ, cuối tuần, tháng hay kiêng và cách ghi ngày âm lên thiệp.',
    readingMinutes: 11,
    markdown: `
Chọn ngày cưới thường đi qua hai vòng. Vòng đầu, gia đình nhờ người lớn hoặc thầy xem vài ngày hợp tuổi hai bạn; vòng sau, hai bạn đem những ngày đó so với lịch trống của nhà hàng, thời tiết nơi tổ chức, ngày lễ và lịch của những người không thể vắng mặt, rồi mới chốt. Vì vậy nên hỏi người lớn thật sớm và xin hai, ba ngày thay vì một. Bài này không xem ngày tốt xấu giúp hai bạn; nó liệt kê những điều thực tế cần cân nhắc, và cách ghi ngày âm lên thiệp cho đúng.

## Chọn ngày cưới theo thứ tự nào để đỡ phải làm lại

Chuyện hay gặp: người lớn đã xem xong một ngày, đến nhà hàng mới biết sảnh hôm đó có người đặt rồi. Đi theo thứ tự dưới đây sẽ đỡ phải quay lại từ đầu:

1. **Hai nhà thống nhất khung thời gian**: cưới trong năm nay hay sang năm, mùa nào, có cần trước hay sau một mốc nào của gia đình như người thân đi xa về, em nhỏ thi xong.
2. **Nhờ người lớn xem ngày trong khung đó**, xin hai, ba ngày ứng viên, kèm giờ cho từng lễ nếu nhà có xem giờ.
3. **Hỏi lịch trống của nhà hàng và ekip** cho từng ngày ứng viên. Đám cưới dựng rạp tại nhà thì hỏi lịch thợ rạp, đội nấu cỗ.
4. **Hỏi lịch những người không thể vắng mặt**: ông bà, bố mẹ, anh chị em ở xa, người sẽ đứng ra phát biểu.
5. **Chốt và đặt cọc**, rồi mới báo cho mọi người.

Bước 2 và bước 3 thường phải đi lại vài lượt. Bắt đầu càng sớm, hai bạn càng có nhiều ngày để chọn.

## Xem ngày theo tuổi: hỏi sớm và xin nhiều hơn một ngày

Nhiều gia đình nhờ ông bà, người lớn trong họ hoặc thầy xem ngày cưới theo tuổi cô dâu chú rể. Có nhà xem cả tuổi bố mẹ, có nhà còn xem năm đó có hợp để cô dâu cưới hay không, nhiều người gọi là xem tuổi Kim Lâu. Đây là chuyện niềm tin và nếp nhà, mỗi gia đình một khác, và bài này không bàn đúng sai. Việc hai bạn làm được là giúp ngày xem được khớp với phần còn lại của kế hoạch:

- **Hỏi trước khi đặt bất cứ thứ gì.** Đặt nhà hàng rồi mới xin ngày thì hoặc phải bỏ cọc, hoặc người lớn khó xử.
- **Xin vài ngày, không phải một.** Đưa kèm khung thời gian hai nhà đã thống nhất để người xem chọn trong đó.
- **Hỏi rõ ngày đó dành cho lễ nào.** Có nhà chỉ cần lễ gia tiên, lễ rước dâu đúng ngày giờ đã xem, còn tiệc mời bạn bè có thể để buổi tối hoặc dời sang cuối tuần gần đó; có nhà muốn mọi thứ trong cùng một ngày. Hỏi người lớn trước, đừng tự suy.
- **Hai họ xem riêng thì bàn với nhau sớm.** Mỗi nhà nhờ một người xem có thể ra hai ngày khác nhau. Thống nhất ai là người chọn sau cùng trước khi đi xem.

## Chọn ngày cưới cần lưu ý gì: sáu yếu tố thực tế

### Mùa cưới: nhà hàng, studio kín lịch sớm

Ở nhiều nơi, đám cưới dồn vào những tháng cuối năm, khi trời dịu và trước Tết, rồi dồn tiếp vào những ngày nhiều nhà cùng xem là đẹp. Những ngày đó, sảnh đẹp, khung giờ đẹp, chuyên viên trang điểm, thợ ảnh và MC thường kín lịch rất sớm; một trung tâm tiệc cưới có thể tổ chức nhiều đám cùng lúc. Nếu ngày ứng viên rơi vào mùa cao điểm, hãy hỏi nhà hàng ngay khi có ngày, hỏi luôn điều kiện đặt cọc và có cho đổi ngày không. Chi phí tiệc và dịch vụ cũng có thể khác nhau giữa mùa đông đám và mùa vắng, giữa cuối tuần và ngày thường; hỏi thẳng từng nơi để so.

Đừng quên lịch chụp ảnh cưới: nếu muốn ảnh của hai bạn nằm trên thiệp, ảnh phải chỉnh xong trước ngày gửi thiệp, không phải trước ngày cưới.

### Thời tiết từng miền

Thời tiết quyết định nhiều thứ hơn ta nghĩ: váy áo, quãng đường của đoàn rước, tiệc trong nhà hay ngoài trời, khách lớn tuổi có ngại đi không. Vài nét chung để tham khảo, còn chi tiết thì hỏi người ở chính nơi tổ chức:

- **Miền Bắc** có bốn mùa. Mùa hè nóng, hay có giông; mùa đông lạnh, cuối đông sang xuân thường nồm ẩm. Mùa thu, khoảng tháng 9 đến tháng 11 dương lịch, thường mát và khô, cũng là lúc nhiều nhà chọn cưới.
- **Miền Trung** thường có mùa mưa bão vào nửa cuối năm, nặng nhất quanh tháng 10 và tháng 11; mùa hè ở nhiều tỉnh nắng nóng gắt. Cưới ở miền Trung cuối năm thì nên có phương án cho mưa lớn và đường ngập.
- **Miền Nam và Tây Nguyên** có hai mùa: mùa mưa khoảng tháng 5 đến tháng 10, tháng 11, mưa hay đổ vào buổi chiều; mùa khô khoảng tháng 12 đến tháng 4. Tiệc sân vườn, tiệc ngoài trời hợp mùa khô hơn.

Đám cưới dựng rạp tại nhà nhạy với thời tiết hơn tiệc trong nhà hàng: một cơn mưa chiều có thể làm ướt cả lối vào. Nếu ngày đã chốt rơi vào mùa mưa, hãy bàn với thợ rạp về mái che và lối đi cho khách.

### Ngày lễ, Tết và lịch đi làm của khách

- **Trước Tết Nguyên đán**: nhiều nhà muốn tổ chức cho xong trong tháng Chạp, nên nhà hàng đông, đường đông, khách cũng bận việc cuối năm. Tết Đinh Mùi rơi vào thứ Bảy 6/2/2027; những ngày sát mốc đó, vé xe và lịch của khách đều căng.
- **Kỳ nghỉ dài** như Tết Dương lịch, 30/4 – 1/5, Quốc khánh 2/9: khách có thời gian về dự, nhưng cũng có người đã lên kế hoạch đi chơi; vé máy bay, xe khách, phòng nghỉ quanh các dịp này thường khó đặt. Đám cưới mà khách phải đi xa thì cân nhắc kỹ.
- **Khách cần xin nghỉ phép**: ai ở xa phải nghỉ một, hai ngày làm để về dự thì cần biết càng sớm càng tốt. Cách báo trước nhẹ nhàng là gửi một lời [save the date](/vi/blog/save-the-date-la-gi) ngay khi chốt ngày.
- **Mùa vụ, mùa thi**: đám cưới ở quê thường né những ngày cả xóm bận gặt; nhà có em nhỏ sắp thi cũng nên tính đến.

### Cuối tuần hay ngày thường

Ngày xem được không phải lúc nào cũng rơi vào cuối tuần. Mỗi lựa chọn có cái được, cái mất:

- **Thứ Bảy, Chủ nhật**: khách dễ sắp xếp nhất, nhưng sảnh và ekip cũng kín lịch nhất.
- **Tiệc tối ngày thường**: dễ đặt sảnh hơn, nhưng khách đi làm về gặp giờ tan tầm, có người đến muộn hoặc phải về sớm. Ghi rõ giờ đón khách và giờ khai tiệc để khách tự tính giờ.
- **Tiệc trưa ngày thường**: thường gặp ở đám cưới quê, khi khách chủ yếu là họ hàng, hàng xóm; khó cho khách là đồng nghiệp, bạn bè đang đi làm.

Nhiều nhà xử lý bằng cách làm lễ gia tiên đúng ngày đã xem rồi đãi tiệc vào buổi tối hoặc cuối tuần gần nhất. Cách này có hợp với nhà mình không thì hỏi người lớn hai bên. Xếp giờ cho từng phần trong ngày có trong bài [lịch trình ngày cưới](/vi/blog/lich-trinh-ngay-cuoi).

### Khoảng cách giữa lễ ăn hỏi và lễ cưới

Khoảng cách này mỗi vùng, mỗi nhà một khác. Có nơi ăn hỏi trước cưới vài tháng, có nơi vài tuần; nhiều gia đình bây giờ làm ăn hỏi sát ngày cưới, có khi gộp trong cùng một ngày để họ hàng ở xa chỉ phải đi một chuyến. Hai lễ cách xa nhau thì ngày ăn hỏi thường cũng được xem riêng; hai lễ sát nhau thì lễ vật, trang phục, khách khứa dồn vào cùng một tuần, nên chia việc cho người nhà từ sớm. Nếp ăn hỏi ở phía Bắc có trong bài [phong tục cưới hỏi miền Bắc](/vi/blog/phong-tuc-cuoi-hoi-mien-bac).

### Lịch của những người không thể vắng mặt

Ông bà tuổi cao, anh chị em đang ở nước ngoài, người bạn thân sẽ làm phù dâu: hỏi lịch họ trước khi chốt. Một ngày đẹp mà người quan trọng nhất không về được thì chỗ trống ấy hai bạn sẽ nhớ rất lâu.

## Tháng nào cưới đẹp?

Không có tháng nào đẹp cho mọi đám cưới. Tháng mát trời lại là mùa cưới, nhà hàng kín và dịch vụ khó đặt; tháng vắng đám thì thường là tháng nhiều nhà kiêng hoặc thời tiết khó chịu. Câu hỏi thực tế hơn là: trong khung thời gian hai nhà đã chọn, tháng nào vừa có ngày người lớn chấp nhận, vừa còn sảnh, vừa hợp thời tiết nơi tổ chức.

Một vài tháng âm lịch được nhiều gia đình tránh cưới. Quen thuộc nhất là **tháng 7 âm lịch**, tháng dân gian gọi là tháng cô hồn và gắn với chuyện mưa ngâu. Bài này không bàn nên kiêng hay không; nếu nhà hai bạn kiêng, hãy gạch khoảng đó khỏi lịch trước khi đi hỏi nhà hàng. Năm 2027, tháng 7 âm lịch kéo dài từ 2/8 đến 31/8 dương lịch. Mỗi vùng, mỗi nhà còn có thể kiêng thêm những tháng, những ngày khác, nên cách chắc nhất vẫn là xin người lớn danh sách những ngày "không được" ngay từ đầu.

Nhà có người thân mới mất thì việc chọn ngày cưới phải tính lại theo nếp riêng của từng nhà: có nhà lùi đám cưới, có nhà tổ chức sớm hơn và làm giản lược. Đây là chuyện chỉ người lớn trong nhà quyết được.

## Ngày cưới âm lịch: đổi ngày và ghi lên thiệp

Ngày cưới thường được xem theo âm lịch, nên ngày âm là gốc và ngày dương được đổi ra từ đó. Hai bạn có thể dùng công cụ [đổi ngày âm dương](/vi/cong-cu/doi-ngay-am-duong): nhập ngày âm hoặc ngày dương, công cụ trả về ngày tương ứng kèm dòng ghi sẵn cho thiệp theo dạng "tức ngày … tháng … năm …". Đổi xong, nhờ chính người đã xem ngày đối chiếu lại một lần.

![Công cụ đổi ngày âm dương của Keemori: ngày 22/11/2026 là Chủ nhật, tức ngày 14 tháng 10 năm Bính Ngọ, kèm dòng ghi sẵn cho thiệp](/images/site/blog/chon-ngay-cuoi/cong-cu-doi-ngay-am-duong.jpg)

Trên thiệp, ngày âm đi sau ngày dương, đặt trong ngoặc, năm ghi bằng can chi: năm 2026 là **Bính Ngọ**, năm 2027 là **Đinh Mùi**. Ví dụ:

> Thứ Bảy, ngày 9 tháng 1 năm 2027 (tức ngày 2 tháng Chạp năm Bính Ngọ)

![Ngày âm in trên thiệp mẫu Đỏ Truyền Thống và Sen Việt: ngày dương đi trước, dòng tức ngày âm lịch kèm năm Bính Ngọ đi sau](/images/site/blog/chon-ngay-cuoi/ngay-am-tren-thiep.jpg)

Ví dụ này cũng cho thấy chỗ dễ sai nhất: Tết Đinh Mùi rơi vào 6/2/2027, nên đám cưới từ đầu tháng 1 đến hết ngày 5/2/2027 vẫn thuộc năm Bính Ngọ. Năm âm lịch 2026 và 2027 đều không có tháng nhuận; năm 2028 có tháng 5 nhuận, ai cưới vào tháng đó thì ghi rõ "tháng 5 nhuận". Thứ trong tuần, cách gọi tháng Giêng, tháng Chạp và những lỗi khác hay gặp có trong bài [cách ghi thiệp cưới](/vi/blog/cach-ghi-thiep-cuoi).

## Chốt ngày xong thì làm gì tiếp

1. **Đặt cọc nhà hàng và ekip**, giữ giấy tờ ghi rõ ngày, giờ, sảnh.
2. **Báo sớm cho người ở xa** để họ xin nghỉ, đặt vé.
3. **Lên danh sách việc cần làm theo mốc thời gian**, tính ngược từ ngày cưới; bài [checklist chuẩn bị đám cưới](/vi/blog/checklist-chuan-bi-dam-cuoi) có sẵn khung để điền.
4. **Xếp lịch trình trong ngày** quanh những giờ lành đã xem.
5. **Soạn thiệp mời** khi đã có đủ giờ và địa điểm.

Với thiệp online, hai bạn không cần đợi chốt hết mọi thứ mới bắt đầu. Trên Keemori, có thể [tạo thiệp cưới online](/vi) ngay khi có ngày: mỗi nghi lễ như ăn hỏi, vu quy, thành hôn có giờ, ngày, địa điểm riêng kèm nút chỉ đường Google Maps; thiệp có đồng hồ đếm ngược và nút "Thêm vào lịch" để khách lưu ngày cưới vào điện thoại. Khối nào chưa có thông tin thì tắt đi, chốt xong thì bật lên. Lỡ phải đổi giờ sau khi đã gửi, hai bạn sửa rồi lưu; khách mở lại đúng đường link cũ là thấy thông tin mới.

## Câu hỏi thường gặp

### Nên xem ngày cưới trước hay đặt nhà hàng trước?

Xin người lớn vài ngày ứng viên trước, rồi hỏi nhà hàng còn sảnh ngày nào. Chọn ngày vừa được người lớn chấp nhận vừa còn chỗ, sau đó mới đặt cọc.

### Tháng 7 âm lịch có cưới được không?

Nhiều gia đình tránh cưới vào tháng 7 âm lịch, nhưng không phải nhà nào cũng kiêng, nên hãy hỏi ý người lớn hai bên. Năm 2027, tháng này rơi vào khoảng 2/8 đến 31/8 dương lịch.

### Ngày xem được rơi vào giữa tuần thì làm sao?

Nhiều nhà làm lễ gia tiên đúng ngày đó, còn tiệc mời bạn bè tổ chức buổi tối hoặc dời sang cuối tuần gần nhất. Hỏi người lớn xem nhà mình có chấp nhận tách lễ và tiệc không.

### Năm 2027 có tháng nhuận không?

Không. Năm âm lịch 2026 và 2027 đều không có tháng nhuận; tháng nhuận tiếp theo là tháng 5 nhuận năm 2028.

### Ghi ngày cưới âm lịch lên thiệp thế nào?

Ghi sau ngày dương, trong ngoặc, theo dạng "tức ngày … tháng … năm" kèm can chi của năm. Dùng công cụ đổi ngày âm dương để có sẵn dòng này, rồi nhờ người đã xem ngày đối chiếu lại.
`,
  },
  {
    slug: 'gui-thiep-cuoi-truoc-bao-lau',
    category: 'experience',
    title: 'Gửi thiệp cưới trước bao lâu? Mốc cho thiệp giấy và thiệp online',
    excerpt:
      'Gửi thiệp cưới trước bao lâu là vừa: mốc cho thiệp giấy, thiệp online, khách ở xa, người lớn tuổi, khi nào cần save the date và cách khớp hạn báo bàn.',
    readingMinutes: 8,
    markdown: `
Nếu bạn đang phân vân nên gửi thiệp cưới trước bao lâu, mốc thường gặp là khách nhận được thiệp khoảng 2–4 tuần trước ngày cưới, và không muộn hơn khoảng một tuần. Thiệp giấy phải đi đưa tận tay nên cần bắt đầu sớm hơn mốc đó; thiệp online gửi trong vài phút nên lại dễ bị gửi quá sát. Khách ở xa phải đặt vé hay xin nghỉ phép thì nên được báo trước từ một đến vài tháng, rồi mới nhận thiệp chính thức.

Đây là những mốc thường gặp, không phải quy định. Mỗi vùng, mỗi nhà có nếp riêng, nên lịch cụ thể hãy bàn với bố mẹ hai bên.

## Gửi thiệp cưới trước bao lâu cho từng nhóm khách

Gửi quá sớm thì khách quên, gửi quá muộn thì khách đã kín lịch. Mốc vừa phải tuỳ vào việc khách cần bao nhiêu thời gian để sắp xếp:

- **Khách ở xa, phải đặt vé hoặc xin nghỉ:** báo trước khoảng một đến ba tháng bằng lời hoặc một tấm save the date, gửi thiệp sau.
- **Ông bà, họ hàng, người lớn cần mời tận nhà:** bắt đầu đi mời khoảng ba đến bốn tuần trước, để còn kịp đi hết các nhà.
- **Bạn bè, đồng nghiệp:** khoảng hai đến ba tuần trước.
- **Muộn nhất:** khoảng một tuần. Sát hơn thế thì nên gọi điện mời kèm một lời xin lỗi vì báo muộn.
- **Nhắc lại:** hai đến ba ngày trước ngày cưới.

## Thiệp giấy: tính cả thời gian đi đưa

Câu hỏi "đưa thiệp cưới trước mấy ngày" thật ra là hai câu: khách cần nhận thiệp lúc nào, và hai bạn cần bao lâu để đưa hết. Thiệp giấy đưa tận tay tốn thời gian hơn nhiều người nghĩ: mỗi buổi tối chỉ ghé được vài nhà, họ hàng lại ở nhiều nơi, và đến nhà người lớn thì không thể đưa thiệp rồi về ngay.

Vài cách để không bị dồn vào tuần cuối:

1. **Tính ngược từ ngày khách cần nhận.** Muốn khách nhận thiệp trước khoảng hai đến ba tuần thì việc đi đưa phải bắt đầu sớm hơn mốc đó, tuỳ danh sách dài hay ngắn.
2. **Hỏi nơi in mất bao lâu.** Chốt nội dung và đặt in sớm, chừa thời gian soát lỗi và ghi tên khách lên thiệp.
3. **Chia việc.** Bố mẹ mỗi bên đưa thiệp cho họ hàng bên mình, hai bạn lo bạn bè và đồng nghiệp.
4. **Khách ở tỉnh khác thì gửi bưu điện hoặc chuyển phát**, cộng thêm vài ngày đi đường, và nhắn trước cho họ biết thiệp đang trên đường tới.

Nhiều đôi giờ kết hợp hai loại: thiệp giấy cho người lớn và những người cần mời tận nơi, thiệp online cho bạn bè ở xa. Trên thiệp giấy có thể in thêm một mã QR dẫn tới thiệp online, để người nhận quét là có bản đồ và lịch trình; công cụ [tạo mã QR từ link thiệp](/vi/cong-cu/tao-ma-qr) cho tải mã dạng ảnh để in.

## Gửi thiệp cưới online trước bao lâu

Thiệp online gửi trong vài phút, nên cái bẫy không phải gửi muộn vì đi đưa không kịp, mà là cứ để đó vì "lúc nào gửi chẳng được". Hai bạn nên ghi hẳn một ngày gửi vào lịch chuẩn bị, giống như ngày đi đưa thiệp giấy.

Mốc hợp lý là khoảng hai đến ba tuần trước ngày cưới với phần lớn khách, có thể chia làm vài đợt: người thân thiết trước, bạn bè và đồng nghiệp sau. Thứ tự gửi, cách nhắn riêng từng người và giờ nào nên gửi có trong bài [cách gửi thiệp cưới online qua Zalo](/vi/blog/cach-gui-thiep-cuoi-online-qua-zalo).

Thiệp online có một lợi thế khi gửi sớm: nếu sau đó đổi giờ đón khách hay đổi sảnh, hai bạn sửa trên thiệp rồi lưu lại, khách mở lại đúng link cũ là thấy thông tin mới. Dù vậy, vẫn nên nhắn thêm một tin đính chính cho những thay đổi quan trọng.

## Khách ở xa phải đặt vé, xin nghỉ phép

Với người ở tỉnh khác hay ở nước ngoài, thiệp gửi trước ba tuần thường là quá muộn để đặt vé và xin nghỉ. Cưới vào dịp lễ, Tết hay mùa cao điểm đi lại thì càng cần báo sớm.

Hãy báo cho nhóm này một câu ngắn từ sớm, rồi gửi thiệp chính thức cùng đợt với mọi người. Lời báo nên có đủ những gì họ cần để đặt vé: ngày cưới, tỉnh hoặc thành phố tổ chức, và lễ chính rơi vào buổi sáng hay buổi tối.

> [Tên] ơi, tụi mình định cưới vào [ngày] ở [tỉnh/thành], tiệc buổi [sáng/tối]. Báo sớm để bạn tiện sắp xếp nhé, thiệp mời chính thức tụi mình gửi sau.

## Khách là người lớn tuổi

Ông bà, cô dì chú bác thường có lịch giỗ chạp, việc họ, việc làng, nên mời sớm hơn bạn bè một chút. Với nhóm này, nhiều gia đình vẫn để bố mẹ đi mời bằng lời hoặc gọi điện trước, sau đó mới đưa thiệp hay gửi link. Khi đưa thiệp, nói rõ giờ đón khách và nơi tổ chức, vì người lớn hay hỏi lại đúng hai điều ấy.

Gia đình đang có tang thì nhiều nơi kiêng dự đám cưới, có nhà chỉ báo tin chứ không đưa thiệp. Những trường hợp như vậy nên hỏi bố mẹ trước khi mời.

## Save the date là gì, khi nào cần

Save the date là lời báo trước ngày cưới, gửi trước khi có thiệp chính thức, chỉ cần ngày và nơi tổ chức, kèm một câu "thiệp mời sẽ gửi sau". Nó không thay thiệp mời; nó chỉ giúp khách giữ ngày.

Không phải đám cưới nào cũng cần. Save the date đáng làm khi:

- Nhiều khách ở xa nơi tổ chức, phải đặt vé hoặc xin nghỉ nhiều ngày.
- Cưới vào dịp lễ, Tết hay mùa cưới cao điểm, khi lịch của mọi người dễ kín.
- Có khách ở nước ngoài, hoặc cưới ở một nơi phải đi xa mới tới.

Đám cưới nhỏ, khách chủ yếu ở gần thì một tấm thiệp gửi đúng hẹn là đủ. Cách làm và nên ghi gì có trong bài [save the date là gì](/vi/blog/save-the-date-la-gi).

## Nhắc lại trước ngày cưới

Khoảng hai đến ba ngày trước, nhắn một tin ngắn gồm ngày, giờ đón khách, địa điểm và gửi lại link thiệp, để khách khỏi phải lục lại tin nhắn cũ. Thiệp gửi càng sớm thì tin nhắc càng cần.

> Chào [tên], tụi mình nhắc nhẹ nè: còn 3 ngày nữa là đám cưới rồi. Đón khách lúc [giờ] ngày [ngày] tại [địa điểm], bản đồ có trong thiệp: [link thiệp]

Mẫu nhắc cho người lớn, cho đồng nghiệp và tin báo đổi giờ có trong bài [tin nhắn mời cưới](/vi/blog/tin-nhan-moi-cuoi).

## Tính ngược từ hạn xác nhận tham dự và hạn báo bàn

Nếu hai bạn hỏi khách có đến dự hay không, hạn trả lời phải nằm trước hạn báo số bàn của nhà hàng, và thiệp phải đến tay khách trước hạn trả lời đủ lâu để họ xem lịch. Vì thế, thay vì đoán nên gửi thiệp cưới trước bao lâu, hãy tính ngược từ nhà hàng.

Một ví dụ cho đám cưới có tiệc ở nhà hàng, cần điều chỉnh theo hợp đồng và nếp nhà của hai bạn:

1. **Khoảng hai đến ba tháng trước:** chốt danh sách khách, báo trước cho khách ở xa.
2. **Khoảng sáu đến tám tuần trước:** chốt nội dung thiệp, đặt in thiệp giấy hoặc làm xong thiệp online.
3. **Khoảng bốn tuần trước:** bố mẹ bắt đầu đi mời họ hàng, người lớn.
4. **Khoảng hai đến ba tuần trước:** gửi thiệp cho bạn bè, đồng nghiệp.
5. **Khoảng mười đến mười hai ngày trước:** hạn khách xác nhận tham dự, nhắc riêng người chưa trả lời.
6. **Theo hạn của nhà hàng, ví dụ năm đến bảy ngày trước:** báo số bàn chính thức.
7. **Hai đến ba ngày trước:** nhắn tin nhắc lại.

Hạn báo bàn nên hỏi ngay lúc ký hợp đồng với nhà hàng. Cách đặt hạn xác nhận và xử lý người không trả lời có trong bài [xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi); khi đã có số khách đã xác nhận, công cụ [tính số bàn tiệc cưới](/vi/cong-cu/tinh-so-ban-tiec-cuoi) giúp ra số bàn cần đặt theo tỉ lệ hai bạn tự ước tính. Các việc còn lại của những tháng cuối nằm trong bài [checklist chuẩn bị đám cưới](/vi/blog/checklist-chuan-bi-dam-cuoi).

## Gửi thiệp online đúng hẹn với Keemori

Nếu hai bạn [tạo thiệp cưới online](/vi) trên Keemori, vài điểm liên quan trực tiếp tới thời điểm gửi:

- **Thanh toán trước khi gửi rộng.** Thiệp Gold hoặc Diamond chưa thanh toán chỉ là link dùng thử: 3 ngày, tối đa 15 người xem. Gửi trước ba tuần bằng link dùng thử thì link hết hạn từ lâu trước ngày cưới. Thiệp gói Free có link vĩnh viễn ngay từ lúc xuất bản.
- **Gửi sớm mà khách không quên.** Khối đếm ngược có nút "Thêm vào lịch", để khách lưu ngày cưới vào lịch trên điện thoại ngay khi mở thiệp.
- **Chốt số khách đúng hạn.** Từ gói Gold, khách xác nhận tham dự ngay trên thiệp; dùng thêm link mời riêng từng khách thì hai bạn thấy ai đã phản hồi trong "Thiệp của tôi" để nhắc riêng những người còn lại.
- **Sửa mà không phải gửi lại.** Đổi giờ hay địa điểm thì sửa trên thiệp, link đã gửi vẫn giữ nguyên.

## Câu hỏi thường gặp

### Nên gửi thiệp cưới khi nào?

Thường khoảng 2–4 tuần trước ngày cưới. Khách ở xa thì báo trước một đến vài tháng, người lớn cần mời tận nhà thì đi mời sớm hơn bạn bè.

### Đưa thiệp cưới trước mấy ngày thì bị coi là muộn?

Sát hơn khoảng một tuần thì nhiều khách đã kín lịch. Nếu buộc phải mời muộn, gọi điện mời trực tiếp kèm một lời xin lỗi vì báo muộn.

### Gửi thiệp cưới online trước bao lâu là vừa?

Khoảng hai đến ba tuần trước, rồi nhắc lại hai đến ba ngày trước ngày cưới. Gửi sớm hơn cũng được, miễn là có tin nhắc.

### Gửi thiệp cưới quá sớm có sao không?

Không sai, chỉ dễ bị quên. Gửi sớm hơn khoảng hai tháng thì nên coi đó là lời báo trước, và gửi lại thiệp hoặc nhắn nhắc khi gần ngày.

### Lỡ quên mời một người thì làm thế nào?

Gọi điện hoặc gặp trực tiếp, nói thật là mình sơ suất, rồi gửi thiệp ngay. Đừng chỉ gửi trơn một đường link, vì người nhận dễ nghĩ mình là khách mời bổ sung.
`,
  },
  {
    slug: 'save-the-date-la-gi',
    category: 'trend',
    title: 'Save the date là gì? Khi nào gửi và mẫu câu cho đám cưới',
    excerpt:
      'Save the date là gì, khác thiệp cưới ở đâu, khi nào nên gửi và cần ghi những gì; kèm mẫu câu save the date đám cưới và cách làm ngay trên thiệp online.',
    readingMinutes: 9,
    markdown: `
Save the date là gì? Đó là lời báo trước ngày cưới để khách giữ trống lịch, thường gửi từ một đến vài tháng trước ngày cưới, trước cả thiệp mời chính thức. Một lời save the date chỉ cần bốn thứ: tên hai bạn, ngày cưới, thành phố tổ chức và lời hẹn sẽ gửi thiệp mời sau. Giờ tiệc, địa chỉ nhà hàng hay các nghi lễ để dành cho thiệp cưới. Cụm từ tiếng Anh này nghĩa đen là "hãy lưu lại ngày này"; trên thiệp Việt, có nơi ghi là "Lưu ngày cưới".

## Save the date là gì và từ đâu mà có

Thói quen gửi save the date đến từ đám cưới phương Tây, nơi khách hay phải đi xa, đặt phòng, xin nghỉ để dự. Nhiều cặp đôi Việt cũng dùng nó, nhất là khi phần lớn lời mời đã đi qua điện thoại.

Thật ra người Việt làm việc này từ lâu, chỉ là không gọi tên: gọi điện cho cô chú ở xa "cuối năm nay cháu cưới, cô chú thu xếp về nhé", hay nhắn bạn thân "giữ cho mình ngày đó". Save the date chỉ làm việc ấy gọn gàng và có chủ đích hơn. Hình thức thường gặp:

- Một tấm thiệp giấy nhỏ hoặc bưu thiếp.
- Một tấm ảnh của hai bạn có ghi ngày cưới, gửi riêng cho từng người.
- Một tin nhắn ngắn.
- Một tấm thiệp online đã có tên, ngày và đồng hồ đếm ngược, phần còn lại bổ sung dần.

## Thiệp save the date khác thiệp cưới thế nào

Nhiều người hỏi save the date là gì khi đằng nào cũng gửi thiệp cưới. Khác biệt nằm ở năm điểm:

- **Mục đích**: save the date nhờ khách giữ lịch; thiệp cưới mới là lời mời chính thức.
- **Thời điểm**: save the date gửi trước từ một đến vài tháng; thiệp cưới thường gửi trước khoảng 2–4 tuần.
- **Nội dung**: save the date chỉ có tên, ngày, thành phố; thiệp cưới có đủ tên bố mẹ hai họ, nghi lễ, giờ đón khách, địa chỉ tiệc.
- **Người nhận**: save the date thường chỉ gửi những ai cần sắp xếp sớm; thiệp cưới gửi mọi khách.
- **Giọng văn**: save the date có thể vui, thân mật; thiệp cưới giữ đúng lễ nghĩa, nhất là với người lớn.

Điều quan trọng nhất: save the date không thay được thiệp mời. Khách đã nhận lời báo trước vẫn chờ một lời mời chính thức, và với ông bà, họ hàng lớn tuổi, nhiều nhà vẫn trao thiệp tận tay.

## Khi nào nên gửi save the date đám cưới

Không phải đám cưới nào cũng cần. Save the date đáng làm khi:

- **Khách ở xa hoặc ở nước ngoài**: họ cần thời gian đặt vé, xếp lịch về.
- **Cưới vào mùa cao điểm**: những tháng cuối năm, một người có khi nhận vài thiệp trong cùng một tuần; báo sớm thì ngày của hai bạn được ghi vào lịch trước.
- **Đám cưới tổ chức ở nơi khác**: cưới ở quê một bên, cưới ở một thành phố du lịch, khách hai nhà đều phải đi xa.
- **Khách cần xin nghỉ phép**: đồng nghiệp, bạn bè đi làm phải xin nghỉ một, hai ngày để về dự.
- **Cưới sát dịp lễ, Tết**: vé xe, vé máy bay quanh những dịp này thường hết sớm.
- **Người có vai trò trong đám cưới**: phù dâu, phù rể, người đại diện gia đình phát biểu.

Ngược lại, đám cưới nhỏ, khách chủ yếu ở cùng thành phố, hoặc cưới gấp trong một, hai tháng thì cứ gửi thẳng thiệp mời.

## Save the date cần ghi gì

Nội dung tối thiểu:

1. Tên hai bạn.
2. Ngày cưới; gia đình quen tính âm lịch thì ghi kèm ngày âm.
3. Thành phố hoặc tỉnh nơi tổ chức; chưa cần địa chỉ nhà hàng.
4. Lời hẹn rằng thiệp mời chính thức sẽ gửi sau.

Có thể thêm một tấm ảnh của hai bạn, đường link thiệp online, hoặc cách để khách thêm ngày cưới vào lịch điện thoại. Không nên ghi giờ tiệc hay địa điểm khi chưa chắc chắn; số tài khoản mừng cưới cũng chưa phải chuyện của lời báo ngày.

Hai điều nên chắc trước khi gửi:

- **Ngày đã chốt, nơi tổ chức đã đặt cọc.** Đổi ngày sau khi gửi save the date phiền hơn nhiều so với đổi trước, vì người đã đặt vé phải đổi theo.
- **Người nhận chắc chắn được mời.** Gửi lời báo trước rồi không gửi thiệp mời là tình huống khó xử nhất. Danh sách khách chưa chốt thì chỉ gửi cho nhóm chắc chắn.

## Gửi save the date khi nào?

Không có mốc bắt buộc. Vài lời khuyên:

- **Gửi ngay khi đã chốt ngày và đặt được nơi tổ chức**, thường khoảng một đến ba tháng trước ngày cưới.
- **Khách ở nước ngoài, đám cưới ở xa, cưới sát Tết** thì báo sớm hơn nữa, để khách kịp chọn vé và xin nghỉ.
- **Đừng gửi khi kế hoạch còn có thể đổi.** Gửi trước cả năm thì khách dễ quên, và chính hai bạn cũng chưa chắc mọi thứ.
- **Thiệp mời chính thức vẫn gửi theo mốc quen thuộc**, thường 2–4 tuần trước ngày cưới. Gửi cho từng nhóm khách lúc nào có trong bài [gửi thiệp cưới trước bao lâu](/vi/blog/gui-thiep-cuoi-truoc-bao-lau).

Nếu ngày cưới còn đang chờ người lớn xem, đừng vội báo: bài [chọn ngày cưới](/vi/blog/chon-ngay-cuoi) liệt kê những gì cần đối chiếu trước khi chốt.

## Mẫu câu save the date

Thay phần trong ngoặc vuông rồi gửi kèm ảnh hoặc link thiệp. Ngày dùng làm ví dụ ở đây là thứ Bảy 9/1/2027, tức ngày 2 tháng Chạp năm Bính Ngọ.

Ngắn gọn, gửi chung:

> Save the date! [Tên chú rể] và [Tên cô dâu] sẽ cưới vào thứ Bảy, 9/1/2027, tại [Thành phố]. Thiệp mời sẽ gửi sau, mọi người giữ giúp tụi mình ngày này nhé.

Cho bạn thân:

> [Tên] ơi, đánh dấu lịch giúp mình: thứ Bảy 9/1/2027 mình cưới ở [Thành phố]. Thiệp gửi sau, nhưng ngày đó là của tụi mình rồi nha!

Cho người lớn, họ hàng ở xa:

> Thưa cô chú, cháu là [Tên]. Cháu xin phép báo trước: đám cưới của cháu và [Tên người thương] sẽ tổ chức vào thứ Bảy, ngày 9 tháng 1 năm 2027 (tức ngày 2 tháng Chạp năm Bính Ngọ) tại quê nhà [Tỉnh]. Cháu báo sớm để cô chú tiện thu xếp; gần ngày, bố mẹ cháu sẽ mời cô chú chính thức ạ.

Cho đồng nghiệp cần xin nghỉ:

> Em báo sớm với anh chị: [ngày], em cưới ở [Tỉnh]. Anh chị nào định về dự thì giữ lịch và xin nghỉ trước giúp em nhé. Thiệp mời và thông tin đi lại em gửi sau ạ.

Cho bạn ở nước ngoài:

> [Tên] ơi, tụi mình cưới vào [ngày] tại [Thành phố]. Biết bạn ở xa nên báo sớm để bạn kịp xem vé. Thiệp mời và lịch trình chi tiết sẽ gửi sau, cần hỏi gì về đi lại cứ nhắn tụi mình.

Kèm link thiệp online:

> Save the date: [Tên] và [Tên], [ngày], [Thành phố]. Thiệp của tụi mình đây: [link thiệp]. Giờ và địa điểm tiệc tụi mình sẽ cập nhật ngay trên link này; gần ngày sẽ nhắn mời chính thức.

Dòng chữ đặt trên ảnh:

> Save the date · [Tên] & [Tên] · 09.01.2027 · [Thành phố]

## Save the date trên thiệp online

Với thiệp online, lời báo ngày và lời mời chính thức có thể đi chung một đường link. Nhiều mẫu trong kho Keemori có sẵn dòng chữ Save the date ở màn bìa hoặc ở khối đếm ngược, và thiệp có khối đếm ngược kèm nút "Thêm vào lịch" để khách lưu ngày cưới vào điện thoại ngay khi mở. Vài mẫu hợp với cách báo ngày trước:

![Màn bìa mẫu Lan Trắng với dòng Save our date, ảnh cưới kẹp trong phong bì và hoa tulip trắng](/images/site/blog/save-the-date-la-gi/man-bia-save-our-date.jpg)

- **[Vòm Ngà](/vi/mau-thiep/vom-nga)** (gói Free): giấy ngà gần như đơn sắc, có lịch tháng và những bình hoa vẽ màu nước. Không cần ảnh cưới, hợp khi ảnh chưa chụp xong mà đã đến lúc báo ngày.
- **Tình Khôi** (gói Gold, 1 ô ảnh): bìa đặt một tấm ảnh vuông bên trái, tên hai bạn và ngày cưới thành một khối chữ serif lớn bên phải, đọc lên như một tấm save the date tối giản.
- **[Hành Trình](/vi/mau-thiep/hanh-trinh)** (gói Gold, 5 ô ảnh): nội dung xếp như những tấm vé máy bay, ngày cưới đánh dấu trên lịch bằng màu đỏ gạch; hợp với đám cưới mà khách phải bay tới.
- **Lan Trắng** (gói Diamond, 6 ô ảnh): lịch cưới nền olive đánh dấu ngày cưới, kèm nút thêm vào Google Calendar.

Thêm những mẫu tông trắng, ít chi tiết, để ngày cưới tự nổi bật trong bài [mẫu thiệp cưới tối giản](/vi/blog/mau-thiep-cuoi-toi-gian).

### Xuất bản sớm, bổ sung dần trên cùng một link

Một cách làm là dùng chính tấm thiệp online làm save the date:

1. **Chọn mẫu và điền những gì đã chắc**: tên hai bạn, ngày cưới, các nghi lễ đã có giờ. Khối nào chưa có thông tin, như tiệc cưới, lịch trình hay dress code, thì tắt đi.
2. **Bấm "Lưu & Tạo link"** để nhận link thiệp và mã QR, rồi gửi kèm lời save the date.
3. **Khi chốt được nhà hàng và giờ đón khách**, bật khối tương ứng, điền rồi lưu. Đường dẫn giữ nguyên, khách mở lại link cũ là thấy bản mới.
4. **Khoảng 2–4 tuần trước ngày cưới**, gửi lời mời chính thức kèm chính link ấy, thêm một câu "thiệp đã cập nhật đủ giờ và địa điểm" để khách biết mà mở lại. Nếu dùng gói Gold trở lên, lúc này có thể gửi link mời riêng chào đúng tên từng khách.

Một lưu ý về gói: thiệp gói Free có link vĩnh viễn, không giới hạn người xem, nên gửi sớm bao lâu cũng được. Thiệp Gold hoặc Diamond chưa thanh toán chỉ là bản dùng thử: link 3 ngày, tối đa 15 người xem. Nếu chọn mẫu có ảnh, hãy thanh toán trước khi gửi save the date để link không hết hạn giữa chừng; quyền lợi từng gói có ở [bảng giá](/vi/bang-gia). Lời nhắn đi kèm thiệp chính thức có thể lấy từ bài [tin nhắn mời cưới](/vi/blog/tin-nhan-moi-cuoi). Khi đã có ngày, hai bạn có thể [tạo thiệp cưới online miễn phí](/vi) và gửi lời hẹn đầu tiên.

## Câu hỏi thường gặp

### Save the date có bắt buộc không?

Không. Nó hữu ích khi khách ở xa, cần xin nghỉ hoặc cưới vào mùa cao điểm; đám cưới nhỏ, khách ở gần thì gửi thẳng thiệp mời là đủ.

### Đã gửi save the date thì có cần gửi thiệp cưới nữa không?

Có. Save the date chỉ nhờ khách giữ lịch; thiệp cưới mới là lời mời chính thức, có đủ giờ, địa điểm và nghi lễ.

### Save the date nên gửi trước bao lâu?

Thường ngay khi đã chốt ngày và nơi tổ chức, khoảng một đến ba tháng trước ngày cưới. Khách ở nước ngoài hoặc đám cưới ở xa thì báo sớm hơn nữa.

### Save the date tiếng Việt là gì?

Nghĩa là "hãy lưu lại ngày này". Trên thiệp Việt, có nơi ghi "Lưu ngày cưới", có nơi giữ nguyên chữ tiếng Anh.

### Có nên gửi save the date cho tất cả khách mời không?

Không cần. Chỉ gửi cho những người chắc chắn được mời và cần sắp xếp sớm, vì báo trước rồi mà không mời là điều khó xử nhất.
`,
  },
  {
    slug: 'loi-chuc-dam-cuoi',
    category: 'guide',
    title: 'Lời chúc đám cưới hay: 50 câu cho bạn thân, đồng nghiệp, họ hàng',
    excerpt:
      '50 lời chúc đám cưới chia theo người nhận: câu ngắn cho thiệp và sổ lưu bút, bạn thân, đồng nghiệp, người lớn, khi không đến được, kèm quà và tiếng Anh.',
    readingMinutes: 11,
    markdown: `
Một lời chúc đám cưới hay chỉ cần ba thứ: đúng vai giữa bạn và cô dâu chú rể, một chi tiết riêng của hai người, và đủ ngắn để đọc trong vài giây. Câu một hai dòng hợp với thiệp chúc mừng, phong bì và sổ lưu bút; lời dài có kỷ niệm thì để dành cho tin nhắn riêng hoặc lúc cầm micro. Dưới đây là 50 câu chia theo người nhận và hoàn cảnh, thay phần trong ngoặc vuông là dùng được.

## Viết lời chúc đám cưới thế nào cho đúng

1. **Đúng vai.** Ông bà chúc cháu khác hẳn bạn thân chúc nhau. Xưng hô theo đúng quan hệ: cháu với cô chú, em với anh chị, tớ với cậu. Chúc người lớn hơn mình thì thêm chữ "ạ" và bớt đùa.
2. **Chúc cả hai người.** Có thể bạn chỉ quen cô dâu, nhưng ngày cưới là của một đôi. Nhắc tên cả hai, hoặc ít nhất viết "hai bạn", "anh chị".
3. **Thêm một chi tiết riêng.** "Trăm năm hạnh phúc" ai cũng viết được. Một quán quen, một biệt danh hồi đại học, một lần đi lạc cùng nhau là thứ biến câu chúc thành của riêng bạn.
4. **Ngắn.** Trên thiệp, phong bì hay sổ lưu bút, một đến ba câu là vừa.
5. **Đùa có chừng.** Bạn thân trêu nhau được, nhưng tránh chuyện người yêu cũ, cân nặng, tiền bạc. Nhớ rằng bố mẹ hai bên cũng có thể đọc thấy.

Một đề tài nên cân nhắc là chúc "sớm có tin vui". Ông bà, bố mẹ chúc con cháu như vậy là chuyện thường, còn đồng nghiệp hay bạn xã giao thì nên chọn lời khác, vì chuyện con cái là chuyện riêng của hai người.

## Câu chúc đám cưới ngắn gọn cho thiệp và sổ lưu bút

Ngắn mà vẫn ấm, hợp để viết vào thiệp chúc mừng, ghi lên phong bì hoặc gõ vào sổ lưu bút của thiệp online.

> Chúc hai bạn luôn nắm tay nhau qua mọi chặng đường!

> Mừng ngày trọng đại! Chúc hai bạn cười nhiều hơn cãi, yêu nhiều hơn giận nhen!

> Chúc cô dâu chú rể mãi ngọt ngào như ngày hôm nay.

> Chúc hai bạn mãi yêu nhau, đầu bạc răng long!

> Chúc mừng [tên chú rể] và [tên cô dâu]. Mong nhà mới lúc nào cũng ấm, bữa cơm lúc nào cũng có tiếng cười.

> Chúc hai bạn mỗi năm lại thương nhau thêm một chút.

> Hôm nay là ngày đẹp nhất, mong những ngày sau còn đẹp hơn. Chúc mừng hai bạn!

> Chúc hai bạn bách niên giai lão, thuận vợ thuận chồng.

Khi thiệp mời là thiệp online có sổ lưu bút, lời chúc bạn gửi có thể hiện ngay trên thiệp cho mọi khách mời cùng đọc. Vì vậy hãy viết như một lời chúc công khai, không nhắc chuyện riêng tư, và ở ô tên thì ghi kèm vai, như "Chị Huyền" hay "Tuấn Anh lớp 12A", để cô dâu chú rể biết ngay ai gửi.

## Lời chúc đám cưới cho bạn thân

Với bạn thân, lời chúc đám cưới hay là lời nghe ra đúng giọng hai người: đùa một chút, rồi nói thật lòng.

> Cuối cùng cũng có người chịu nghe [tên] kể chuyện cả đời rồi. Chúc mừng hai đứa, nhớ giữ nhau thật chặt nhé!

> Từ nay hết ai rủ tớ đi ăn đêm lúc mười một giờ. Hơi buồn, nhưng tớ mừng cho cậu nhiều hơn. Chúc hai đứa hạnh phúc!

> Chúc hai đứa có cãi nhau thì cũng chỉ cãi xem tối nay ăn gì.

> Bao nhiêu năm chơi với nhau, hôm nay là lần đầu tớ thấy cậu cười tươi đến vậy. Giữ nụ cười đó thật lâu nha.

> Hôm đó tớ bay chuyến sớm nhất về nhé. Chúc mừng hai đứa!

> Hội mình chính thức có thêm một thành viên. [Tên người thương] ơi, chào mừng nhé, từ giờ đi chơi phải đi cả đôi đó!

> Hồi đó ai bảo còn lâu mới cưới? Gặp đúng người thì kế hoạch nào cũng đổi hết. Chúc mừng hai bạn nha!

> Chúc mừng cậu đã tìm được người chịu nổi cái tính hay quên của cậu. [Tên người thương] ơi, từ nay nhờ cậu nhắc giùm nhé!

Đùa vừa phải là đùa về thói quen vô hại của bạn mình, không phải về chuyện làm người ta ngượng trước nhà chồng, nhà vợ. Phân vân thì đọc lại câu chúc và tự hỏi: mẹ cô dâu đọc câu này có cười được không?

## Chúc mừng đám cưới đồng nghiệp, sếp

### Đồng nghiệp

> Chúc mừng [tên] và [tên người thương]! Chúc hai bạn trăm năm hạnh phúc, đi trăng mật thật vui rồi về kể cả phòng nghe nhé.

> Chúc mừng đám cưới [tên]! Chúc em và [tên người thương] luôn vui khỏe, việc nhà việc công ty đều suôn sẻ.

> Làm việc cùng [tên] mới biết bạn chu đáo thế nào, [tên người thương] đúng là người may mắn. Chúc hai bạn hạnh phúc!

> Chúc mừng anh đã chốt được "dự án" quan trọng nhất đời. Chúc anh chị thuận buồm xuôi gió, trăm năm bền chặt.

> Thay mặt cả phòng [tên phòng], chúc mừng [tên] và [tên người thương]. Chúc hai bạn xây được một tổ ấm thật vững và lúc nào cũng rộn tiếng cười.

Khi cả phòng góp chung một món quà, để một người viết lời chúc thay mặt mọi người rồi ký tên từng người bên dưới, gọn hơn mỗi người một câu.

### Với sếp, cấp trên

Hai câu đầu để chúc cấp trên; câu cuối dành cho người làm sếp chúc nhân viên của mình.

> Em chúc mừng anh chị ạ. Chúc anh chị trăm năm hạnh phúc, gia đình luôn bình an.

> Kính chúc anh và chị [tên] một đời hạnh phúc, vạn sự như ý. Em rất vui được có mặt trong ngày vui của anh chị ạ.

> Chúc mừng em và [tên người thương]. Chúc hai em luôn đồng lòng. Cứ yên tâm nghỉ cưới, việc ở công ty mọi người lo được.

## Lời chúc của ông bà, bố mẹ dành cho con cháu

Người lớn chúc thì chậm rãi, có lời dặn, và được phép chúc những điều mà người ngoài nên tránh.

> Ông bà chúc hai cháu thuận vợ thuận chồng, sống với nhau có trước có sau, sớm có tin vui cho cả nhà.

> Bố mẹ chúc hai con thương nhau, nhường nhịn nhau, có chuyện gì cũng ngồi xuống nói với nhau trước. Nhà mình lúc nào cũng mở cửa chờ hai con.

> Mẹ mừng vì con đã tìm được người thương con. Chúc hai con mãi yêu thương, mai này có khó khăn thì cùng nhau vượt qua.

> Cô chú chúc hai cháu trăm năm hạnh phúc, làm ăn thuận lợi, hiếu thảo với hai bên nội ngoại.

> Bác mừng cho hai đứa. Chúc các cháu bách niên giai lão, nhà cửa lúc nào cũng êm ấm.

> Chúc con gái của bố mẹ về nhà mới được thương như ở nhà mình, và chúc con rể luôn giữ đúng lời hứa hôm nay.

Nếu bố mẹ được mời nói vài lời trong tiệc, xem bố cục và mẫu ở bài [bài phát biểu đám cưới](/vi/blog/bai-phat-bieu-dam-cuoi).

## Anh chị em chúc nhau

> Chúc hai em trăm năm hạnh phúc, vợ chồng đồng lòng.

> Em gái của chị lớn thật rồi. Chúc em và [tên người thương] luôn thương nhau như ngày đầu, có chuyện gì cũng nhớ là còn chị ở đây.

> Anh trai em cưới vợ rồi! Chúc anh chị hạnh phúc, và chị [tên] ơi, từ nay nhờ chị trông anh em giùm nhé.

> Chúc mừng em trai. Từ nay em là trụ cột của một gia đình nhỏ: thương vợ, và nhớ về thăm bố mẹ thường xuyên.

> Lớn lên cùng nhau, giành nhau từng món đồ chơi, giờ thì chị phải nhường em cho người khác rồi. Chúc em hạnh phúc trọn đời!

## Lời chúc khi không đến dự được

Báo sớm, một câu lý do ngắn, rồi đến lời chúc. Không cần xin lỗi dài dòng: thứ cô dâu chú rể muốn nhận là lời chúc, không phải lời giải thích.

> Tiếc quá vì hôm đó mình không về kịp, nhưng lời chúc thì đến đúng hẹn: chúc hai bạn trăm năm hạnh phúc! Hẹn gặp hai bạn sớm nhất có thể.

> Em xin lỗi vì không đến chung vui được, em đang công tác xa. Chúc anh chị một ngày cưới thật đẹp và một đời bình an bên nhau ạ.

> Cách nửa vòng trái đất nhưng tớ vẫn mở thiệp, nghe nhạc và hình dung ngày vui của cậu. Chúc mừng hai đứa, về nước tớ khao!

> Anh không về dự được, nhưng ảnh hai đứa gửi, anh xem không sót tấm nào. Chúc hai em hạnh phúc, có dịp anh ghé thăm nhà mới.

> Hôm đó mình trùng lịch nên không đến được, thật sự tiếc. Gửi hai bạn lời chúc và một món quà nhỏ, chúc hai bạn mãi vui như hôm nay.

Thiệp mời có sổ lưu bút thì gửi lời chúc thẳng vào đó, cô dâu chú rể sẽ đọc cùng lời chúc của mọi người.

## Lời chúc kèm quà mừng cưới

Nhiều gia đình ghi lại tên người mừng để sau này đáp lễ, nên trên phong bì, tên người gửi quan trọng không kém câu chúc. Đi cùng vợ hoặc chồng thì ghi tên cả hai.

> Mừng hạnh phúc [tên chú rể] và [tên cô dâu]. Chúc hai bạn trăm năm bên nhau. [Tên người mừng]

> Một chút quà nhỏ cho tổ ấm mới. Chúc hai bạn ngày nào về nhà cũng thấy vui.

> Quà nhỏ cho căn bếp của hai bạn. Mong bếp nhà mình lúc nào cũng đỏ lửa, bàn ăn lúc nào cũng đủ đôi.

> Chúc mừng hai em. Anh chị gửi chút quà để hai em sắm thêm gì cho nhà mới, chúc hai em luôn đầy đủ, bình an.

Mừng cưới bằng chuyển khoản thì ô nội dung thường ngắn và có thể mất dấu, nên ghi tên mình trước rồi một câu thật gọn:

> [Tên bạn] mừng cưới [tên chú rể] [tên cô dâu], chúc trăm năm hạnh phúc

Nhiều thiệp online có hộp mừng cưới với mã QR chuyển khoản cho khách ở xa; cách dùng cho tế nhị có trong bài [mã QR mừng cưới](/vi/blog/ma-qr-mung-cuoi).

## Lời chúc đám cưới bằng tiếng Anh ngắn

Hợp khi cô dâu chú rể có bạn bè nước ngoài, hoặc khi bạn chọn một tấm thiệp chúc mừng in sẵn chữ tiếng Anh. Phần trong ngoặc là nghĩa tiếng Việt để bạn chọn cho đúng ý.

> Congratulations on your wedding! Wishing you a lifetime of love and happiness. *(Chúc mừng đám cưới! Chúc hai bạn một đời yêu thương và hạnh phúc.)*

> Here's to love, laughter and happily ever after. *(Nâng ly vì tình yêu, tiếng cười và hạnh phúc mãi về sau.)*

> May your love grow stronger with each passing year. *(Mong tình yêu của hai bạn mỗi năm một bền chặt hơn.)*

> So happy for you both. Cheers to the beginning of your forever! *(Mừng cho hai bạn. Chúc mừng khởi đầu của mãi mãi!)*

> Best wishes on your wedding day and always. *(Chúc hai bạn mọi điều tốt đẹp trong ngày cưới và mãi về sau.)*

## Sổ lưu bút trên thiệp: lời chúc chỉ hiện khi cô dâu chú rể duyệt

Phần này dành cho hai bạn đang làm thiệp. Trên thiệp Keemori, khối sổ lưu bút cho khách gửi lời chúc ngay trong thiệp, có cả ở gói Free. Lời chúc mới gửi ở trạng thái chờ; chỉ những lời hai bạn duyệt mới hiện trên thiệp, và hai bạn xoá được bất kỳ lời chúc nào. Một câu đùa quá đà vì thế không nằm trên thiệp cho cả họ hàng cùng đọc.

![Khối sổ lưu bút trên mẫu Nắng Xanh và Trăm Năm: ô nhập tên, ô lời chúc và các lời chúc đã được cô dâu chú rể duyệt](/images/site/blog/loi-chuc-dam-cuoi/so-luu-but.jpg)

Vài cách dùng sổ lưu bút cho trọn vẹn:

- **Rủ khách viết ngay từ lời mời.** Một câu "có lời chúc gì bạn viết vào sổ lưu bút trong thiệp nha" ở cuối tin nhắn là đủ; mẫu tin nhắn có trong bài [tin nhắn mời cưới](/vi/blog/tin-nhan-moi-cuoi).
- **Duyệt đều tay.** Ai gửi lời chúc cũng muốn thấy nó lên thiệp, nhất là những ngày sát đám cưới.
- **Đọc lại sau tiệc.** Sổ lưu bút là danh sách sẵn có để viết [lời cảm ơn sau đám cưới](/vi/blog/loi-cam-on-sau-dam-cuoi), nhất là với người không đến được mà vẫn gửi lời chúc.

Chưa có thiệp thì hai bạn có thể [tạo thiệp cưới online miễn phí](/vi): chọn mẫu, điền thông tin, xem thử, rồi xuất bản để nhận link và mã QR gửi khách.

## Câu hỏi thường gặp

### Lời chúc đám cưới nên dài bao nhiêu?

Trên thiệp, phong bì hay sổ lưu bút, một đến ba câu là vừa. Lời chúc dài có kỷ niệm thì để dành cho tin nhắn riêng hoặc lúc phát biểu trong tiệc.

### Viết gì vào sổ lưu bút của thiệp cưới online?

Một lời chúc ngắn, kèm tên và vai để cô dâu chú rể nhận ra bạn. Viết như một lời chúc công khai, vì lời chúc được duyệt sẽ hiện trên thiệp cho mọi khách mời.

### Lời chúc gửi vào sổ lưu bút có hiện lên thiệp ngay không?

Tuỳ từng thiệp. Trên thiệp Keemori thì không: lời chúc chờ cô dâu chú rể duyệt rồi mới hiện.

### Có nên chúc "sớm có tin vui" trong đám cưới không?

Ông bà, bố mẹ chúc con cháu như vậy là bình thường. Đồng nghiệp hay bạn xã giao nên chọn lời chúc khác.

### Ghi gì lên phong bì mừng cưới?

Tên người mừng, ghi rõ để gia đình biết ai gửi, cùng một câu chúc ngắn như "Mừng hạnh phúc hai bạn".
`,
  },
  {
    slug: 'bai-phat-bieu-dam-cuoi',
    category: 'guide',
    title: 'Bài phát biểu đám cưới: bố cục và mẫu cho từng người nói',
    excerpt:
      'Bài phát biểu đám cưới gồm 5 phần, nói 2–3 phút. Kèm mẫu cho đại diện nhà trai, nhà gái ở lễ ăn hỏi, rước dâu, tiệc cưới, lời cảm ơn của cô dâu chú rể.',
    readingMinutes: 11,
    markdown: `
Một bài phát biểu đám cưới gọn gàng thường có năm phần: chào hỏi, giới thiệu mình là ai, nội dung chính, lời cảm ơn và một lời mời (mời nhận lễ, mời đón dâu, mời nâng ly). Mỗi người nói chỉ nên gói trong khoảng hai đến ba phút; cô dâu chú rể và bạn thân thì có thể ngắn hơn. Dưới đây là bố cục, cách xưng hô và mẫu cho từng vai, từ lễ ăn hỏi đến tiệc cưới.

Cách xưng hô và thủ tục mỗi vùng, mỗi nhà một khác, nên các mẫu dưới đây là khung để sửa chứ không phải bài để đọc nguyên văn. Trước khi viết, hãy hỏi bố mẹ hai bên xem nhà mình quen nói thế nào.

## Ai thường phát biểu trong đám cưới

- **Lễ ăn hỏi:** đại diện nhà trai thưa chuyện và giới thiệu lễ vật, đại diện nhà gái đáp lời.
- **Lễ rước dâu:** đại diện nhà trai xin đón dâu, đại diện nhà gái đồng ý và gửi gắm.
- **Tiệc cưới:** đại diện gia đình (thường là bố chú rể hoặc bố cô dâu, tuỳ tiệc của nhà nào) cảm ơn khách; ngày càng nhiều đôi tự nói vài lời cảm ơn; có tiệc mời thêm một người bạn thân lên chúc.

Người đại diện ở các lễ tại nhà thường là người có vai vế trong họ và ăn nói chắc chắn: ông, bác trưởng, chú, hoặc chính bố chú rể. Nên chốt ai nói ngay từ buổi dạm ngõ, như bài [nghi thức lễ cưới ở nhà gái](/vi/blog/nghi-thuc-le-cuoi-o-nha-gai) đã nhắc: việc này rất hay bị quên đến sát ngày mới đẩy qua đẩy lại.

## Bố cục một bài phát biểu đám cưới

1. **Chào.** Chào theo thứ bậc, từ người lớn tuổi nhất đến khách chung: "Kính thưa các cụ, thưa ông bà, cô dì chú bác…".
2. **Giới thiệu.** Tên mình, quan hệ với cô dâu hoặc chú rể, và mình thay mặt ai.
3. **Nội dung chính.** Lý do có mặt hôm nay (xin làm lễ ăn hỏi, xin đón dâu, cảm ơn khách), thêm một hai câu về đôi trẻ.
4. **Cảm ơn.** Gia đình bên kia, khách mời, những người đã giúp.
5. **Lời mời.** Mời nhận lễ, mời đón dâu, mời nâng ly hoặc mời dùng tiệc. Đây là câu cho mọi người biết bài nói đã xong.

### Bài phát biểu đám cưới nên dài bao lâu

Lễ ở nhà có nhiều phần nối tiếp nhau và giờ lành đã định, nên mỗi bên nói khoảng hai đến ba phút là vừa. Ở tiệc cưới, khách vừa ngồi vào bàn, nói dài quá ba phút là bắt đầu có người cúi xuống điện thoại. Cách thử đơn giản: đọc to bài của mình chậm hơn lúc nói chuyện thường một chút và bấm giờ.

### Xưng hô: hỏi người lớn trước

Ở miền Bắc, lời chào trong lễ ăn hỏi thường mở bằng "các cụ", hai bên gọi nhau là "họ nhà trai", "họ nhà gái" và "ông bà thông gia". Nhiều gia đình miền Nam nói "đàng trai", "đàng gái", gọi nhau là "sui gia". Cách gọi còn khác theo từng làng, từng họ, nên hỏi bố mẹ tên và vai vế của những người ngồi hàng đầu rồi ghi ra giấy. Phần khác nhau giữa hai miền có trong bài [phong tục cưới hỏi miền Bắc](/vi/blog/phong-tuc-cuoi-hoi-mien-bac) và [phong tục cưới hỏi miền Nam](/vi/blog/phong-tuc-cuoi-hoi-mien-nam).

## Mẫu bài phát biểu lễ ăn hỏi

### Phát biểu đại diện nhà trai

> Kính thưa các cụ, thưa ông bà, cô dì chú bác cùng toàn thể gia đình nhà gái.
>
> Tôi là [tên], [bác ruột] của cháu [tên chú rể]. Hôm nay tôi được gia đình tin tưởng, thay mặt họ nhà trai có đôi lời thưa chuyện.
>
> Được sự đồng ý của hai gia đình, hôm nay là ngày lành, họ nhà trai chúng tôi sang làm lễ ăn hỏi cho cháu [tên chú rể] và cháu [tên cô dâu]. Hai cháu quen nhau đã [số] năm, thương yêu nhau thật lòng và được hai bên gia đình vun đắp.
>
> Theo phong tục, gia đình chúng tôi có sửa soạn [số] tráp lễ, gọi là chút lòng thành. Kính mong gia đình nhà gái nhận lễ để thắp hương báo cáo gia tiên.
>
> Nhân dịp này, nhà trai cũng xin thưa: hai gia đình đã thống nhất tổ chức lễ cưới cho các cháu vào ngày [ngày]. Xin cảm ơn gia đình nhà gái đã đón tiếp chu đáo. Xin trân trọng cảm ơn.

### Phát biểu đại diện nhà gái đáp từ

> Kính thưa các cụ, thưa ông bà cùng các vị đại diện họ nhà trai.
>
> Tôi là [tên], [chú ruột] của cháu [tên cô dâu], xin thay mặt gia đình nhà gái có đôi lời đáp lễ.
>
> Trước hết, gia đình chúng tôi xin cảm ơn họ nhà trai đã chu đáo sửa soạn lễ vật và đến đúng giờ lành. Chúng tôi rất vui khi thấy hai cháu thương yêu nhau, và từ nay hai gia đình thêm một mối thâm tình.
>
> Gia đình nhà gái xin trân trọng nhận lễ và xin phép thắp hương báo cáo gia tiên. Cháu [tên cô dâu] còn trẻ, có điều gì chưa chu đáo, kính mong gia đình nhà trai thương yêu, chỉ bảo cho cháu.
>
> Mời các cụ, ông bà cùng họ nhà trai dùng chén trà, miếng bánh để hai bên chuyện trò thêm. Xin cảm ơn.

Người nói cho nhà trai nên biết trước có bao nhiêu tráp và trong tráp có gì, vì nhiều nơi người đại diện giới thiệu lễ vật ngay trong bài. Người nói cho nhà gái thì nên hỏi trước tên và vai vế của người đại diện nhà trai, để lời đáp gọi cho đúng.

## Mẫu phát biểu ở lễ rước dâu

### Đại diện nhà trai xin đón dâu

> Kính thưa các cụ, thưa ông bà và toàn thể gia đình nhà gái.
>
> Tôi là [tên], [ông nội] của cháu [tên chú rể]. Theo ngày giờ hai gia đình đã định, hôm nay họ nhà trai chúng tôi sang xin rước cháu [tên cô dâu] về làm dâu.
>
> Gia đình chúng tôi xin hứa sẽ thương yêu cháu [tên cô dâu] như con cháu trong nhà, để hai cháu cùng nhau xây dựng một gia đình êm ấm, hiếu thảo với ông bà, cha mẹ hai bên.
>
> Kính xin gia đình nhà gái cho phép hai cháu làm lễ gia tiên và cho họ nhà trai được đón dâu. Xin trân trọng cảm ơn.

### Đại diện nhà gái đồng ý và gửi gắm

> Kính thưa các cụ, thưa ông bà cùng họ nhà trai.
>
> Thay mặt gia đình nhà gái, tôi xin cảm ơn họ nhà trai đã đến đón dâu đúng giờ lành. Gia đình chúng tôi đồng ý để cháu [tên cô dâu] về làm dâu bên gia đình nhà trai.
>
> Từ hôm nay, cháu [tên cô dâu] là con, là cháu của gia đình bên ấy. Cháu còn nhiều điều phải học, chúng tôi xin gửi gắm cháu, mong ông bà, anh chị bên nhà trai thương yêu và chỉ bảo.
>
> Chúc hai cháu trăm năm hạnh phúc. Xin mời họ nhà trai đón dâu. Xin cảm ơn.

Về đến nhà trai, nhiều gia đình có thêm vài lời giới thiệu cô dâu với họ hàng bên nội trước lễ gia tiên; trình tự ấy có trong bài [nghi thức lễ cưới ở nhà trai](/vi/blog/nghi-thuc-le-cuoi-o-nha-trai).

## Đại diện gia đình phát biểu trong tiệc cưới

Tiệc chung hai họ thì hai nhà nên thống nhất trước ai nói, và người nói thay mặt cả hai gia đình. Tiệc riêng của nhà nào thì người của nhà đó cảm ơn khách của mình.

> Kính thưa quý vị đại biểu, quý khách, thưa bà con họ hàng và các bạn.
>
> Tôi là [tên], bố của chú rể [tên chú rể]. Hôm nay, thay mặt hai gia đình, tôi xin cảm ơn quý vị đã dành thời gian đến chung vui trong ngày cưới của hai cháu [tên chú rể] và [tên cô dâu].
>
> Gia đình chúng tôi rất vui được đón [tên cô dâu] về làm con trong nhà, và cảm ơn ông bà thông gia đã tin tưởng gửi gắm cháu. Mong hai con luôn thương yêu, nhường nhịn nhau, cùng nhau đi qua cả những ngày khó.
>
> Nếu khâu đón tiếp có điều gì sơ suất, kính mong quý vị rộng lòng bỏ qua. Xin mời quý vị cùng nâng ly chúc mừng cô dâu chú rể, và chúc quý vị một buổi tiệc thật vui.

## Lời cảm ơn của cô dâu chú rể trong tiệc cưới

Không bắt buộc, nhưng vài câu cảm ơn từ chính hai bạn thường làm khách nhớ hơn mọi bài dài. Một mẹo nhỏ về xưng hô: với khách chung, "chúng em" là cách nói phổ biến; khi quay sang bố mẹ thì đổi thành "chúng con".

> Kính thưa ông bà, thưa các cô chú, anh chị và các bạn.
>
> Em là [tên chú rể], và bên cạnh em là [tên cô dâu], từ hôm nay là vợ em. Thay mặt hai đứa, em xin cảm ơn mọi người đã dành buổi tối hôm nay để chung vui cùng gia đình.
>
> Chúng em cảm ơn ông bà, cô chú, anh chị đã đi đường xa về dự. Cảm ơn [tên các bạn] đã giúp chúng em từ sáng sớm. Và bố mẹ hai bên ơi, chúng con cảm ơn bố mẹ đã nuôi dạy, lo lắng cho chúng con đến ngày hôm nay.
>
> Xin mời mọi người cùng nâng ly. Chúc cả nhà sức khỏe và một buổi tối thật vui.

Ngại đứng trước đông người thì ba câu này cũng đủ:

> Chúng con cảm ơn bố mẹ hai bên. Cảm ơn mọi người đã đến chung vui với chúng em hôm nay. Mời cả nhà cùng nâng ly!

## Bạn thân phát biểu: nhẹ nhàng, có một kỷ niệm

Bài của bạn thân hay nhất khi có đúng một kỷ niệm ngắn, nói được cả về người kia, và kết bằng lời chúc. Bỏ qua chuyện người yêu cũ và những trò đùa khiến cô dâu chú rể ngượng trước bố mẹ hai bên.

> Chào cả nhà, mình là [tên], bạn thân của [tên cô dâu] từ hồi [cấp ba].
>
> [Số] năm trước, [tên cô dâu] tuyên bố với cả lớp là sẽ không bao giờ lấy chồng sớm. Hôm nay mình đứng đây, cầm micro, làm chứng cho lời tuyên bố đó chính thức bị huỷ.
>
> Đùa vậy thôi. Quen [tên cô dâu] bao năm, mình biết bạn ấy chỉ đổi kế hoạch khi gặp đúng người. Và nhìn cách [tên chú rể] [nhớ từng món bạn ấy không ăn được], mình yên tâm rồi.
>
> [Tên chú rể] ơi, cảm ơn anh đã thương bạn mình. Mời mọi người cùng nâng ly chúc mừng hai bạn!

Lời chúc ngắn hơn để ghi vào thiệp hay sổ lưu bút có trong bài [lời chúc đám cưới](/vi/blog/loi-chuc-dam-cuoi).

## Chuẩn bị bài phát biểu đám cưới để nói trôi chảy

![Người phát biểu cầm micro cùng một tấm thẻ nhỏ ghi ý chính, phía sau là bàn tiệc cưới mờ](/images/site/blog/bai-phat-bieu-dam-cuoi/the-ghi-y-chinh.jpg)

- **Viết đủ, rồi rút ý.** Viết cả bài để chắc ý, sau đó chép năm ý chính và tên những người cần nhắc lên một tấm thẻ nhỏ. Cầm thẻ tự nhiên hơn cầm điện thoại hay tờ giấy to.
- **Đọc to ít nhất hai lần.** Câu viết ra đọc trôi chưa chắc nói đã trôi. Chỗ nào vấp thì sửa cho giống lời nói hằng ngày.
- **Kiểm tên và vai vế.** Gọi nhầm tên ông bà thông gia là điều người nghe nhớ lâu nhất.
- **Hỏi trước lúc nào tới lượt mình.** Ở tiệc, hỏi người dẫn chương trình thứ tự phát biểu và ai đưa micro. Ở lễ tại nhà, hỏi người lớn phần nói rơi vào lúc nào trong nghi lễ.
- **Nâng ly sau, không phải trước.** Ở tiệc, đừng uống trước khi phát biểu, và để lời mời nâng ly là câu cuối cùng.

## Ghi lịch các lễ lên thiệp cho người phát biểu

Người phát biểu cần biết lễ ăn hỏi bắt đầu lúc mấy giờ, đoàn rước xuất phát từ đâu, tiệc khai mạc khi nào. Nếu hai bạn [tạo thiệp cưới online](/vi) trên Keemori, khối nghi lễ ghi được nhiều lễ trên cùng một thiệp, mỗi lễ có giờ, ngày, địa điểm riêng kèm nút chỉ đường Google Maps, còn khối lịch trình ghi các mốc trong ngày tiệc. Gửi link cho người đại diện hai họ là họ nắm cả lịch; cách sắp các mốc có trong bài [lịch trình ngày cưới](/vi/blog/lich-trinh-ngay-cuoi).

Những gì hai bạn muốn nói trong lời cảm ơn cũng có thể chép vào khối lời cảm ơn ở cuối thiệp, để cả khách không đến được cũng đọc thấy.

## Câu hỏi thường gặp

### Ai nên phát biểu đại diện nhà trai?

Thường là người có vai vế trong họ và ăn nói chắc chắn. Mỗi nhà một lệ, nên hỏi ý bố mẹ và chốt từ buổi dạm ngõ.

### Bài phát biểu lễ ăn hỏi nên dài bao lâu?

Khoảng hai đến ba phút cho mỗi bên là vừa, vì lễ còn nhiều phần nối tiếp và cần giữ giờ lành.

### Cô dâu chú rể có bắt buộc phải phát biểu trong tiệc cưới không?

Không bắt buộc. Nhưng vài câu cảm ơn bố mẹ và khách mời, dù chỉ ba câu, thường được khách nhớ lâu.

### Có được cầm giấy hay điện thoại khi phát biểu không?

Được, nhất là ở các lễ trang trọng. Một tấm thẻ nhỏ ghi ý chính là gọn nhất; nhớ ngẩng lên nhìn người nghe ở câu chào và câu cảm ơn.

### Phát biểu đám cưới miền Bắc và miền Nam có khác nhau không?

Khác chủ yếu ở cách xưng hô và thủ tục từng lễ. Khung năm phần vẫn dùng được cho cả hai, chỉ cần hỏi người lớn để gọi cho đúng.
`,
  },
  {
    slug: 'cach-chon-web-tao-thiep-cuoi-online',
    category: 'experience',
    title: 'Web tạo thiệp cưới online: 12 tiêu chí chọn trước khi dùng',
    excerpt:
      'Nên dùng web nào tạo thiệp cưới online? 12 tiêu chí để tự kiểm mọi nền tảng: gói miễn phí, hạn link, số người xem, phong tục Việt, quyền riêng tư, thanh toán.',
    readingMinutes: 11,
    markdown: `
Một web tạo thiệp cưới online đáng dùng là nơi hai bạn biết chắc link thiệp sống được bao lâu và bao nhiêu người xem được, mẫu thiệp ghi đúng lễ vu quy, lễ thành hôn và ngày âm, khách không thấy thông tin của nhau, và giá được ghi rõ trước khi trả tiền. Bài này không xếp hạng nền tảng nào. Nó đưa ra 12 tiêu chí kèm cách tự kiểm từng cái, để hai bạn so sánh thiệp cưới online ở bất cứ đâu, kể cả ở Keemori. Phần lớn chỉ mất vài phút với một chiếc điện thoại và trang bảng giá.

Nếu còn đang phân vân giữa thiệp giấy và thiệp online, đọc trước bài [thiệp cưới online là gì](/vi/blog/thiep-cuoi-online-la-gi).

## Chuẩn bị gì trước khi thử một web tạo thiệp cưới online

- Điện thoại của chính hai bạn, và nếu được, một máy cũ của bố mẹ.
- Tắt wifi, dùng 4G để thử như khách ở quê hay khách đang trên đường.
- Vài tấm ảnh chụp bằng điện thoại để tải thử.
- Thông tin thật: tên hai bạn, tên bố mẹ, ngày cưới cả âm lẫn dương, địa chỉ tiệc. Gõ tên thật vào mới biết màn bìa có bị tràn chữ hay ngắt dòng xấu không.
- Mở sẵn trang bảng giá, câu hỏi thường gặp và điều khoản của nền tảng đang xét.

## Chi phí, hạn link và số người xem

### 1. Gói miễn phí được gì, link sống bao lâu

"Miễn phí" có thể là cả tấm thiệp gửi đi, cũng có thể chỉ là bản xem thử hay bản có hạn. Câu cần hỏi: thiệp miễn phí xuất bản xong có link thật không, link dùng được đến bao giờ, thiếu những phần nào so với gói trả phí. Sau đám cưới, nhiều người vẫn mở lại thiệp để xem ảnh, đọc lời chúc, nên một đường link vĩnh viễn có giá trị hơn ta tưởng.

**Cách tự kiểm**: đọc mô tả gói miễn phí trên trang bảng giá, tìm chữ "vĩnh viễn" hoặc một con số ngày cụ thể; rồi tạo thử một thiệp miễn phí xem có ra link gửi được không.

### 2. Giới hạn người xem

Có nơi giới hạn số người xem hoặc số lượt mở. Hai cách đếm này khác nhau rất xa: đếm theo lượt mở thì một người mở lại năm lần đã dùng mất năm suất; đếm theo người thì khách quay lại xem giờ tiệc vẫn vào được.

**Cách tự kiểm**: tìm trong bảng giá hoặc câu hỏi thường gặp con số giới hạn, cách đếm, và chuyện gì xảy ra khi chạm trần: khách mới thấy trang báo lỗi, còn người đã xem thì sao.

### 3. Điều kiện khi chưa thanh toán

Nhiều nơi cho tạo và xem thử miễn phí, rồi tính phí khi xuất bản hoặc khi hết thời gian dùng thử. Đọc kỹ ba điều: bản chưa trả tiền sống bao lâu, cho bao nhiêu người xem, và hết hạn thì nội dung ra sao. Rủi ro lớn nhất là gửi link dùng thử cho cả trăm khách rồi link tắt đúng tuần cưới.

**Cách tự kiểm**: đọc bảng giá và câu hỏi thường gặp; nếu vẫn chưa rõ, hỏi thẳng bộ phận hỗ trợ: "Nếu tôi chưa thanh toán thì link còn mở được đến khi nào, và sau đó nội dung có còn không?"

## Có hợp với đám cưới Việt không

### 4. Mẫu có hợp phong tục Việt

Thiệp cưới Việt có những thứ thiệp phương Tây không có: tên bố mẹ hai họ, lễ vu quy ở nhà gái và lễ thành hôn ở nhà trai, lễ ăn hỏi với ngày giờ riêng, ngày âm lịch đi kèm ngày dương, và nhiều đám tách tiệc nhà trai, nhà gái. Mẫu làm theo kiểu phương Tây thường chỉ có một phần "lễ" và một phần "tiệc" chung chung.

**Cách tự kiểm**: mở trình tạo thiệp, tìm ô cho tên bố mẹ hai bên; xem có chọn được loại lễ và thêm nhiều lễ, mỗi lễ một giờ và địa điểm không; xem ngày âm ghi ở đâu. Nếu hai nhà đãi tiệc riêng, hỏi có làm được thiệp nhà trai, nhà gái khác nhau không.

### 5. Link mời riêng tên từng khách

Thiệp giấy ghi tay tên người nhận; thiệp online gửi chung một link thì mất phần chào đích danh ấy. Có nơi cho tạo link riêng, khách mở ra thấy tên mình ngay màn đầu. Vì sao chi tiết này quan trọng với người lớn tuổi, xem bài [thiệp cưới ghi tên khách mời](/vi/blog/thiep-cuoi-ghi-ten-khach-moi).

**Cách tự kiểm**: nhập thử danh sách ba tên, mở link của từng người; sau đó chèn thêm một tên lên đầu danh sách và mở lại link cũ, xem có ai bị đổi link hay nhận nhầm tên người khác không.

### 6. Xác nhận tham dự và ai xem được câu trả lời

Form xác nhận tham dự giúp chốt số bàn sát thực tế. Hỏi thêm: câu trả lời có hiện công khai trên thiệp không, khách gửi lại có tạo ra hai dòng trùng không, hai bạn có biết ai chưa trả lời không. Cách hỏi và chốt số khách có trong bài [xác nhận tham dự đám cưới](/vi/blog/xac-nhan-tham-du-dam-cuoi).

**Cách tự kiểm**: gửi thử một câu trả lời từ điện thoại khác, rồi mở thiệp như một khách khác xem có thấy câu trả lời đó không.

### 7. Hộp mừng cưới bằng mã QR

Khách ở xa thường muốn gửi quà qua chuyển khoản. Xem nền tảng có hộp mừng cưới không, có ở gói miễn phí không, và mã QR có ra đúng tài khoản của hai bạn không.

**Cách tự kiểm**: điền tài khoản của chính mình vào bản thử, quét mã QR bằng ứng dụng ngân hàng, xem tên người nhận hiện ra có đúng không rồi thoát ra, không cần chuyển thật.

## An toàn và trải nghiệm của khách

### 8. Đổi mẫu, sửa nội dung có mất gì không

Hai bạn gần như chắc chắn sẽ đổi ý ít nhất một lần. Đổi mẫu mà phải nhập lại từ đầu, hay mất ảnh đã tải, là mất cả buổi tối. Sửa thông tin sau khi đã gửi thì đường link phải giữ nguyên, nếu không khách cầm link cũ sẽ thấy bản sai hoặc trang lỗi.

**Cách tự kiểm**: nhập đủ một thiệp thử, đổi sang mẫu có số ô ảnh khác rồi đổi lại; sửa một mốc giờ sau khi xuất bản và mở lại đúng link cũ.

### 9. Quyền riêng tư

Thiệp cưới ghi tên cả nhà, địa chỉ và cả giờ cả nhà vắng mặt. Bốn điểm cần kiểm:

- **Link có dễ đoán không.** Link chỉ gồm tên hoặc một dãy số tăng dần thì người lạ có thể dò ra thiệp khác.
- **Ảnh có mang theo vị trí không.** Ảnh chụp bằng điện thoại thường lưu toạ độ GPS; nền tảng cẩn thận sẽ xoá thông tin này khi ảnh được tải lên.
- **Khách có thấy danh sách người khác không.** Khi dùng link mời riêng, người xem thiệp không nên thấy được tên những khách khác.
- **Ai kiểm soát lời chúc.** Lời chúc hiện ngay hay chờ hai bạn duyệt, và hai bạn có xoá được không.

**Cách tự kiểm**: nhìn cấu trúc link sau khi xuất bản; tải lên bản thử một tấm ảnh có vị trí, lưu ảnh đó từ thiệp về máy rồi xem phần thông tin ảnh còn địa điểm không; gửi thử một lời chúc xem nó hiện ngay hay chờ duyệt.

### 10. Tốc độ mở trên điện thoại và mạng yếu

Khách mở thiệp trên điện thoại, nhiều người bấm ngay trong Zalo hay Messenger, có người đang ở quê sóng yếu. Một tấm thiệp đẹp mà để màn hình trắng quá lâu thì nhiều người sẽ đóng lại trước khi kịp thấy ngày cưới.

**Cách tự kiểm**: tắt wifi, gửi link bản xem thử vào khung chat của chính mình rồi mở bằng 4G; thử thêm trên máy cũ. Để ý chữ có đủ to cho người lớn tuổi đọc không, nhạc nền có tắt được không, nút bản đồ có mở đúng Google Maps không.

## Hỗ trợ và thanh toán

### 11. Hỗ trợ khi cần

Sự cố hay rơi đúng vào tuần cuối trước đám cưới. Xem nền tảng có kênh hỗ trợ nào, có trả lời bằng tiếng Việt không, có hướng dẫn từng bước và trang câu hỏi thường gặp không.

**Cách tự kiểm**: nhắn thử một câu hỏi trước khi trả tiền và để ý cách họ trả lời.

### 12. Thanh toán minh bạch

Giá có công khai không, đã gồm những gì, có phí phát sinh khi thêm khách, thêm ảnh hay gia hạn không, trả bằng cách nào, bao lâu sau thì thiệp được mở khoá, mua thiệp thứ hai có khác không.

**Cách tự kiểm**: đọc hết trang bảng giá và chụp màn hình lại trước khi trả. Chỉ thanh toán qua màn hình thanh toán trên chính trang của nền tảng, đừng chuyển tiền theo số tài khoản ai đó nhắn riêng.

## Keemori đáp ứng các tiêu chí này thế nào

Keemori cũng là một web tạo thiệp cưới online, nên công bằng nhất là tự đặt mình vào đúng 12 câu hỏi trên. Câu trả lời cho từng tiêu chí:

- **Gói miễn phí và hạn link**: tạo thiệp và xem thử luôn miễn phí. Gói Free dùng mẫu minh hoạ vẽ riêng, không có ô ảnh cưới, nhưng đủ nghi lễ, tiệc, gia đình, lịch trình, nhạc nền, hộp mừng cưới và sổ lưu bút; link vĩnh viễn, không giới hạn người xem. Gợi ý chọn mẫu có trong bài [mẫu thiệp cưới miễn phí](/vi/blog/mau-thiep-cuoi-mien-phi).
- **Giới hạn người xem và khi chưa thanh toán**: thiệp Gold, Diamond đã thanh toán có link vĩnh viễn, không giới hạn người xem. Chưa thanh toán là bản dùng thử: link 3 ngày, tối đa 15 người xem, đếm theo người chứ không theo lượt mở, người đã xem vẫn mở lại được. Muốn gửi rộng thì thanh toán trước.
- **Phong tục Việt**: một thiệp có nhiều nghi lễ, chọn Lễ ăn hỏi, Lễ vu quy, Lễ thành hôn hoặc tự đặt tên lễ khác, mỗi lễ có giờ, ngày, địa điểm và nút chỉ đường riêng; có khối gia đình hai họ, và Truyền thống là một trong sáu phong cách của kho mẫu. Gói Diamond Song Hỷ cho một thiệp ba link: link chung, link riêng nhà trai và link riêng nhà gái, mỗi nhà hiện tiệc của nhà mình.
- **Link mời riêng** (từ gói Gold): mỗi khách một link, màn mở thiệp chào "Trân trọng kính mời" kèm tên khách; thêm khách lên đầu danh sách không làm đổi link của người khác.
- **Xác nhận tham dự** (từ gói Gold): khách điền tên, có đi hay không, đi mấy người; câu trả lời không hiện công khai, chỉ hai bạn xem trong "Thiệp của tôi". Khách mở link riêng được điền sẵn tên, gửi lại là sửa câu trả lời cũ.
- **Hộp mừng cưới QR**: có ở mọi gói, kể cả Free.
- **Đổi mẫu, sửa nội dung**: đổi mẫu không mất nội dung hay ảnh; ảnh nào mẫu mới không có ô thì vẫn được giữ, chỉ tạm không hiển thị. Sửa xong lưu lại, đường dẫn giữ nguyên.
- **Quyền riêng tư**: đường dẫn tự sinh từ tên hai bạn kèm một mã ngẫu nhiên; ảnh tải lên được nén lại và xoá thông tin vị trí GPS; người xem không thấy danh sách khách mời khác; lời chúc chờ hai bạn duyệt mới hiện, và hai bạn xoá được bất kỳ lời chúc nào.
- **Tốc độ**: tiêu chí này hai bạn nên tự kiểm như cách ở trên: mở bản xem thử của mẫu định chọn trong [kho mẫu thiệp](/vi/mau-thiep) bằng điện thoại, dùng 4G.
- **Hỗ trợ**: có trang hướng dẫn từng bước và trang [câu hỏi thường gặp](/vi/cau-hoi-thuong-gap); gói Diamond được ưu tiên hỗ trợ.
- **Thanh toán**: chuyển khoản ngân hàng bằng mã QR, hệ thống tự xác nhận; giá từng gói công khai ở [bảng giá](/vi/bang-gia). Đã mua một thiệp Gold hoặc Diamond thì những lần mua sau được giá mua lại.

Cách so sánh thiệp cưới online chắc nhất vẫn là tự làm thử. Hai bạn có thể [tạo thiệp cưới online miễn phí](/vi) trên Keemori, đi lần lượt 12 tiêu chí trên điện thoại của mình, rồi làm y như vậy với nơi khác đang cân nhắc.

## Câu hỏi thường gặp

### Nên dùng web nào tạo thiệp cưới?

Không có đáp án chung. Chọn nơi đáp ứng tốt nhất những tiêu chí quan trọng với đám cưới của hai bạn, thường là hạn link, số người xem, phong tục, quyền riêng tư và giá rõ ràng; tạo thử ở vài nơi rồi so trên chính điện thoại của mình.

### Thiệp cưới online miễn phí có đủ dùng không?

Đủ để báo tin và mời khách, nếu link không hết hạn và có đủ thông tin lễ, tiệc, bản đồ. Cần xác nhận tham dự, link mời riêng hay ảnh cưới trong thiết kế thì thường phải dùng gói trả phí.

### Làm sao biết link thiệp có hết hạn không?

Đọc điều kiện từng gói trong bảng giá và câu hỏi thường gặp, chú ý chữ "dùng thử", số ngày và số người xem. Với thiệp đã tạo, xem trạng thái và hạn dùng trong trang quản lý thiệp của mình.

### Thiệp cưới online có an toàn không?

An toàn hơn khi link khó đoán, ảnh được xoá vị trí GPS và khách không thấy danh sách của nhau. Dù vậy, chỉ nên gửi link cho người được mời, đừng đăng công khai lên trang cá nhân.
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

export class AddPlanningBlogPosts1794600000000 implements MigrationInterface {
  name = 'AddPlanningBlogPosts1794600000000';

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
          now() - make_interval(secs => 3600 + $10), now() - make_interval(secs => 3600 + $10)
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
