# syntax=docker/dockerfile:1

# Biên dịch JS bằng CPU máy build; native dependency runtime cài riêng cho server.
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=info

FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ==========================================================================
# Mọi biến `NEXT_PUBLIC_*` phải là **build arg**, không phải biến runtime.
#
# Next.js thay thế `process.env.NEXT_PUBLIC_*` bằng giá trị chuỗi **ngay lúc
# build** để nhét vào bundle chạy trong trình duyệt. Truyền chúng ở
# `environment:` của compose là không có tác dụng gì: bundle đã đóng băng giá
# trị cũ, và triệu chứng là trình duyệt gọi API vào `http://localhost:3001`
# trên máy của khách chứ không phải máy chủ.
#
# Hệ quả trực tiếp: **đổi tên miền là phải build lại image**, không phải khởi
# động lại container. Đây là chỗ khác biệt lớn nhất giữa Next và backend Nest
# trong cùng một dây chuyền deploy.
#
# `NEXT_PUBLIC_API_URL` phải là địa chỉ **trình duyệt của khách gọi tới được**
# — không bao giờ là `http://backend:3001`: tên đó chỉ tồn tại bên trong mạng
# của Docker.
# ==========================================================================
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
ARG NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY=
ARG NEXT_PUBLIC_GA_ID=
ARG NEXT_PUBLIC_INVITATION_MUSIC_AUTOPLAY=true
# `UPLOADS_ORIGIN` là nơi rewrite `/uploads/*` trỏ tới. Rewrite bị ghi vào
# `.next/routes-manifest.json` **lúc build** — đặt biến này lúc chạy container
# không đổi được gì (đã thử: production vẫn trỏ về backend sau khi restart).
# Để trống thì rơi về `NEXT_PUBLIC_API_URL`, tức backend. Xem ops/r2/README.md.
ARG UPLOADS_ORIGIN=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY \
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_INVITATION_MUSIC_AUTOPLAY=$NEXT_PUBLIC_INVITATION_MUSIC_AUTOPLAY \
    UPLOADS_ORIGIN=$UPLOADS_ORIGIN \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --loglevel=info

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY package.json next.config.ts tsconfig.json ./
# `next.config.ts` được đánh giá lúc **khởi động server**, nên nó kéo theo
# `apis/config.ts` (chỗ khai `API_BASE_URL`). Thiếu thư mục này thì container
# chết ngay lúc start với lỗi module not found.
COPY --from=build /app/apis/config.ts ./apis/config.ts
# next.config.ts imports these modules at runtime as well as during build.
COPY --from=build /app/constants/opening-artwork.ts ./constants/opening-artwork.ts
# Fail the image build if a runtime config dependency was omitted from COPY.
RUN node -e "require('next/dist/server/config').default('phase-production-server', process.cwd()).then(() => console.log('Runtime Next config OK')).catch(e => { console.error(e); process.exit(1); })"


# Tối ưu về sau nếu image nặng: bật `output: "standalone"` trong `next.config.ts`
# rồi copy `.next/standalone` thay cho `node_modules` — bỏ được vài trăm MB.
# Chưa làm ở đây vì nó sửa một file cấu hình của app, không phải của hạ tầng.

# `.next/cache` là nơi Next ghi Data Cache lúc chạy (kết quả `fetch` có
# `revalidate`/`tags`). Layer `COPY` tạo file thuộc về root, nhưng tiến trình
# chạy bằng user `node` — thiếu dòng này thì mọi lượt ghi cache đều
# `EACCES: permission denied` và **toàn bộ cache phía server ngừng hoạt động**:
# trang vẫn hiện đúng nên không ai nhận ra, chỉ có database phải gánh lại từng
# lượt xem một.
RUN mkdir -p .next/cache && chown -R node:node .next

USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
