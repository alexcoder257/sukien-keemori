# Backup database production

Chạy trên **máy cá nhân**, không chạy trên server: mỗi ngày launchd gọi
`backup.sh`, script SSH vào `keemori`, chạy `pg_dump` bên trong container
Postgres rồi kéo file về `BACKUP_DIR`. Chỉ giữ `BACKUP_KEEP` bản mới nhất, và
bản cũ chỉ bị xoá **sau khi** bản mới đã được `pg_restore --list` đọc lại được —
một lượt hỏng không bao giờ đẩy mất bản tốt. Thành công hay thất bại đều báo qua
Telegram.

## Cài

```bash
cp .env.example .env     # điền TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
./install.sh
launchctl kickstart gui/$(id -u)/com.keemori.sukien.db-backup   # chạy thử ngay
tail -f ~/Backups/sukien-keemori/db/backup.log
```

Gỡ: `launchctl bootout gui/$(id -u)/com.keemori.sukien.db-backup && rm ~/Library/LaunchAgents/com.keemori.sukien.db-backup.plist`

Máy tắt hẳn đúng giờ hẹn thì lượt đó bị bỏ; máy chỉ ngủ thì launchd chạy bù khi
thức dậy.

## Khôi phục

Thử trên database local trước, đừng đổ thẳng lên production:

```bash
createdb keemori_restore_test
pg_restore --no-owner -d keemori_restore_test ~/Backups/sukien-keemori/db/keemori-db-<stamp>.dump
```

Đổ lên production (ghi đè dữ liệu đang có):

```bash
ssh keemori 'cid=$(docker ps -q -f label=com.docker.compose.service=postgres -f label=com.docker.compose.project=sukien-keemori);
  docker exec -i "$cid" sh -c "pg_restore --clean --if-exists --no-owner -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\""' \
  < ~/Backups/sukien-keemori/db/keemori-db-<stamp>.dump
```

## Không nằm trong bản backup

Ảnh người dùng tải lên (`STORAGE_DRIVER=local`, volume `backend-uploads`) **không**
có trong dump — database chỉ giữ đường dẫn `/uploads/...` tới chúng.
