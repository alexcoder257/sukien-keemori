# Font cho tiếng Việt — danh sách đã kiểm chứng & hướng dẫn dùng

Tài liệu chọn font cho template thiệp. Mọi font trong đây đều **tự host được**
(tải file `.woff2` về `frontend/assets/fonts/`), không gọi ra CDN ngoài.

> **Cách dữ liệu này được xác minh** (tháng 8/2026)
>
> 1. Subset `vietnamese` — đọc từ `next/dist/compiled/@next/font/dist/google/font-data.json`.
>    Toàn thư viện Google Fonts có **1911 font, chỉ 505 font có subset `vietnamese`**.
> 2. Coverage ký tự — tải `.woff2` thật, đọc bảng `cmap` bằng `fontTools`, đối
>    chiếu với 134 ký tự riêng của tiếng Việt.
> 3. Chất lượng đặt dấu — render `Nguyễn Hoàng Minh`, `NGUYỄN · TRẦN · ĐẶNG · VŨ`,
>    `ế ộ ữ ằ ẩ ợ ự ỹ` ở cả chữ thường và chữ HOA rồi soi bằng mắt.
>
> Bước 3 mới là bước phân loại. **Coverage không đủ để kết luận**: cả 28 font đã
> thử đều có đủ glyph, nhưng chất lượng đặt dấu chênh nhau rất xa.

---

## 1. Ba tiêu chí, theo đúng thứ tự

**① Có subset `vietnamese`.** Thiếu thì trình duyệt âm thầm fallback sang font
khác giữa chừng một chữ: `Nguyễn` ra `Nguy` + `ễ`(font khác) + `n`. Nguy hiểm
hơn ô vuông tofu vì trông "gần đúng" nên dễ lọt qua review.

**② Đủ 134 ký tự riêng.** Gồm `Đ đ Ơ ơ Ư ư Ă ă`, dải Latin Extended Additional
`U+1EA0–1EF9`, và `₫` (U+20AB) nếu có hiển thị giá tiền.

**③ Đặt dấu đúng khi VIẾT HOA.** Đây là chỗ font Latin phương Tây gãy. Tiếng
Việt chồng **hai tầng dấu**: `Ễ` = E + dấu mũ + dấu ngã. Font script có chữ hoa
cao vút sẽ đẩy tầng dấu vượt khỏi ô chữ → đè lên dòng trên hoặc dính vào nhau.
Chữ thường trông vẫn ổn nên lỗi này chỉ lộ khi khách nhập tên viết hoa.

---

## 2. Danh sách đã kiểm chứng

Cột **Dấu** là kết quả soi mắt, thang: ★★★ dùng thoải mái · ★★ dùng được, cần
nới `line-height` · ★ chỉ dùng chữ thường · ✗ không dùng.

### 2.1 Script — tên cặp đôi, tiêu đề trang trí

Nhóm quan trọng nhất (tên cặp đôi luôn là chữ to nhất trên thiệp) và cũng khan
hiếm nhất: **chỉ 26/505 font tiếng Việt là script/viết tay**.

