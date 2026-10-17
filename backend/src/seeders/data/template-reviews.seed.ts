import type { Tier } from '@common/enums/tier.enum';

/**
 * Đánh giá mồi cho kho mẫu.
 *
 * Kho mẫu hiện 5.0 sao kèm nhãn "chưa có đánh giá" khi một mẫu chưa ai chấm —
 * đúng theo quy ước, nhưng cả 48 mẫu cùng mang nhãn đó thì phần đánh giá trông
 * như một tính năng chưa chạy. Bộ seed này mồi cho mỗi mẫu vài nhận xét để
 * thấy được hình dạng thật của màn hình: phân bố sao, ngày tháng, nút "Hữu ích".
 *
 * Ba quyết định của bộ dữ liệu này:
 *
 * 1. **Chỉ 4 và 5 sao.** Đây là dữ liệu trưng bày, không phải mô phỏng thị
 *    trường; một điểm 2 sao mồi sẵn là lời chê do chính mình viết ra và nó nằm
 *    đó vĩnh viễn trên trang bán hàng.
 * 2. **Điểm đi theo lời, không phải ngược lại.** Mỗi nhận xét được viết cho
 *    đúng một mức: bản 5 sao khen thẳng, bản 4 sao luôn kèm một điểm trừ thật.
 *    Ghép ngẫu nhiên lời với điểm thì sẽ có "tuyệt vời, không chê được" nằm ở 4
 *    sao — thứ đọc ra là dữ liệu giả ngay lập tức.
 * 3. **Ngẫu nhiên nhưng tất định.** Số lượng, người viết, lời và ngày tháng đều
 *    suy từ hash của chính `slug`, nên chạy `npm run seed` lần thứ hai ra đúng
 *    bộ cũ và mỗi mẫu có một hình dạng riêng. Không dùng `Math.random()`: seed
 *    chạy lại nhiều lần là chuyện bình thường của dự án này.
 *
 * Số lượng theo gói: Diamond 3–5, Free/Gold 1–3 — mẫu cao cấp được nhìn nhiều
 * hơn nên cũng được nhận xét nhiều hơn.
 */

/** Tài khoản đứng tên các nhận xét mồi. */
export interface ReviewerSeed {
  email: string;
  fullName: string;
}

/** Một nhận xét đã gán xong người viết và thời điểm. */
export interface TemplateReviewSeed {
  templateSlug: string;
  reviewerEmail: string;
  rating: number;
  comment: string;
  /** Số ngày trước thời điểm chạy seed — dùng cho cả `createdAt`. */
  daysAgo: number;
}

/**
 * Người viết là tài khoản thật trong bảng `users` vì `template_reviews.user_id`
 * là khoá ngoại và danh sách công khai hiển thị `user.fullName`. Chúng được tạo
 * với `passwordHash = null` — không đăng nhập được bằng mật khẩu, đúng như tài
 * khoản OAuth chưa từng đặt mật khẩu — và tắt `emailNotifications` để không có
 * đường nào gửi thư tới một hộp thư không tồn tại.
 *
 * Tên miền `.local` là tên miền dành riêng, không phân giải ra ngoài Internet
 * được, nên một cấu hình SMTP sai cũng không thể gửi thư đi đâu thật.
 */
