# Rà soát SEO kho mẫu — 10/09/2026

Đã kiểm tra source hiện tại, HTML công khai trên `https://keemori.com` và
frontend local tại `http://localhost:3000`. Kho có 63 mẫu. Kiểm toàn bộ tên,
slug, đường dẫn ảnh trong catalog local và HTML trang danh sách; kiểm route
demo/xem thử bằng mẫu đại diện Hoa Hồng. Chưa kiểm từng trang demo của 63 mẫu,
Search Console, trạng thái index thực tế hay Core Web Vitals thực địa.

## Kết quả chính

| Mức độ | Phát hiện | Bằng chứng / hướng xử lý |
|---|---|---|
| Cao | Từng mẫu chưa có trang chi tiết cho phép index | Không có `app/[locale]/mau-thiep/[templateSlug]/page.tsx`. Card mở bằng button; HTML kho không có link `<a>` tới từng mẫu. Demo và xem thử có `noindex`. Cần trang đích mô tả mẫu, rồi nối link và sitemap. |
| Vừa, đã sửa local | Sitemap chỉ liệt kê URL Việt | Production có 24 URL, đều `/vi`. Bản sửa có 48 URL Việt–Anh với hreflang đầy đủ. |
| Vừa, đã sửa local | `lastmod` không phản ánh thời điểm sửa nội dung | Trang tĩnh lấy thời điểm sinh sitemap; blog lấy ngày xuất bản. Bỏ trường này vì API chưa cung cấp ngày sửa bài. |
| Cải thiện | Kho chưa có dữ liệu có cấu trúc | HTML `/vi/mau-thiep` và code trang không có JSON-LD. Có thể bổ sung breadcrumb/CollectionPage; Product và đánh giá thật phù hợp hơn trên trang chi tiết sau khi xây dựng. Thiếu schema không ngăn index. |
| Cải thiện | Chia sẻ demo dùng metadata chung của website | `/vi/mau-thiep/rose/demo` có title trang theo mẫu nhưng OG title, description và ảnh vẫn kế thừa layout. Nên có ảnh và mô tả riêng cho mẫu khi xây trang chi tiết. |
| Triển khai | Slug mới chưa có trên production | Production `/rose/demo` trả 200, `/hoa-hong/demo` trả 404. Local `/rose/demo` chuyển 308 tới `/hoa-hong/demo`, đích trả 200; ảnh poster cũ cũng chuyển 308. Cần triển khai đồng bộ migration đổi slug và frontend đã có trong workspace. |

Trang kho vẫn có thể xuất hiện cho truy vấn tên mẫu hoặc phong cách. Điều
thiếu là trang đích riêng, có mô tả và tín hiệu liên kết cho từng mẫu; không
thể kết luận cả site không xếp hạng chỉ từ việc thiếu route chi tiết.

## Các điểm đã đạt trong lần kiểm tra

- `/vi/mau-thiep` và `/en/mau-thiep`: title, description, canonical tự trỏ,
  hreflang `vi`/`en`/`x-default`, Open Graph và Twitter Card đầy đủ; không có
  `noindex`.
- Trang kho tiếng Việt có đúng một H1, 63 article mẫu và 64 ảnh trong HTML
  server trả về; không ảnh nào thiếu thuộc tính alt. Nội dung tên mẫu không
  phụ thuộc thao tác mở popup.
- `?tier=diamond` hiển thị 21 mẫu trên production nhưng canonical vẫn trỏ
  `/vi/mau-thiep`, không mang tham số lọc.
- 63 tên và slug trong catalog local không trùng; mọi `imageSrc` đều có file
  tương ứng trong `frontend/public`.
- Ảnh OG của kho trả 200, `Content-Type: image/jpeg`.
- `robots.txt` không chặn kho mẫu hoặc demo/xem thử. `/rose/demo` và
  `/rose/xem-thu` trên production trả 200, có `noindex, nofollow`.
- Thiệp của khách, demo và xem thử không nằm trong sitemap.

## Thay đổi trong lần rà soát

- `frontend/app/sitemap.ts`: sinh mục URL cho từng locale, giữ cùng bộ
  hreflang; bỏ `lastModified` chưa có nguồn chính xác.
- `SEO-built.md`: sửa hướng dẫn sitemap cũ, bỏ khẳng định chắc chắn về thứ
  hạng và sao đánh giá; dẫn tới báo cáo này.
- Không dựng trang chi tiết trong lần kiểm tra này. Đây là phần phát triển
  sản phẩm cần nội dung riêng của từng mẫu, không chỉ thêm metadata vào demo.
- Chưa deploy hoặc thay đổi dữ liệu production.

## Kiểm chứng thay đổi

