# SEO "thiệp cưới online" — đợt 11/10/2026

Mục tiêu: lên top Google VN cho "thiệp cưới online". Tài liệu này ghi việc đã
làm trong code, việc người vận hành phải làm sau deploy, và phần ngoài site —
phần quyết định thứ hạng mà code không làm thay được.

## Mốc ngày 11/10/2026

- Keemori không có trong ~95 kết quả đầu của "thiệp cưới online" (Google VN,
  trình duyệt không đăng nhập). `site:keemori.com` ra khoảng 58 kết quả.
- Top 6: CineLove, ZenLove, ChungDoi, Canva, Huy Thanh Jewelry, Tierra.
- Huy Thanh và Tierra đứng hạng 5–6 với trang chỉ 350–440 chữ, không schema —
  nhờ tên miền mẹ là thương hiệu trang sức lớn và được các bài "top web làm
  thiệp cưới" nhắc tên. Tức là ở mức cạnh tranh này, **uy tín tên miền và lượt
  nhắc tên quyết định**, nội dung trang chỉ là điều kiện cần.
- Tìm "keemori" thì Google trả trang mẫu Rừng Hoa trước trang chủ (title trang
  chủ khi đó không có tên thương hiệu).

## Đã làm trong code (chờ deploy)

- Trang chủ: title `Tạo thiệp cưới online miễn phí, link vĩnh viễn | Keemori`,
  H1 mở đầu bằng "Tạo thiệp cưới online miễn phí", meta description nêu tính
  năng; khối tính năng mới (`components/home/features.tsx`) nói thẳng những gì
  người tìm đang so: ghi tên từng khách, xác nhận tham dự, thiệp riêng nhà trai –
  nhà gái, gửi qua Zalo/Messenger.
- Thẻ mẫu ở trang chủ là link thật tới `/mau-thiep/<slug>` (trước là nút).
- Schema trang chủ: `Organization` thêm `sameAs` (fanpage, Instagram, TikTok),
  thêm `WebApplication` kèm Offer giá 0.
- `www.keemori.com` chuyển hướng 308 về `keemori.com` (`proxy.ts`).
- 13 bài blog (migration `AddFeatureBlogPosts1794500000000`), ảnh bìa và ảnh
  minh hoạ dựng từ poster thật của mẫu:

  | Bài | Từ khoá chính |
  |---|---|
  | `/vi/blog/thiep-cuoi-online-la-gi` | thiệp cưới online là gì |
  | `/vi/blog/mau-thiep-cuoi-mien-phi` | mẫu thiệp cưới online miễn phí |
  | `/vi/blog/thiep-cuoi-nha-trai-nha-gai` | thiệp cưới nhà trai nhà gái |
  | `/vi/blog/thiep-cuoi-ghi-ten-khach-moi` | thiệp cưới ghi tên khách mời |
  | `/vi/blog/xac-nhan-tham-du-dam-cuoi` | xác nhận tham dự đám cưới |
  | `/vi/blog/cach-gui-thiep-cuoi-online-qua-zalo` | gửi thiệp cưới qua Zalo |
  | `/vi/blog/tin-nhan-moi-cuoi` | tin nhắn mời cưới |
  | `/vi/blog/cach-ghi-thiep-cuoi` | cách ghi thiệp cưới |
  | `/vi/blog/ma-qr-mung-cuoi` | mã QR mừng cưới |
  | `/vi/blog/lich-trinh-ngay-cuoi` | lịch trình ngày cưới |
  | `/vi/blog/mau-thiep-cuoi-truyen-thong` | mẫu thiệp cưới truyền thống |
  | `/vi/blog/mau-thiep-cuoi-hoa` | mẫu thiệp cưới hoa |
  | `/vi/blog/mau-thiep-cuoi-toi-gian` | mẫu thiệp cưới tối giản |

## Đợt 2: công cụ miễn phí và 9 bài lập kế hoạch cưới (chờ deploy)

- Công cụ (`/cong-cu`): đổi ngày âm dương, tính số bàn tiệc cưới, tạo mã QR cho
  thiệp giấy. Trang tĩnh, có FAQ và schema riêng, nằm trong sitemap và chân trang.
