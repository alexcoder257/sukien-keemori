@AGENTS.md

# Keemori — CMS (dashboard)

Khu quản trị của Keemori. **App Next.js riêng**, tách khỏi
`frontend/` (trang khách) và dùng chung backend NestJS ở `backend/`. Cả ba nằm
chung repo `thiep-cuoi-online`.

Đây là source of truth về vị trí đặt code của thư mục này. Phạm vi tính năng ở
[`spec.md`](./spec.md); hiện trạng triển khai ở
[`features-done.md`](./features-done.md).

## 1. Vì sao tách app

Trang khách và CMS có hai vòng đời khác nhau: trang khách là sản phẩm SEO, nặng
ảnh, nhiều art direction và deploy theo đợt marketing; CMS là công cụ nội bộ,
`noindex`, deploy theo nhu cầu vận hành. Chung một app thì mỗi lần sửa một nút
trong CMS lại phải build lại toàn bộ kho mẫu thiệp.

Chung repo nhưng **build và deploy độc lập**: `dashboard/` có `package.json`,
`node_modules` và lệnh build riêng, không dính vào build của `frontend/`.

Hệ quả cần nhớ: **không import xuyên app**. Thứ gì cả hai bên cùng cần
(`apis/http.ts`, `constants/role.ts`, token dịch) hiện đang là **bản sao có
chủ đích**. Sửa một bên thì sang bên kia sửa nốt.

## 2. Non-negotiable rules

- File/folder: **kebab-case**. Component/class/type: **PascalCase**.
  Function/variable/hook: **camelCase**; hook bắt đầu bằng `use`.
- Dùng alias `@/`; không relative import dài.
- Page/layout mỏng; business logic nằm đúng layer.
- Không hard-code secret, environment URL hoặc text đa ngôn ngữ.
- Text hiển thị phải có ở cả `dictionaries/vi.json` và `en.json`.
- Next.js 16: đọc guide trong `node_modules/next/dist/docs/` trước khi đụng vào
  hành vi của framework.

## 3. Cấu trúc

```text
dashboard/
├── app/[locale]/            # routes; app này KHÔNG có prefix /admin
├── apis/                    # hàm HTTP client-side
├── assets/fonts/            # chỉ Inter
├── components/
│   ├── admin/               # component của khu quản trị
│   ├── auth/                # màn đăng nhập
│   ├── shared/              # dùng ở 2+ chỗ
│   └── ui/                  # Ant Design primitive wrappers
├── constants/
├── contexts/                # provider toàn app
├── dictionaries/            # vi.json, en.json
├── hooks/                   # React Query hooks
├── i18n/
├── lib/
│   ├── data/                # helper server-only (serverFetch, session)
│   └── schemas/<domain>/    # Zod
├── styles/components/ui/    # override shadcn toàn cục
└── proxy.ts                 # locale redirect + gác phiên
```

| Code | Vị trí bắt buộc |
|---|---|
| Route, layout, metadata | `app/[locale]/...` |
| Hàm gọi backend | `apis/<domain>.ts` |
| React Query query/mutation | `hooks/use-<domain>.ts` |
| Zod schema | `lib/schemas/<domain>/` |
| Helper server-only | `lib/data/` |
| Ant Design primitive wrapper | `components/ui/` |
| Component quản trị | `components/admin/` |

## 4. Route

App này **là** khu quản trị, nên URL không lặp lại `/admin`:
`/vi` (tổng quan) · `/vi/nguoi-dung` · `/vi/cai-dat` ·
`/vi/dang-nhap`. Sidebar và bản đồ 13 mục của spec nằm trong
`components/admin/admin-shell.tsx`; mục chưa dựng khai `path: null` để vẫn hiện
tên kèm biểu tượng khoá.

## 5. Đăng nhập và quyền

Người vận hành đăng nhập bằng email + mật khẩu của tài khoản trong bảng
`admin_users` ở backend (`modules/admin-auth/`), không bằng tài khoản khách.
Form (`components/auth/sign-in-form.tsx`) băm SHA-256 rồi gửi tới route handler
`POST /api/auth/login` của **chính dashboard**; route đó gọi backend từ server
(`lib/admin-auth.ts`) và đặt cookie. Ba route handler `app/api/auth/`
(`login`, `refresh`, `logout`) đều chuyển tiếp `X-Forwarded-For` để backend
throttle đăng nhập theo IP người dùng chứ không theo IP container;
`proxy.ts` bỏ qua `/api/` để chúng chạy được khi chưa có phiên.

