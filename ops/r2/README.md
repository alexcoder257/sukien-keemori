# R2 — nơi lưu ảnh

Ảnh của khách nằm trên **Cloudflare R2**, chia làm hai bucket với hai vai khác
hẳn nhau:

| Bucket | Biến | Công khai? | Chứa gì |
|---|---|---|---|
| công khai, ví dụ `keemori-uploads` | `R2_BUCKET` | **Có**, qua custom domain | Ảnh đã thuộc một thiệp, ảnh cặp đôi tiêu biểu. Khoá `uploads/...` trùng khít đường dẫn `/uploads/...` ghi trong database |
| tạm, ví dụ `keemori-staging` | `R2_STAGING_BUCKET` | **Không bao giờ** | Ảnh editor vừa chọn, **kể cả của khách chưa đăng nhập**. Tự xoá sau 1 ngày |

Luồng ảnh (chi tiết ở `backend/src/modules/storage/upload-staging.service.ts`):

```text
trình duyệt ── thu nhỏ 2048px ──PUT (presigned)──► keemori-staging/raw/<phiên>/<id>
                                                        │ worker nén AVIF (process riêng, nice 10)
                                                        ▼
                                          keemori-staging/ready/<phiên>/<id>.avif
bấm Lưu (đã đăng nhập) ── claim ─────────────────────────┘
                                                        ▼
                                  keemori-uploads/uploads/cards/<thiệp>/photos/…avif
```

**Vì sao bucket tạm phải riêng:** custom domain phục vụ *mọi* khoá trong
bucket, không chặn được theo tiền tố. Để ảnh chưa kiểm của người chưa đăng nhập
chung bucket công khai là biến dịch vụ thành chỗ lưu file miễn phí cho bất kỳ
ai đoán được khoá. `configure-buckets.cjs` từ chối chạy nếu hai biến trùng nhau.

## Chuyển từ `STORAGE_DRIVER=local` sang `r2`

Làm một lần. Thứ tự quan trọng: chép ảnh cũ **trước** khi đổi driver, rồi chép
lại lần nữa **sau** khi đổi để vét ảnh tải lên trong lúc chuyển.

### 1. Cloudflare (làm tay trong dashboard)

1. **R2 → Create bucket** hai lần: `keemori-uploads` và `keemori-staging`.
   Location: Automatic. Storage class: **Standard** (lớp Infrequent Access không
   có phần miễn phí và tính tối thiểu 30 ngày — sai với tệp sống 1 ngày).
2. `keemori-uploads` → **Settings → Custom Domains → Connect**, ví dụ
   `media.keemori.com`. **Không** bật `r2.dev` public URL: URL đó bị giới hạn
   tốc độ và không hưởng cache của zone.
3. `keemori-staging`: **không** gắn domain, **không** bật public access.
4. **R2 → Manage API tokens → Create API token**: quyền *Object Read & Write*,
   giới hạn đúng hai bucket trên. Ghi lại Access Key ID và Secret Access Key
   (chỉ hiện một lần), cùng Account ID.

### 2. Điền `.env` trên server (`/opt/keemori/.env`)

```bash
R2_ACCOUNT_ID=...
R2_BUCKET=keemori-uploads
R2_STAGING_BUCKET=keemori-staging
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
# Giữ nguyên STORAGE_DRIVER=local ở bước này.
```

Restart backend để nó đọc biến mới (driver vẫn là `local`, chưa đổi gì với
khách):

```bash
ssh keemori 'cd /opt/keemori && docker compose up -d --no-deps backend'
```

### 3. Cấu hình bucket tạm (CORS + lifecycle)

Chạy từ máy local, script đi qua stdin nên không phải chép lên server:

```bash
ssh keemori 'cd /opt/keemori && docker compose exec -T backend node -' < ops/r2/configure-buckets.cjs
```

Nếu R2 từ chối lệnh lifecycle, đặt tay: `keemori-staging` → Settings → Object
lifecycle rules → xoá mọi object sau **1 ngày**. CORS tay: AllowedOrigins =
`PUBLIC_WEB_URL`, AllowedMethods = `PUT`, AllowedHeaders = `content-type`.

### 4. Chép ảnh cũ