| Font | Dấu | Tính cách | KB¹ | Ghi chú |
|---|:--:|---|--:|---|
| **Momo Signature** | ★★★ | Chữ ký đậm, hiện đại | 58 | Dấu rõ nhất cả nhóm, chữ HOA có dấu vẫn sạch |
| **Charm** | ★★★ | Script thanh lịch, nhẹ | 25 | Cadson Demak — vẽ cho Thái + Việt nên dấu chuẩn |
| **Charmonman** | ★★★ | Script mảnh, cổ điển | 25 | Cùng nhà với Charm, có 400/700 |
| **Great Vibes** | ★★★ | Copperplate đám cưới kinh điển | 36 | Dấu cân đối kể cả chữ HOA |
| **Story Script** | ★★★ | Viết tay hiện đại, đều nét | 23 | Nhẹ, dễ đọc |
| **Dancing Script** | ★★★ | Vui, thân mật | 28 | Có trục biến thiên `wght` |
| **Lobster** | ★★☆ | Đậm, retro | 22 | Thiếu `₫` |
| **Pacifico** | ★★☆ | Đậm tròn, thư giãn | 29 | Hơi "quán cafe", cân nhắc với thiệp sang |
| **Bad Script** | ★★☆ | Bút mảnh, mộc | 30 | Nhẹ nhàng, hợp mẫu tối giản |
| **Allura** | ★★☆ | Copperplate rất mảnh | 33 | Nới `line-height`, đừng để cỡ nhỏ |
| **Alex Brush** | ★★☆ | Cọ mảnh | 28 | Chữ HOA nét mảnh, dấu nhỏ — chỉ dùng cỡ lớn |
| Vujahday Script | ★★ | Viết tay nghiêng | 39 | Ổn, không nổi bật |
| Style Script | ★★ | Retro đậm | 37 | Thiếu `₫` |
| Meow Script | ★ | Copperplate | 28 | Chữ HOA có dấu bắt đầu rối |
| Pinyon Script | ★ | Copperplate cổ | 35 | Dấu ngã trên chữ HOA đè vào thân chữ |
| Imperial Script | ★ | Copperplate swash | 30 | Dấu chen chúc khi viết hoa |
| Luxurious Script | ★ | Rất mảnh, sang | 32 | Nét mảnh + dấu = dính nhau |
| Comforter Brush | ★ | Cọ ướt | 146 | Nặng nhất, dấu nhỏ |
| Water Brush | ★ | Cọ nước | 77 | Chữ HOA có dấu rối |
| Kolker Brush | ★ | Cọ cực mảnh | 48 | Dấu gần như biến mất |
| **Mea Culpa** | **✗** | Copperplate swash dày | 35 | **Chữ HOA có dấu đè chồng lên nhau, không đọc được** |

¹ Tổng dung lượng `.woff2` của subset `latin` + `vietnamese`, đo thật.

### 2.2 Serif display — tiêu đề mục, monogram, số ngày

Nhóm này an toàn, **tất cả đều ★★★**. Chọn theo tính cách, không theo rủi ro.

| Font | Tính cách | KB | Biến thiên | Nghiêng thật |
|---|---|--:|---|---|
| **Playfair Display** | Didone tương phản cao — *đang dùng trong dự án* | 27 | `wght` | ✓ |
| **Prata** | Didone, chỉ 400, rất "tạp chí" | 16 | — | — |
| **Cormorant** | Garamond mảnh, sang, nhiều biến thể (`SC`, `Unicase`, `Infant`) | 28 | `wght` | ✓ |
| **EB Garamond** | Garamond cổ điển, thân thiện | 29 | `wght` | ✓ |
| **Yeseva One** | Display đậm, có "chân" trang trí | 15 | — | — |
| **Noto Serif Display** | Trung tính, phủ rộng | — | `wght,wdth` | ✓ |
| **Fraunces** | Có trục `SOFT`/`WONK` chỉnh độ "mềm/quái" | — | 4 trục | ✓ |

Serif cho đoạn văn dài (lời ngỏ, chuyện tình): **Lora · Spectral · Crimson Text ·
Newsreader · Literata · Source Serif 4 · Alegreya · Vollkorn · Faustina · Petrona ·
Andada Pro · Bitter · Arsenal · Judson · Trirong** — đều có tiếng Việt.

### 2.3 Blackletter — concept "báo cưới"

Nếu làm mẫu theo phong cách báo giấy: **`Grenze Gotisch`** — ★★★, đọc được, dấu
đúng, 21KB, có trục `wght`. Đây gần như là lựa chọn duy nhất.

`UnifrakturMaguntia`, `UnifrakturCook`, `Pirata One`, `Metal Mania`, `Almendra`
đều **không có tiếng Việt**.

### 2.4 Sans — giao diện app và body thiệp

| Font | Ghi chú |
|---|---|
| **Be Vietnam Pro** | ★★★ — người Việt thiết kế, dấu chuẩn nhất. Ưu tiên nếu cần đúng "chất Việt" |
| **Inter** | ★★★ — *đang dùng làm font giao diện*. **Không có bộ nghiêng thật**, đừng dùng class `italic` |
| Montserrat · Raleway · Josefin Sans | Hình học, hợp uppercase giãn chữ kiểu thiệp cưới |
| Manrope · Plus Jakarta Sans · Lexend · Public Sans · Nunito Sans · Archivo · Space Grotesk · Oswald | Đều có tiếng Việt |

---

## 3. Danh sách CẤM — không có tiếng Việt

