# Cập nhật production

Push lên `develop` kích hoạt `.github/workflows/production.yml`; các nhánh khác không tự deploy.
Commit đủ source, migration và asset mới/xóa. Thay đổi chỉ nằm trong DB local không đi theo git.

- CSS/component/dictionary/dữ liệu demo `/mau-thiep/.../demo` và ảnh trong `frontend/public` được đóng vào frontend image.
- DB đang có dữ liệu dùng migration mới trong `backend/src/migrations`; không chạy seed trên production, không sửa migration đã chạy.
- Seed chỉ dành cho DB mới, giữ đồng bộ để môi trường dựng mới có cùng mặc định.
- Cột CMS quản lý như tier, tags, xuất bản và thứ tự không bị migration mẫu ghi đè. Nội dung thiệp khách hàng cũng không được đồng bộ từ DB local.

Pipeline so sánh với release thành công gần nhất, build image gắn commit SHA, kéo image,
backup DB, chạy migration bằng backend image mới rồi mới thay container. Migration lỗi thì dừng
trước khi restart. Health check lỗi thì quay lại image trước; data migration không tự rollback
vì vậy phải tương thích với code cũ. Chỉ khi workflow xanh mới coi là deploy thành công.

Đợt Lan Trắng / Nắng Hẹn:
- `1789100000000`: bổ sung mẫu còn thiếu; `1789200000000`: bật các block của thiệp Lan Trắng trưng bày.
- `1789300000000`: đồng bộ metadata do code quản của hai mẫu; sửa tên chủ tài khoản và timeline
  bốn mục trên đúng thiệp `tuan-anh-nhu-binh`, chỉ khi giá trị còn là dữ liệu demo cũ.
- Thumbnail/poster hai mẫu dùng static import trong `TemplateMedia`, URL có hash tự đổi theo file.
- Docker frontend copy dependency của `next.config.ts` và thử load config ngay trong runtime image.

Kiểm tra sau deploy: workflow xanh, trang demo hai mẫu, `/vi/t/tuan-anh-nhu-binh`,
kho mẫu và poster/thumbnail mới. Nếu dữ liệu demo production đã được sửa riêng, migration
có điều kiện sẽ giữ nội dung đó; cần đánh giá chênh lệch trước khi cập nhật tiếp.
