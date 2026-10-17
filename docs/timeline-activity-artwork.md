# Ảnh sự kiện lịch trình · 2026-09-14

## Kết quả rà soát

Bảy mẫu ảnh chưa phủ hết mười loại hoạt động trong editor:

| Mẫu | Trước khi sửa |
|---|---|
| Trầu Cau | Chỉ có máy ảnh, nhẫn, tiệc và nhạc; các loại mới có ô trống |
| Tình Khôi | Ba ô sprite; loại thiếu thay bằng số thứ tự |
| Thẫm Lục | Loại thiếu lặp lại chiếc giày trung tính |
| Ái Tình | Chỉ tiệc/nâng ly và bánh có tranh; các loại khác lặp bó hoa |
| Tình Ca | Thiếu đón dâu, nâng ly, chụp ảnh, tiễn khách; thay bằng nhành hoa |
| Tin Vui | Thiếu đón dâu, tiễn khách; thay bằng thiệp mời |
| Trăm Năm | Thiếu nhiều loại; dùng lại cổng đình, chén trà hoặc ly rượu |

Lục Ly dùng SVG riêng: bổ sung xe hoa, máy ảnh, người chào khách và khay trà.
Những mẫu dùng trọn bộ Lucide đã có đủ mười loại. Mẫu chỉ dùng chấm, đường kẻ,
số thứ tự hoặc một hoạ tiết cố định không thuộc nhóm thiếu ảnh theo loại.

Mỗi mẫu ảnh hiện có 11 file riêng tại
`frontend/public/images/templates/<slug>/decor/event-<kind>.avif`:
mười loại hoạt động và `neutral` (đồng hồ cho chữ tự do chưa nhận diện).
Ảnh 320×320, AVIF q70, alpha; giữ layout và palette của từng mẫu.
Helper `timeline-activity-images.ts` khai đủ `Record<TimelineActivityKind, string>`.

## Kiểm tra

- `node scripts/check-timeline-activities.mjs`: **pass**, kiểm các loại hoạt động, lựa chọn
  tường minh thắng chữ, tự động tiếng Việt/Anh, đảo thứ tự/lặp hoạt động, ảnh đầy
  đủ đúng kích thước và alpha.
- `node scripts/check-templates.mjs`: tài nguyên mới khớp spec; kiểm toàn repo
  vẫn báo 9 lỗi có sẵn: lệch tier ở dao-hoa, hai-lam, hanh-trinh, hong-vien,
  hy-sac, su-lam, thuy-mac; lệch photoSlots ở hong-tien; `.DS_Store` trong
  thư mục templates. Không thay đổi phân gói/số ảnh trong đợt sửa icon.
- TypeScript, ESLint và production build: **pass**. Build còn cảnh báo AVIF
  import tĩnh của lan-trang/nang-hen và thiếu `NEXT_PUBLIC_SITE_URL` ở môi
  trường local; không liên quan đến bộ ảnh lịch trình mới.
- Kiểm tra trình duyệt tại khung 375px và 640px: tám mẫu không tràn ngang;
  bảy bộ ảnh tải đủ 11 file, Lục Ly hiển thị SVG. Đã xem trực tiếp từng phong
  cách ảnh và các mốc đón khách/gia tiên/đón dâu/tiệc. Trang QA tạm đã xóa.

## Nguồn và xử lý ảnh

Dùng built-in ImageGen, không dùng CLI/API. Reference là ảnh decor có sẵn của
chính từng mẫu. Các bản sinh nền caro giả bị loại khỏi tài nguyên xuất bản;
sinh lại nền chroma magenta phẳng rồi chuẩn hóa alpha bằng Sharp, khử viền màu,
cắt từng ô, căn vật thể vào canvas 320×320 và mã hóa AVIF. Các bộ một màu được
chuẩn hóa mực đen/đỏ để không còn nhiễu nền. Sheet nguồn không đặt trong public.

Prompt chỉnh nền áp cho sáu mẫu ngoài Trầu Cau:

```text
Keep all eleven illustrations in the same 4-column by 3-row grid. Replace only
the gray/white checkerboard with perfectly flat chroma magenta #FF00FF, including
empty holes and the blank final cell. Preserve artwork, colors, shape and size.
No text, new drawings, texture, or gray checkerboard. This matte will be keyed out
in production asset processing.
```

## Prompt sinh ảnh

### trau-cau

