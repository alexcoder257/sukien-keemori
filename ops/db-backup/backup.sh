#!/usr/bin/env bash
# Kéo bản dump Postgres production về máy này, giữ tối đa $BACKUP_KEEP bản, báo
# kết quả qua Telegram. launchd gọi script này mỗi ngày (xem install.sh).
#
# Viết cho bash 3.2 mặc định của macOS: không mapfile, không mảng kết hợp.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# launchd chạy với PATH tối thiểu, không thấy pg_restore của Homebrew.
export PATH="/opt/homebrew/opt/postgresql@16/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "Thiếu $SCRIPT_DIR/.env — copy từ .env.example rồi điền." >&2
  exit 1
fi
# shellcheck source=/dev/null
. "$SCRIPT_DIR/.env"

SSH_HOST="${SSH_HOST:-keemori}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-sukien-keemori}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/Backups/sukien-keemori/db}"
BACKUP_KEEP="${BACKUP_KEEP:-2}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

mkdir -p "$BACKUP_DIR"
LOG_FILE="$BACKUP_DIR/backup.log"
exec >>"$LOG_FILE" 2>&1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

notify() {
  if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    log "Bỏ qua Telegram: chưa cấu hình TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID"
    return 0
  fi
  # Lỗi gửi tin không được làm hỏng một bản backup đã xong.
  curl -sS --fail --max-time 20 -o /dev/null \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=$1" || log "Gửi Telegram thất bại"
}

# Chống hai lượt chạy chồng nhau (launchd bù lượt lỡ + chạy tay cùng lúc).
LOCK_DIR="$BACKUP_DIR/.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "Đang có một lượt backup khác chạy, bỏ qua"
  exit 0
fi

STAMP="$(date '+%Y%m%d-%H%M%S')"
PARTIAL="$BACKUP_DIR/.partial-$STAMP.dump"
FINAL="$BACKUP_DIR/keemori-db-$STAMP.dump"
STARTED_AT="$(date +%s)"

cleanup() {
  rm -f "$PARTIAL"
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT

on_error() {
  local line="$1"
  log "THẤT BẠI ở dòng $line"
  notify "❌ Keemori DB backup THẤT BẠI ($(hostname -s), $(date '+%d/%m/%Y %H:%M'))
Dòng $line. Bản cũ vẫn giữ nguyên.
Log cuối:
$(tail -n 8 "$LOG_FILE")"
}
trap 'on_error $LINENO' ERR

log "Bắt đầu backup $SSH_HOST"

# pg_dump chạy **trong** container Postgres: đúng phiên bản server, và
# user/database đọc từ env của chính container nên máy này không giữ mật khẩu
# DB nào. -Fc là định dạng nén, khôi phục chọn lọc được bằng pg_restore.
ssh -o BatchMode=yes -o ConnectTimeout=20 -o ServerAliveInterval=30 "$SSH_HOST" \
  "set -e
   cid=\$(docker ps -q -f label=com.docker.compose.project=$COMPOSE_PROJECT -f label=com.docker.compose.service=postgres)
   [ -n \"\$cid\" ] || { echo 'Không tìm thấy container postgres' >&2; exit 3; }
   docker exec \"\$cid\" sh -c 'pg_dump -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -Fc --no-owner'" \
  >"$PARTIAL"

# Kiểm tra bản dump đọc được trước khi coi là thành công — một file rỗng hay
# cụt mà vẫn xoay vòng thì sẽ đẩy mất bản tốt cuối cùng.
[ -s "$PARTIAL" ] || { log "File dump rỗng"; false; }
TOC="$(pg_restore --list "$PARTIAL")"
TABLES="$(printf '%s\n' "$TOC" | grep -c ' TABLE DATA ' || true)"
[ "$TABLES" -gt 0 ] || { log "Dump không có bảng dữ liệu nào"; false; }

mv "$PARTIAL" "$FINAL"
SIZE="$(du -h "$FINAL" | cut -f1 | tr -d ' ')"

# Xoay vòng chỉ sau khi bản mới đã hợp lệ. Tên file mang timestamp nên sắp xếp
# theo tên cũng là theo thời gian.
COUNT="$(ls -1 "$BACKUP_DIR"/keemori-db-*.dump | wc -l | tr -d ' ')"
REMOVED=""
if [ "$COUNT" -gt "$BACKUP_KEEP" ]; then
  for old in $(ls -1 "$BACKUP_DIR"/keemori-db-*.dump | sort | head -n $((COUNT - BACKUP_KEEP))); do
    rm -f "$old"
    REMOVED="$REMOVED $(basename "$old")"
    log "Đã xoá bản cũ $(basename "$old")"
  done
fi

ELAPSED=$(($(date +%s) - STARTED_AT))
log "Xong: $(basename "$FINAL") ($SIZE, $TABLES bảng, ${ELAPSED}s)"

notify "✅ Keemori DB backup thành công
📦 $(basename "$FINAL") — $SIZE, $TABLES bảng
⏱ ${ELAPSED}s
🗂 Đang giữ $(ls -1 "$BACKUP_DIR"/keemori-db-*.dump | wc -l | tr -d ' ')/$BACKUP_KEEP bản${REMOVED:+
🗑 Đã xoá:$REMOVED}"
