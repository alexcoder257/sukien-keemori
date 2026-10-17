# Keemori

SaaS tạo thiệp cưới online: chọn mẫu → nhập nội dung → nhận link/QR để chia sẻ.
Repo này gồm `frontend/` (Next.js, trang khách), `dashboard/` (Next.js, CMS) và
`backend/` (NestJS).

**Khu quản trị không nằm trong `frontend/`.** CMS là một ứng dụng Next.js
riêng ở thư mục `dashboard/`, có `CLAUDE.md` và `spec.md` của chính nó. Nó dùng
chung `backend/` nhưng không import gì từ `frontend/`: những thứ cả hai bên cùng
cần (`apis/http.ts`, `constants/role.ts`, chuỗi dịch) đang là **bản sao có chủ
đích**, sửa một bên thì phải sửa nốt bên kia. Đừng thêm route `/admin` vào
`frontend/`.

**Màu thì không dùng chung.** `dashboard/` chạy theme mặc định của Ant Design
(xem `dashboard/CLAUDE.md` mục 6); bảng 7 màu thương hiệu bên dưới chỉ áp dụng
cho `frontend/`.

Đây là **source of truth về vị trí đặt code**. Không tạo folder mới có trách
nhiệm trùng với folder đã quy định tại đây.

## 1. Non-negotiable rules

- File/folder: **kebab-case**.
- Component/class/type/interface: **PascalCase**.
- Function/variable/hook: **camelCase**; hook bắt đầu bằng `use`.
- Dùng import alias khi đi xuyên folder; không dùng relative import dài.
- Page/layout/controller phải mỏng; business logic nằm đúng layer.
- Không hard-code secret, environment URL hoặc text đa ngôn ngữ.
- Không sửa output: `node_modules/`, `.next/`, `dist/`, `coverage/`.
- Folder rỗng chỉ là structure dự kiến, không đồng nghĩa feature đã hoàn thành.

## 2. Project structure

```text
thiep-cuoi-online/
├── frontend/
│   ├── app/[locale]/            # routes, layouts, metadata
│   ├── apis/                    # HTTP functions
│   ├── assets/                  # fonts, icons, imported images
│   ├── components/
│   │   ├── ui/                  # shadcn primitives
│   │   ├── shared/              # cross-domain components
│   │   └── <domain>/            # domain components
│   ├── constants/
│   ├── contexts/                # global providers
│   ├── dictionaries/            # vi.json, en.json
│   ├── hooks/                   # React/React Query hooks
│   ├── i18n/
│   ├── lib/
│   │   ├── schemas/<domain>/    # Zod schemas
│   │   └── data/                # server-only data helpers
│   ├── public/                  # files served directly by URL
│   ├── stores/                  # local client UI state
│   ├── styles/components/ui/    # global shadcn overrides
│   └── proxy.ts                 # locale redirect + preliminary auth guard
│
├── dashboard/                   # CMS — app Next.js riêng, xem dashboard/CLAUDE.md
│
├── ops/                         # script vận hành chạy ngoài app (db-backup/, nginx/, r2/; keycloak/ đã ngừng dùng)
│
└── backend/
    ├── src/
    │   ├── common/              # reusable cross-domain building blocks
    │   ├── configuration/       # app/database/infrastructure config
    │   ├── constant/            # shared constants/error messages
    │   ├── cronjob/
    │   ├── filters/
    │   ├── migrations/
    │   ├── modules/<domain>/    # domain code
    │   └── seeders/
    └── test/                    # e2e tests
```

## 3. Frontend placement rules

| Code | Required location |
|---|---|
| Route, layout, metadata | `app/[locale]/...` |
| Trang 404 | `app/[locale]/not-found.tsx` |
| Error boundary của route | `app/[locale]/error.tsx` |
| Error boundary thay root layout | `app/global-error.tsx` |
| Skeleton khi chuyển route | `app/[locale]/<route>/(<group>)/loading.tsx`, xem mục Skeleton bên dưới |
| shadcn primitive | `components/ui/` |
| Domain component | `components/<domain>/` |
| Component shared by 2+ domains | `components/shared/` |
| Mẫu thiệp | `components/invitation/templates/<slug>/` |
| Block nhiều mẫu thiệp cùng dùng | `components/invitation/shared/` |
| Backend request function | `apis/<domain>.ts` |
| HTTP client, refresh token, API error | `apis/http.ts` |
| React Query query/mutation | `hooks/use-<domain>.ts` |
| Other React hook | `hooks/use-<name>.ts` |
| App-wide provider/context | `contexts/<name>-provider.tsx` |
| Zod schema | `lib/schemas/<domain>/` |
| Shared/framework helper | `lib/` |
| Constant | `constants/` or domain-local constants file |
| Translation | `dictionaries/vi.json` + `dictionaries/en.json` |
| Local font | `assets/fonts/` |
| Imported icon/image | `assets/icons/`, `assets/images/` |
| File accessed directly by URL | `public/` |
| Global shadcn override | `styles/components/ui/<component>.css` |
| Component-only CSS | colocated `*.module.css` |
| Cross-component local UI state | `stores/` |
| Bước chọn loại thiệp trước editor | route `app/[locale]/tao-thiep/`; danh sách loại, slug URL và block theo loại ở `constants/invitation.ts` |
| Công cụ miễn phí (`/cong-cu/*`) | route `app/[locale]/cong-cu/<slug>/`, khung chung + widget ở `components/tools/`, danh sách ở `constants/tools.ts` (nguồn cho trang tổng hợp và sitemap). Trang tĩnh: chữ giải thích và FAQ render ở server, widget chỉ là phần client |

### Frontend boundaries

- `app/`: routing/composition only; no long business logic.
- `apis/`: plain HTTP functions; no React hooks.
- `hooks/`: hooks only; API implementation stays in `apis/`.
- `contexts/`: providers only; no API or domain business logic.
- `stores/`: local UI state only; server state belongs to React Query.
- `components/ui/`: primitives only; no business components.
- `globals.css`: Tailwind imports, tokens, theme and base styles only.
- Do not use `assets/styles/` or add new helpers to `utils/`; use `styles/`
  and `lib/` respectively.

### Trang lỗi và 404

Cả `frontend/` lẫn `dashboard/` đều có đủ bộ, và hai bên là **bản sao có chủ
đích** như mọi thứ khác hai app cùng cần.

`not-found.tsx` **chỉ** bắt những chỗ code gọi `notFound()`. URL không khớp
route nào thì Next bỏ qua cây `[locale]` và trả trang 404 mặc định của
framework. Vá bằng một catch-all xếp cuối, `app/[locale]/[...rest]/page.tsx`,
chỉ gọi `notFound()` — nó kéo trường hợp đó về đúng trang 404 của mình mà vẫn
giữ nguyên layout, header và footer thật. Cách còn lại là
`experimental.globalNotFound`, đã cân nhắc và loại: trang đó bỏ qua vòng render
bình thường nên phải tự dựng `<html>`, tự nạp font, không có provider nào — tức
một trang 404 thứ hai trông khác hẳn, phải sửa hai chỗ mỗi lần đổi chữ.

Ba file này **không nhận `params`**, nên chúng không tự biết locale.
`error.tsx` (client) đọc `useParams()`. `not-found.tsx` (server) đọc
`getRequestLocale()` ở `i18n/request-locale.ts` — layout `[locale]` ghi locale
vào một `cache()` của React, trang 404 đọc ra. Trang 404 còn phân biệt link thiệp
đã chết (`/t/<slug>`) với một URL gõ sai — khách mời gặp link chết không gõ sai
gì cả, và người cấp lại link là cặp đôi chứ không phải trang chủ — việc đó nằm ở
`components/shared/not-found-note.tsx` (`usePathname()`).

**`not-found.tsx` không được đọc request** (`headers()`, `cookies()`,
`hasSession`). Next render sẵn nó trong payload của *mọi* page dưới `[locale]`
làm boundary dự phòng, nên một lời gọi như vậy biến mọi trang tĩnh thành lỗi
500 ở bản build. Cách cũ (proxy gắn `x-pathname`, `lib/data/request-path.ts`
đọc lại) đã bị gỡ vì đúng lý do đó.

Chữ nằm ở khoá **cấp cao nhất** `errors` trong `vi.json`/`en.json`, cố ý không
nằm trong `common`: `common` được truyền xuống header/footer nên nó bị serialize
vào payload của *mọi* trang.

`error.tsx` bắt buộc là Client Component, mà Client Component thì không nhận
props từ server — nên nó nạp chữ qua `i18n/error-dictionary.ts` (`import()`
động, chunk riêng, chỉ tải khi thật sự có lỗi). Đây là đường **duy nhất** được
phép đọc từ điển ở client. `global-error.tsx` thì viết chữ thẳng trong file:
nó thay cả root layout, nên nếu thứ vừa hỏng là app shell hoặc đường tải chunk
thì một `import()` nữa cũng hỏng nốt — sửa chữ ở đó phải sửa cả `errors.global`
cho khớp.

### Chuyển route: thanh tiến trình và skeleton

Không có lớp che toàn màn hình. Lớp che KEEMORI cũ (`PageLoader`) đã bị gỡ vì
nó cộng ~1.5s vào **mọi** lần chuyển trang, kể cả khi route sẵn sàng sau
200ms, và che luôn skeleton đúng lúc skeleton cần hiện. Giờ có hai lớp, mỗi
lớp một khoảng chờ:

- **Trước khi route commit**: `components/shared/navigation-progress.tsx`
  (`nextjs-toploader`). Thư viện chỉ tự bắt click `<a>`; `router.push` đi qua
  `onRouterTransitionStart` trong `instrumentation-client.ts`.
- **Sau khi commit, chờ dữ liệu**: `loading.tsx` của route. Next prefetch sẵn
  phần layout tới `loading.tsx` nên bấm là thấy skeleton gần như ngay.

`loading.tsx` bọc **bên trong** layout cùng segment, mà header/footer của các
trang khu marketing đang nằm trong `page.tsx` — đặt `loading.tsx` cạnh page
như vậy là skeleton thay luôn header và header nháy mỗi lần chuyển trang. Nên
route có skeleton phải chuyển page vào một route group có `layout.tsx` giữ
header, phần mở đầu và footer (mẫu: `app/[locale]/mau-thiep/(catalog)/`).
Group còn giữ layout đó khỏi route con như `[templateSlug]`.

Skeleton chép đúng lưới và breakpoint của component thật (mẫu:
`components/template/template-gallery-skeleton.tsx`), dựng từ primitive
`components/ui/skeleton.tsx`, và không có chữ — `loading.tsx` không nhận
`params` nên không biết locale. Không cần skeleton cho trang tĩnh (pháp lý,
bảng giá, FAQ): chúng render gần như tức thì.

### Trang tĩnh và trang động

Trang **public** (trang chủ, kho mẫu, trang mẫu, bảng giá, FAQ,
hướng dẫn, liên hệ, pháp lý) là **trang tĩnh**: dựng lần đầu khi có người vào,
cache lại (ISR), và làm mới khi admin bấm Lưu qua tag (`/api/revalidate`).
Nhờ vậy Next prefetch **trọn trang** cho link trong khung nhìn và trình duyệt
giữ nó 30 phút (`staleTimes` trong `next.config.ts`) — bấm link là tới, kể cả
trên 3G. Build **không** dựng sẵn trang nào: `generateStaticParams` của layout
`[locale]` và `mau-thiep/[templateSlug]` trả mảng rỗng, vì
`docker build` chạy trên máy không có backend.

Giữ một trang tĩnh nghĩa là trong cây render của nó **không có gì đọc
request**. Luật cụ thể:

- Không `hasSession()`/`getSessionRole()`/`cookies()`/`headers()`/
  `searchParams` trong page, layout hay component server của trang public.
- Trạng thái đăng nhập đọc ở client: `useSession()` (`hooks/use-session.ts`)
  trả `null` khi chưa biết — vẽ trạng thái trung tính, đừng coi `null` là
  "chưa đăng nhập". Giao diện theo vai trò dùng một component client chọn giữa
  hai nhánh đã render sẵn ở server.