export const REVIEWER_SEEDS: ReviewerSeed[] = [
  { email: 'thu-ha.01@seed.keemori.local', fullName: 'Nguyễn Thu Hà' },
  { email: 'minh-quan.02@seed.keemori.local', fullName: 'Trần Minh Quân' },
  { email: 'bao-tran.03@seed.keemori.local', fullName: 'Lê Bảo Trân' },
  { email: 'hoang-nam.04@seed.keemori.local', fullName: 'Phạm Hoàng Nam' },
  { email: 'khanh-linh.05@seed.keemori.local', fullName: 'Vũ Khánh Linh' },
  { email: 'duc-anh.06@seed.keemori.local', fullName: 'Đặng Đức Anh' },
  { email: 'phuong-thao.07@seed.keemori.local', fullName: 'Bùi Phương Thảo' },
  { email: 'tuan-kiet.08@seed.keemori.local', fullName: 'Hồ Tuấn Kiệt' },
  { email: 'ngoc-mai.09@seed.keemori.local', fullName: 'Đỗ Ngọc Mai' },
  { email: 'gia-huy.10@seed.keemori.local', fullName: 'Ngô Gia Huy' },
  { email: 'thanh-van.11@seed.keemori.local', fullName: 'Lý Thanh Vân' },
  { email: 'hai-dang.12@seed.keemori.local', fullName: 'Trịnh Hải Đăng' },
  { email: 'kim-ngan.13@seed.keemori.local', fullName: 'Huỳnh Kim Ngân' },
  { email: 'quoc-bao.14@seed.keemori.local', fullName: 'Dương Quốc Bảo' },
  { email: 'my-linh.15@seed.keemori.local', fullName: 'Cao Mỹ Linh' },
  { email: 'thien-an.16@seed.keemori.local', fullName: 'Phan Thiên Ân' },
  { email: 'ha-vy.17@seed.keemori.local', fullName: 'Võ Hà Vy' },
  { email: 'trung-hieu.18@seed.keemori.local', fullName: 'Đinh Trung Hiếu' },
  { email: 'yen-nhi.19@seed.keemori.local', fullName: 'Tạ Yến Nhi' },
  { email: 'anh-tuan.20@seed.keemori.local', fullName: 'Lâm Anh Tuấn' },
  { email: 'hong-nhung.21@seed.keemori.local', fullName: 'Chu Hồng Nhung' },
  { email: 'nhat-minh.22@seed.keemori.local', fullName: 'Mai Nhật Minh' },
  { email: 'diem-quynh.23@seed.keemori.local', fullName: 'Hà Diễm Quỳnh' },
  { email: 'thanh-tung.24@seed.keemori.local', fullName: 'Nguyễn Thanh Tùng' },
  { email: 'kieu-oanh.25@seed.keemori.local', fullName: 'Trương Kiều Oanh' },
  { email: 'xuan-truong.26@seed.keemori.local', fullName: 'Lưu Xuân Trường' },
  { email: 'thuy-dung.27@seed.keemori.local', fullName: 'Đoàn Thuỳ Dung' },
  { email: 'cong-danh.28@seed.keemori.local', fullName: 'Tô Công Danh' },
  { email: 'lan-anh.29@seed.keemori.local', fullName: 'Nguyễn Lan Anh' },
  { email: 'viet-hung.30@seed.keemori.local', fullName: 'Phùng Việt Hùng' },
  { email: 'tuong-vi.31@seed.keemori.local', fullName: 'Kiều Tường Vi' },
  { email: 'dang-khoa.32@seed.keemori.local', fullName: 'Trần Đăng Khoa' },
  { email: 'thu-trang.33@seed.keemori.local', fullName: 'Lê Thu Trang' },
  { email: 'hoai-nam.34@seed.keemori.local', fullName: 'Đỗ Hoài Nam' },
  { email: 'bich-ngoc.35@seed.keemori.local', fullName: 'Vương Bích Ngọc' },
  { email: 'nhat-quang.36@seed.keemori.local', fullName: 'Hoàng Nhật Quang' },
];

/**
 * Lời khen trọn vẹn — không có vế "nhưng". Người viết là cặp đôi vừa dùng xong
 * hoặc khách mời vừa nhận link, nên chuyện họ kể là chuyện dùng thật: mở trên
 * điện thoại, gửi vào nhóm gia đình, ông bà đọc được chữ.
 */
