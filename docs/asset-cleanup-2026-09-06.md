# Rà soát asset — 2026-09-06

Đã xóa 832 file, tổng cộng **788.21 MiB** (826,495,407 byte). Dung lượng là kích thước file, không phải mức giảm lịch sử Git hoặc kích thước image đã nén.

| Nhóm | File | MiB | Tác động |
|---|---:|---:|---|
| Asset công khai trong frontend/public | 50 | 8.85 | Giảm dữ liệu được COPY vào image runtime frontend |
| Ảnh QA ở gốc frontend | 3 | 1.14 | Giảm build context frontend |
| Ảnh QA ở gốc repo và .playwright-mcp | 13 | 7.34 | Chỉ giảm workspace; compose build từ từng app |
| Ảnh xử lý tạm trong frontend/.template-raw | 765 | 770.86 | Chỉ giảm workspace; đã được dockerignore |
| Python bytecode trong frontend/scripts | 1 | 0.02 | Giảm build context frontend |

## Cách xác định

Đối chiếu toàn bộ code frontend, backend, dashboard, seed, spec, registry font và các đường dẫn ghép động. Không dùng kết quả grep tên file đơn thuần để xóa: poster/thumbnail/phong bì, logo ngân hàng, nhạc và icon Next.js có quy ước tải riêng. Những tên decor trùng nhau giữa hai mẫu được đối chiếu theo đúng thư mục mẫu.

Đã cập nhật `assets.*` và các dòng manifest tương ứng trong 17 spec. Phần đối chiếu inspiration và prompt cũ được giữ làm lịch sử, có ghi chú rõ ở đầu từng spec. Không thay đổi layout hoặc số ô ảnh của sản phẩm.

## Những phần giữ lại

- 27 bài nhạc đang có trong `MUSIC_TRACKS` (112,26 MiB), 40 logo ngân hàng và toàn bộ font đang khai báo sử dụng.
- Poster, thumbnail và phong bì của 48 mẫu; `frontend/app/icon.png` được Next.js tự nhận diện.
- `placeholder.avif` là asset dự phòng được quy ước dự án giữ lại.
- Ba ảnh so sánh chất lượng AVIF còn dùng ở route `/[locale]/test-avif`.
- Tư liệu thiết kế `docs/inspiration/`, `design-system/`; worktree `.claude/worktrees/payment-wow`; dữ liệu upload và output của các công cụ build.
- Script, ghi chú và JSON còn lại trong `.template-raw`; chỉ xóa ảnh trung gian có thể tái tạo.

## Ngăn tái phát

`.gitignore` loại ảnh QA của frontend, output `.playwright-mcp` và cache Python. `frontend/.dockerignore` loại ảnh QA ở gốc app, output Playwright, cache Python và `*.tsbuildinfo`, vẫn cho phép ảnh trong `public/` và `app/`. Compose hiện dùng context riêng cho từng app, nên ảnh tham khảo ở gốc repo không đi vào build context frontend.

## Kiểm tra

- `npx tsc --noEmit`: đạt.
- `npm run lint`: đạt.
- `npm run build`: đạt, sinh đủ 70 trang tĩnh; cấu hình local còn cảnh báo `NEXT_PUBLIC_SITE_URL` chưa khai.
- `git diff --check`: đạt.
- Đối chiếu 857 đường dẫn literal, font local và đường dẫn theo registry/quy ước: không có đường dẫn bị mất thêm do lần xóa này.
- `node scripts/check-templates.mjs`: vẫn còn lỗi đã có trước khi dọn: Hồng Tiên khai `[cover, closing]` trong spec nhưng seed là `[cover]`. Hai cảnh báo asset thừa Tình Ca đã hết; hai cảnh báo thương mại về mẫu Diamond có 2 ô ảnh vẫn còn.

Chưa chạy Docker build; đã kiểm tra Dockerfile/context và production build của frontend. Không truy vấn dữ liệu production hoặc CDN, nên kết luận về sử dụng asset dựa trên repository hiện tại. Không thay đổi backend/dashboard hoặc dữ liệu khách hàng.

## Tham chiếu cũ phát hiện trước khi xóa

- `frontend/components/invitation/templates/classic/classic-invitation.tsx`: `phong-thu/decor/laurel-frame.avif`, `moc-lan/decor/magnolia-wreath.avif` đã không tồn tại.
- `backend/src/seeders/data/showcase-cards.seed.ts`: hai ảnh Tình Ca `anh-doi-studio-vuong.avif`, `anh-doi-vuon-hong.avif` đã không tồn tại; registry demo hiện dùng các bản `-v2`.

Các đường dẫn này đã thiếu trước khi dọn, cần xử lý riêng theo nơi sử dụng. URL ảnh giả trong unit test không được tính là asset thiếu của sản phẩm.

## Danh sách file đã xóa ngoài ảnh xử lý tạm