```text
Use case: stylized-concept. Production asset: a SINGLE wedding-event icon sprite atlas for the Trầu Cau wedding invitation. Reference image is STYLE ONLY: warm ivory hand-drawn screen-printed outlines, light organic irregularities and small expressive rays, no filled backgrounds. Generate a transparent PNG, landscape 4:3, laid out as EXACTLY 4 columns by 3 equal rows with square cells, no visible grid. Each icon centered inside its own cell, same visual weight, occupying 65% of cell with generous clear gutters. Fixed row-major order:
row 1: two welcoming people with a small heart (welcome); a Vietnamese ancestral tea tray with teapot and two cups (ancestral ceremony); a wedding car with ribbon (bride procession); two interlocking wedding rings (marriage ceremony).
row 2: dinner cloche with fork and spoon (reception); two clinking champagne flutes (toast); tiered wedding cake (cake cutting); camera (photography).
row 3: two musical notes with celebratory rays (music); waving hand beside a small departing heart (farewell); a small round analog clock with hands and NO numbers (neutral activity); EMPTY transparent cell.
Color: ONLY warm ivory #E1DED9 lines. True transparent alpha background, no colored plate, no checkerboard texture. No labels, text, digits, watermark, people portraits, border, connecting lines. Sharp legible silhouettes at 64px. Keep all twelve cells precisely separated; no drawing crosses cell edges.
```

### tinh-khoi

```text
Use case: stylized-concept. Production asset: a SINGLE wedding-event icon sprite atlas for the Tình Khôi wedding invitation. Reference image is STYLE ONLY: minimal, refined thin black ink monoline stationery icons, almost geometric, elegant and simple, NO rays or extra ornaments. Generate a transparent PNG, landscape 4:3, laid out as EXACTLY 4 columns by 3 equal rows with square cells, no visible grid. Each icon centered inside its own cell, same visual weight, occupying 65% of cell with generous clear gutters. Fixed row-major order:
row 1: two welcoming people with a small heart (welcome); a Vietnamese ancestral tea tray with teapot and two cups (ancestral ceremony); a wedding car with ribbon (bride procession); two interlocking wedding rings (marriage ceremony).
row 2: dinner cloche with fork and spoon (reception); two clinking champagne flutes (toast); tiered wedding cake (cake cutting); camera (photography).
row 3: two musical notes (music); waving hand beside a small departing heart (farewell); a small round analog clock with hands and NO numbers (neutral activity); EMPTY transparent cell.
Color: ONLY near-black #20221F. True transparent alpha background, no colored plate, no checkerboard texture. No labels, text, digits, watermark, people portraits, border, connecting lines. Sharp legible silhouettes at 64px. Keep all twelve cells precisely separated; no drawing crosses cell edges.
```

### tham-luc

```text
Use case: stylized-concept. Production asset: a SINGLE wedding-event icon sprite atlas for the Thẫm Lục wedding invitation. Reference image is STYLE ONLY: photorealistic isolated miniature vintage wedding keepsakes: aged golden brass, cream porcelain, muted olive accents, silver disco ball for music; tactile antique objects with delicate self shadows, no cast background shadows. Welcome represented by an ornate open miniature doorway with invitation envelope, farewell by waving-hand golden charm, neutral by antique pocket watch. NO cartoon outlines. Generate a transparent PNG, landscape 4:3, laid out as EXACTLY 4 columns by 3 equal rows with square cells, no visible grid. Each icon centered inside its own cell, same visual weight, occupying 65% of cell with generous clear gutters. Fixed row-major order:
row 1: two welcoming people with a small heart (welcome); a Vietnamese ancestral tea tray with teapot and two cups (ancestral ceremony); a wedding car with ribbon (bride procession); two interlocking wedding rings (marriage ceremony).
row 2: dinner cloche with fork and spoon (reception); two clinking champagne flutes (toast); tiered wedding cake (cake cutting); camera (photography).
row 3: silver vintage disco ball (music); waving hand beside a small departing heart (farewell); a small round analog clock with hands and NO numbers (neutral activity); EMPTY transparent cell.
Color: antique gold, warm ivory, muted olive, tarnished silver. True transparent alpha background, no colored plate, no checkerboard texture. No labels, text, digits, watermark, people portraits, border, connecting lines. Sharp legible silhouettes at 64px. Keep all twelve cells precisely separated; no drawing crosses cell edges.
```

### tram-nam

```text
Use case: stylized-concept. Production asset: a SINGLE wedding-event icon sprite atlas for the Trăm Năm wedding invitation. Reference image is STYLE ONLY: small elegant realistic watercolor sepia vintage Vietnamese wedding object illustrations, warm ink engraving details and antique cream porcelain as in reference, soft natural self shading, ancestral tea set and decorated bride procession car, welcome by a small Vietnamese ceremonial open gate, farewell by a waving-hand sepia ornament, neutral by antique round clock. Generate a transparent PNG, landscape 4:3, laid out as EXACTLY 4 columns by 3 equal rows with square cells, no visible grid. Each icon centered inside its own cell, same visual weight, occupying 65% of cell with generous clear gutters. Fixed row-major order:
row 1: two welcoming people with a small heart (welcome); a Vietnamese ancestral tea tray with teapot and two cups (ancestral ceremony); a wedding car with ribbon (bride procession); two interlocking wedding rings (marriage ceremony).
row 2: dinner cloche with fork and spoon (reception); two clinking champagne flutes (toast); tiered wedding cake (cake cutting); camera (photography).
row 3: two musical notes (music); waving hand beside a small departing heart (farewell); a small round analog clock with hands and NO numbers (neutral activity); EMPTY transparent cell.
Color: warm sepia brown #4B4233, muted antique brass, warm ivory #F2EADB, restrained oxblood accent. True transparent alpha background, no colored plate, no checkerboard texture. No labels, text, digits, watermark, people portraits, border, connecting lines. Sharp legible silhouettes at 64px. Keep all twelve cells precisely separated; no drawing crosses cell edges.
```