Cookie: access token **không** `httpOnly` (`apis/http.ts` gắn `Authorization`
khi gọi thẳng backend); refresh token **`httpOnly`**. Vì vậy client gặp 401 thì
làm mới qua `POST /api/auth/refresh`, còn điều hướng trang thì `proxy.ts` tự
làm mới. Đăng xuất là form `POST /api/auth/logout`, thu hồi refresh token ở
backend rồi xoá cookie.

Đổi mật khẩu ở màn `/tai-khoan` (`components/admin/change-password-form.tsx`,
luật độ mạnh ở `lib/schemas/auth/change-password.ts` — backend chỉ thấy
SHA-256 nên không kiểm được). Backend thu hồi phiên khi đổi, nên form tự đăng
xuất và đưa về `/dang-nhap?notice=password_changed`.

Quyền là danh sách `AdminPermission` (`constants/permission.ts`, bản sao của
backend) đọc từ claim `permissions` trong token (`getAdminSession()` ở
`lib/data/session.ts`). Mỗi mục sidebar khai `requires`
là quyền mà màn đó cần. Quyền ở đây chỉ để **chọn giao diện**: `proxy.ts` chỉ
gác *đã đăng nhập hay chưa* và token đọc ở edge không được verify chữ ký. Quyền
thật do backend thực thi bằng `@Permissions(...)` — ẩn một mục nav không làm
route sau nó an toàn.

## 6. Design system

**CMS dùng theme mặc định của Ant Design, không dùng bảng màu thương hiệu.**
Đây là quyết định có chủ đích: khu quản trị là công cụ nội bộ, người vận hành
ngồi cả ngày với bảng và form, nên giá trị nằm ở giao diện quen thuộc và tương
phản rõ — không phải ở việc nút Lưu trùng màu với trang khách. Bản map token cũ
(nền paper, primary deep-gold) bắt mọi component antd phải bị phủ class Tailwind
`!important` mới ra đúng tông, và chính lớp phủ đó làm giao diện rối.

Hệ quả cần nhớ:

- `contexts/antd-config-provider.tsx` khai **đúng hai thứ**: thuật toán màu
  (`defaultAlgorithm`/`darkAlgorithm`) và năm token bề mặt. Không có token thứ
  ba, và tuyệt đối không có hue thương hiệu. Muốn đổi diện mạo thì đổi bằng
  token của antd tại đây, đừng phủ class lên từng component.
- `app/globals.css` chỉ còn token trung tính **dịch từ antd** (seed `#1677ff`
  ở nền sáng, `#1668dc` ở nền tối) sang tên ngữ nghĩa, để class Tailwind trong
  `components/admin/` khớp với component antd đứng cạnh. Không thêm hue mới;
  cần màu thì lấy preset antd.
- Bảng màu thương hiệu (7 màu, `.theme-paper`/`.theme-forest`) và thang chữ
  khổ trang chủ **không còn ở repo này** — chúng thuộc về `frontend/`.
- **Ngoại lệ duy nhất: trang đăng nhập** (`components/auth/sign-in-panel.tsx`
  + `sign-in-page.module.css`) mang diện mạo Keemori — Forest Ink, Champagne,
  Playfair Display, logo lấy qua rewrite `/images/*`. Cố ý **không có ảnh
  minh hoạ**: cửa vào công cụ nội bộ, không phải trang marketing. Màu khai gọn
  trong CSS Module đó, trang luôn tối và không theo nút sáng/tối. Đây là cửa
  vào chứ không phải màn làm việc; đừng kéo token hay font của nó sang màn khác.

**CMS có chế độ sáng/tối.** `next-themes` gắn `.light`/`.dark` lên `<html>`;
nút chuyển nằm cuối sidebar (`components/shared/theme-toggle.tsx`, bản sao có
chủ đích của bản bên `frontend/`). Mặc định là *theo hệ thống*.