- Migration `AddPlanningBlogPosts1794600000000`: checklist chuẩn bị đám cưới, dự
  toán chi phí, danh sách khách mời, lời chúc, bài phát biểu, gửi thiệp trước bao
  lâu, chọn ngày cưới, save the date, cách chọn web tạo thiệp. Tách khỏi đợt 1 để
  deploy riêng được.
- 13 bài đợt 1 có thêm link sang công cụ ở đúng đoạn liên quan.

### Ảnh sinh bằng Astra

**Đã xong ngày 2026-10-11**: cả bảy vị trí đã là ảnh thật. Prompt giữ lại để
sinh lại khi cần — xuất đúng kích thước, lưu JPEG **đè lên đúng đường dẫn**
trong `frontend/public`, không phải sửa bài hay database. Ảnh đã lên CDN thì
đổi file cùng tên phải chờ cache.

#### `frontend/public/images/site/blog/checklist-chuan-bi-dam-cuoi.jpg`

ảnh bìa (tỉ lệ 16:9, xuất 1672×941). Bàn gỗ sồi buổi sáng bày cuốn sổ kế hoạch cưới đang mở, cây bút, mẫu vải ngà, hộp nhẫn nhung và chén trà men ngọc.

```text
Editorial photograph, top-down at a slight angle, of a wedding planning still life on a warm oak table in soft morning window light. An open linen-bound planner with handwritten notes too soft-focus to read, a brass fountain pen, a few blank ivory envelopes, ivory silk and lace fabric swatches, a sprig of baby's breath, a small closed velvet ring box, and green tea in a celadon ceramic cup. Palette of ivory paper, champagne gold, a very deep forest green linen napkin and natural wood. Objects grouped slightly left of center with generous empty space on the right. Shallow depth of field, calm contemporary Vietnamese wedding mood. No readable text, no numbers, no logos, no watermark.
```

#### `frontend/public/images/site/blog/checklist-chuan-bi-dam-cuoi/hai-nha-ban-chuyen-cuoi.jpg`

ảnh trong bài (tỉ lệ 3:2, xuất 1200×800). Bố mẹ hai bên ngồi quanh bàn trà gỗ, bàn bạc chuyện cưới bên cuốn sổ ghi chép, chỉ thấy tay và dáng người.

```text
Editorial photograph in a bright Vietnamese living room: two middle-aged couples, the parents of a bride and groom, seated around a low dark-wood tea table, framed from the side and behind so no face is recognizable. Focus on hands: one pours tea from a small clay teapot, another rests on an open notebook whose writing is blurred and unreadable. The women wear simple áo dài in muted ivory and deep forest green, the men plain light shirts. A plate of fresh fruit on the table. Warm natural window light, palette of ivory, champagne, deep green and wood. Hands and table in sharp focus, people softly out of focus, subject slightly off-center. No text, no numbers, no logos, no watermark.
```

#### `frontend/public/images/site/blog/du-toan-chi-phi-dam-cuoi.jpg`

ảnh bìa (tỉ lệ 16:9, xuất 1672×941). Tay một cặp đôi trên bàn gỗ đang rà cuốn sổ kẻ cột ghi chi phí cưới, bên cạnh xấp phong bì ngà buộc ruy băng và hai chén trà.

```text
Editorial photograph from a low side angle of a young Vietnamese couple's hands at a warm honey-wood table, reviewing wedding plans together. One hand holds a pencil over an open ledger-style notebook with ruled columns, its entries blurred and unreadable. Nearby: a small stack of blank ivory envelopes tied with champagne satin ribbon, a few fabric swatches, a sprig of white flowers and two cups of tea. A very deep forest green linen runner beneath the objects. Soft late-afternoon window light, palette of ivory, champagne gold, deep green and wood. Hands and notebook slightly right of center, generous empty space on the left. No faces, no calculator, no banknotes, no readable text, no numbers, no logos, no watermark.
```

#### `frontend/public/images/site/blog/cach-lap-danh-sach-khach-moi-dam-cuoi.jpg`

