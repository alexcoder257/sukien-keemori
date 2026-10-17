---
slug: burgundy-birthday
name: Burgundy
tier: gold
kind: birthday
colorTones: [red, white]
photoSlots: [cover]
fonts:
  display: playfair-display
  body: cormorant
  script: great-vibes
assets:
  thumbnail: thumbnail.avif
  photos: [chan-dung-sinh-nhat.jpg]
  decor: [velvet-texture-landscape.avif, velvet-texture-portrait.avif, candlelit-table.avif, opening-wrap.avif, opening-paper.avif, opening-inner-paper.avif]
status:
  assets: done
  build: done
---

# Burgundy — thiệp sinh nhật

Dựng theo canvas thiết kế "Thiệp sinh nhật Khải Hồ" (artboard Desktop 1200px
và Mobile 390px). Chỉ ghép được với thiệp loại `birthday` (`templates.kind`).
Bản Desktop bật từ 900px bề rộng tấm thiệp; dưới đó là bản Mobile.

Nền nội dung dùng burgundy pha mận (`#682736`, vùng tối `#421823`), đồng bộ
sắc giấy của opening. Lớp màu phủ gradient trên `velvet-*.avif` làm dịu đỏ
tươi và giữ vân nhung nhẹ; bảng màu nằm trong CSS Module của mẫu.

## Bố cục

1. **Một màn, không phong bì**: nền nhung đỏ rượu (`decor/velvet-*.avif`),
   khung viền vàng đôi có hạt kim cương ở góc.
2. Cột trái: "Trân trọng kính mời" (`envelope.greeting`, trống thì chữ mặc
   định), **tên khách** khi mở bằng link mời riêng, "Sinh nhật", tên
   (`occasion.nickname` hoặc `occasion.name`). Giữa: chân dung (ô ảnh `cover`).
   Phải: huy hiệu chữ đầu tên trong vòng nguyệt quế, "Một lời mời, trọn niềm
   vui", lời mời (`envelope.invitation`, trống thì câu mặc định có tên).
3. Ba cột: **Thời gian** (`reception.date` + `reception.startTime`, thiếu thì
   mốc đếm ngược) · **Địa điểm** (`reception.venueAddress`: phần trước dấu phẩy
   đầu là tên, hai phần cuối là tỉnh/thành; tên là link chỉ đường) · **Tiệc
   sinh nhật** (`thankYou.message`, trống thì câu mặc định).
4. Ảnh bàn tiệc (`decor/candlelit-table.avif`) và **dress code**: mỗi dòng mô
   tả `Nhãn: màu · màu` là một cột; mỗi tên màu khác nhau lấy một ô trong
   `dressCode.colors` theo thứ tự xuất hiện đầu tiên (tên lặp lại dùng lại ô
   đó — bộ chọn màu của editor không cho nhập trùng).
5. Dưới tấm thiệp, mỗi block bật được là một khung viền vàng: đếm ngược, lịch
   trình, lời nhắn, album (Diamond), hộp quà, sổ lưu bút, xác nhận tham dự.

## Giải trình sàn decor

Thiết kế gốc là một tấm thiệp typography: ngoài nền nhung và ảnh bàn tiệc,
mọi hoạ tiết (khung, hạt góc, vòng nguyệt quế, ngọn nến, ngôi sao) là SVG/CSS
vẽ trong component, không có asset raster riêng.
