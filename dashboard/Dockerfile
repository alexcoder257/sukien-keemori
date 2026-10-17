# syntax=docker/dockerfile:1

# Biên dịch JS bằng CPU máy build; native dependency runtime cài riêng cho server.
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=keemori-npm-build,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund --loglevel=info --fetch-timeout=60000 --fetch-retries=2

FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Xem chú thích dài trong `frontend/Dockerfile`: `NEXT_PUBLIC_*` bị đóng băng
# vào bundle lúc build, nên đổi tên miền là phải build lại image chứ không phải
# restart container.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
# Rewrite được ghi vào .next/routes-manifest.json lúc build. Trong Docker,
# localhost là chính CMS; mặc định dùng service frontend cùng mạng Compose.
ARG SITE_ORIGIN=http://frontend:3000
# `UPLOADS_ORIGIN` là nơi rewrite `/uploads/*` trỏ tới. Rewrite bị ghi vào
# `.next/routes-manifest.json` **lúc build** — đặt biến này lúc chạy container
# không đổi được gì (đã thử: production vẫn trỏ về backend sau khi restart).
# Để trống thì rơi về `NEXT_PUBLIC_API_URL`, tức backend. Xem `frontend/Dockerfile`.
ARG UPLOADS_ORIGIN=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    SITE_ORIGIN=$SITE_ORIGIN \
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
COPY package.json next.config.ts tsconfig.json ./
# `next.config.ts` kéo theo `apis/config.ts` lúc khởi động server.
COPY --from=build /app/apis/config.ts ./apis/config.ts

# Không copy `public/` — CMS không có thư mục đó.

# `.next/cache` là nơi Next ghi Data Cache lúc chạy (kết quả `fetch` có
# `revalidate`/`tags`). Layer `COPY` tạo file thuộc về root, nhưng tiến trình
# chạy bằng user `node` — thiếu dòng này thì mọi lượt ghi cache đều
# `EACCES: permission denied` và **toàn bộ cache phía server ngừng hoạt động**:
# trang vẫn hiện đúng nên không ai nhận ra, chỉ có database phải gánh lại từng
# lượt xem một.
RUN mkdir -p .next/cache && chown -R node:node .next

USER node
EXPOSE 3002
# `start` của dashboard đã kèm `--port 3002` (xem package.json): CMS và trang
# khách chạy song song trên cùng một máy dev nên không dùng chung cổng được.
CMD ["npm", "run", "start"]
