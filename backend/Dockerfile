# syntax=docker/dockerfile:1

# Debian slim chứ không phải Alpine, và đây là quyết định có lý do chứ không
# phải mặc định: `bcrypt` và `sharp` đều là native module. Alpine dùng musl nên
# phải tải đúng bản binary musl — `sharp` có, nhưng `bcrypt` thì phải biên dịch
# lại bằng node-gyp, tức phải cài python3 + make + g++ vào image. Chênh lệch
# dung lượng không bù nổi cho một dây chuyền build hay hỏng.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` chứ không `npm install`: lockfile là thứ quyết định, và `ci` sẽ báo
# lỗi khi lockfile lệch package.json thay vì lặng lẽ sửa nó.
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `nest build && tsc-alias` — `tsc-alias` viết lại các alias `@modules/*` thành
# đường dẫn tương đối, nếu không thì `node dist/main` không resolve được.
RUN npm run build

# Chỉ giữ dependency production từ cây đã cài để runtime không chứa công cụ build.
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Ảnh khách tải lên nằm ở đây khi `STORAGE_DRIVER=local` (xem `main.ts` →
# `useStaticAssets`). Thư mục phải thuộc về user `node`, vì tiến trình không
# chạy bằng root — và compose gắn một named volume đè lên đúng đường dẫn này.
# Không có volume thì mọi ảnh khách tải lên biến mất sau mỗi lần deploy.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
# Vùng tạm của ảnh editor khi `STORAGE_DRIVER=local` (`LocalStagingStorage`).
# Cố ý **không** gắn volume: đây là tệp tạm, deploy làm mất thì editor gửi lại
# từ bản còn trong trình duyệt. `/app` thuộc root nên phải tạo sẵn ở đây.
RUN mkdir -p /app/uploads-staging && chown -R node:node /app/uploads-staging

USER node
EXPOSE 3001
CMD ["node", "dist/main"]