- Query string: không gọi `useSearchParams()` thẳng trong component lớn (nó kéo
  cả cây phía trên về render ở client, mất HTML dựng sẵn). Dùng
  `SearchParamsListener`, hoặc đọc `window.location` lúc bấm
  (`lib/login-redirect.ts`).
- `fetch` ở server phải có `revalidate` (qua `serverFetch`); thiếu là `no-store`
  và trang thành động.
- **Không viết `<link rel="preload">` trong Server Component** của trang hay bị
  prefetch (trang chủ bị prefetch từ logo trên mọi trang). React đưa nó vào
  payload RSC thành resource hint và thực thi ngay cả với payload *prefetch* —
  từng khiến mọi trang âm thầm tải ~530KB ảnh hero, trên 3G request chuyển
  trang thật "Stalled" 24s xếp hàng sau nó. Đặt preload trong một Client
  Component (mẫu: `components/home/reveal/hero-preloads.tsx`): lúc mở thẳng
  trang vẫn được SSR lên `<head>`, lúc prefetch thì không chạy. Kiểm bằng
  `curl -H 'RSC: 1' -H 'Next-Router-Prefetch: 1' <url> | grep ':HL\['`.
- **Nội dung luôn render ở server.** Client chỉ được *chọn/ẩn* thứ đã có trong
  HTML (nhánh theo vai trò, bộ lọc từ URL, ô tài khoản) — không fetch nội dung
  ở client cho trang public. URL có bộ lọc (`?category=`, `?tier=`) canonical
  về trang gốc, và HTML của trang gốc phải chứa đủ mọi mục.

Trang **thật sự** cần request (`thiep-cua-toi`,
`dat-lai-mat-khau`…) phải khai `export const revalidate = 0` **tường minh**:
với `generateStaticParams` rỗng, lúc build Next không dựng thử trang nào nên
không tự phát hiện trang động, và bản build ném 500 "Page changed from static
to dynamic at runtime" ở lượt xem đầu. Dùng `revalidate = 0` chứ không
`force-dynamic` — cái sau tắt luôn cache của mọi `fetch` trong trang. Route có
segment động mà không khai `generateStaticParams` (`t/[slug]`, `editor/...`)
vốn đã động, không cần khai.

`next dev` render mọi thứ động nên **không báo** bất kỳ lỗi nào ở trên. Sửa gì
đụng tới trang public thì kiểm bằng `npm run build && npx next start`, rồi gọi
trang hai lần: lần hai phải có header `x-nextjs-cache: HIT`.

### Server/Client Components

- Page/layout is a Server Component by default.
- Add `"use client"` only for state, events, browser APIs, Context or React
  Query.
- Load dictionary in the Server Component and pass serializable props down.
- Do not turn a whole page/layout into a Client Component for one interactive
  child.
- This project uses Next.js 16. Before changing Next.js behavior, read the
  relevant guide in `frontend/node_modules/next/dist/docs/`.

### Fetch and React Query

```text
Client Component → hooks/ → apis/ → request()/fetch → Backend
```

- `fetch` is the transport; React Query manages cache/request lifecycle.
- Client data needing cache, refetch or mutation uses React Query.
- Server Components may use `fetch` or a server-only helper in `lib/data/`.
- Do not call the same endpoint with direct fetch and React Query in one Client
  Component.
- A mutation must update, invalidate or remove affected query cache.
- Keep query keys in the domain hook.
- `apis/http.ts` is currently client-only because it reads browser tokens.

### Forms, i18n and styles

- Forms: React Hook Form + Zod.
- Validation schema: `lib/schemas/<domain>/`; do not duplicate rules in UI.
- API errors: normalize through `ApiError`.
- User-facing text must exist in both `vi.json` and `en.json`.
- Use Tailwind for normal styling.
- Put complex component-only styles in a colocated CSS Module.
- Put each global shadcn override in its own file and import it once from
  `globals.css`.

### Design system

Nguồn token duy nhất là `frontend/app/globals.css`. Trang đối chiếu trực quan:
`/[locale]/design-system` (trang tham chiếu nội bộ, không phải trang sản phẩm).

- Bảng màu chỉ gồm 7 màu: `forest-ink`, `forest`, `forest-soft`, `champagne`,
  `deep-gold`, `ivory`, `paper`. Sắc độ khác phải tạo bằng opacity hoặc
  `color-mix`; không thêm hue mới.
- Ngoại lệ duy nhất: nhóm trạng thái chức năng `destructive` / `success` /
  `warning` — chỉ dùng cho phản hồi hệ thống (form, toast), không trang trí.
- Ô màu của bộ lọc kho mẫu (`TEMPLATE_COLOR_SWATCHES` trong
  `constants/invitation.ts`) cũng nằm ngoài 7 màu, vì nó là **dữ liệu** — vẽ
  màu của thiệp chứ không phải màu giao diện, cùng lý do với
  `DRESS_CODE_SUGGESTED_COLORS`. Mã hex chỉ sống ở hằng số đó (và bản sao ở
  `dashboard/constants/template.ts`), không đưa vào `globals.css`.
- Component dùng token ngữ nghĩa (`bg-primary`, `text-muted-foreground`,
  `border-input`), không gọi thẳng màu thương hiệu, trừ khi đúng là màu cố
  định của thương hiệu.
- **Website có chế độ sáng/tối; mẫu thiệp thì không.** Mặc định là **tối**, và
  `prefers-color-scheme` của trình duyệt **cố ý không được đọc**
  (`enableSystem={false}`): nền đen là art direction của website, không phải
  cài đặt hệ điều hành của khách. Người dùng đổi bằng nút ở header
  (`components/shared/theme-toggle.tsx`), `next-themes` gắn `.light` / `.dark`
  lên `<html>` và nhớ lựa chọn trong `localStorage`.

  Chế độ sáng là **giấy** (Paper · Ivory). Chế độ tối là **đen** (Forest Ink),
  các bề mặt nâng lên pha bằng Ivory ở vài phần trăm. `forest` và `forest-soft`
  vẫn là màu thương hiệu nhưng **không được dùng làm mảng nền lớn**: một mảng
  `#10261D` cỡ card trở lên đọc ra là xanh lam-lục, mà xanh lục đứng cạnh
  champagne thì hai màu triệt nhau — vàng mất độ ấm, xanh mất độ sâu. Đây là
  quyết định đã thử rồi mới chốt, đừng lặp lại.

  Vàng thương hiệu **đổi vai theo nền**, vì tương phản bắt nó phải đổi: Deep
  Gold ở nền sáng (6.29:1 trên Paper), Champagne ở nền tối (11.33:1, so với
  6.29:1 của Deep Gold trên Forest Ink). Chữ trên cả hai nút đều là Forest Ink —
  Ivory trên Deep Gold chỉ đạt 2.73:1 và từng làm CTA chính của website trượt
  AA. Chữ thân là Ivory chứ không phải trắng tinh: trắng trên Forest Ink cho
  19.5:1, vượt vùng dễ chịu và loé trên màn OLED.

  Mẫu thiệp bị chốt ở bề mặt sáng bằng `.theme-invitation`, class do
  `components/invitation/templates/template-typography.tsx` gắn lên **điểm vào
  duy nhất** của mọi tấm thiệp (trang khách, xem thử, demo, preview trong
  editor). Đây là chốt chặn chứ không phải quy ước phải nhớ: art direction của
  tấm thiệp là thứ cặp đôi chọn, khách mời không được bật/tắt nó bằng cài đặt
  trình duyệt của mình. Nút chuyển chế độ cũng không xuất hiện trên trang thiệp
  công khai.

- Hai bề mặt sản phẩm: `.theme-paper` (nền sáng) và `.theme-forest` (nền tối).
  Chúng là bề mặt **tuyệt đối** — không đổi theo chế độ — nên chỉ dùng ở chỗ art
  direction đã chốt một tông và cần giữ tương phản với khối bao quanh (footer
  luôn tối). Section
  muốn **đi theo chế độ người dùng chọn** thì không gắn class nào, chỉ gọi token
  (`bg-background`, `bg-card`). `<Card tone="light" | "dark">` cũng là ghim tuyệt
  đối; content card thường để mặc định `tone="inherit"`.

  **`.theme-forest` không dùng chung khai báo với `.dark`.** Hai cái từng giống
  hệt nhau, và hệ quả là ở chế độ tối footer cùng các chương nền tối chìm nghỉm
  vào nền trang — mất hẳn ranh giới. Giờ `.theme-forest` luôn đứng cao hơn nền
  trang một bậc. Tên class còn chữ "forest" nhưng bề mặt là **đen**, không phải
  xanh rừng; đổi tên thì phải sửa hơn hai chục chỗ gọi lẫn CSS Module của mẫu
  thiệp nên giữ tên cũ rẻ hơn.

- **Elevation không đến từ bậc nền.** Ba màu tối chỉ chênh nhau 1.22:1
  (ink→forest) và 1.18:1 (forest→forest-soft); mắt không đọc ra "khối nổi lên"
  từ khoảng đó. Bề mặt nổi dùng utility `surface-glass` / `surface-glass-strong`
  trong `globals.css`: nền trong suốt pha từ `--card` + `backdrop-filter: blur()
  saturate()` + một mép sáng champagne ở cạnh trên (`--glass-edge-top`, giả lập
  nguồn sáng phía trên) + bóng đổ sâu. `Card`, `PopoverContent` và
  `DialogContent` đã dựng trên đó — đừng thêm `bg-card` hay `ring-1` đè lên.

  Hai điều dễ sai: (1) `saturate()` là phần bắt buộc, blur không kèm saturate
  làm màu phía sau xỉn đi và kính hoá ra tấm nhựa đục; (2) bản `.theme-forest`
  phải **đục hơn hẳn** bản `.dark` vì nó là bề mặt tuyệt đối và có thể nằm giữa
  một trang giấy sáng — để loãng thì giấy hắt lên và chữ ivory mờ đi.

- Section lớn có thể mang quầng sáng môi trường bằng utility `glow-surface`
  (hai vệt ấm rất nhạt ở hai góc trên). Trên nền tối nó là thứ duy nhất phá được
  cảm giác "một mảng đen phẳng dài 6000px"; trên nền sáng nó gần như vô hình, và
  đó là chủ ý. Cả hai vệt đều **ấm** — đã thử một vệt xanh rừng cho sâu, nó biến
  nền đen thành xanh xám và kéo tụt champagne xuống.