- Đọc XML thực từ local: 48 URL duy nhất; mọi alternate `vi`, `en`,
  `x-default` trỏ tới URL tồn tại trong sitemap; có `/en/mau-thiep`; không
  còn `lastmod`, demo/xem thử hoặc thiệp khách.
- `npx tsc --noEmit`: đạt.
- `npm run lint`: đạt.
- `npm run build`: đạt; có 4 cảnh báo Turbopack về import AVIF từ các thay đổi
  khác đang có trong workspace. Build local cảnh báo thiếu
  `NEXT_PUBLIC_SITE_URL`; HTML production đã xác minh canonical trỏ đúng
  `https://keemori.com`, không phải localhost.
- `node scripts/check-templates.mjs`: **chưa đạt**, 10 lỗi và 3 cảnh báo
  thuộc dữ liệu/spec hiện có, không liên quan tới thay đổi sitemap.

Các lỗi checker: lệch tier ở `dao-hoa`, `hai-lam`, `hanh-trinh`, `hong-vien`,
`hy-sac`, `luc-ly`, `su-lam`, `thuy-mac`, `trau-cau`; lệch photoSlots ở
`hong-tien`. Cảnh báo: vai font Hurricane ở `ha-noi-xua`; `moc-duyen` và
`tinh-ca` là Diamond với 2 ô ảnh. Chưa chỉnh tier vì dữ liệu gói do CMS làm chủ.

## Ưu tiên tiếp theo

1. Dựng `/[locale]/mau-thiep/[templateSlug]`: mô tả đúng concept, ảnh, thông
   tin gói, số ô ảnh, tính năng thật, CTA và đánh giá thật. Có title,
   description, canonical, hreflang và ảnh OG riêng.
2. Thêm link HTML từ kho tới trang chi tiết, đưa URL đã xuất bản vào sitemap;
   giữ demo/xem thử ở `noindex`.
3. Sau triển khai, kiểm tra URL và sitemap trong Search Console. Không suy
   trạng thái index hoặc thứ hạng từ việc build qua.

## Kiểm tra favicon và logo sau ảnh chụp Google

Kiểm tra production bằng user-agent Googlebot/Googlebot-Image ngày 10/09/2026:

- Trang gốc `/` chuyển 308 tới `/vi`, đích trả 200 và khai favicon trong head.
- `/images/site/brand/favicon-light.png` trả 200, PNG 512×512, không có
  X-Robots-Tag chặn index; robots.txt cho phép tải. Hình là chữ K đen trên nền
  sáng. `/icon.png` cũng trả 200, PNG 512×512.
- `Organization.logo` trỏ tới `/images/site/brand/logo-stacked-ink.png`, trả
  200, PNG 800×960. `WebSite.name` và `og:site_name` khai Keemori.
- Production khai cùng URL favicon hai lần, mỗi lần có media query sáng/tối.
  Đã chuẩn hóa local ở `app/[locale]/layout.tsx` thành một icon mặc định không
  có media query; xác minh HTML local có đúng một `rel=icon` trong head và
  giữ nguyên URL ảnh. Đây là cải thiện cấu hình, chưa có bằng chứng rằng media
  query là nguyên nhân Google đang hiện biểu tượng mặc định.
- Biểu tượng quả địa cầu bên cạnh tên miền là favicon. Ảnh logo lớn bên phải
  kết quả tìm kiếm là ảnh minh họa riêng, không chứng minh favicon đã được
  Google xử lý.
- Chưa có lịch sử crawl từ Search Console nên không xác nhận được đây là
  cache cũ. Sau deploy, yêu cầu crawl lại trang chủ trong URL Inspection và
  theo dõi. Google nêu thời gian cập nhật có thể vài ngày tới vài tuần và
  không bảo đảm favicon sẽ xuất hiện dù đáp ứng hướng dẫn.

Nguồn: [Google — favicon trong kết quả tìm kiếm](https://developers.google.com/search/docs/appearance/favicon-in-search),
[Google — tên website](https://developers.google.com/search/docs/appearance/site-names),
[Google — Organization logo](https://developers.google.com/search/docs/appearance/structured-data/organization).

## Tài liệu đối chiếu

- [Google: sitemap đa ngôn ngữ](https://developers.google.com/search/docs/specialty/international/localized-versions#sitemap): mỗi bản ngôn ngữ có mục URL riêng và bộ alternate đầy đủ.
- [Google: xây dựng sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): `lastmod` cần phản ánh lần cập nhật nội dung đáng kể, có thể kiểm chứng.
- [Google: liên kết có thể crawl](https://developers.google.com/search/docs/fundamentals/get-started-developers): dùng phần tử `<a>` với URL.
- [Google: noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing): crawler cần tải được trang để đọc noindex; robots.txt tự nó không bảo đảm loại URL khỏi kết quả tìm kiếm.
