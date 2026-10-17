#!/usr/bin/env bash
# Đăng ký backup.sh với launchd để chạy mỗi ngày. Chạy lại được nhiều lần.
#
# Dùng launchd chứ không crontab: máy đang ngủ đúng giờ hẹn thì launchd chạy bù
# ngay khi máy thức, còn cron bỏ lỡ luôn lượt đó.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LABEL="com.keemori.sukien.db-backup"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

[ -f "$SCRIPT_DIR/.env" ] || { echo "Tạo $SCRIPT_DIR/.env từ .env.example trước." >&2; exit 1; }
# shellcheck source=/dev/null
. "$SCRIPT_DIR/.env"
HOUR="${BACKUP_HOUR:-22}"
MINUTE="${BACKUP_MINUTE:-0}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/Backups/sukien-keemori/db}"
mkdir -p "$BACKUP_DIR" "$HOME/Library/LaunchAgents"
chmod +x "$SCRIPT_DIR/backup.sh"
chmod 600 "$SCRIPT_DIR/.env"

cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SCRIPT_DIR/backup.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>$HOUR</integer>
    <key>Minute</key><integer>$MINUTE</integer>
  </dict>
  <key>StandardOutPath</key><string>$BACKUP_DIR/launchd.log</string>
  <key>StandardErrorPath</key><string>$BACKUP_DIR/launchd.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Đã cài $LABEL, chạy lúc $(printf '%02d:%02d' "$HOUR" "$MINUTE") mỗi ngày."
echo "Chạy thử ngay: launchctl kickstart gui/$(id -u)/$LABEL"
