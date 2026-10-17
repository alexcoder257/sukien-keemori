# Feature đã làm — Backend & Admin Dashboard

Cập nhật: 2026-08-11 (nhánh `develop`)

## Backend — modules

| Module | Nội dung |
|---|---|
| `auth` | register / login / refresh / logout / me / forgot / reset password. JWT access+refresh, guard `JwtAuthGuard`, `OptionalJwtAuthGuard`, `RolesGuard` + `@Roles`, `@CurrentUser`. |
| `user` | Entity/repository/service dùng nội bộ + `GET /admin/users`, `PATCH /admin/users/:id/role` (super_admin). |
| `catalog` | `GET /templates`, `/templates/:slug`, `/pricing`; admin: `PATCH /admin/templates/:slug`, `PATCH /admin/pricing/:tier`. Entity `Template`, `TierPrice`. |
| `cards` | CRUD thiệp: `POST/GET/GET :id/PUT/DELETE /cards`, đổi mẫu `PATCH :id/template`, đổi slug `PATCH :id/slug`, xuất bản `POST :id/publish`; public `GET /public/cards/:slug`. Có `@ContentMap` decorator. |
| `interactions` | Lời chúc: public `GET/POST /public/cards/:slug/wishes`; chủ thiệp `GET /cards/:cardId/wishes`, duyệt `PATCH :wishId/approve`, xoá, `GET /wishes/pending-count`. Yêu thích: `GET/POST /favorites`, `DELETE /favorites/:templateSlug`. Đánh giá mẫu: `GET /template-reviews/summaries`, `GET/POST/DELETE /template-reviews/:slug`. |
| `commerce` | `GET /orders/quote/:tier`, `POST /orders/voucher-preview`, `GET/POST /orders`, `POST /orders/:id/cancel`; admin `POST /admin/orders/:id/confirm-payment`. Entity `Order`. |
| `vouchers` | Mã giảm giá: `GET/POST /admin/vouchers`, `PATCH/DELETE /admin/vouchers/:id` (super_admin). Entity `Voucher`, `VoucherRedemption`. Không import module nào khác — `commerce` gọi vào, không có chiều ngược lại. |
| `content` | `/faqs`, `/couple-showcases`, `/site-stats`. |
| `settings` | `GET/PATCH /admin/settings` — cấu hình vận hành (số ngày sống link, trần lượt xem…), một hàng `site_settings`. |
| `admin-dashboard` | `GET /admin/dashboard`: users, thiệp theo status, đơn đã trả, doanh thu VND. Chỉ đọc, gọi service domain khác, không có entity riêng. |
| `storage` | `POST /cards/:cardId/uploads/photo`, `POST /cards/:cardId/uploads/album`. |
| `captcha` | Verify reCAPTCHA v3. |
| `mail` | SMTP (Brevo) + template mail. |
| `todo` | Ví dụ kiến trúc, không phải domain sản phẩm. |

**Phân quyền:** 4 role trong `common/enums/user-role.enum.ts`; `roleSatisfies` là luật duy nhất (`super_admin` thoả `@Roles('admin')`, ngược lại thì không).

**Data:** 19 entity, 1 migration `InitSchema`, có seeder (`src/seeders/`).

## CMS — repo `dashboard/` (cổng dev 3002)

Khu quản trị đã **tách khỏi `frontend/`** thành repo git riêng. URL không còn
prefix `/admin` vì cả app này là khu quản trị.

**Đã dựng (4 màn):**

- `/[locale]` — dashboard mặc định: KPI vận hành cho admin; super admin có thêm
  lưu lượng theo ngày, mẫu/gói/trạng thái phổ biến và doanh thu tổng.
- `/[locale]/nguoi-dung` — `user-table.tsx`: danh sách + đổi role.
- `/[locale]/cai-dat` — `site-settings-form.tsx`: cấu hình vận hành toàn site.
- `/[locale]/dang-nhap` — màn đăng nhập riêng của CMS (`login-form.tsx`); repo này không dùng chung trang auth của trang khách nữa.

**Hạ tầng:** `admin-shell.tsx` (sidebar 13 mục theo spec, mục chưa dựng hiện xám
+ khoá theo role) và `sign-out-button.tsx`, `apis/admin.ts`, `hooks/use-admin.ts`,
`hooks/use-auth.ts`, `proxy.ts` gác phiên cho mọi route trừ `/dang-nhap`.

**Chưa dựng (9 mục còn trong sidebar):** FAQ, tag mẫu thiệp,
cấu hình trang chủ, quản lý thiệp — và của `super_admin`: bảng giá, phân tích,
doanh thu.

**Component đã viết nhưng chưa gắn vào màn nào:** `price-config-form.tsx`
(bảng giá).

**Đã gỡ:** toàn bộ luồng point/Credits — `store-table.tsx`,
`add-store-dialog.tsx`, `add-points-dialog.tsx`, sổ nạp point trong màn doanh
thu, và các route point ở backend.
