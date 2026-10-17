1. Section Nghi Lễ
Datetime và địa chỉ phải căn trái
2. Tên cô dâu chú rể không để break xuống dòng
3. Tên cô dâu chú rể để ở footer là 3 dòng ở mobile, desktop 1 dòng
4. Số dùng font EB Garamond tuyệt đối không sử dụng font Cormorant
5.
Chụp ảnh preview mẫu thiệp theo một rule duy nhất dùng chung cho cả 3 chỗ hiển thị (card kho
  mẫu, dải "Mẫu thiệp nổi bật" và "Cặp đôi đã tạo thiệp"): mở route
  `/vi/mau-thiep/{slug}/xem-thu` ở viewport rộng đúng 640px (bằng max-width của thiệp, để
  thiệp phủ kín khung, không lộ viền trắng hai bên) với deviceScaleFactor 1.5, chụp full-page
  một lần duy nhất ra `thumbnail.avif` rộng 960px × toàn bộ chiều dài thiệp, rồi cắt
  `poster.avif` 960×1231 (tỉ lệ 0.78, khớp khung `aspect-[0.78]` của PosterCard) từ đầu chính
  ảnh thumbnail đó chứ không chụp riêng; cả hai file xuất AVIF quality 70, không resize lên
  hay xuống, và 960px phải luôn ≥ 1.5 lần bề rộng khung card lớn nhất ở mọi breakpoint.