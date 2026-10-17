# Keemori — CMS

Khu quản trị (dashboard) của Keemori. Next.js 16 + React Query +
Tailwind v4, dùng chung backend NestJS với trang khách.

## Chạy

```bash
npm install
cp .env.example .env   # trỏ NEXT_PUBLIC_API_URL vào backend
npm run dev            # http://localhost:3002
```

Backend phải đang chạy (mặc định `http://localhost:3001`). Đăng nhập bằng tài
khoản có quyền `admin` hoặc `super_admin`.

| App | Cổng dev |
|---|---|
| `frontend/` (trang khách) | 3000 |
| `backend/` (NestJS) | 3001 |
| `dashboard/` (repo này) | 3002 |

## Tài liệu

- [`spec.md`](./spec.md) — 13 mục yêu cầu của CMS và trạng thái triển khai.
- [`features-done.md`](./features-done.md) — tổng hợp feature backend + CMS đã làm.
- [`CLAUDE.md`](./CLAUDE.md) — quy ước đặt code.

## Lệnh

```bash
npm run lint
npm run build
```