```bash
# Xem trước
ssh keemori 'cd /opt/keemori && docker compose exec -T -e DRY_RUN=1 backend node -' < ops/r2/sync-local-uploads.cjs
# Chép thật
ssh keemori 'cd /opt/keemori && docker compose exec -T backend node -' < ops/r2/sync-local-uploads.cjs
```

Kiểm một tệp qua custom domain: `curl -I https://media.keemori.com/uploads/<một khoá vừa in ra>`
phải trả `200` và `cache-control: public, max-age=31536000, immutable`.

### 5. Đổi driver

**Trước tiên**: GitHub → Settings → Secrets and variables → Actions →
Variables, thêm `UPLOADS_ORIGIN=https://media.keemori.com`, rồi deploy lại
frontend + dashboard. Rewrite `/uploads/*` bị Next ghi vào
`routes-manifest.json` **lúc build**; chỉ đặt `UPLOADS_ORIGIN` trong `.env` rồi
restart thì image cũ vẫn trỏ `/uploads` về backend, và mọi ảnh tải lên sau khi
đổi driver (chỉ nằm trên R2) thành 404. Kiểm image mới đã đúng chưa:

```bash
ssh keemori 'cd /opt/keemori && docker compose exec -T frontend node -e "const m=require(\"./.next/routes-manifest.json\");console.log(JSON.stringify(m.rewrites).match(/[^\"]*uploads\/:path\*/g))"'
```

Phải thấy `https://media.keemori.com/uploads/:path*` rồi mới đổi driver:

```bash
# /opt/keemori/.env
STORAGE_DRIVER=r2
UPLOADS_ORIGIN=https://media.keemori.com
```

```bash
ssh keemori 'cd /opt/keemori && docker compose up -d --no-deps backend frontend dashboard'
```

Rồi chạy lại bước 4 (lần này chỉ vét những ảnh tải lên trong vài phút chuyển).

### 6. Kiểm

- Mở một thiệp cũ có ảnh: ảnh hiện, tab Network cho thấy `/_next/image?url=/uploads/...` trả 200.
- Editor, **chưa đăng nhập**: chọn một ảnh → tab Network có một `PUT` tới `*.r2.cloudflarestorage.com` (khoá `raw/...`) trả 200 (lỗi CORS ở đây = bước 3 chưa đúng origin).
- Đăng nhập, bấm Lưu → ảnh của thiệp mới trỏ về `/uploads/cards/...`.

### 7. Phục vụ ảnh thẳng từ R2 (Worker)

Sau bước 5, ảnh đã **lưu** trên R2 nhưng vẫn **đi qua VPS**: `/uploads/*` vào
Next, và rewrite trong `next.config.ts` là proxy chứ không phải redirect.
`uploads-worker/` chặn route `keemori.com/uploads/*` ở biên Cloudflare và đọc
thẳng từ bucket, có Cache API để không mỗi lượt xem là một lượt đọc tính tiền.

Chỉ làm **sau** khi đã chép vét ảnh lần hai ở bước 5 — từ lúc route bật, ảnh nào
còn nằm trên đĩa VPS là 404.

```bash
cd ops/r2/uploads-worker && npx wrangler login && npx wrangler deploy
```

Kiểm: `curl -sI https://keemori.com/uploads/<một khoá>` không còn header
`x-powered-by: Express`, và gọi lần hai thì `cf-cache-status: HIT`. Gỡ route
trong dashboard (Workers → keemori-uploads → Settings → Domains & Routes) là
quay về đường qua VPS ngay.

### Quay lại `local`

Đặt lại `STORAGE_DRIVER=local`, bỏ `UPLOADS_ORIGIN`, restart ba service. Ảnh
tải lên **sau** lúc chuyển sang R2 chỉ nằm trên R2 — chép ngược bằng
`rclone`/`aws s3 sync` trước khi quay lại, nếu không những ảnh đó sẽ 404.

## Hạ tầng VPS nên làm kèm

VPS có 2 vCPU, ~3,5GB RAM trống, **không có swap** và container không có giới
hạn RAM. Worker nén ảnh đã chạy ở process riêng với `nice 10` và một luồng
`libvips`, nhưng hết RAM thì hệ điều hành vẫn giết process to nhất mà không báo
trước. Thêm 2GB swap để có chỗ đệm:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# Chỉ dùng swap khi thật sự cần, không đẩy RAM đang nóng ra đĩa.
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf && sudo sysctl --system
```
