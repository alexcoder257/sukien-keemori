#!/usr/bin/env sh
# Tạo (hoặc gán thêm vai trò cho) một tài khoản CMS trong realm keemori-admin.
#
#   ops/keycloak/create-cms-user.sh <email> <vai-trò> [compose-file]
#
#   vai-trò: cms-super-admin | cms-admin | cms-editor | cms-support | cms-accountant
#   compose-file: mặc định ops/keycloak/compose.dev.yml; production truyền
#                 docker-compose.yml (chạy ở thư mục chứa file đó).
#
# Mật khẩu tạm được in ra một lần; người dùng **bắt buộc** đổi mật khẩu và cài
# ứng dụng OTP ở lần đăng nhập đầu. Script đăng nhập kcadm bằng tài khoản
# bootstrap admin (KC_BOOTSTRAP_ADMIN_* / KEYCLOAK_ADMIN_*).
set -eu

EMAIL="${1:?Thiếu email}"
ROLE="${2:?Thiếu vai trò (vd. cms-super-admin)}"
COMPOSE_FILE="${3:-$(dirname "$0")/compose.dev.yml}"
REALM=keemori-admin

kc() {
  docker compose -f "$COMPOSE_FILE" exec -T keycloak /opt/keycloak/bin/kcadm.sh "$@"
}

ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
kc config credentials --server http://localhost:8080 --realm master \
  --user "$ADMIN_USER" --password "$ADMIN_PASSWORD" >/dev/null

USER_ID="$(kc get users -r "$REALM" -q "email=$EMAIL" -q exact=true --fields id --format csv --noquotes | head -n 1)"
if [ -z "$USER_ID" ]; then
  TEMP_PASSWORD="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 12)Aa1"
  kc create users -r "$REALM" \
    -s "username=$EMAIL" -s "email=$EMAIL" -s emailVerified=true -s enabled=true \
    -s 'requiredActions=["UPDATE_PASSWORD","CONFIGURE_TOTP"]' >/dev/null
  kc set-password -r "$REALM" --username "$EMAIL" --new-password "$TEMP_PASSWORD" --temporary
  echo "Đã tạo $EMAIL — mật khẩu tạm: $TEMP_PASSWORD"
else
  echo "$EMAIL đã tồn tại, chỉ gán thêm vai trò."
fi

kc add-roles -r "$REALM" --uusername "$EMAIL" --rolename "$ROLE"
echo "Đã gán $ROLE cho $EMAIL."