- `.playwright-mcp/b013c173-41de-4b32-beb9-e1f718efbe60.jpg` (586.0 KiB)
- `.playwright-mcp/c4668289-cd99-4b00-8f16-9c00c1115f0f.jpg` (327.0 KiB)
- `.playwright-mcp/d9528f99-0c36-447b-8640-23a9451d2cae.jpg` (424.1 KiB)
- `consent-dialog.png` (120.1 KiB)
- `cover.png` (772.6 KiB)
- `da-khuc-cover.png` (418.6 KiB)
- `frontend/checkout-consent.png` (172.4 KiB)
- `frontend/dialog.png` (436.4 KiB)
- `frontend/featured-header.png` (561.1 KiB)
- `frontend/public/images/site/brand/ChatGPT Image Aug 20, 2026, 06_00_55 PM.png` (2108.2 KiB)
- `frontend/public/images/site/brand/favicon-dark.png` (366.8 KiB)
- `frontend/public/images/site/editorial-detail.avif` (115.6 KiB)
- `frontend/public/images/site/editorial-detail.jpg` (159.4 KiB)
- `frontend/public/images/site/hero-couple.avif` (82.0 KiB)
- `frontend/public/images/site/hero-couple.jpg` (266.9 KiB)
- `frontend/public/images/site/hero-editorial.jpg` (119.0 KiB)
- `frontend/public/images/site/invitation-paper.jpg` (294.8 KiB)
- `frontend/public/images/site/logo-raw.png` (1716.5 KiB)
- `frontend/public/images/site/placeholder.jpg` (25.8 KiB)
- `frontend/public/images/site/showcase/thiep-cuoi-hoa-tra-lua-xanh-dau-sap.jpg` (232.3 KiB)
- `frontend/public/images/site/showcase/thiep-cuoi-hoa-van-vang-nhung-xanh.jpg` (239.6 KiB)
- `frontend/public/images/site/showcase/thiep-cuoi-mica-tua-xanh-da-den.avif` (81.8 KiB)
- `frontend/public/images/site/showcase/thiep-cuoi-mica-tua-xanh-da-den.jpg` (116.1 KiB)
- `frontend/public/images/site/showcase/thiep-cuoi-toi-gian-phong-bi-kem.jpg` (178.9 KiB)
- `frontend/public/images/templates/bang-lam/decor/winter-dress-code-collage.avif` (89.1 KiB)
- `frontend/public/images/templates/da-khuc/decor/pastel-satin-swatches.avif` (58.4 KiB)
- `frontend/public/images/templates/hai-lam/decor/white-floral-arch-left.avif` (138.5 KiB)
- `frontend/public/images/templates/hai-lam/decor/white-floral-arch-right.avif` (154.8 KiB)
- `frontend/public/images/templates/hai-lam/decor/white-floral-corner-bottom-left.avif` (88.4 KiB)
- `frontend/public/images/templates/hai-lam/decor/white-floral-table-edge.avif` (101.0 KiB)
- `frontend/public/images/templates/hanh-trinh/decor/boarding-pass-blank.avif` (10.1 KiB)
- `frontend/public/images/templates/hanh-trinh/decor/ticket-corner.avif` (6.1 KiB)
- `frontend/public/images/templates/hong-tien/decor/heart-rococo-frame.avif` (57.6 KiB)
- `frontend/public/images/templates/hong-tien/decor/rococo-vine-arch.avif` (78.3 KiB)
- `frontend/public/images/templates/hy-sac/decor/floral-garland.avif` (41.2 KiB)
- `frontend/public/images/templates/lam-cuc/preview.avif` (78.6 KiB)
- `frontend/public/images/templates/luc-ly/decor/lace-hearts-countdown.avif` (386.1 KiB)
- `frontend/public/images/templates/luc-ly/decor/lace-valance-bottom.avif` (138.7 KiB)
- `frontend/public/images/templates/moc-lan/preview.avif` (174.5 KiB)
- `frontend/public/images/templates/phong-thu/preview.avif` (97.8 KiB)
- `frontend/public/images/templates/tham-luc/decor/crochet-signature-label.avif` (87.8 KiB)
- `frontend/public/images/templates/tham-luc/decor/lace-initial-monogram.avif` (40.9 KiB)
- `frontend/public/images/templates/tham-luc/decor/plate-green-textile.avif` (0.5 KiB)
- `frontend/public/images/templates/thanh-su/decor/calendar-twig-frame.avif` (75.6 KiB)
- `frontend/public/images/templates/thuy-mac/decor/hero-envelope-open.avif` (131.1 KiB)
- `frontend/public/images/templates/thuy-mac/decor/minh-hoa-cap-doi-vuon-hoa.avif` (149.3 KiB)
- `frontend/public/images/templates/ti-hon/decor/timeline-bracket.avif` (8.3 KiB)
- `frontend/public/images/templates/tin-vui/decor/halftone-fade-left.avif` (35.1 KiB)
- `frontend/public/images/templates/tin-vui/decor/halftone-fade-right.avif` (38.5 KiB)
- `frontend/public/images/templates/tin-vui/decor/ink-roller-strip.avif` (72.2 KiB)
- `frontend/public/images/templates/tin-vui/decor/torn-paper-edge.avif` (7.1 KiB)
- `frontend/public/images/templates/tinh-ca/decor/heart-solid-painterly.avif` (50.0 KiB)
- `frontend/public/images/templates/tinh-ca/decor/illust-dancers-group.avif` (117.8 KiB)
- `frontend/public/images/templates/tinh-ca/decor/speaker-minus.avif` (8.1 KiB)
- `frontend/public/images/templates/tinh-ca/decor/speaker-plus.avif` (8.7 KiB)
- `frontend/public/images/templates/tinh-ca/photos/anh-chan-dung-chu-re-v2.avif` (83.2 KiB)
- `frontend/public/images/templates/tinh-ca/photos/anh-chan-dung-co-dau-v2.avif` (93.6 KiB)
- `frontend/public/images/templates/vuon-hen/preview.avif` (141.6 KiB)
- `frontend/public/music/skills-main.zip` (105.4 KiB)
- `luc-ly-390-cover.png` (385.4 KiB)
- `menu-open.png` (27.4 KiB)
- `mobile-before.png` (417.5 KiB)
- `san-ho-envelope-mobile.png` (164.6 KiB)
- `san-ho-full-780.png` (2850.4 KiB)
- `sulam-cover.png` (527.9 KiB)
- `vn-1440x1000-cover.png` (493.8 KiB)
- `frontend/scripts/__pycache__/check-assets.cpython-312.pyc`