### tin-vui

```text
Use case: stylized-concept. Production asset: a SINGLE wedding-event icon sprite atlas for the Tin Vui wedding invitation. Reference image is STYLE ONLY: monochrome black vintage newspaper woodcut engraving, thin etched outlines and delicate hatching matching reference, sharp legibility, no filled background or decoration outside each object. Generate a transparent PNG, landscape 4:3, laid out as EXACTLY 4 columns by 3 equal rows with square cells, no visible grid. Each icon centered inside its own cell, same visual weight, occupying 65% of cell with generous clear gutters. Fixed row-major order:
row 1: two welcoming people with a small heart (welcome); a Vietnamese ancestral tea tray with teapot and two cups (ancestral ceremony); a wedding car with ribbon (bride procession); two interlocking wedding rings (marriage ceremony).
row 2: dinner cloche with fork and spoon (reception); two clinking champagne flutes (toast); tiered wedding cake (cake cutting); camera (photography).
row 3: two musical notes (music); waving hand beside a small departing heart (farewell); a small round analog clock with hands and NO numbers (neutral activity); EMPTY transparent cell.
Color: ONLY black #181B19. True transparent alpha background, no colored plate, no checkerboard texture. No labels, text, digits, watermark, people portraits, border, connecting lines. Sharp legible silhouettes at 64px. Keep all twelve cells precisely separated; no drawing crosses cell edges.
```

### tinh-ca

```text
Use case: stylized-concept. Production asset: a SINGLE wedding-event icon sprite atlas for the Tình Ca wedding invitation. Reference image is STYLE ONLY: elegant organic hand drawn fine burgundy red pen illustrations on transparency, subtly irregular confident line art matching reference house, no shading, no gradients, no filled backgrounds. Generate a transparent PNG, landscape 4:3, laid out as EXACTLY 4 columns by 3 equal rows with square cells, no visible grid. Each icon centered inside its own cell, same visual weight, occupying 65% of cell with generous clear gutters. Fixed row-major order:
row 1: two welcoming people with a small heart (welcome); a Vietnamese ancestral tea tray with teapot and two cups (ancestral ceremony); a wedding car with ribbon (bride procession); two interlocking wedding rings (marriage ceremony).
row 2: dinner cloche with fork and spoon (reception); two clinking champagne flutes (toast); tiered wedding cake (cake cutting); camera (photography).
row 3: two musical notes (music); waving hand beside a small departing heart (farewell); a small round analog clock with hands and NO numbers (neutral activity); EMPTY transparent cell.
Color: ONLY burgundy wine red #842832. True transparent alpha background, no colored plate, no checkerboard texture. No labels, text, digits, watermark, people portraits, border, connecting lines. Sharp legible silhouettes at 64px. Keep all twelve cells precisely separated; no drawing crosses cell edges.
```

### ai-tinh

```text
Use case: stylized-concept. Production asset: a SINGLE wedding-event icon sprite atlas for the Ái Tình wedding invitation. Reference image is STYLE ONLY: romantic fine ivory and pale blush engraved line-art matching reference: light antique floral accents at base of each object, subtle champagne-gold hairline details, delicate yet legible against dark burgundy, predominantly ivory contours. No giant bouquets obscuring each event object. Generate a transparent PNG, landscape 4:3, laid out as EXACTLY 4 columns by 3 equal rows with square cells, no visible grid. Each icon centered inside its own cell, same visual weight, occupying 65% of cell with generous clear gutters. Fixed row-major order:
row 1: two welcoming people with a small heart (welcome); a Vietnamese ancestral tea tray with teapot and two cups (ancestral ceremony); a wedding car with ribbon (bride procession); two interlocking wedding rings (marriage ceremony).
row 2: dinner cloche with fork and spoon (reception); two clinking champagne flutes (toast); tiered wedding cake (cake cutting); camera (photography).
row 3: two musical notes (music); waving hand beside a small departing heart (farewell); a small round analog clock with hands and NO numbers (neutral activity); EMPTY transparent cell.
Color: ivory #FFF1DF, pale blush and subtle champagne gold. True transparent alpha background, no colored plate, no checkerboard texture. No labels, text, digits, watermark, people portraits, border, connecting lines. Sharp legible silhouettes at 64px. Keep all twelve cells precisely separated; no drawing crosses cell edges.
```
