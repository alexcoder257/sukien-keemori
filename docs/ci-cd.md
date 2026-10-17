# CI/CD production

Repo chứa ba ứng dụng độc lập: `backend/`, `frontend/`, `dashboard/`.
Workflow `.github/workflows/production.yml` chạy khi push lên **`develop`**.

## Luồng triển khai

1. So sánh commit mới với commit deploy thành công gần nhất trên server.
2. Chỉ lint/test/build các ứng dụng có thay đổi. Lần đầu hoặc thay đổi
   `docker-compose.yml`/`.github/` thì build cả ba.
3. Build `linux/amd64` trên GitHub runner rồi push Docker Hub với hai tag:
   `<service>` và `<service>-<commit SHA>`.
4. Sau khi mọi image cần thiết build thành công, server pull **tag commit**.
5. Nếu backend đổi: backup database, chạy migration, rồi cập nhật backend.
6. Chỉ tạo lại những container thay đổi, kiểm tra HTTP và trạng thái container.
   Nếu lỗi sau khi cập nhật, khôi phục các image trước đó. Database không tự
   rollback; migration phải tương thích với phiên bản ứng dụng trước.

Push chỉ sửa tài liệu ở `docs/` hoặc README không build image. Workflow vẫn
chạy bước phát hiện thay đổi để không bỏ sót code từ một lần deploy lỗi trước đó.
Các lần deploy được tuần tự hoá. Push nhánh khác không deploy production.

## GitHub Secrets và Variables

Vào repository → **Settings → Secrets and variables → Actions**.

Secrets:

| Tên | Giá trị |
| --- | --- |
| `DOCKERHUB_TOKEN` | Docker Hub access token quyền Read & Write |
| `DEPLOY_SSH_KEY` | Private key riêng của CI, không dùng SSH key cá nhân |
| `DEPLOY_KNOWN_HOSTS` | Host key server đã xác minh qua kết nối SSH hiện có |

Variables:

| Tên | Giá trị |
| --- | --- |
| `DOCKERHUB_USERNAME` | Tài khoản Docker Hub |
| `IMAGE_REPO` | Repository image, cùng giá trị với `.env` production |
| `DEPLOY_HOST` | IP/hostname server |
| `DEPLOY_USER` | Tài khoản SSH đã cài deploy helper |
| `DEPLOY_PORT` | Cổng SSH, mặc định `22` |
| `PUBLIC_API_URL` | URL API HTTPS công khai |
| `PUBLIC_WEB_URL` | URL website HTTPS công khai |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Site key reCAPTCHA dùng trong frontend |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` | Tuỳ chọn |
| `NEXT_PUBLIC_GA_ID` | Tuỳ chọn, Google Analytics measurement ID |
| `NEXT_PUBLIC_INVITATION_MUSIC_AUTOPLAY` | Tuỳ chọn, mặc định `true` |

`NEXT_PUBLIC_*` được đóng vào image khi build. Khi đổi Variables, vào
**Actions → Build and deploy production → Run workflow**, chọn `develop`
và bật `force_rebuild`. Các secret runtime như DB/JWT/SMTP/OAuth/SePay vẫn
nằm trong `/opt/keemori/.env`, không đưa chúng vào build args hoặc Git.

Nút **Run workflow** chỉ xuất hiện sau khi workflow cũng có trên nhánh mặc định
của repo (`main`). Khi mới có trên `develop`, có thể yêu cầu rebuild toàn bộ
bằng commit message chứa `[rebuild all]`, kể cả một commit rỗng:

```bash
git commit --allow-empty -m "ci: [rebuild all]"
git push origin develop
```

## Cài đặt server một lần

Server cần Docker Compose v2, Python 3, nginx hiện có và quyền pull Docker Hub.
Nếu image private, đăng nhập Docker Hub trên server một lần.

- Cài `.github/scripts/deploy-server.py` thành
  `/usr/local/libexec/keemori-deploy.py`, owner root, mode `0755`.
- Public key CI trong `authorized_keys` phải có tuỳ chọn:
  `restrict,command="/usr/local/libexec/keemori-deploy.py"`.
- Key này chỉ nhận lệnh `status` và `deploy`; không dùng làm SSH tương tác.
  Quyền deploy bao gồm cập nhật Compose nên chỉ cấp Secrets cho nhánh tin cậy.
- `/opt/keemori` vẫn chỉ chứa `.env` và `docker-compose.yml`.
- Trạng thái deploy ở `/var/lib/keemori-deploy/state.json`.
- Backup cấu hình/database ở `/var/backups/keemori/`. Không backup source ứng dụng.
  Mỗi deploy tự xoá các thư mục backup quá **30 ngày** (`BACKUP_RETENTION_DAYS`
  trong `deploy-server.py`), trừ backup của chính lần deploy đang chạy — đó là
  đường quay lại duy nhất. 30 ngày là **con số đã công bố** ở Chính sách bảo
  mật mục 13: mỗi backup chứa một `pg_dump` đầy đủ, nên dữ liệu người dùng đã
  yêu cầu xoá còn sống trong đó cho tới khi thư mục bị dọn. Đổi số này là đổi
  văn bản pháp lý.
- Sau mỗi deploy thành công, `prune_images` gỡ tag mọi image của repo **trừ**
  image container đang dùng và tag `rollback-<service>-*` mới nhất của từng
  service (bản duy nhất `deploy` sẽ quay về), rồi `docker image prune -f`.
  Thiếu bước này mỗi release nằm lại trên đĩa mãi — ngày 2026-09-19 có 114 tag
  chiếm ~14 GB của ổ 40 GB. Dọn hỏng không làm deploy thất bại.
- Khi sửa `deploy-server.py`, cài lại helper lên server trước khi dùng hành vi mới.

CI tự ghi `BACKEND_IMAGE_TAG`, `FRONTEND_IMAGE_TAG`, `DASHBOARD_IMAGE_TAG`
vào `.env` server sau deploy. Các biến khác được giữ nguyên.
Không đồng bộ đè `.env` local lên server sau đó nếu muốn giữ các tag đang chạy.

Postgres và Docker volume được giữ nguyên. Nếu cần thay đổi cấu hình database,
mount hoặc tên service/project thì thực hiện một đợt bảo trì riêng; helper sẽ
từ chối các thay đổi này để không vô tình chuyển sang database/upload rỗng.

## Kiểm tra pipeline

```bash
python3 -B .github/scripts/test-deployment.py
actionlint .github/workflows/production.yml
```

Tests mô phỏng deploy trong thư mục tạm, không truy cập production. Bao gồm
lọc service, pin tag, lỗi pull/migration, rollback khi health check lỗi, chặn
run cũ và thay đổi volume/cổng không phù hợp.

Sau khi Secrets, Variables và helper đã cài, push workflow lên `develop` rồi
theo dõi cả ba job `changes`, `build`, `deploy` trong Actions. Chỉ khi run thực
tế hoàn tất mới coi việc kích hoạt CI/CD đã được xác nhận.