Đây đúng là những font mà mọi template cưới nước ngoài dùng. Chọn font theo ảnh
tham khảo (`docs/inspiration/`) là dính ngay nhóm này.

**Serif/display:** `Italiana` · `Cinzel` · `Marcellus` · `Marcellus SC` ·
`Tenor Sans` · `Julius Sans One` · `Gilda Display` · `Bodoni Moda` ·
`Antic Didone` · `Forum` · `Bellefair` · `Sorts Mill Goudy` · `Cardo` ·
`Della Respira` · `Rosarivo` · `Libre Baskerville` · `Quattrocento` · `Unna` ·
`Domine` · `Instrument Serif` · `DM Serif Display` · `Amiri`

**Script:** `Parisienne` · `Sacramento` · `Tangerine` · `Petit Formal Script` ·
`Rouge Script` · `Mrs Saint Delafield`

**Sans:** `Jost` · `Karla` · `Outfit` · `Figtree` · `Sora`

---

## 4. Tải font về local

Google Fonts phát hành toàn bộ dưới **OFL 1.1 / Apache 2.0 / UFL** — được phép
tự host, nhúng vào sản phẩm thương mại, không cần ghi công trên giao diện. Kiểm
tra giấy phép từng font ở tab *About* trên fonts.google.com hoặc file
`LICENSE.txt` trong `github.com/google/fonts`.

### Script tải subset

Chỉ tải đúng hai subset cần dùng (`latin` + `vietnamese`). **Không tải file
"Download family" trên fonts.google.com** — đó là `.ttf` đủ mọi bảng chữ, nặng
gấp 10–30 lần.

```bash
# Chạy từ thư mục frontend/
FONT="Great Vibes"                       # đổi tên font ở đây
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
Q=$(echo "$FONT" | tr ' ' '+'); SLUG=$(echo "$FONT" | tr 'A-Z ' 'a-z-')

curl -sS -A "$UA" "https://fonts.googleapis.com/css2?family=$Q&display=swap" -o /tmp/$SLUG.css
for SUB in latin vietnamese; do
  URL=$(awk -v s="/* $SUB */" 'index($0,s){f=1} f && /url\(/{match($0,/https:[^)]+/); print substr($0,RSTART,RLENGTH); exit}' /tmp/$SLUG.css)
  curl -sS "$URL" -o "assets/fonts/$SLUG-$SUB.woff2"
done
ls -la assets/fonts/$SLUG-*.woff2
```

Chuỗi `User-Agent` là bắt buộc: không có nó Google trả CSS `.ttf` đời cũ thay vì
`.woff2`.

Muốn font biến thiên (variable), thêm trục vào query, ví dụ
`family=Playfair+Display:wght@400..900`.

### Khai báo trong dự án

Thêm vào `frontend/assets/fonts/index.ts`, cùng khuôn với `inter` đang có:

```ts
export const greatVibes = localFont({
  src: [
    { path: "./great-vibes-latin.woff2" },
    { path: "./great-vibes-vietnamese.woff2" },
  ],
  variable: "--font-great-vibes",
  weight: "400",
  style: "normal",
  display: "swap",
});
```

`next/font/local` gộp nhiều `src` thành một họ chữ — trình duyệt chỉ tải file
chứa ký tự đang cần.

> **Bẫy `@theme inline`** — xem `CLAUDE.md` mục Design system. Token khai trong
> khối `@theme inline` ở `globals.css` được Tailwind nội suy thẳng lúc build, ghi
> đè ở scope con **không có tác dụng**. Trong CSS Module của template phải khai
> `font-family` trực tiếp, không đặt lại biến.

---

## 5. Quy tắc dùng trong template

**Nới `line-height`.** `NGUYỄN` viết hoa đội hai tầng dấu, cao hơn chữ Latin
thường rõ rệt. Không dùng `leading-none`/`leading-tight` cho chữ script hoặc
display cỡ lớn — tối thiểu `1.3`, script nên `1.4`–`1.5`.

**Không cắt phần trên của khối chữ.** `overflow: hidden` + chiều cao cố định sẽ
cắt cụt dấu ngã, dấu mũ. Kiểm tra bằng chuỗi `Ễ Ữ Ằ` chứ đừng kiểm tra bằng
`Wedding`.

