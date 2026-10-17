# Spec CMS / Dashboard

Nguồn: yêu cầu khách hàng. File này là **source of truth về phạm vi CMS**.
Cột trạng thái chỉ ghi nhận hiện trạng code, không phải một phần của spec.

## 1. Phân chia role

Ba role chính: **Super admin**, **Admin**, **User**.

- **Super admin** — toàn quyền chỉnh sửa và xem mọi thông tin.
- **Admin** — chỉ có quyền chỉnh sửa thông tin, **không được xem một số thông
  tin** (bảng giá, analytic, doanh thu).
- **User** — người mua thiệp (role `customer`).

> `roleSatisfies` là luật duy nhất: `super_admin` thoả mọi route khai
> `@Roles('admin')`, nhưng `@Roles('super_admin')` vẫn chặn `admin`.
>
> **Mục 5 "Blog", mục 6 "Đối tác" và mục 12 "Add point" đã bị gỡ khỏi sản
> phẩm** — xem ghi chú ở từng mục.

## 2. Bảng giá — *Super admin*

Config bảng giá, **% discount**, và **giá lần mua thiệp tiếp theo** của chính
account đó (chiết khấu mua lại tính riêng theo từng user nhưng chung mọi tier: đã mua
một thiệp trả phí thì lần sau mua tier nào cũng về giá mua lại).

## 3. Thời gian tồn tại của thiệp — *Admin*

Config **số ngày tồn tại của link** và **số lượt view cho phép** của link.
Đây là hằng số vận hành, phải nằm ở `site_settings`, không hard-code.

## 4. FAQ — *Admin*

Chỉnh sửa được danh sách FAQ.

## 5. Blog — *đã gỡ*

Tính năng blog đã bị gỡ khỏi toàn hệ thống (backend, trang khách và CMS).

## 6. Đối tác — *đã gỡ*

Tính năng đối tác B2B (cửa hàng, duyệt hồ sơ, mã giảm giá độc quyền) đã bị gỡ
khỏi toàn hệ thống. Nhật ký thao tác vẫn đọc được các dòng `partner.*` cũ.

## 7. Quản lý tag thiệp — *Admin*

Quản lý các **tag** trên mẫu thiệp và **các bậc** (tier).

## 8. List mẫu thiệp homepage — *Admin*

Chọn mẫu thiệp nào hiển thị trên homepage và **số lượng hiển thị**.

## 9. List thiệp đã tạo — *Admin*

Xem **lịch sử toàn bộ thiệp** của các cặp đôi đã tạo, và config thiệp nào được
hiển thị ở homepage.

## 10. Analytic — *Super admin*

- Số lượng người truy cập website.
- Số lượng thiệp đã tạo theo từng mẫu (để biết mẫu nào đang hot).
- Số lượng thiệp Free / Gold / Diamond đã tạo.

## 11. Đánh giá — *Admin*

Hai thứ khác nhau, hai màn khác nhau:

- **Đánh giá trang chủ** (`/danh-gia`): trích dẫn biên tập tự soạn, config những
  gì hiển thị trên homepage.
- **Đánh giá mẫu thiệp** (`/danh-gia-mau`): điểm sao + nhận xét do người dùng
  gửi cho từng mẫu trong kho mẫu. Hiện ngay khi gửi, **không duyệt trước**; admin
  chỉ đọc và gỡ nội dung không phù hợp, không sửa lời của người khác.

## 12. Add point — *đã gỡ*

Mục này không còn trong sản phẩm. Đơn vị quy đổi point/Credits đã bị gỡ khỏi cả
backend lẫn CMS (migration `RemovePointsAndCredits`): mọi khách trả tiền theo
đúng bảng giá ở mục 2.

## 13. Doanh thu — *Super admin*

Tính tổng doanh thu website đã bán được. Nhập các khoản đã chi trả và **phí duy
trì website hàng tháng**.

---

## Trạng thái triển khai (2026-08-11)

| # | Mục | Quyền | Backend | Màn CMS |
|---|---|---|---|---|
| 1 | Phân chia role | — | ✅ `roleSatisfies`, `RolesGuard`, `PATCH /admin/users/:id/role` | ✅ `/nguoi-dung` |
| 2 | Bảng giá | Super admin | ✅ `PATCH /admin/pricing/:tier` | ❌ (`price-config-form.tsx` đã viết, chưa gắn route) |
| 3 | Thời gian tồn tại thiệp | Admin | ✅ `GET/PATCH /admin/settings` | ✅ `/cai-dat` |
| 4 | FAQ | Admin | 🟡 chỉ có `GET /faqs` public, chưa có CRUD admin | ❌ |
| 5 | Blog | — | đã gỡ | đã gỡ |
| 6 | Đối tác | — | đã gỡ | đã gỡ |
| 7 | Quản lý tag thiệp | Admin | 🟡 `PATCH /admin/templates/:slug`; chưa có domain tag riêng | ❌ |
| 8 | List mẫu thiệp homepage | Admin | 🟡 sửa được template, chưa có cờ/thứ tự homepage | ❌ |
| 9 | List thiệp đã tạo | Admin | 🟡 `cards` đã có CRUD của chủ thiệp; chưa có route admin liệt kê toàn bộ | ❌ |
| 10 | Analytic | Super admin | ✅ `GET /admin/analytics` (lượt truy cập, lượt xem trang/thiệp, thống kê theo mẫu, gói và trạng thái) | ✅ tích hợp vào `/` làm dashboard mặc định; `/phan-tich` giữ tương thích đường dẫn cũ |
| 11 | Đánh giá | Admin | 🟡 `/admin/template-reviews` (liệt kê, xoá). Lời chứng thực trang chủ (`/testimonials`) **đã gỡ** | 🟡 `/danh-gia-mau` (mẫu thiệp) |
| 12 | ~~Add point~~ | — | ⬛ đã gỡ khỏi sản phẩm | ⬛ đã gỡ |
| 13 | Doanh thu | Super admin | 🟡 mới có tổng doanh thu trong dashboard; **chưa có phần nhập chi phí / phí duy trì** | ❌ |

✅ xong · 🟡 một phần · ❌ chưa làm