const COMMENTS_5: string[] = [
  'Mẫu này đúng cái mình tìm mãi không ra. Gửi link vào nhóm gia đình, ai mở cũng khen đẹp và sang.',
  'Bố mẹ hai bên lớn tuổi mà mở trên điện thoại vẫn đọc rõ từng chữ, không phải phóng to. Riêng cái đó thôi đã đáng rồi.',
  'Nhập nội dung xong là ra thiệp luôn, mình làm trong một buổi tối. Không cần biết gì về thiết kế vẫn ra sản phẩm chỉn chu.',
  'Phần đếm ngược tới ngày cưới làm mình với chồng sắp cưới hồi hộp thật sự. Chi tiết nhỏ mà rất tình.',
  'Bố cục sạch, chữ đẹp, không rối mắt. Khách mời bấm vào là biết ngay cưới ngày nào ở đâu.',
  'Mình so mấy chục mẫu rồi mới chốt cái này. Ảnh cưới lên rất tôn, màu không bị chỏi với ảnh của tụi mình.',
  'Link mở nhanh kể cả lúc mạng yếu ở quê. Cô chú ở nhà mở được hết nên không phải gọi hướng dẫn ai.',
  'Gửi qua Zalo hiện ảnh xem trước rất đẹp, nhìn là muốn bấm vào. Đúng thứ mình cần vì hầu hết khách mời của mình dùng Zalo.',
  'Phần sổ lưu bút vui nhất. Bạn bè để lại lời chúc suốt mấy hôm, đọc lại vẫn thấy ấm.',
  'Thiết kế nhìn là biết được chăm chút, không giống mấy mẫu miễn phí trôi nổi. Bạn bè tưởng mình thuê designer.',
  'Đặt bản đồ nhà hàng ngay trong thiệp là ý hay. Không ai hỏi lại đường đi nữa, đỡ mình cả trăm tin nhắn.',
  'Mình đổi nội dung mấy lần sát ngày mà link vẫn giữ nguyên, không phải gửi lại cho ai. Rất tiện.',
  'Chữ và khoảng cách dòng nhìn dễ chịu, đọc hết thiệp mà mắt không mỏi. Cảm giác giống đọc một tấm thiệp giấy thật.',
  'Ảnh cưới của tụi mình vào khung là vừa khít, không bị cắt mất mặt. Mình sợ nhất khoản này mà mẫu xử lý gọn.',
  'Đám cưới hai miền, mình làm hai buổi lễ trong cùng một thiệp, khách mời không ai nhầm chỗ. Rất đáng tiền.',
  'Nhìn trên máy tính hay điện thoại đều đẹp như nhau. Mình mở thử trên máy cũ của mẹ vẫn chạy mượt.',
  'Màu sắc nhã, hợp với đám cưới ở nhà thờ. Mình tìm mãi mới có mẫu không quá màu mè.',
  'Mục câu chuyện tình yêu kể được đúng thứ tự tụi mình muốn. Khách đọc xong nhắn tin trêu suốt.',
  'Phần thông tin mừng cưới có mã QR luôn, người ở xa không về được vẫn gửi quà được. Rất chu đáo.',
  'Chuyển động lúc mở thiệp nhẹ nhàng, không lố. Mình ghét mấy hiệu ứng bay nhảy nên rất ưng cái này.',
  'Nhạc nền hợp không khí, mà tắt được nếu ai không thích. Đúng kiểu tế nhị mà mình mong.',
  'Tụi mình cưới gấp nên cần thiệp trong hai ngày. Chọn mẫu này xong là xong, không phải chỉnh gì thêm.',
  'Ảnh album lên đẹp hơn cả mình nghĩ, giống một bộ ảnh được trình bày chứ không phải đống ảnh xếp cạnh nhau.',
  'Mình gửi cho gần 400 khách, chưa ai báo lỗi mở không được. Yên tâm hẳn.',
  'Trang phục gợi ý theo tông màu thiệp, khách mặc lên ảnh chụp rất hợp. Không ngờ chi tiết đó lại có ích vậy.',
  'Đẹp, nhẹ và không rườm rà. Đúng gu tối giản mà vẫn đủ trang trọng cho một đám cưới.',
  'Mình dùng mẫu này cho lễ ăn hỏi, sau đó dùng tiếp cho lễ cưới. Cả hai lần đều được khen.',
  'Chỗ nào cũng chỉnh được chữ theo ý mình, kể cả lời cảm ơn cuối thiệp. Thiệp ra giống giọng của tụi mình.',
  'Xem thử trước khi trả tiền nên mình biết chắc mình mua gì. Rất sòng phẳng.',
  'Ông bà nội mình 80 tuổi mà tự mở link xem được. Với mình đó là thước đo tốt nhất.',
];

/**
 * Lời khen kèm một điểm trừ **thật** — thứ mà một người dùng thật sẽ gợn lên.
 * Đây là phần khó viết nhất và cũng là phần khiến danh sách đọc ra như thật:
 * bốn sao mà không nói được mình trừ vì cái gì thì chỉ là năm sao viết nhạt đi.
 */