Màu của hai chế độ nằm ở **hai nơi phải khớp nhau bằng tay**: token CSS ở
`app/globals.css` tô cho class Tailwind, thuật toán antd ở
`contexts/antd-config-provider.tsx` tô cho component antd. Lệch một bậc thì
thấy ngay — một `Table` nền `#141414` nằm trên một thẻ nền `#1f1f1f`.

**Ba bậc bề mặt, không phải hai**: nền trang → thẻ → lớp nổi (popover, modal,
dropdown). Mặc định của antd để nền trang `#f5f5f5` dưới thẻ `#ffffff`
(1.05:1) và ở chế độ tối là `#000` dưới `#141414` (1.11:1) — cả hai đều dưới
ngưỡng mắt đọc ra ranh giới, nên một màn toàn form đọc ra như một mảng phẳng.
Giá trị đang dùng: sáng `#eef0f4`/`#ffffff`/`#ffffff`, tối
`#141414`/`#1f1f1f`/`#2a2a2a`, mỗi bậc kèm viền riêng và thẻ kèm
`shadow-card`.

Hai chỗ cố ý lệch khỏi mặc định antd, cả hai vì tương phản chữ:
`--muted-foreground` là `rgba(0,0,0,.56)` chứ không phải `.45` (`.45` chỉ được
~4.0:1 trên nền trắng, trượt AA ở cỡ 12–14 mà CMS dùng cho mọi dòng phụ), và
bản tối là `rgba(255,255,255,.6)` chứ không phải `.45`.

**Khác biệt kiến trúc UI với `frontend/`.** `dashboard/` chạy Tailwind + **Ant
Design** (`antd`) thay vì Tailwind + shadcn/Base UI như `frontend/`. Quyết định
này chốt lúc debug bug "select thô kẹt chữ mũi tên OS" ở `/vi/nguoi-dung` —
người dùng chọn thay hẳn cách dựng UI của CMS thay vì vá từng chỗ. `components/
ui/` ở đây bọc mỏng component `antd` và **chỉ map prop, không tô màu**:
`Button` map `variant`/`size` sang `type`/`danger`/`size` của antd, `Badge` là
`Tag` với preset màu antd, `Dialog` là `Modal` dùng nguyên nút đóng và padding
của nó, `AdminTable` là `Table` không override class. `input.tsx`/`textarea.tsx`
là ngoại lệ có lý do: phải là thẻ HTML thuần thì `register()` của React Hook
Form mới hiện được `defaultValues`/`reset`, nên class của chúng **chép lại diện
mạo mặc định của `antd.Input`** (cao 32px, bo 6px, viền `#d9d9d9`) — sửa gì thì
đối chiếu với một `antd.Input` thật. Toast dùng antd `message`/`notification`
qua `App.useApp()`, không dùng `sonner`. Form dùng React Hook Form + Zod như
`frontend/`. Không copy component `ui/` giữa hai app: chúng là hai hệ thống
thiết kế khác nhau.

**Cột "Thao tác" của mọi bảng dùng `ActionButton` trong `ActionGroup`**
(`components/ui/action-button.tsx`): ô vuông chỉ có icon, nền nhạt theo sắc
(`filled`), đậm hẳn khi rê chuột, tên thao tác ở tooltip và `aria-label`.
Không đặt nút có chữ hay nút `outline` vào cột thao tác nữa. Sắc chọn theo
**nghĩa**: `view` xem, `primary` sửa, `success` duyệt/khôi phục/lưu, `warning`
tạm dừng/thu hồi, `danger` xoá/từ chối — đều là preset màu antd. Thao tác cần
nhập thêm hoặc hạ quyền (ví dụ xoá kèm lý do) mở một bước xác
nhận ngay dưới dãy nút, không làm luôn từ một cú bấm vào ô icon nhỏ.

## 7. Chạy và kiểm tra

```bash
npm install
npm run dev     # cổng 3002 (frontend 3000, backend 3001)
npm run lint
npm run build
```

Cần backend chạy ở `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:3001`) đã
chạy migration — migration `CreateAdminUsers` tạo sẵn tài khoản đầu tiên.

Repo chưa có test; đừng ghi là đã chạy test.