**`text-transform: uppercase` là một quyết định thiết kế, không phải trang trí.**
Nó biến `ễ` thành `Ễ` — tức chuyển font sang vùng dấu rủi ro nhất. Font ★★ trở
xuống thì đừng viết hoa.

**Đừng dùng `italic` với font không có bộ nghiêng thật.** Inter không có; trình
duyệt sẽ nghiêng giả bằng phép biến hình, dấu nghiêng theo và trông sai. Playfair
Display, Cormorant, EB Garamond có bộ nghiêng thật.

**Font trong template thuộc về template.** Theo `CLAUDE.md`, mỗi mẫu thiệp được
có art direction riêng, nhưng font phải khai trong CSS Module của chính mẫu đó,
không thêm vào `globals.css`, không rò ra ngoài selector gốc.

---

## 6. Checklist trước khi chốt một font

- [ ] Có trong danh sách mục 2 (hoặc đã tự chạy lại 3 bước xác minh ở đầu file)
- [ ] Đã render thử: `Nguyễn Hoàng Minh`, `NGUYỄN · TRẦN · ĐẶNG · VŨ`,
      `ế ộ ữ ằ ẩ ợ ự ỹ ẵ ọ ỗ ừ ể ẫ đ Đ ơ Ư`
- [ ] Thử ở cỡ nhỏ nhất mà template dùng — dấu mảnh biến mất trước tiên
- [ ] Thử tên dài nhất có thể (`Nguyễn Thị Hoàng Phương Anh`) xem có tràn khung
- [ ] File `.woff2` đã nằm trong `assets/fonts/`, không còn gọi `fonts.gstatic.com`
- [ ] Đã khai qua `next/font/local`, không dùng `@import` trong CSS
- [ ] `line-height` đủ rộng cho hai tầng dấu

---

## 7. Font pairing theo vibe của mẫu

### Thanh lịch & lãng mạn

| Preview | Biến thể | Combo font |
|---|---|---|
| <img src="inspiration/inspire-1-phong-thu-extracted.jpg" width="70" alt="Hoa lá cổ điển 1"> <img src="inspiration/inspire-2-khuynh-diep-done.jpg" width="70" alt="Hoa lá cổ điển 2"> <img src="inspiration/inspire-3-khuynh-diep-vuon-hen-done.jpg" width="70" alt="Hoa lá cổ điển 3"> <img src="inspiration/inspire-12-moc-lan-done.jpg" width="70" alt="Hoa lá cổ điển 12"> | Hoa lá cổ điển | **Great Vibes** · **Cormorant SC** · **Cormorant** |
| <img src="inspiration/inspire-7-thuy-mac-done.jpg" width="100" alt="Vườn hoa màu nước 7"> <img src="inspiration/inspire-14-bach-mai-done.jpg" width="100" alt="Vườn hoa màu nước 14"> | Vườn hoa màu nước | **Charmonman** · **EB Garamond** · **Lora** |
| <img src="inspiration/inspire-11-su-lam-done.jpg" width="100" alt="Lâu đài Pháp 11"> | Lâu đài Pháp | **Playfair Display** · **Cormorant** · **Lora** |

### Biên tập & ý tưởng

| Preview | Biến thể | Combo font |
|---|---|---|
| <img src="inspiration/inspire-4-hanh-trinh-done.jpg" width="150" alt="Thiệp vé du lịch"> | Thiệp vé du lịch | **Momo Signature** · **Playfair Display** · **Be Vietnam Pro** |
| <img src="inspiration/inspire-5-tin-vui-done.jpg" width="150" alt="Báo cưới"> | Báo cưới | **Grenze Gotisch** · **Newsreader** · **Spectral** |

### Vui tươi & minh họa

| Preview | Biến thể | Combo font |
|---|---|---|
| <img src="inspiration/inspire-6-ti-hon-done.jpg" width="100" alt="Chibi vẽ tay 6"> | Chibi vẽ tay | **Story Script** · **Be Vietnam Pro** |

### Sang trọng & ấn tượng

| Preview | Biến thể | Combo font |
|---|---|---|
| <img src="inspiration/inspire-9-ngoc-bich-done.jpg" width="100" alt="Sắc đá quý 9"> <img src="inspiration/inspire-13-man-chin-extracted.jpg" width="100" alt="Sắc đá quý 13"> | Sắc đá quý | **Great Vibes** · **Prata** · **Cormorant** |