ảnh bìa (tỉ lệ 16:9, xuất 1672×941). Bàn tay cô dâu viết lên những tấm thiệp nhỏ màu ngà, bên cạnh xấp phong bì, cuộn ruy băng và cuốn sổ danh sách khách mời đang mở.

```text
Editorial photograph, close three-quarter view of a young Vietnamese woman's hands writing with a fine pen on small ivory place cards at a wooden table, the handwriting soft and illegible. Around her: a neat stack of blank ivory envelopes, a spool of champagne satin ribbon, a sprig of white baby's breath, and an open notebook with a long handwritten list blurred beyond reading. A very deep forest green linen cloth under part of the table. Soft diffused window light from the left, warm palette of ivory paper, champagne gold, deep green and natural wood. Hands slightly left of center, calm empty space on the right. No face, no readable text, no numbers, no logos, no watermark.
```

#### `frontend/public/images/site/blog/cach-lap-danh-sach-khach-moi-dam-cuoi/ban-tiec-cuoi-xep-cho.jpg`

ảnh trong bài (tỉ lệ 3:2, xuất 1200×800). Sảnh tiệc cưới trước giờ đón khách, những bàn tròn phủ khăn ngà xếp sẵn thẻ chỗ ngồi để trống.

```text
Editorial photograph of an empty Vietnamese wedding banquet hall just before guests arrive. Several round tables dressed in ivory linen with champagne-gold chair covers, low centerpieces of white flowers and deep green foliage, neatly folded napkins and glassware. In the foreground, a small blank ivory place card stands on each setting, nothing written on it. Warm natural light mixed with soft ambient glow, palette of ivory, champagne, very deep forest green and warm wood. Shallow depth of field: nearest table sharp, the rest of the hall softly blurred, composition slightly off-center. No people, no stage signage, no readable text, no numbers, no logos, no watermark.
```

#### `frontend/public/images/site/blog/bai-phat-bieu-dam-cuoi.jpg`

ảnh bìa (tỉ lệ 16:9, xuất 1672×941). Người đại diện nhà trai mặc áo dài xanh rừng cầm micro phát biểu trong lễ ăn hỏi tại nhà, phía sau là bàn thờ gỗ, bộ ấm trà, trầu cau và tráp lễ mờ.

```text
Editorial photograph, soft natural window light, inside a Vietnamese family home during a traditional engagement ceremony. Slightly left of center, an older man in a deep forest-green silk ao dai seen from the side and slightly behind holds a wireless microphone near his chest; his face is turned away. In the blurred background: a dark polished wooden altar table with a porcelain tea set, betel leaves and areca nuts, and lacquered gift trays draped in muted burgundy cloth; blurred relatives seated in ivory and champagne ao dai. Warm palette of ivory paper, champagne gold, very deep forest green and aged wood. Generous empty space on the right. No text, no letters, no numbers, no logos, no watermark.
```

#### `frontend/public/images/site/blog/bai-phat-bieu-dam-cuoi/the-ghi-y-chinh.jpg`

ảnh trong bài, mục "Chuẩn bị bài phát biểu đám cưới để nói trôi chảy" (tỉ lệ 3:2, xuất 1200×800). Bàn tay người phát biểu cầm micro cùng một tấm thẻ nhỏ ghi ý chính, phía sau là bàn tiệc cưới mờ trong ánh đèn ấm.

```text
Editorial close-up photograph at a contemporary Vietnamese wedding reception, warm evening light. A speaker's hand, seen from the side, holds a wireless microphone together with a small palm-sized ivory note card; the handwriting on the card is faint, soft and completely illegible. Behind, out of focus, round banquet tables with ivory tablecloths, champagne-gold glassware, small white flower arrangements and warm bokeh lights. The speaker wears a dark forest-green jacket sleeve; no face is visible. Palette of ivory, champagne gold, deep forest green and warm wood tones, no neon colors. Subject slightly off-center with breathing room on one side. No readable text, no letters, no numbers, no logos, no watermark.
```

## Ngay sau deploy

1. Kiểm: `curl -sI https://www.keemori.com/vi` phải ra `308` về
   `https://keemori.com/vi`; mở 2–3 bài blog mới xem ảnh bìa và ảnh trong bài.