- Bề mặt thứ ba `.theme-reveal` **chỉ dùng cho cảnh mở đầu homepage** ("The
  Invitation Reveal": loader + hero, xem `components/home/reveal/`). Đây là art
  direction của một cảnh điện ảnh, không phải một tông giao diện: đen ám nâu và
  champagne bão hoà hơn để bắt ánh kim nhũ trên mặt thiệp. Giá trị nằm gọn
  trong class đó ở `globals.css`, không đụng tới 7 màu thương hiệu. Không dùng
  `.theme-reveal` cho section sản phẩm khác; cần bề mặt tối thì dùng
  `.theme-forest`.
- **Hai họ chữ, chia theo vai chứ không theo trang.** Serif nói phần *nội dung*
  — tên trang, tiêu đề chương, câu dẫn; sans nói phần *giao diện* — nhãn thẻ,
  nút, bảng, form. Trước đây cả website chỉ có Inter, và hệ quả là hero
  (`.theme-reveal`, vốn dùng Playfair) sang một mình còn phần còn lại đọc ra như
  một bảng điều khiển công cụ.

  - `font-sans` / `font-heading` → **Inter** (local font trong `assets/fonts/`).
    Mặc định của mọi thứ. Không dùng class `italic` với Inter vì nó không có bộ
    nghiêng thật.
  - `font-display` → **Playfair Display**. Dùng cho: `h1`/`h2` (quy tắc trong
    `@layer base`), các tiêu đề display cỡ lớn của khu marketing (`page-hero`,
    `final-cta`, `faq`, `editorial-block`),
    cảnh `.theme-reveal`, và template thiệp. Playfair có bộ
    nghiêng thật nên `<em>` ở đó là chữ nghiêng thật.

  Ba chỗ **không** dùng serif, mỗi chỗ một lý do: mẫu thiệp (tự chọn bộ chữ qua
  `--template-font-*`), editor và dashboard (`[data-editor-surface]` — công cụ
  thao tác, chữ cần đọc nhanh theo hàng), và tiêu đề nằm trong một khối giao
  diện mà cấp thẻ vẫn phải là h1/h2 vì ngữ nghĩa (`[data-ui-heading]`).

  Hai lưu ý khi chỉnh: serif cỡ lớn cần **ít độ đậm hơn** sans để ra cùng sức
  nặng thị giác (500, không phải 700) và **tracking rộng hơn** (-0.015em, không
  phải -0.03em) — giữ giá trị của Inter thì Playfair bết lại thành một mảng đen.
- **Template thiệp là ngoại lệ có phạm vi.** Mỗi mẫu thiệp là **một thư mục**
  `components/invitation/templates/<slug>/` (khớp `public/images/templates/<slug>/`)
  và được phép có art direction riêng —
  kể cả hue ngoài 7 màu thương hiệu và font riêng — với ba điều kiện: (1) mọi
  giá trị khai báo trong CSS Module của chính mẫu đó, không thêm vào
  `globals.css`; (2) không hue nào rò ra ngoài selector gốc của mẫu; (3) các
  component dùng chung đặt bên trong thiệp được chỉnh về ngôn ngữ của mẫu bằng
  token ngữ nghĩa, không sửa chính component đó. Lý do giống `.theme-reveal`:
  đây là art direction của một sản phẩm khách hàng chọn, không phải tông giao
  diện của app.

  **Cỡ chữ KHÔNG nằm trong ngoại lệ đó.** Mọi mẫu dùng chung đúng một thang,
  khai ở `globals.css` là `--tpl-*`; CSS Module của mẫu **không được khai
  `font-size` bằng con số**, chỉ được gọi token:

  | Token | Cỡ | Vai |
  |---|---|---|
  | `--tpl-caption` | 14 → 15 | nhãn, chú thích, meta — **đáy tuyệt đối** |
  | `--tpl-small` | 16 → 17 | label, nút, dòng phụ |
  | `--tpl-body` | 18 → 19 | thân bài |
  | `--tpl-lead` | 20 → 22 | câu dẫn |
  | `--tpl-h4` | 24 → 28 | tiêu đề mục |
  | `--tpl-h3` | 30 → 36 | tiêu đề chương |
  | `--tpl-h2` | 28 → 48 | tiêu đề lớn |
  | `--tpl-h1` | 32 → 64 | tên cô dâu chú rể |
  | `--tpl-display` | 40 → 96 | màn bìa |
  | `--tpl-ornament` | 64 → 192 | **chữ dùng làm hoạ tiết**, không phải chữ để đọc |

  Vì sao chốt: 49 CSS Module từng tự khai **1066 cỡ chữ riêng**, trong đó 272
  chỗ tụt xuống dưới 14px — nhỏ nhất **5.12px**. Không ai cố ý chọn 5px; nó là
  hệ quả của việc mỗi mẫu tự đặt một `clamp()` rồi không ai đọc lại cả kho.
  Thiệp cưới là thứ người lớn tuổi mở trên điện thoại, nên đáy 14px phải được
  bảo đảm ở **một** chỗ, không phải 49 chỗ.

  Mỗi bậc vẫn là `clamp()` **giống hệt nhau ở mọi mẫu**: mẫu đặt
  `container-type: inline-size` ở gốc nên `cqi` đo theo bề rộng *tấm thiệp*,
  không phải màn hình — đó là thứ giữ cho khung preview hẹp trong editor và
  trang khách full-width cùng đọc ra một tấm thiệp. Đổi sang rem cứng là preview
  trong editor thành chữ tràn khung. Cái co giãn là khung hình, không phải ý
  thích của từng mẫu.

  Ba bậc màn bìa (`h2`, `h1`, `display`) và `ornament` dùng `min(Ncqi, Msvh)`
  chứ không phải `cqi` trơn, vì màn bìa được dựng để vừa **một khung hình**:
  bỏ vế `svh` là điện thoại xoay ngang bị tên cô dâu chú rể đẩy nút "mở thiệp"
  xuống dưới mép màn. Sàn của bốn bậc này cố ý thấp hơn `--tpl-h3` — sàn cao
  quá thì `clamp()` chặn mất vế `svh` đúng lúc cần nó nhất. Chúng vẫn cách sàn
  đọc 14px rất xa nên không đụng tới luật đó.

  Thang khai ở **`:root`**, không ở `.theme-invitation`, và đây là chỗ dễ sửa
  sai: hộp mừng cưới dựng bằng Radix `Dialog` nên nội dung modal portal ra
  `document.body`, tức nằm **ngoài** cây `.theme-invitation`. Khai trong class
  đó thì mọi `var(--tpl-*)` bên trong modal phân giải ra rỗng.

  Mẫu **vẫn được** tự quyết `font-family` (qua `--template-font-*`), màu,
  `line-height` và `letter-spacing` — chữ thảo cần tracking khác chữ có chân, và
  đó là art direction thật chứ không phải cỡ chữ trôi nổi.

  Class Tailwind (`text-caption`…) dùng trong TSX của thiệp được ánh xạ về thang
  này bằng một khối `.theme-invitation .text-*` trong `globals.css`, cộng một
  bản sao trong `shared/invitation-gift-box.module.css` cho nhánh portal. Phải
  bắt bằng **tên class** chứ không bằng biến — xem bẫy `@theme inline` ngay
  dưới.
- **Bẫy `@theme inline`.** Các token khai báo trong khối `@theme inline` ở
  `globals.css` được Tailwind nội suy thẳng giá trị vào class lúc build. Ghi đè
  biến đó ở scope con **không có tác dụng** — `--font-heading` là ví dụ: đặt lại
  trong CSS Module vẫn ra Inter, phải khai `font-family` trực tiếp. Ngược lại
  các token màu ngữ nghĩa (`--primary`, `--foreground`, `--card`…) khai ở
  `:root`/`.theme-*` nên vẫn ghi đè được ở scope con như bình thường.
- **Trình duyệt không có `color-mix()`** (WebKit < Safari 16.2: iPhone kẹt ở
  iOS 15/16.0–16.1, kể cả trình duyệt trong app Facebook/Messenger) được đỡ bằng
  plugin `frontend/postcss-color-mix-fallback.cjs`, chạy sau Tailwind. Không có
  nó, `bg-foreground/4` rơi về màu gốc **đặc 100%** (đầu thẻ editor thành mảng
  Ivory, chữ Ivory biến mất) và token khai bằng `color-mix()` thành `unset`.
  Plugin **chỉ thêm** khối `@supports not (color:color-mix(in lab, red, red))`
  chứa màu tính sẵn lúc build; trình duyệt mới bỏ qua toàn bộ, CSS gốc giữ
  nguyên. Cứ viết `color-mix()` như bình thường — không phải nhớ gì thêm. Kiểm:
  xoá mọi khối đó khỏi CSS build ra thì phải trùng khít bản không có plugin.
- Cỡ chữ **của website** dùng token: `text-h1`(64) `text-h2`(48) `text-h3`(36)
  `text-h4`(28) `text-body-lg`(18) `text-body`(16) `text-small`(14)
  `text-caption`(12). Thang này **không dùng cho mẫu thiệp** — thiệp có thang
  `--tpl-*` riêng với đáy 14px, xem mục Template thiệp bên trên.
- Breakpoint điện thoại là **`mobile` = 440px** (`--breakpoint-mobile` trong
  `@theme` ở `globals.css`): giao diện riêng cho màn dưới 440px viết bằng
  `max-mobile:`. Ví dụ: hộp thoại bật link mời riêng hiện toàn màn hình ở đó.
- Spacing theo bậc 4px của Tailwind: 4/8/16/24/32/48/64/96/128. Riêng nhịp dọc
  của trang dùng hai token co giãn trong `globals.css`: `pb-section` (khoảng
  nghỉ giữa hai section) và `mb-stack` (tiêu đề → nội dung). Khi thêm khóa
  `--spacing-<tên>`, kiểm tra tên không trùng tiện ích sẵn có của Tailwind —
  mỗi khóa sinh ra cả `inline-<tên>` (inline-size).
- Radius dùng thang mặc định của Tailwind, không override:
  `rounded-sm`=4 · `lg`=8 · `xl`=12 · `2xl`=16 · `3xl`=24 · `4xl`=32.
- Layout: `container-page` (tối đa 1200px, gutter 24px) và `grid-12`.
- Khi thêm component shadcn mới, chỉnh lại theo token trên trước khi dùng —
  mặc định của shadcn không khớp design system.

## 4. Backend placement rules

Backend flow:

```text
Controller → Service → Repository → Entity
```

Domain shape:

```text
backend/src/modules/<domain>/
├── dto/
├── decorators/                  # only when needed
├── guards/                      # only when needed
├── strategies/                  # only when needed
├── <domain>.controller.ts
├── <domain>.service.ts
├── <domain>.repository.ts
├── <domain>.entity.ts
└── <domain>.module.ts
```

| Code | Required location |
|---|---|
| New domain | `src/modules/<domain>/` |
| Route/HTTP mapping | `<domain>.controller.ts` |
| Business logic | `<domain>.service.ts` |
| TypeORM query/persistence | `<domain>.repository.ts` |
| Database schema/relation | `<domain>.entity.ts` |
| Request validation | `modules/<domain>/dto/` |
| Domain guard/decorator/strategy | matching folder inside the domain |
| Cross-domain reusable primitive | `src/common/<type>/` |
| App/database config | `src/configuration/` |
| Reusable error message | `src/constant/error-messages.ts` |
| Migration | `src/migrations/` |
| Seeder | `src/seeders/` |
| Scheduled job | `src/cronjob/` |
| Process nền không phục vụ HTTP (worker) | điểm vào `src/<tên>.ts`, module + logic trong domain (mẫu: `src/image-worker.ts`) |
| Unit test | beside source as `*.spec.ts` |
| E2E test | `backend/test/` |

### Backend boundaries

- Controller: route, DTO, guard, throttle, status; no business logic/query.
- Service: business rules and orchestration.
- Repository: all TypeORM access.
- Entity: schema/index/relation only.
- DTO: validation and transform at the API boundary.
- Module exports services only, never repositories.
- Domain services stay inside `modules/<domain>/`, not `src/services/`.
- Domain-specific helpers do not belong in `common/`.
- Source code never belongs in `uploads/`.

### Backend standards

- Use aliases: `@configuration/*`, `@modules/*`, `@constant/*`, `@common/*`.
- Relative imports are allowed only for nearby files in the same domain.
- Use NestJS exceptions and messages from `error-messages.ts`.
- Validate route input with DTO + `class-validator`.
- Normal entities extend `BaseEntity`; primary key defaults to UUID.
- TypeScript properties use camelCase; database names use snake_case.
- Secret columns use `select: false` where appropriate.
- Production uses migrations and `DB_SYNCHRONIZE=false`.
- Authorization, ownership and tier limits must be enforced in backend.

### Kho mẫu và migration

**Kho mẫu bắt đầu lại từ số 0.** Cả 70 mẫu cũ đã bị gỡ khỏi code, ảnh, seed
và database (migration `RemoveAllTemplates`, kèm đánh giá, lượt xem, yêu thích
và ô trang chủ trỏ tới chúng). Thiệp đã tạo vẫn giữ `template_slug` cũ và dựng
bằng mẫu dự phòng `templates/classic/`. Mẫu duy nhất hiện có là
`burgundy-birthday` (migration `AddBurgundyBirthdayTemplate`). Kho trống thì
trang chủ bỏ hẳn chương "Tìm phong cách" và `/mau-thiep` hiện
`templates.emptyCatalog`. Mẫu mới vẫn thêm theo đúng luật bên dưới.

**Mỗi mẫu mang một loại thiệp** (`templates.kind`, code làm chủ, mặc định
`wedding`). Mẫu chỉ dựng được thiệp cùng loại: editor chỉ liệt kê mẫu cùng loại
với thiệp, thiệp mới trên một mẫu trong kho lấy loại của mẫu, và
`CardsService.create`/`changeTemplate` từ chối ghép sai loại
(`TEMPLATE_KIND_MISMATCH`). Mẫu dựng sẵn `mac-dinh` là ngoại lệ, hợp với mọi
loại. Demo và `xem-thu` của mẫu không phải thiệp cưới đổ nội dung trưng bày
riêng của mẫu (`SamplePhotoSet.showcase` trong `lib/data/invitation-sample.ts`).

**Seed không phải đường lên production.** Seed không có khái niệm "đã chạy
rồi": nó áp toàn bộ file đang nằm trên máy đang gõ lệnh, nên một laptop có seed
cũ kéo production lùi lại mà không có gì cản — và ở chế độ mặc định
`seedContent` còn **xoá** dải trang chủ (`slug NOT IN (...)`). Migration thì có bảng `migrations` theo dõi, chạy đúng
một lần, và chạy trong pipeline deploy. `assertNotProduction` trong `seed.ts`
chặn cứng `NODE_ENV=production`; cửa thoát là `SEED_ALLOW_PRODUCTION` mang đúng
tên database, không phải `=1`.

Hai đường, cho hai loại database:

| Database | Đường đi |
|---|---|
| Dựng từ số 0 (dev, CI, staging mới) | `npm run seed` |
| Đang có dữ liệu thật | Một migration mới |

Ba loại thay đổi trên kho mẫu:

| Thay đổi | Đường đi |
|---|---|
| Thêm mẫu mới | Migration: `INSERT ... ON CONFLICT (slug) DO NOTHING`, `sort_order` lấy `MAX + ROW_NUMBER()` |
| Sửa mẫu cũ — cột **code làm chủ** (`name`, `photo_slots`, `image_position`, `image_src`, `color_tones`) | Migration: `UPDATE ... WHERE slug = ...` |
| Sửa mẫu cũ — cột **CMS làm chủ** (`tier`, `categories`, `tags`, `is_published`, `sort_order`, `featured_on_home`, `homepage_order`) | **Không migration nào cả** — vào CMS bấm |

Hàng thứ ba là luật, không phải gợi ý: admin sửa những cột đó qua
`UpdateTemplateDto`, nên một migration ghi đè lên chúng là dựng lại đúng cái bug
vừa diệt, chỉ khác là lần này nó nằm trong một file trông chính thống hơn. Cùng
luật đó ở phía seed là `CODE_OWNED_TEMPLATE_FIELDS` — một **whitelist**, nên cột
mới thêm vào `Template` mặc định thuộc CMS.

Hai điều dễ sai:

- **Migration đã chạy thì không sửa nội dung.** TypeORM ghi tên nó vào bảng
  `migrations` và không chạy lại; sửa file cũ thì DB dựng mới ra một đằng,
  production giữ nguyên một nẻo, và không có lỗi nào báo. Mọi thay đổi là một
  file mới, kể cả khi nó chỉ sửa một dòng của migration trước.
- **Migration không được `import` từ `seeders/data/`.** Migration là một lát cắt
  đông cứng của thời gian, còn `TEMPLATE_SEEDS` thì còn đang được sửa; nối hai
  thứ lại là để ý nghĩa của migration cũ đổi ngược về quá khứ. Dữ liệu viết
  thẳng trong file migration — trùng lặp với file seed ở đây là **có chủ đích**,
  cùng loại với các bản sao `frontend`/`dashboard`.

Mẫu tham chiếu: `src/migrations/1789100000000-SyncTemplateCatalog.ts`.

Current backend modules:

- `auth`: register/login/refresh/logout/me/forgot/reset password và đăng nhập
  ngoài bằng Google hoặc Facebook (`GET /auth/{provider}` →
  `GET /auth/{provider}/callback`, `provider` khai ở
  `common/enums/oauth-provider.enum.ts`). Những route đó là **điều hướng trình
  duyệt**, không phải API: mọi nhánh hỏng đều redirect về
  `/{locale}/dang-nhap?error=…&provider=…` chứ không ném JSON. Tài khoản tạo
  qua OAuth có `password_hash = NULL`, nên `login` phải luôn kiểm tra cột này
  trước khi so bcrypt.

  Phần dùng chung (ký/kiểm `state`, dựng URL quay về frontend) nằm ở
  `OAuthProviderService`; mỗi nhà cung cấp là một lớp con chỉ khai endpoint,
  scope và cách đọc hồ sơ. Khoá nối là cột riêng cho từng bên (`google_id`,
  `facebook_id`) chứ không phải email, nhưng **trùng email thì nối vào cùng một
  hàng** — một người đăng nhập Google rồi Facebook vẫn là một tài khoản. Riêng
  Facebook có thể trả hồ sơ **không có email** (đăng ký bằng số điện thoại,
  hoặc bỏ tick quyền email); trường hợp đó không đăng nhập được và trả mã lỗi
  `email_missing`.
- `user`: internal user entity/repository/service; no public controller.
- `captcha`: reCAPTCHA v3 verification.
- `places`: proxy gợi ý địa điểm cho các ô địa chỉ trong editor. **Hai nhà cung
  cấp, chọn theo cấu hình**: không có `GOOGLE_PLACES_API_KEY` thì đi bằng
  **Photon (OpenStreetMap)** — miễn phí, không key, không hạn mức tính tiền, và
  là mặc định của dự án; có key thì dùng Google Places. Dùng Photon thì UI
  **bắt buộc** hiện dòng ghi công "© OpenStreetMap" ở nơi thấy danh sách gợi ý.
  Phần dưới nói về nhánh Google: **key chỉ nằm ở backend** — key trình duyệt chỉ giới hạn được theo
  HTTP referrer mà header đó giả được, nên đặt key ở client là mở hạn mức có
  tính tiền cho bất kỳ ai. Chống lạm dụng xếp lớp: guard đăng nhập →
  `@Throttle` theo phút → trần theo ngày cho mỗi tài khoản (trong service) →
  cache truy vấn → debounce 350ms ở client → quota cứng đặt trong Google Cloud
  Console. Ô địa chỉ vẫn là **text tự do**; gợi ý chỉ là trợ giúp, và
  `venuePlace` (placeId + toạ độ) bị xoá ngay khi người dùng sửa tay lại chữ.

  Cùng module còn `POST /places/resolve-link`: bóc toạ độ và tên địa điểm từ
  **link chia sẻ Google Maps** mà người dùng dán vào khối Tiệc cưới. Đường này
  **không cần API key, không quota, không tốn tiền** — chỉ đi theo redirect và
  đọc chính URL đó — nên nó là nguồn vị trí chính, còn Places chỉ là trợ giúp
  gõ. Hai điểm phải giữ: chỉ đi theo redirect trong danh sách host của Google
  (nếu không đây là một lỗ SSRF), và ưu tiên `!3d/!4d` (điểm ghim) hơn `@lat,lng`
  (tâm khung nhìn) — thử với link thật thì hai giá trị lệch gần 300m. Đây là đọc
  URL công khai chứ không phải API có hợp đồng, nên mọi nhánh hỏng đều phải hỏng
  mềm: giữ link, mất toạ độ, bản đồ quay về tra theo chuỗi chữ.

  Ô "Địa điểm" của nghi lễ còn gợi ý từ **chính dữ liệu trong thiệp** (địa chỉ
  nhà trai/nhà gái/nhà hàng đã nhập). Nguồn này không gọi mạng và chạy cả khi
  chưa cấu hình Places — nó xử lý đúng chỗ trùng lặp nhiều nhất của form.
- `mail`: SMTP and mail templates. Cùng module có `POST /resend/webhook`:
  Resend bắn sự kiện vào, backend đẩy thành tin Telegram cho người vận hành qua
  `AdminAlertsService`. Thư **đến** `@keemori.com` (MX trỏ về Resend) chỉ báo
  người gửi và địa chỉ nhận — cố ý không kèm tiêu đề/nội dung, đọc thư thì vào
  Resend. Thư **đi** chỉ báo khi hỏng (`bounced`, `complained`, `failed`,
  `delivery_delayed`). Chữ ký Svix kiểm trên **raw body**, nên `main.ts` bật
  `rawBody: true`; thiếu `RESEND_WEBHOOK_SECRET` thì route từ chối.

  Mọi email dùng chung khung `templates/email-layout.ts` (banner, chữ ký, chân
  thư); template của từng loại chỉ viết phần thân bằng `paragraph`,
  `detailTable`, `callout`. Viết theo luật email: `<table>`, CSS inline, màu pha
  từ 7 màu thương hiệu. Nền thư **trắng**, chỉ banner giữ màu giấy của logo. Banner và logo **nhúng vào thư (CID)**
  từ `modules/mail/assets/` — `nest-cli.json` chép sang `dist/` — chứ không trỏ
  URL, vì Outlook chặn ảnh từ máy chủ ngoài và thư không được phụ thuộc vào việc
  frontend đã deploy ảnh hay chưa. Email chỉ có bản tiếng Việt.
- `notifications`: chuông thông báo trong ứng dụng. Module này **không import
  module nào khác** — các domain khác bắn sự kiện vào bằng cách gọi
  `NotificationsService`, không có chiều ngược lại — nên thêm loại thông báo mới
  không bao giờ sinh phụ thuộc vòng.

  **Cố ý không realtime và cố ý không gửi email.** Không websocket, không cron,
  không `refetchInterval`: frontend nạp danh sách đúng một lần lúc component
  mount, tức lúc đăng nhập hoặc lúc tải lại trang. Email để dành cho thứ bắt
  buộc phải tới hộp thư (đặt lại mật khẩu) vì quota nhà cung cấp là hữu hạn,
  còn một cái chuông tự gọi API mỗi phút thì nhân số request lên theo số tab
  đang mở.

  Sự kiện cùng nguồn được **gom nhóm** qua `groupKey` (`<type>:<id nguồn>`):
  sự kiện mới trùng nhóm với một thông báo **chưa đọc** thì cộng dồn vào dòng
  đó thay vì tạo dòng mới — ngày cưới có thể vào vài chục lời chúc trong ít
  phút. Đã đọc rồi thì lần sau mở dòng mới. Thứ tự đọc theo `last_event_at`
  (cột tự quản, không mượn `updated_at` vì "đánh dấu đã đọc" cũng chạm vào cột
  đó và sẽ đẩy thông báo cũ lên đầu). Không có endpoint đếm riêng: frontend suy
  số chưa đọc từ chính danh sách đã nạp.

  `wish_pending` bắn từ
  `WishesService.createFromGuest`, cộng dồn vào dòng chưa đọc của cùng thiệp và
  tự đánh dấu đã đọc trong `WishesService.findAllForOwner` — chủ thiệp mở danh
  sách lời chúc là đã nhìn thấy, giữ chấm đỏ lại chỉ là nhiễu.

  `payment_success` bắn từ `announcePaid` (xem `commerce`), **gửi kèm email**
  biên nhận — ngoại lệ có lý do của luật "không email": người trả tiền luôn cần
  biên nhận. Payload không mang số tiền.

  Hai loại cũ `link_expiring`, `link_expired` đi cùng bản dùng thử đã gỡ. Giá trị
  enum còn trong Postgres, hàng cũ còn trong bảng, nhưng `findRecent` chỉ trả
  `ACTIVE_NOTIFICATION_TYPES` nên chúng không bao giờ ra tới chuông.

  Câu chữ nằm ở `dictionaries/`, backend chỉ gửi dữ liệu thô. Thêm loại mới thì
  phải sửa cả `NOTIFICATION_TYPES`, migration `ALTER TYPE ... ADD VALUE`, union
  payload ở `apis/notification.ts` và một nhánh trong `notification-bell.tsx` —
  mỗi loại có đích đến riêng, bấm vào lời nhắc phải tới được chỗ xử lý nó.
- `content`: nội dung biên tập (FAQ, số liệu trang chủ, cặp đôi tiêu biểu).
  **Blog và lời chứng thực đã bị gỡ khỏi cả ba app** (migration
  `RemovePartnersAndBlog` xoá `blog_posts`, `DropTestimonials` xoá
  `testimonials`); các migration blog cũ vẫn nằm
  trong `src/migrations/` vì migration đã chạy thì không sửa, không xoá.

  Phần dưới về lưu trữ ảnh (`modules/storage`) áp cho mọi ảnh tải lên.

  Ảnh tải lên nằm trên đĩa **backend** (`/uploads`), nên cả `frontend/` lẫn
  `dashboard/` đều rewrite `/uploads/:path*` sang backend trong `next.config.ts`.
  Nhờ vậy đường dẫn lưu trong cơ sở dữ liệu là tương đối — đổi tên miền hay lên
  CDN không phải backfill dữ liệu đã ghi.

  **Nơi lưu chọn bằng `STORAGE_DRIVER`**: `local` (mặc định, đĩa server) hoặc
  `r2` (Cloudflare R2). Mặc định là `local` để dev chạy được mà không cần tài
  khoản Cloudflare. `R2Provider` được dựng bằng `useFactory` chứ không khai
  thẳng trong `providers`: constructor của nó `getOrThrow` bốn biến môi trường,
  nên để Nest tự khởi tạo thì mọi môi trường chưa cấu hình R2 sẽ **sập lúc khởi
  động** dù không dùng tới.

  **R2 vẫn trả đường dẫn tương đối `/uploads/...`, không phải URL tuyệt đối.**
  Đây là điều dễ làm sai nhất khi lên CDN, và nó hỏng theo hai đường:
  `content.photos.*` được dùng thẳng
  làm `src` trong khoảng 30 file template nên URL tuyệt đối kéo theo sửa cả 30
  file; và đổi tên miền sẽ phải backfill dữ liệu đã ghi. Khoá trên R2 vì vậy
  mang đúng tiền tố `uploads/` để khoá trùng khít đường dẫn công khai.

  Chỗ quyết định `/uploads/*` đi về đâu là biến `UPLOADS_ORIGIN` của
  `frontend/` và `dashboard/` — để trống thì về backend, trỏ sang custom domain
  của bucket thì về R2. Backend không biết gì về địa chỉ đó.

  Ảnh lên R2 mang sẵn `Cache-Control: public, max-age=31536000, immutable`.
  Phần này **bắt buộc**, không phải tối ưu: thiếu nó Cloudflare vẫn cache nhưng
  TTL mặc định chỉ 120 phút, tức cứ 2 tiếng mỗi POP lại hỏi R2 một lần và phát
  sinh request tính tiền. Đặt vĩnh viễn được vì tên tệp là ngẫu nhiên. Cũng vì
  vậy bucket phải đi qua **custom domain**, không phải URL `r2.dev` — URL đó bị
  giới hạn tốc độ và không hưởng cache của zone.

  **Mọi ảnh tải lên đều bị nén lại** ở `ImageProcessorService` trước khi tới
  `StorageProvider` — thiệp là link vĩnh viễn nên mỗi byte lưu xuống là chi phí
  vĩnh viễn. Nén ở backend chứ không ở client vì client không ép được: gọi thẳng
  API vẫn phải qua bước này. Đây cũng là lớp kiểm an ninh thật sự — `mimetype`
  do client gửi nên giả được, còn giải mã bằng libvips thì tệp không phải ảnh
  ném lỗi trước khi chạm đĩa.

  Ảnh thiệp (ô ảnh và album) ra **AVIF q70**, cạnh dài tối đa **2048px** — chỗ
  lớn nhất một tấm ảnh được vẽ là ảnh bìa tràn khung 1024px CSS trên màn Retina.
  Con số có **bản sao có chủ đích** ở `frontend/lib/image-resize.ts`: trình duyệt
  thu nhỏ về đúng mức đó trước khi gửi, nên hai bên phải bằng nhau. Không còn
  đường nào ra JPEG: nhánh JPEG q85 cũ chỉ phục vụ ảnh bìa blog. Nếu sau này có
  ảnh cần gắn vào `openGraph` thì nhớ crawler của Facebook/Zalo **không đọc được
  AVIF**.

  Hai điều trong pipeline không được bỏ: `.rotate()` phải chạy **trước** khi bỏ
  metadata, vì ảnh dọc chụp bằng điện thoại nằm ngang trong tệp và chỉ đúng chiều
  nhờ cờ orientation trong EXIF; và metadata bị bỏ là **có chủ đích**, vì ảnh
  cưới từ điện thoại mang toạ độ GPS nhà cô dâu chú rể còn thiệp là link công
  khai ai cũng mở được.

  **Ảnh của editor đi qua vùng tạm, kể cả khi chưa đăng nhập.** Chọn ảnh là ảnh
  được thu nhỏ trong trình duyệt rồi `PUT` thẳng lên **bucket tạm riêng tư**
  (`R2_STAGING_BUCKET`, presigned URL; driver `local` thì qua
  `PUT /upload-sessions/photos/:id/raw`). Quyền trên vùng tạm là **token phiên**
  (`upload_sessions`, header `X-Upload-Session`), không phải tài khoản. Bấm Lưu
  thì `POST /upload-sessions/claim` (bắt buộc đăng nhập, kiểm chủ thiệp, chặn
  album theo gói) chép bản đã nén sang `cards/<id>/`. Trước đây khách chưa đăng
  nhập dồn cả album lại tới lúc đăng nhập, và mọi byte đi qua VPS 2 lõi, nén
  ngay trong request — vài chục khách cùng lúc là đủ làm backend hết RAM.

  Luật thay cho "ảnh luôn thuộc một thiệp": ảnh tạm **không có URL công khai
  nào**, và chỉ thành ảnh công khai khi đã được giải mã + nén lại **và** một tài
  khoản đã đăng nhập nhận nó về thiệp của chính mình. Vì vậy bucket tạm phải là
  bucket riêng không gắn custom domain — custom domain phục vụ mọi khoá, không
  chặn theo tiền tố được. Phiên sống 1 ngày; cron `upload-staging-purge` dọn,
  lifecycle rule của bucket là lưới an toàn. Cách dựng: `ops/r2/README.md`.

  **Bản nháp của editor chỉ giữ id ảnh, không giữ byte.** Thiệp chưa lưu lần
  nào được tự cất vào `localStorage` (`lib/editor-draft.ts`: chữ + id ảnh tạm +
  token phiên) khi form đổi, khi một tấm vừa lên vùng tạm và ngay lúc trang bị
  ẩn — trình duyệt trong app Facebook bị iOS giết khi khách sang app khác, và
  trước đây khách chưa đăng nhập mất sạch mỗi lần như vậy. Mở lại editor thì ảnh
  tải về qua `GET /upload-sessions/photos/:id/preview`: route đòi token phiên,
  chỉ trả bản **đã nén** (`ready/`), `409` + `STAGED_PHOTO_PROCESSING` khi tấm
  còn trong hàng đợi. Đây là ngoại lệ duy nhất của luật trên và nó không phá
  luật: không có URL nào dùng được nếu không có token, và byte thô chưa kiểm
  không bao giờ đi ra. Ảnh tải lại giữ nguyên id nên lúc Lưu được nhận thẳng về
  thiệp; phiên đã hết thì editor báo khách chọn lại. Thiệp đã có id thì không
  cất nháp — nội dung nằm ở backend.

  Nén chạy ở **process worker riêng** (`src/image-worker.ts`), do
  `ImageWorkerHost` trong process API sinh ra, hạ `nice` và dựng lại khi chết;
  một tấm một lúc, `sharp` một luồng. Hàng đợi là chính bảng `staged_photos`
  (`FOR UPDATE SKIP LOCKED`), ảnh của thiệp đang Lưu đi trước, ảnh ẩn danh đi
  sau cùng — bị spam thì chỉ hàng ẩn danh chậm lại. Worker ở trong container
  backend chứ không phải service Compose riêng vì `deploy-server.py` từ chối
  mọi thay đổi danh sách service.

  Lưu thiệp **xoá tệp của ảnh bị thay** (`CardsService.removeReplacedPhotos`):
  có trong `content` cũ, không còn trong `content` mới, và khoá nằm trong đúng
  `cards/<id>/` (`isKeyInsideCard` — `content` là JSON tự do, dán được URL của
  thiệp khác). Ảnh của ô mà mẫu mới không có và ảnh album bị ẩn khi hạ gói vẫn
  nằm trong `content` nên không bị đụng. Ảnh đã **claim** mà lượt ghi `content`
  sau đó hỏng/bị bỏ thì được dọn lúc cron xoá phiên tạm hết hạn
  (`CardsService.removeUnreferencedPhotos`) — hàng `staged_photos` là dấu vết
  duy nhất của tệp đó, nên đối chiếu phải chạy trước khi xoá phiên.
- `settings`: cấu hình vận hành toàn site, một hàng `site_settings`. Hai
  controller tách hẳn nhau: `admin/settings` trả nguyên hàng cho CMS, còn
  `GET /settings/public` chỉ trả những trường trang khách được đọc (`messengerUrl`
  cho nút chat nổi, `demoCardSlug`/`demoCardKind` cho hero, và
  `facebookUrl`/`instagramUrl`/`tiktokUrl`/`zaloPhone`/`contactEmail` cho hàng
  biểu tượng ở chân trang) và **chọn tay từng trường** trong service — thêm cột
  mới thì mặc định nó là riêng tư, không tự rò ra route công khai. Chân trang
  **luôn vẽ đủ năm biểu tượng**: kênh nào `null` thì biểu tượng mờ và không bấm
  được (không dùng `href="#"`), còn email `null` thì rơi về
  `CONTACT.supportEmail`. `zaloPhone` lưu **số** nội địa 10 chữ số chứ không lưu
  URL — trang Thông tin doanh nghiệp in chính con số; link `zalo.me/<số>` dựng ở
  `frontend/lib/zalo.ts`.
  `contactEmail` **không** thay `CONTACT.supportEmail`:
  địa chỉ kia được trích trong văn bản pháp lý có phiên bản, nên nó không được
  đổi bằng một cú bấm Lưu trong CMS.
- **Thanh toán: một gói duy nhất** (`docs/business-model.md`). Giá niêm yết
  (899.000 ₫) và % khuyến mãi của gói nằm ở module `pricing` — đúng **một hàng**
  `tier_prices` với `tier='diamond'` (cột cũ, giữ tên); `GET /pricing` công khai,
  `PATCH /admin/pricing` (quyền `pricing:manage`, màn CMS `/bang-gia`), đổi giá
  revalidate tag `pricing`. Frontend đọc qua `lib/data/pricing.ts`, rơi về
  `CUSTOM_CARD_PRICE` khi API hỏng.

  `commerce` là đơn hàng: báo giá → khuyến mãi gói → mã giảm giá, làm tròn **lên**
  bội số 1.000 ₫ (`common/pricing/discount.ts`, bản sao hiển thị ở frontend phải
  sửa kèm). Mỗi thiệp tối đa một đơn `pending`. `orders.tier` (NOT NULL) luôn
  ghi `diamond`, `family_split`/`is_repeat_purchase` luôn `false` — cột cũ.
  `CommerceService.markPaid` là điểm vào duy nhất của "tiền đã về" (webhook
  SePay, ghép tay ở CMS, xác nhận tay, đơn 0 ₫): nó **xuất bản** thiệp (`paid`,
  slug từ tên ở lần đầu, `paidAt ??=`), rồi `announcePaid` đếm lượt mã giảm giá,
  bắn chuông `payment_success`, gửi biên nhận email và tin Telegram — phần sau
  **không bao giờ được ném lỗi**: tới đó tiền đã vào tài khoản, để lỗi SMTP nổi
  lên thì webhook trả lỗi, SePay thử lại, và `markPaid` từ chối một đơn đã `paid`.
  Không còn route doanh thu/chi phí (bảng `expenses` để yên).

  `payments` nhận tiền chuyển khoản qua **SePay**, phụ thuộc **một chiều**
  (`payments` biết `commerce`). Đơn phân biệt bằng `orders.payment_code` — 8 ký
  tự trong nội dung chuyển khoản, bảng chữ bỏ `0 O 1 I L 5 S`, dò bằng regex
  tìm trong chuỗi (ngân hàng chèn thêm chữ). `payment_transactions` là **sổ cái
  thô**: mọi sự kiện webhook đều ghi kể cả khi không ghép được đơn, `raw_payload`
  là dữ liệu cá nhân, chỉ nhánh admin đọc. Ba luật webhook: chống lặp theo
  `sepay_id` (unique), **luôn trả `{"success": true}`** trừ khi máy chủ hỏng,
  trả thiếu tiền thì ghi `underpaid` và không xuất bản. Thiếu
  `SEPAY_WEBHOOK_API_KEY` thì webhook từ chối mọi request. Khách trả ở
  `/{locale}/thanh-toan/{orderId}` (trang tự hỏi lại `GET /payments/checkout/:id`
  tới khi đơn rời `pending` — ngoại lệ có chủ đích của luật "không polling");
  vận hành tra cứu và ghép tay ở `/{locale}/giao-dich` (quyền `payments:manage`).
  `GET /payments/receiving-account` in số tài khoản ở trang Thông tin doanh nghiệp.

  `cards` đọc `pendingOrderId` thẳng từ bảng `orders` bằng SQL thô
  (`CardsRepository.findPendingOrderIds`) để không sinh vòng `cards` ↔ `commerce`.
- `vouchers`: mã giảm giá khách nhập ở hộp thanh toán, màn CMS `/ma-giam-gia`
  (quyền `vouchers:manage`). Không import module nào khác — `commerce` gọi vào
  `VouchersService`. Mã tính **sau** khuyến mãi gói. Cột `tiers`/phạm vi theo gói
  đã vô nghĩa (một gói): DTO vẫn nhận `tiers`/`partnerStoreId` rồi bỏ qua, cột lưu
  `[]`. Danh sách chọn mã chỉ trả mã `is_public`, không trả ghi chú nội bộ, và trả
  **mã lý do** (`minimum`, `user-limit`) — câu chữ nằm ở từ điển frontend. `code`
  **không sửa được** sau khi tạo; lượt dùng đếm ở `markPaid`, không ở lúc tạo đơn,
  và `recordVoucherUse` không bao giờ ném lỗi. `orders` giữ `list_amount`,
  `discount_amount`, `voucher_id` **và** `voucher_code` (giữ chữ của mã khi mã bị
  xoá).
- `legal`: sổ chấp thuận văn bản pháp lý. Module này **không import module nào
  khác**, giống `notifications` — `auth` gọi vào `LegalService`,
  không có chiều ngược lại.

  Khoá duy nhất của `legal_acceptances` là bộ ba **(user, văn bản, phiên bản)**
  chứ không phải (user, văn bản): khi Điều khoản lên 2.0, hàng "user A đồng ý
  1.0" phải còn nguyên — câu hỏi bên pháp chế sẽ hỏi là "lúc đăng ký người này
  đồng ý với chữ nào", và ghi đè là câu trả lời duy nhất không lấy lại được.

  Hai hàm có vai trò khác hẳn nhau: `assertSignupDocuments` **ném lỗi** và chạy
  *trước* khi tài khoản tồn tại — phát hiện thiếu sau khi đã tạo thì lần thử
  lại vấp "email đã được đăng ký". Còn `record` thì **không bao giờ ném lỗi**,
  đúng như `AuditService.record`: tới đó tài khoản đã tạo xong rồi.

  `POST /auth/register` ghi **phiên bản client gửi lên**, vì thứ cần lưu là chữ
  người dùng thật sự nhìn thấy — hai giá trị lệch nhau đúng vào lúc vừa deploy
  bản legal mới trong khi có người đang mở dở form. Nhánh Google/Facebook không
  có form nào để gửi nên đọc `constant/legal-documents.ts` (bản sao có chủ đích
  của `frontend/constants/legal.ts`) và ghi với `source: 'oauth'` — chấp thuận
  bằng hành vi, mức bằng chứng khác một ô tick, nên không gộp chung.

  Enum `common/enums/legal-document.enum.ts` có năm giá trị nhưng chỉ **ba**
  văn bản có trang: `complaints` đã được gộp vào Điều khoản sử dụng (mục "Khiếu
  nại và giải quyết tranh chấp", bản `2.1`) và `/khieu-nai` redirect 301 sang
  `/dieu-khoan`. Giá trị enum giữ lại vì Postgres không xoá được giá trị enum,
  và nó vô hại — chưa có hàng nào dùng. Thêm một văn bản là sửa cả enum,
  migration `ALTER TYPE … ADD VALUE`, `LEGAL_DOCUMENTS` bên frontend và một
  route trong `app/[locale]/`.

  `partner_terms` (Điều khoản đối tác) cũng còn trong enum mà không còn trang:
  chương trình đối tác đã gỡ, nhưng hàng chấp thuận cũ trỏ vào giá trị đó.
  Chân trang chỉ hiện **ba** văn bản (`FOOTER_LEGAL_KEYS`). Quyết định nghiệp vụ còn thiếu
  (hoàn tiền, thời gian lưu trữ) nằm ở `docs/legal-decisions.md`.
- `audit`: nhật ký thao tác. Module này **không import module nào khác**, giống
  `notifications` và `legal` — các domain gọi vào `AuditService`,
  không có chiều ngược lại.

  `audit_logs` **không có khoá ngoại nào**, và đó là điểm quan trọng nhất của
  nó. Chín khoá ngoại trỏ về `users` trong hệ thống đều `ON DELETE CASCADE`;
  thêm một cái nữa ở đây thì xoá tài khoản sẽ cuốn theo chính dòng ghi lại việc
  xoá đó. `actor_id`/`target_id` vì vậy là uuid trần, và mỗi dòng mang **ảnh
  chụp** (`actor_email`, `target_label`, `metadata`) để tự đọc được sau khi hàng
  gốc đã biến mất — bảng cần tra chính là bảng vừa bị xoá.

  `record` **không bao giờ được ném lỗi**, vì nó được gọi ngay cạnh những thao tác
  không hoàn tác được. Đổi lại mọi thất bại phải kêu to trong log ứng dụng — một
  audit log âm thầm ngừng ghi chỉ bị phát hiện vào đúng ngày cần tra nó.

  Danh sách hành động (`common/enums/audit-action.enum.ts`) cố ý **ngắn**: chỉ
  ghi thứ *không hồi phục được* hoặc *đổi quyền lực của một tài khoản*. Ghi mọi
  thao tác thì tra một sự cố sẽ là lội qua vài nghìn dòng "admin đã mở danh
  sách". Thêm một loại là sửa cả enum backend, bản sao ở `dashboard/apis/audit.ts`
  và nhãn ở hai từ điển — kiểu `AuditAction` bắt lỗi thiếu nhãn ngay lúc build.

  Route đọc là `GET /admin/audit-logs`, quyền **`super_admin`** chứ không phải
  `admin`: nhật ký là thứ soi lại chính người vận hành. Không có route sửa hay
  xoá, kể cả cho `super_admin` — một cuốn sổ mà người dùng nó xoá được dòng thì
  không còn là bằng chứng. Màn CMS ở `/{locale}/nhat-ky`.

- `admin-alerts`: tin Telegram cho **người vận hành** — tài khoản mới (gọi từ
  `AuthService.register` và nhánh tạo tài khoản của `loginWithOAuth`) và đơn đã
  thanh toán (gọi từ `announcePaid`, nên đơn 0 ₫ và xác nhận tay cũng có tin).
  Không import module nào khác, giống `notifications`. Mọi hàm fire-and-forget
  và **không bao giờ ném lỗi**, cùng luật với `AuditService.record`. Thiếu
  `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` thì im lặng bỏ qua. Khai thêm
  `TELEGRAM_EXTRA_CHAT_ID` (kèm `TELEGRAM_EXTRA_BOT_TOKEN`, trống thì mượn bot
  chính) thì tin báo đi song song tới chat đó; trả lời lệnh `/health` vẫn chỉ
  về chat chính (`reply`, không phải `send`). Tin gửi plain
  text, không `parse_mode`: tên người dùng gõ tự do, một dấu `_` lẻ trong
  Markdown làm Telegram từ chối cả tin.
- Trợ lý chat **Mori** (`modules/mori`, RAG trên Gemini) đã bị gỡ khỏi cả
  ba app; bảng `mori_unanswered_questions` bị xoá ở migration
  `DropMoriUnansweredQuestions`. Giá trị `mori:manage` không còn trong danh
  sách quyền.
- `todo`: architecture example, not a product domain.

### Roles và CMS

**Hai tập tài khoản, tách hẳn nhau.** Bảng `users` chỉ giữ **khách**, một vai
trò duy nhất `customer` (`common/enums/user-role.enum.ts`; `partner` đã gỡ
cùng chương trình đối tác) — spec CMS gọi là **User**. **Người vận hành CMS**
nằm ở bảng riêng `admin_users` (`modules/admin-auth/`), không bao giờ trộn vào `users`. Hai giá trị
`admin`/`super_admin` cũ của `users.role` đã bị gỡ ở migration
`MoveAdminsToKeycloak`; Keycloak sau đó cũng bị bỏ (migration
`CreateAdminUsers`) — `ops/keycloak/` và service `keycloak` trong compose chỉ
còn chờ gỡ tay trên server.

Đăng nhập CMS là `POST /admin/auth/login` (email + SHA-256 mật khẩu, cùng quy
ước với khách), kèm `refresh`, `logout`, `me` và `PATCH /admin/auth/password`.
Không có route tạo tài khoản: tài khoản quản trị sinh bằng migration (tài
khoản đầu tiên `admin@gmail.com`, `super_admin`, nằm trong
`CreateAdminUsers`). Token CMS ký HS256 bằng secret **suy ra** từ secret của
khách (`admin-jwt-secret.ts`, HMAC kèm nhãn) — không thêm biến môi trường nào,
nhưng hai loại token không bao giờ qua nhầm guard của nhau, và token CMS còn
mang `typ: "cms"`. Refresh token lưu **SHA-256** chứ không bcrypt: bcrypt chỉ
đọc 72 byte đầu mà mọi JWT của một tài khoản trùng nhau ở đó, nên token đã xoay
vòng vẫn "khớp". Đổi mật khẩu thu hồi refresh token.

Mọi route `/admin/*` đi qua `@UseGuards(AdminJwtAuthGuard, PermissionsGuard)`
+ `@Permissions(...)`. `AdminJwtStrategy` tra lại `admin_users` ở mỗi request,
nên tắt `is_active` hay đổi vai trò có hiệu lực ngay. `PermissionsGuard`
**đóng cửa khi quên khai quyền**, và khai nhiều quyền nghĩa là cần **đủ cả**.

Mỗi quyền một màn CMS — danh sách chuẩn ở
`common/enums/admin-permission.enum.ts` (bản sao
`dashboard/constants/permission.ts`). Mỗi tài khoản mang **một vai trò**
(`super_admin`, `admin`, `editor`, `support`, `accountant` —
`common/enums/admin-role.enum.ts`), và bảng `ADMIN_ROLE_PERMISSIONS` ở đó bung
vai trò thành quyền. Thêm vai trò là sửa enum, bảng đó và một migration
`ALTER TYPE admin_users_role_enum ADD VALUE`. Thứ gì "chỉ super admin được
xem" là một quyền riêng: phân tích, nhật ký, xoá tài khoản. Quyền tiền là
`payments:manage`, `pricing:manage`, `vouchers:manage`; `revenue:manage` đã gỡ
cùng màn doanh thu.

`req.user` ở route quản trị là `AdminUser` (`@CurrentAdmin()`), cùng hình dạng
với `AuditActor`: `userId` là id trong `admin_users` — `audit_logs.actor_id`
không có khoá ngoại nên nhận được — và `actor_role` ghi vai trò.

Xoá tài khoản từ CMS (`DELETE /admin/users/:id`, quyền `users:delete`) là **soft
delete**: `users.deleted_at` được đóng dấu, hàng ở nguyên. Hệ quả có chủ đích —
tài khoản mất đường đăng nhập lẫn refresh (mọi query qua repository tự thêm
`deleted_at IS NULL`), dữ liệu liên quan không bị `ON DELETE CASCADE` cuốn theo,
và email vẫn giữ chỗ ở unique index nên **không đăng ký lại được**. Vì vậy
`register` và nhánh Google phải tra bằng `findByEmailIncludingDeleted`, nếu
không lỗi rơi xuống database thành 500. Người dùng **tự** xoá tài khoản
(`AuthService.deleteAccount`) vẫn là xoá thật — họ có quyền rời đi và lấy lại
email của mình. Màn Người dùng không đổi quyền: khách chỉ có một vai trò, còn
tài khoản quản trị nằm ở `admin_users`.

## 5. Adding a feature

Example domain `invitation`:

```text
backend/src/modules/invitation/
frontend/apis/invitation.ts
frontend/hooks/use-invitation.ts
frontend/lib/schemas/invitation/
frontend/components/invitation/
frontend/app/[locale]/.../page.tsx
```

Order:

1. Define domain and API contract.
2. Backend: DTO → Entity → Repository → Service → Controller → Module.
3. Add error messages, migration and tests.
4. Frontend: API function → React Query hook → schema → components → route.
5. Add both `vi` and `en` translations.
6. Run validation commands.

If no database is needed, Entity/Repository may be omitted. Do not collapse the
remaining responsibilities into the controller or route.

## 6. Business invariants

- **Một gói duy nhất, giá niêm yết 899.000 ₫** (sửa ở CMS), thanh toán chuyển
  khoản trong ứng dụng qua SePay, có khuyến mãi gói và mã giảm giá
  (`docs/business-model.md`). Không có gói Free/Gold/Diamond, không dùng thử,
  không giá mua lại, không Diamond Song Hỷ.
- **Phải trả mới có link.** Ai cũng soạn được (kho mẫu → "Dùng mẫu này" →
  editor); lưu cần đăng nhập và tạo thiệp `draft`. "Lưu & Tạo link" trên thiệp
  chưa trả mở hộp thanh toán; `POST /cards/:id/publish` trên thiệp chưa trả bị
  từ chối (403, `code: PAYMENT_REQUIRED`, bản sao `frontend/constants/http.ts`).
  `markPaid` mới là thứ xuất bản thiệp.
- **Mọi thiệp có mọi tính năng** — RSVP, link mời riêng, lời chúc, album (trần
  `ALBUM_PHOTO_CAP`), hộp quà, nhạc — và không phép kiểm nào theo gói còn lại.
  `wedding_cards.plan_tier` là cột cũ, mọi hàng mang `diamond`.
- **Trạng thái thiệp chỉ còn `draft` → `paid`.** `paid` = đã trả và đã xuất bản:
  link **vĩnh viễn, không trần người xem**, không cron nhắc hạn hay xoá thiệp.
  `free`/`unpaid` còn trong enum Postgres (`CARD_STATUS_DB_VALUES`) cho hàng cũ
  nhưng không bao giờ được ghi; migration `CollapseCardPlans` đã chuyển mọi thiệp
  cũ sang `paid`. Bản sao trạng thái ở `frontend/constants/invitation.ts` và
  `dashboard/constants/template.ts`.
- **Đơn hàng sống lâu hơn tài khoản và thiệp.** `orders.user_id` và
  `orders.card_id` đều là `ON DELETE SET NULL`: đơn là chứng từ kế toán, và
  Chính sách bảo mật đã công bố rằng xoá tài khoản không cuốn theo đơn. Đơn mất
  chủ vẫn tự đọc được vì `amount`, `list_amount`, `discount_amount`,
  `voucher_code`, `payment_code` và `paid_at` đã chốt trên hàng. `markPaid` phải
  chặn đơn có `cardId`/`userId` rỗng.
- **Cột cũ ở yên trong database**: `expenses`, `site_settings.unpaid_*`,
  `wedding_cards.groom_slug`/`bride_slug`… không còn code nào đọc ghi.
- **Tên trên thiệp khoá sau 15 ngày kể từ lần thanh toán đầu**
  (`COUPLE_NAMES_LOCK_DAYS`, Điều khoản sử dụng mục 3). Thiệp đã trả tiền là
  link vĩnh viễn không trần lượt xem, nên không khoá thì một lần mua dùng được
  cho mọi sự kiện về sau chỉ bằng cách gõ tên khác. Khoá các ô tên (cô dâu chú
  rể, hoặc tên chính của loại khác), mọi nội dung khác vẫn sửa tự do. Mốc là
  `wedding_cards.paid_at`, ghi `??=` ở `markPaid` — trả lại không dời mốc. Backend chặn ở `CardsService.update` (403 `COUPLE_NAMES_LOCKED`).

  Trang khách **không báo trước** — không khoá ô trong editor, không dòng nhắc;
  luật được công bố ở Điều khoản. Chỉ khi lưu bị từ chối, backend trả kèm
  `code: COUPLE_NAMES_LOCKED` (`constant/error-codes.ts`, bản sao
  `frontend/constants/http.ts`) và editor mở **hộp thoại** riêng
  (`components/editor/couple-names-locked-dialog.tsx`): lý do + nút liên hệ
  admin. Hộp thoại chứ không phải toast — đây là một việc bị chặn người dùng
  phải đọc hết, không phải thông báo thoáng qua. Rẽ nhánh theo
  `ApiError.code`, không so chuỗi `message`. Đường hỗ trợ
  là CMS: màn `/thiep` có ô "Cho
  sửa tên" (`PATCH /admin/cards/:id/couple-names-lock`, quyền `admin`), bật thì
  thắng mốc 15 ngày, tắt thì luật thời gian có hiệu lực lại ngay. Mỗi lần đổi
  ghi `audit` (`card.couple_names_unlocked`/`locked`). Là hằng số chứ không phải
  `site_settings` vì con số nằm trong văn bản pháp lý có phiên bản.
- **Link mời riêng từng khách** (`content.guestInvite`, mặc định **bật**, công
  tắc đổi thẳng không qua hộp xác nhận). Cặp đôi
  gõ danh sách vào một textarea, mỗi dòng một khách; link
  `/t/<slug>?khach=<mã>` đổi lời chào màn mở đầu thành "Kính mời: <tên>". Mã
  link nằm ở bảng `card_guests` và **đứng yên qua các lần lưu** — khớp theo tên
  chứ không theo số dòng, nên chèn thêm khách lên đầu danh sách không trao link
  của người này cho người kia. Tắt tính năng không xoá danh sách lẫn mã.

  Bố cục bắt buộc của màn bìa, áp cho **mọi** mẫu. Link chung: tên cô dâu chú
  rể, rồi lời chào chung ("Trân trọng kính mời") **dưới** tên. Link riêng:
  khối "TRÂN TRỌNG KÍNH MỜI:" + tên khách bằng chữ viết tay có gạch chân,
  **ngay trên** tên, và lời chào chung **ẩn hẳn** — hai câu mời trên một tấm
  bìa là nói hai lần một việc. Mẫu tự vẽ bìa dùng hai
  component trong `shared/invitation-guest-greeting.tsx`:
  `<InvitationGuestGreeting />` đặt ngay trước phần tử tên, và
  `<InvitationCoverGreeting>` thay cho thẻ `<p>` của lời chào; bìa chung
  `WeddingOpening` tự làm cả hai việc. Không ghi đè `envelope.greeting` bằng
  tên khách. Mẫu mới thiếu một trong hai component thì link riêng hoặc mất tên
  khách, hoặc hiện hai câu mời. **Ngoại lệ:** mẫu tự dựng màn phong bì riêng và
  đã đặt khối lời mời riêng ở đó thì màn
  bìa **không** lặp lại khối đó nữa và giữ lời
  chào chung dưới tên cô dâu chú rể — luật "chỉ một câu mời" vẫn nguyên, chỉ
  khác chỗ đặt. Route công khai **luôn xoá `guestList`** khỏi payload (mọi
  khách nhận cùng một payload, để nguyên là ai cũng đọc được tên cả trăm người
  khác); mã sai — hoặc bật mà danh sách rỗng — hỏng mềm về lời chào chung: tên khách
  chỉ hiện khi mã khớp một hàng `card_guests`, không bao giờ theo cờ `enabled`. Chủ thiệp lấy
  link ở `thiep-cua-toi/<slug>/khach-moi`.
- Lượt xem đếm theo **người xem**, không theo lượt tải trang (chỉ để thống
  kê — không còn trần người xem nào). Mỗi khách được
  `proxy.ts` phát một `visitor_id` ngẫu nhiên vào cookie ở lần đầu vào
  `/{locale}/t/...`, chuyển tiếp xuống backend bằng header `x-visitor-id`, và
  `card_views` giữ cặp `(card_id, visitor_id)` là duy nhất. Request
  **không có** `visitor_id` thì không tính (bot lấy ảnh preview của
  Messenger/Zalo không giữ cookie, mỗi lần chia sẻ sẽ là một "khách" mới); và
  `wedding_cards.view_count` là bản đếm sẵn số hàng trong `card_views`, cộng
  đúng một lần lúc ghi nhận khách mới. Không đếm theo IP — nhà mạng di động
  Việt Nam NAT chung địa chỉ, nên một phòng khách dùng chung wifi sẽ bị gộp
  thành một người.
- Đường dẫn thiệp sinh **ở lần xuất bản đầu**, không phải lúc tạo: lúc tạo thì
  chưa có tên ai (`thiep-<8 hex>`), còn `publish` thì đã bắt buộc có tên cô dâu
  chú rể nên dựng được `tuan-anh-nhu-binh-adec`. Hậu tố ngẫu nhiên là bắt buộc —
  đường dẫn đoán được thì người lạ dò trúng link riêng tư của khách. Slug người dùng **tự đặt** thì xuất bản không được
  ghi đè.
- **Đường dẫn thiệp không bao giờ chết, và không đổi được.** Đường dẫn do hệ
  thống đặt ở lần xuất bản đầu (`<tên-dâu-rể>-<mã>`); người dùng không đặt hay
  đổi được nữa — route `PATCH /cards/:id/slug` và ô "Đổi đường link" đã gỡ.
  Slug cũ của những thiệp từng đổi link trước đây vẫn nằm ở
  `card_slug_aliases` và tiếp tục chuyển hướng về thiệp — link đã in lên thiệp
  giấy hoặc gửi vào nhóm chat gia đình phải mở được mãi, vì khách mời không mở
  được thì **không ai báo lại cho cặp đôi**. Một slug đã từng phát ra ngoài thì
  vĩnh viễn không cấp lại cho thiệp khác (`isSlugFree` xét `slug`, `groom_slug`/
  `bride_slug` cũ của Song Hỷ đã gỡ, và bảng alias — hai cột Song Hỷ cũ vẫn mở
  thiệp chung). Chuyển hướng nằm ở trang Next chứ không
  ở `findPublicBySlug`, vì route đó **đếm lượt xem** — gộp lại là một lượt xem
  qua link cũ bị đếm hai lần.
- **Diamond Song Hỷ** (thiệp riêng nhà trai / nhà gái) **đã gỡ** khỏi cả ba app.
  Nội dung cũ có thể còn khoá `familySplit`/`viewSide`: DTO vẫn nhận rồi bỏ đi
  (`CardsService.update`), editor bỏ trước khi lưu (`lib/legacy-content.ts`).
  Khách mời và RSVP ghi `side = 'groom'` mặc định; hàng `bride` cũ để yên.
- **Màu chủ đạo của mẫu** (`templates.color_tones`, `TEMPLATE_COLORS`) là 1–2
  nhóm màu đơn sắc: màu nền và màu concept — đỏ đô cũng là `red`, kem/ngà là
  `white`. Cột **code làm chủ**: chốt ở frontmatter spec lúc `thiep-extract`,
  không có trong `UpdateTemplateDto`, CMS chỉ hiển thị. Trần 2 chặn bằng CHECK
  ở database; sàn 1 chặn ở test seed và `check-templates.mjs` (không chặn ở DB,
  để một slug lạ không làm hỏng lượt deploy). Trang `/mau-thiep` của site
  này **không còn bộ lọc** (gói, màu, phong cách, nhãn), ô tìm kiếm hay sắp
  xếp: nó chỉ là trang mẫu tham khảo cho thiệp custom, kèm nút liên hệ khi
  trống. `TEMPLATE_COLOR_SWATCHES` hiện không còn chỗ nào vẽ.
  Thiệp custom có route riêng được giới thiệu trong cùng lưới qua
  `frontend/lib/data/reference-invitations.ts` (hiện trống). Danh sách này
  chỉ chứa thiệp đã dựng được chủ dự án chọn làm mẫu tham khảo, không giả
  thành `WeddingTemplate` hay thêm vào editor. Card dùng `PosterCard`, ảnh
  chụp đặt cạnh ảnh khách trong `images/client /<id>/`, bấm mở route thiệp.
  Thiệp tham khảo cần link mời riêng, xác nhận tham dự hay lời chúc thì phải
  dựng lại thành mẫu thật, như thiệp sinh nhật Khải Hồ đã thành
  `burgundy-birthday`: nội dung cũ thành nội dung trưng bày của mẫu
  (`lib/data/khai-ho-birthday.ts`), thiệp của khách là một hàng `wedding_cards`
  sửa bằng editor, và link cũ `/t/khai-ho` là một hàng `card_slug_aliases` trỏ
  sang thiệp đó — không còn route tĩnh nào, vì route tĩnh luôn thắng
  `t/[slug]` và alias sẽ không bao giờ chạy.
  Mẫu dùng editor vẫn lấy từ CMS như trước.
- `docs/business-model.md` is the source of truth for what the customer buys.
- Two kinds of photo, never merged:
  - **Photo slots** are laid out by the *template* (`WeddingTemplate.photoSlots`,
    keyed by `PHOTO_SLOT_KEYS`). They are not blocks and have no on/off switch —
    the layout is built around them. `template.tier` (free/gold/diamond) is now
    only the template's design level (0 / 1–3 / 4–6 slots), not something sold.
  - **Album** is available on every card, with a hard policy cap
    (`ALBUM_PHOTO_CAP`), not "unlimited".
- Changing template must never drop content, including photos whose slot the
  new template lacks — keep them, just don't render them.
- One invitation supports multiple ceremonies.
- Invitation content is composed of independent blocks:
  couple, families, ceremonies, reception, dress code, timeline,
  countdown/calendar, story, album, gift/QR, guestbook, RSVP, thank-you,
  envelope and music. Every block can be toggled on/off per invitation.
  `constants/invitation.ts` → `INVITATION_BLOCKS` is the source of truth for
  the block list and its order; the editor renders its cards in that order.
- **Sáu loại thiệp, chọn trước khi soạn.** `INVITATION_KINDS`: `wedding`,
  `birthday`, `graduation`, `event`, `anniversary`, `greeting` (bản sao ở
  `backend/src/common/enums/invitation.enum.ts`). Người dùng chọn loại ở
  `/{locale}/tao-thiep` trước, rồi vào editor với `?loai=<slug>` (`cuoi`,
  `sinh-nhat`, `tot-nghiep`, `su-kien`, `ky-niem`, `chuc-mung`); mọi nút "Tạo
  thiệp" trỏ về trang chọn loại.

  Loại nằm **trong `content.kind`** chứ không phải một cột: nó đi theo nội dung
  tới mọi nơi vẽ thiệp (trang khách, xem thử, preview editor) mà không phải nối
  thêm một trường nào, và không cần migration. Thiếu khoá là `wedding` — mọi
  thiệp cũ giữ nguyên hành vi. Loại **bất biến** sau khi tạo: backend từ chối
  lượt lưu mang loại khác (`KIND_IMMUTABLE`), nên client phải gửi lại đúng
  `kind` đang lưu ở mỗi lượt.

  Một loại = một danh sách block (`KIND_BLOCKS` ở backend, bản sao ở frontend).
  Block dùng chung giữ nguyên dữ liệu, chỉ đổi nhãn theo loại — "Tiệc cưới"
  (`reception`) là "Thời gian & địa điểm" ở loại khác. Thông tin riêng của loại
  nằm ở `content.occasion` (tên chính, tuổi, trường/ngành/khoá, đơn vị tổ
  chức, số năm, người gửi, dịp con của thiệp chúc mừng…), là **khối lõi không
  có công tắc** nên không nằm trong `visibility`. Ba khối cô dâu chú rể, gia
  đình, nghi lễ chỉ thuộc thiệp cưới; hộp quà của loại khác chỉ
  dùng tài khoản `giftBox.groom`; thiệp chúc mừng không có link mời riêng.

  Luật bắt buộc theo loại nằm ở **service** (`assertContentForKind`), không ở
  DTO, vì DTO lồng không nhìn thấy `kind`: thiệp cưới vẫn cần tên cô dâu chú
  rể và ít nhất một nghi lễ, loại khác cần `occasion.name`. Slug lần xuất bản
  đầu và khoá tên 15 ngày dựng từ cùng "tên chính" đó (`cardDisplayName`,
  `lockedNameValues` trong `modules/cards/`).

  Mỗi thiệp đã tạo mang **nhãn loại** ở mọi nơi liệt kê hoặc soạn nó: dòng
  thiệp ở Thiệp của tôi, đầu form editor (`components/shared/
  invitation-kind-badge.tsx`) và cột "Loại" cùng bộ lọc `?kind=` ở màn `/thiep`
  của CMS (`dashboard/components/shared/invitation-kind-tag.tsx`, bản sao danh
  sách loại ở `dashboard/constants/invitation-kind.ts`). Phân biệt bằng biểu
  tượng, không bằng màu: sáu hue cho sáu loại là phá bảng 7 màu ở trang khách,
  và ở CMS thì đụng các preset antd đã mang nghĩa gói/trạng thái. Lọc
  `wedding` bắt cả hàng thiếu khoá (`COALESCE(content ->> 'kind', 'wedding')`).

  Mọi loại đều dùng được **mẫu dựng sẵn** `mac-dinh` (thiệp sinh nhật có thêm
  mẫu `burgundy-birthday` trong kho)
  (`DEFAULT_TEMPLATE_SLUG`): không có hàng trong `templates`, tier `free`, không
  ô ảnh, và không bao giờ hiện trong kho mẫu hay danh sách yêu thích. Backend
  tra mẫu cho thiệp qua `catalogService.findCardTemplate`, không qua
  `findTemplateBySlug` (cái sau vẫn 404 với slug này). Phía frontend nó rơi về
  renderer `templates/classic/`, và renderer đó tự đổi bố cục theo `kind`.
- **Biểu tượng lịch trình đi theo nghĩa, không theo vị trí.** Mỗi mốc có
  `kind` tuỳ chọn (`TIMELINE_ACTIVITY_KINDS`, bản sao ở backend enum); `null`
  là "Tự động", đoán từ chữ `activity`. Người dùng chọn **nghĩa**, không chọn
  hình: mỗi mẫu khai một `TimelineDecorSet` bằng icon/ảnh decor của chính nó
  (`components/invitation/shared/timeline-activity.ts`), nên đổi mẫu thì hình
  đổi mà nghĩa giữ. Hai luật: không quay vòng icon theo `index %` (quay vòng là
  "Đón dâu" ra nốt nhạc), và loại nào mẫu không có hình hợp nghĩa thì dùng
  `neutral` của mẫu — không mượn hình của loại khác. Mẫu vẽ tay/ảnh decor không
  trải bộ lucide mặc định vào bảng của mình. Mẫu chỉ có hoạ tiết cố định (chấm,
  số thứ tự, một icon lặp lại) giữ nguyên. Dữ liệu mẫu và seed **bắt buộc** ghi
  `kind` tường minh vì thumbnail kho mẫu chụp từ đó.
- Guests write two things into a card, and they are never merged. A **wish**
  in the guestbook (`wishes`) arrives pending; only wishes the couple approves
  appear on the card, and the couple may delete any of them. Approval and
  deletion are owner-only rights, so backend enforces them — the UI merely
  reflects the state. Owners moderate **only** from
  `thiep-cua-toi/<slug>/loi-chuc`: the editor card holds the on/off switch and
  a link there, not a second moderation list — the editor is for composing the
  card, moderation is repeat work done after it has been sent.
- **Xác nhận tham dự** (block `rsvp`, bảng `rsvps`) là thứ thứ hai khách ghi
  vào: tên, có đi hay không, và số người đi. Block này **mặc định bật** như mọi
  block khác — ở `createEmptyContent`, `emptyInvitationContent` và nội dung mẫu
  — và nằm ngay dưới sổ lưu bút. Khác lời chúc: **không bao giờ hiện công khai** và không có
  bước duyệt; chỉ chủ thiệp đọc được, và chỉ ở
  `thiep-cua-toi/<slug>/xac-nhan` (thẻ trong editor chỉ có công tắc và link
  sang đó, cùng lý do với lời chúc).

  Component dùng chung `InvitationRsvp` **không vẽ tiêu đề**: mỗi mẫu bọc nó
  trong chính khung section của mình, cùng khung với sổ lưu bút, nên tiêu đề ra
  đúng font của mẫu. Mẫu mới phải dựng block này như vậy, không tự vẽ form.

  Nối với **link mời riêng**: khách mở `/t/<slug>?khach=<mã>` được điền sẵn tên,
  mã đi kèm phản hồi, và backend gắn phản hồi vào đúng hàng `card_guests` — mỗi
  khách một phản hồi (unique `guest_id`), gửi lại là sửa. Mã chỉ được tin khi
  `CardsService.findInvitedGuest` khớp ra khách (tính năng đang bật, mã đúng);
  mọi trường hợp khác ghi như link chung (`guest_id = null`, không khử trùng
  lặp). `guest_id` là `ON DELETE SET NULL` vì sửa chính tả một tên là xoá hàng
  khách cũ — câu trả lời đã gửi không được mất theo, `name` giữ ảnh chụp. Màn
  `khach-moi` hiện trạng thái phản hồi của từng khách.
- **Đánh giá mẫu thiệp không phải lời chúc.** (Site này đã gỡ toàn bộ phần
  đánh giá và yêu thích mẫu ở `frontend/`; backend và màn CMS `/danh-gia-mau`
  vẫn còn. Phần dưới mô tả hành vi backend.) Người dùng đã đăng nhập có thể
  chấm 1–5 sao kèm nhận xét tuỳ chọn cho một **mẫu** trong kho mẫu
  (`template_reviews`, khoá theo `templateSlug`). Đây là nhận xét về sản phẩm,
  hiện ngay và không qua duyệt — khác hẳn `wishes` là thứ khách mời viết vào
  thiệp cưới của một cặp đôi và phải được cặp đôi duyệt. Mỗi người một đánh giá
  cho mỗi mẫu; gửi lại là sửa bản cũ. Quy tắc "khách chỉ viết lời chúc" ở trên
  nói về **thiệp**, không nói về kho mẫu. Admin **kiểm duyệt sau**: xoá được bất
  kỳ đánh giá nào (`DELETE /admin/template-reviews/:id`, màn `/danh-gia-mau`
  trong dashboard) nhưng không sửa điểm hay lời của người khác. Mẫu chưa có đánh
  giá nào thì UI hiện mặc định 5.0 sao kèm nhãn "chưa có đánh giá", không hiện
  0.0.
- Users edit content only; template layout, fonts and colors are fixed.
- Never hard-code invitation data into a template.
- Tier/payment/ownership rules must be enforced by backend, not only hidden in
  the UI.

## 7. Environment and validation

- Never commit `.env` or secrets.
- When adding an environment variable, update the corresponding `.env.example`.

Backend:

```bash
cd backend
npm run format
npm run lint
npm test
npm run build
```

Also run `npm run test:e2e` for route/integration changes.

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Frontend currently has no `format` or `test` script; do not claim they ran.

## 8. Definition of done

- Code is in the required folder/layer.
- No duplicate-responsibility folder was introduced.
- Backend enforces validation, authorization and business limits.
- Mutations keep React Query cache consistent.
- Both locales are updated for user-facing text.
- No secret/environment-specific value is hard-coded.
- Relevant lint, tests and build pass.
- If a genuinely new architecture category is introduced, update this file in
  the same change.