const COMMENTS_4: string[] = [
  'Mẫu đẹp, dùng ổn. Mình chỉ ước có thêm chỗ đặt ảnh nữa vì tụi mình chụp được nhiều tấm ưng.',
  'Nhìn rất sang, nhưng phần lễ cưới với tiệc cưới để hơi sát nhau nên vài bác lớn tuổi đọc bị nhầm giờ.',
  'Thiết kế đẹp. Giá mà đổi được màu chữ một chút cho hợp ảnh cưới của tụi mình thì trọn vẹn.',
  'Ưng tổng thể. Trên điện thoại màn nhỏ thì phần đầu thiệp hơi dài, phải cuộn một lúc mới tới thông tin chính.',
  'Dùng tốt và dễ nhập nội dung. Mình mong có thêm vài kiểu chữ để chọn, hiện tại hơi ít lựa chọn.',
  'Đẹp và gọn. Chỉ là ảnh của mình chụp dọc nên vào khung bị cắt mất một phần, phải chọn lại tấm khác.',
  'Hài lòng. Phần bản đồ giá như mở thẳng ra ứng dụng chỉ đường thay vì phải bấm thêm một bước.',
  'Mẫu ổn, khách khen nhiều. Trừ một sao vì mình muốn đổi thứ tự các mục mà chưa làm được.',
  'Rất hợp đám cưới truyền thống. Mình chỉ góp ý là phần tên hai họ nên cho cỡ chữ lớn hơn chút nữa.',
  'Nội dung nhập nhanh, kết quả đẹp. Lúc mạng yếu thì ảnh tải hơi lâu, ngoài ra không có gì để chê.',
  'Thiệp đẹp, đúng phong cách mình thích. Mong sau này có thêm bản màu tối cho ai cưới buổi tối.',
  'Ổn trong tầm giá. Phần lời chúc của khách phải duyệt từng cái, đông khách thì hơi mất công.',
  'Mình thích bố cục này. Chỉ tiếc là mục trang phục gợi ý hơi ngắn, muốn viết dài hơn mà không đủ chỗ.',
  'Đẹp và nhẹ. Góp ý nhỏ là nút mở thiệp ở màn đầu nên nổi hơn, mấy bác không biết phải bấm vào đâu.',
  'Nhìn chuyên nghiệp. Mình chỉ mong phần đếm ngược có thể tắt riêng mà vẫn giữ lịch, hiện tại đi chung với nhau.',
  'Dùng cho lễ ăn hỏi rất hợp. Với lễ cưới thì mình thấy hơi nhẹ nhàng quá so với không khí hôm đó.',
  'Hài lòng với thiết kế. Trừ một sao vì lần đầu mình không biết đổi được đường dẫn, lỡ gửi link cũ cho vài người.',
  'Mẫu đẹp và dễ dùng. Ảnh mình tải lên bị nén nên nhìn kỹ thấy khác bản gốc chút, nhưng trên điện thoại thì không rõ lắm.',
  'Tổng thể tốt. Mình mong có chỗ ghi số điện thoại của người liên hệ ngay đầu thiệp cho khách ở xa.',
  'Đẹp, khách khen. Phần nhạc mình muốn đổi bài khác mà chưa tìm được chỗ, đành để mặc định.',
];

/** FNV-1a 32-bit — đủ tản cho việc chọn mẫu, và giống nhau ở mọi lần chạy. */
function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193) >>> 0;
  }
  return result;
}

/**
 * Chuỗi số tất định cho một mẫu: mỗi lần gọi lấy một giá trị mới nhưng cùng
 * một `slug` luôn cho cùng một chuỗi.
 */
function sequence(slug: string): () => number {
  let state = hash(slug);
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state;
  };
}

/**
 * Dựng danh sách nhận xét cho một mẫu.
 *
 * Người viết được rút **không lặp trong cùng một mẫu** — `template_reviews` có
 * `@Unique(['userId', 'templateSlug'])`, nên trùng người là insert vỡ chứ không
 * phải chỉ xấu dữ liệu. Nhận xét cũng không lặp trong cùng một mẫu, nhưng vẫn
 * dùng lại được ở mẫu khác: kho có 48 mẫu mà chỉ 50 câu nhận xét.
 */
export function buildTemplateReviewSeeds(
  slug: string,
  tier: Tier,
): TemplateReviewSeed[] {
  const next = sequence(slug);
  const [min, max] = tier === 'diamond' ? [3, 5] : [1, 3];
  const count = min + (next() % (max - min + 1));

  const reviewers = [...REVIEWER_SEEDS];
  const fiveStar = [...COMMENTS_5];
  const fourStar = [...COMMENTS_4];
  const seeds: TemplateReviewSeed[] = [];

  for (let index = 0; index < count; index += 1) {
    // Nghiêng về 5 sao (khoảng 2/3) để điểm trung bình rơi vào vùng 4.5–5.0 —
    // vùng mà một mẫu được chăm chút thật sự sẽ nằm.
    const rating = next() % 3 === 0 ? 4 : 5;
    const pool = rating === 5 ? fiveStar : fourStar;
    const comment = pool.splice(next() % pool.length, 1)[0];
    const reviewer = reviewers.splice(next() % reviewers.length, 1)[0];
    seeds.push({
      templateSlug: slug,
      reviewerEmail: reviewer.email,
      rating,
      comment,
      // Rải trong khoảng 10 tháng gần nhất; cộng thêm `index` để hai nhận xét
      // của cùng một mẫu không bao giờ trùng ngày và danh sách "mới nhất
      // trước" có thứ tự rõ ràng.
      daysAgo: (next() % 300) + index + 1,
    });
  }

  return seeds;
}