2. Google Search Console: gửi lại `https://keemori.com/sitemap.xml`; URL
   Inspection → "Yêu cầu lập chỉ mục" cho `/vi` và 13 bài trên (hạn mức mỗi
   ngày có giới hạn — chia làm hai ngày nếu bị chặn).
3. Rich Results Test cho `https://keemori.com/vi`: phải thấy Organization và
   WebApplication, không lỗi.
4. Đăng lại bài lên fanpage/Instagram/TikTok, 2–3 bài mỗi tuần. Ưu tiên bài
   chia sẻ được ngay: tin nhắn mời cưới, cách ghi thiệp, lịch trình ngày cưới.

## Ngoài site — phần quyết định thứ hạng

### 1. Lọt vào các bài "top web làm thiệp cưới online"

Các bài này đang nằm ngay trong top 100 của từ khoá chính, và là nguồn AI
Overview hay trích. Một dòng nhắc tên kèm link từ đây đáng hơn nhiều bài blog.

| Trang | Hạng (11/10) |
|---|---|
| cellphones.com.vn/sforum/lam-thiep-cuoi-online | 10 |
| vuathiepcuoi.com — "9 website tự thiết kế thiệp cưới online miễn phí" | 23 |
| thegioididong.com — "TOP 9 website thiết kế thiệp cưới online miễn phí" | 29 |
| tiff.vn — "TOP 5 nền tảng thiết kế thiệp cưới online" | 39 |
| mimosawedding.vn — "Top 5+ ứng dụng thiết kế thiệp cưới online" | 40 |
| hoanghamobile.com/tin-tuc/thiep-cuoi-online | 84 |

Thư mẫu gửi ban biên tập (sửa tên người nhận, gửi từ email tên miền
`@keemori.com`):

> Chào anh/chị biên tập,
>
> Mình là [tên] từ Keemori (keemori.com), nền tảng tạo thiệp cưới online tại
> Việt Nam. Mình đọc bài "[tên bài]" và thấy bài đang giúp nhiều cặp đôi chọn
> công cụ. Khi bài được cập nhật, anh/chị cân nhắc thêm Keemori giúp mình nhé:
>
> - Gói miễn phí có link vĩnh viễn, không giới hạn người xem
> - Hơn 60 mẫu, có mẫu không cần ảnh cưới
> - Link mời riêng ghi tên từng khách, xác nhận tham dự
> - Thiệp riêng nhà trai – nhà gái trên cùng một thiệp
>
> Mình có thể gửi tài khoản dùng thử gói trả phí và ảnh chụp màn hình để
> anh/chị kiểm tra. Cảm ơn anh/chị!

### 2. Đối tác B2B

Mỗi cửa hàng đối tác đã duyệt nên đặt một link về `https://keemori.com` trên
website hoặc fanpage của họ (ví dụ "Thiệp cưới online do Keemori cung cấp").
Link từ studio, wedding planner, nhà hàng tiệc cưới là đúng chủ đề — loại link
Google tính nhiều nhất.

### 3. Video hướng dẫn

Video "Hướng dẫn tạo thiệp cưới online" của YouTube đang đứng hạng 26 cho từ
khoá chính. Một video 3–5 phút quay màn hình tạo thiệp trên Keemori, mô tả có
link về trang chủ, vừa có thể lên kết quả video vừa là một backlink.

### 4. Cộng đồng

Nhóm Facebook cưới hỏi: chia sẻ nội dung có ích (mẫu tin nhắn mời cưới, cách
ghi ngày âm trên thiệp) kèm link bài, không rải link trần. Rải link hàng loạt
dễ bị nhóm chặn và không giúp gì cho thứ hạng.

## Theo dõi

- Search Console → Hiệu suất, lọc các từ khoá trong bảng trên và "thiệp cưới
  online". Kiểm lại thứ hạng 2 tuần/lần, so với mốc 11/10.
- Kỳ vọng thực tế: bài blog nhắm từ khoá dài có thể lên trước trong vài tuần
  tới vài tháng; cụm chính "thiệp cưới online" cần phần ngoài site và thời
  gian — ZenLove mất khoảng 14 tháng để vào top 3.
