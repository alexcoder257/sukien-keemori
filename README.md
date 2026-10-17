# sukien-keemori

Nền tảng tạo **sự kiện** ở `sukien.keemori.com`, tách từ repo thiệp cưới
`thiep-cuoi-online` (keemori.com). Cùng kiến trúc — `backend/` (NestJS),
`frontend/` (trang khách), `dashboard/` (CMS) — nhưng database, image Docker và
thư mục deploy riêng.

## Chạy cùng VPS với keemori.com

| | keemori.com | sukien.keemori.com |
|---|---|---|
| Thư mục server | `/opt/keemori` | `/opt/sukien-keemori` |
| Compose project | `thiep-cuoi-online` | `sukien-keemori` |
| Image | `alexcoder257/thiep-cuoi-online` | `alexcoder257/sukien-keemori` |
| Cổng host (web/api/cms) | 3000 / 3001 / 3002 | 3110 / 3111 / 3112 |
| Database | `thiep_cuoi_online` | `sukien_keemori` (Postgres riêng trong compose) |

Hai stack không chia sẻ container, network, volume hay secret nào. Nginx trên
host chia theo tên miền: `ops/nginx/sukien-keemori.conf`.

## Deploy lần đầu

```bash
# Máy local
cp .env.docker.example .env        # điền giá trị thật (secret mới, không chép của keemori)
docker login
docker compose build backend frontend dashboard
docker compose push backend frontend dashboard

# Server
ssh <vps> 'sudo mkdir -p /opt/sukien-keemori && sudo chown $USER /opt/sukien-keemori'
scp docker-compose.yml .env <vps>:/opt/sukien-keemori/
ssh <vps> 'cd /opt/sukien-keemori && docker compose pull && docker compose up -d --no-build'
```

`migrate` chạy toàn bộ migration trên database trống trước khi backend lên.
Tài khoản CMS đầu tiên (`admin@gmail.com`, `super_admin`) do migration
`CreateAdminUsers` tạo — **đổi mật khẩu ngay** sau lần đăng nhập đầu.

DNS: trỏ `sukien`, `api-sukien`, `cms-sukien` (bản ghi A) về IP VPS, rồi làm
theo hướng dẫn trong đầu file nginx để cài chứng chỉ.

## Chưa có CI/CD

`docs/ci-cd.md` mô tả pipeline của repo gốc; thư mục `.github/` không được
chép sang nên ở đây deploy là thủ công như trên. Khi dựng CI, helper
`deploy-server.py` phải là bản riêng (đường dẫn `/opt/sukien-keemori`, state và
backup tách khỏi `/var/lib/keemori-deploy`, `/var/backups/keemori`).

## Local development

Mỗi app chạy bằng npm trong thư mục của nó, xem `CLAUDE.md` mục 7. Database
local mặc định là `sukien_keemori` — tạo trước bằng `createdb sukien_keemori`
rồi `cd backend && npm run migration:run`.
