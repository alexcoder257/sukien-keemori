> **ĐÃ NGỪNG DÙNG.** CMS không còn đăng nhập bằng Keycloak: tài khoản quản trị
> nằm ở bảng `admin_users` của backend (`backend/src/modules/admin-auth/`,
> migration `CreateAdminUsers`). Thư mục này và service `keycloak` /
> `keycloak-db-init` trong `docker-compose.yml` chỉ còn chờ gỡ tay trên server
> (`deploy-server.py` từ chối release làm đổi danh sách service). Nội dung bên
> dưới giữ lại để tham khảo lúc gỡ.

# Keycloak — tài khoản và quyền của CMS

Người vận hành CMS **không** nằm trong bảng `users`. Họ là tài khoản trong realm
`keemori-admin` của Keycloak, còn bảng `users` chỉ còn khách (`customer`,
`partner`). Hai tập tài khoản tách hẳn nhau: token của khách không mở được
`/admin/*`, token Keycloak không dùng được ở trang khách.

```text
dashboard ──(OIDC code + PKCE)──► Keycloak (sso.keemori.com)
    │  access token (RS256, aud=keemori-api, resource_access.keemori-api.roles)
    ▼
backend /admin/*  ── KeycloakAuthGuard (JWKS) → PermissionsGuard (@Permissions)
```

## Mô hình quyền

- **Quyền** = client role của client `keemori-api`, mỗi quyền ứng với một màn
  CMS (`dashboard:view`, `content:manage`, `revenue:manage`…). Danh sách chuẩn ở
  `backend/src/common/enums/admin-permission.enum.ts`.
- **Vai trò** = realm role tổ hợp `cms-*`, gom nhiều quyền. Gán vai trò cho
  người, không gán quyền lẻ.

| Vai trò | Dùng cho |
|---|---|
| `cms-super-admin` | Toàn quyền |
| `cms-admin` | Vận hành hằng ngày, tương đương `admin` cũ: không thấy tiền, không xoá tài khoản, không đọc nhật ký |
| `cms-editor` | Blog, FAQ, lời chứng thực, kho mẫu, đánh giá mẫu |
| `cms-support` | Tra người dùng, thiệp, đối tác, giao dịch |
| `cms-accountant` | Giao dịch, doanh thu, bảng giá, mã giảm giá, phân tích |

Thêm vai trò mới (ví dụ "Marketing") thì **không phải sửa code**: Admin Console
→ realm `keemori-admin` → Realm roles → Create role `cms-marketing` → bật
Composite → thêm client role của `keemori-api`. Tên phải bắt đầu bằng `cms-` để
hiện trong nhật ký thao tác và trang Tài khoản.

Thêm một **quyền** mới thì phải sửa code ở bốn chỗ: enum backend, bản sao
`dashboard/constants/permission.ts`, nhãn trong `dashboard/dictionaries/*.json`,
và client role trong `realm-keemori-admin.json` **và** trong Keycloak đang chạy
(file realm chỉ được nạp ở lần khởi động đầu tiên).

Quyền đổi có hiệu lực ở lần làm mới token kế tiếp — tối đa 15 phút
(`accessTokenLifespan`). Khoá gấp một người: Admin Console → Users → tắt
Enabled, rồi vào tab Sessions → Sign out.

## Chạy ở máy dev

```bash
docker compose -f ops/keycloak/compose.dev.yml up -d
ops/keycloak/create-cms-user.sh ban@email.com cms-super-admin
```

`backend/.env` và `dashboard/.env` giữ đúng giá trị trong `.env.example` là
khớp. Mở `http://localhost:3002`, bấm "Đăng nhập bằng Keycloak", đăng nhập bằng
mật khẩu tạm mà script in ra; Keycloak sẽ bắt đổi mật khẩu và cài ứng dụng OTP.

Admin Console dev: `http://localhost:8080/admin` (`admin` / `admin`).

## Production

Keycloak chạy bằng **image chính thức** trong `docker-compose.yml`, realm nạp
từ `/opt/keemori/ops/keycloak/realm-keemori-admin.json`. CI **không** build
hay restart Keycloak: `deploy-server.py` chỉ `up --no-deps` ba app.

`deploy-server.py` từ chối mọi release làm đổi danh sách service trong compose
(thay đổi hạ tầng phải làm tay). Vì vậy lần thêm Keycloak đầu tiên đã được làm
tay trên server (2026-09-23): chép compose mới + file realm vào `/opt/keemori`,
thêm `PUBLIC_SSO_URL`, `KEYCLOAK_ADMIN_USER`, `KEYCLOAK_ADMIN_PASSWORD`,
`KEYCLOAK_DASHBOARD_CLIENT_SECRET` vào `.env`, rồi `docker compose up -d
keycloak`. Từ đó CI deploy bình thường; **không cần thêm biến nào trên GitHub**
— dashboard và backend đọc biến Keycloak ở runtime từ `.env` của server.

Việc làm tay còn lại, khi cần:

- **DNS**: `keemori.com` dùng nameserver **Cloudflare** — bản ghi `sso` phải
  khai ở Cloudflare (A → IP server, proxy bật như `dashboard`), khai ở nhà đăng
  ký tên miền không có tác dụng.
- **TLS**: `certbot --nginx -d sso.keemori.com --redirect` (block nginx HTTP
  đã có trong `/etc/nginx/sites-available/keemori`).
- **Thêm người vận hành** (trên server):

  ```bash
  cd /opt/keemori && set -a && . ./.env && set +a
  ./ops/keycloak/create-cms-user.sh <email> <cms-role> docker-compose.yml
  ```

  hoặc làm trong Admin Console `https://sso.keemori.com/admin` (tài khoản
  `KEYCLOAK_ADMIN_USER`/`KEYCLOAK_ADMIN_PASSWORD` trong `.env` của server).
- **Nâng phiên bản Keycloak**: sửa tag image trong compose, commit, rồi trên
  server `docker compose pull keycloak && docker compose up -d keycloak`.
- **Email quên mật khẩu**: realm dùng SMTP Resend của backend, cấu hình trong
  Admin Console → Realm settings → Email. Đổi `MAIL_*` thì sửa ở đó cho khớp.

Lưu ý thứ tự: migration `MoveAdminsToKeycloak` hạ các tài khoản `admin` cũ về
`customer` ở lần deploy backend kế tiếp. Người vận hành phải có tài khoản
Keycloak **trước** lần deploy đó.

## Sự cố thường gặp

- **401 ở mọi route `/admin/*`** — `KEYCLOAK_ISSUER` của backend không khớp
  `iss` trong token (thường là thiếu `https`, thừa `/` cuối, hoặc
  `PUBLIC_SSO_URL` khác `KC_HOSTNAME`). Giải mã token ở jwt.io và so chuỗi.
- **403 dù đã đăng nhập** — tài khoản chưa được gán vai trò có quyền đó. Trang
  Tài khoản trong CMS liệt kê quyền mà token thực sự mang.
- **`sso.keemori.com` không mở được / certbot báo NXDOMAIN** — bản ghi `sso`
  chưa có trên Cloudflare (xem mục DNS).
- **"Invalid redirect uri" ở Keycloak** — `DASHBOARD_URL`/`PUBLIC_CMS_URL` lệch
  với Valid redirect URIs của client `keemori-dashboard`.
- **Đăng nhập xong quay về trang đăng nhập với lỗi "state"** — cookie
  `admin_oidc_state` không quay về: kiểm tra dashboard chạy HTTPS ở production
  (cookie `Secure`) và đồng hồ server.
