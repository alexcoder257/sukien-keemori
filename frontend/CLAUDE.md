@AGENTS.md

# Frontend Architecture Guide

Tài liệu này là quy ước bắt buộc khi thêm hoặc sửa mẫu thiệp. Mục tiêu là mỗi
concept có art direction riêng nhưng vẫn dùng chung schema, editor và các block
đã có. Không sao chép component chỉ để đổi màu hoặc đổi ảnh.

## 1. Nguồn sự thật

- Đọc `AGENTS.md` trước khi sửa code và đọc guide tương ứng trong
  `node_modules/next/dist/docs/` trước khi dùng API Next.js.
- Quy tắc gói, số ô ảnh và block nằm trong `docs/business-model.md`.
- Hằng số nghiệp vụ nằm trong `constants/invitation.ts`.
- Metadata của 12 mẫu nằm trong `lib/data/templates.ts`; không khai báo lại tier,
  concept code hoặc `photoSlots` trong template component.
- Mẫu chưa ra mắt khai trong `LOCAL_ONLY_TEMPLATE_SLUGS` tại `lib/data/templates.ts`:
  chỉ hiện với `npm run dev`, bị ẩn trong `next build`/`next start` (kể cả chạy
  trên máy local). Các trang chọn/xem mẫu dùng `getCatalogTemplateBySlug`;
  `getTemplateBySlug` dành cho metadata của thiệp đã lưu. Khi ra mắt, bỏ slug
  khỏi danh sách này; trạng thái xuất bản trong CMS vẫn áp dụng như trước.

## 2. Cấu trúc ảnh

**Một mẫu thiệp = một thư mục.** Đây là trục phân loại duy nhất. Tier *không*
phải là thư mục: nó là thuộc tính có thể đổi của mẫu (`lib/data/templates.ts`),
nên nếu xếp ảnh theo tier thì mỗi lần xếp lại gói là phải move file và đổi tên.

```text
public/images/
├── site/                         # giao diện sản phẩm, không thuộc mẫu nào
│   ├── steps/                    # ảnh minh hoạ 3 bước ở trang chủ
│   ├── showcase/                 # ảnh chụp thiệp dùng cho home/guide
│   ├── template-atlas.avif       # atlas dự phòng cho card kho mẫu
│   └── placeholder.avif          # ô trống có chủ đích, xem bên dưới
├── shared/                       # asset trung tính, từ 2 mẫu trở lên dùng
└── templates/
    └── {slug}/                   # slug PHẢI khớp `lib/data/templates.ts`
        ├── thumbnail.avif        ┐ dải dài toàn bộ thiệp (homepage + hover)
        ├── poster.avif           ├─ 4 vai cố định, tên không đổi giữa các mẫu
        ├── envelope-closed.avif  │
        ├── envelope-open.avif    ┘
        ├── photos/               # ảnh mock cặp đôi của chính concept này
        └── decor/                # scenery, texture, ornament riêng của mẫu
```

- Vai **cố định** (số lượng biết trước) nằm ở gốc thư mục mẫu và mang tên theo
  vai; tập **số lượng thay đổi** nằm trong thư mục con. Nhờ vậy suy ra được
  đường dẫn thumbnail và phong bì của một mẫu mà không cần tra manifest.
- `thumbnail.avif` là **một ảnh chụp dài của toàn bộ thiệp sau khi mở phong
  bì** (960px ngang). Mọi `PosterCard` (kho mẫu, dải mẫu nổi bật, cặp đôi đã
  tạo thiệp) pan nó từ đầu xuống cuối khi hover. Không nhúng iframe vào card;
  iframe thật chỉ dùng trong dialog/trang demo.
  **Quy cách chụp duy nhất:** khung thiệp 640px (viewport 644, cắt đúng khung —
  không chụp rộng hơn, phần thừa là nền trang và lộ thành viền trắng hai bên
  card; không chụp đúng 640, vì `@media (max-width: 640px)` sẽ ra bố cục mobile)
  × `deviceScaleFactor` 1.5 = 960px, không resize, AVIF q70. 960 phải luôn ≥ 1.5
  lần khung card rộng nhất ở mọi breakpoint.
- `poster.avif` (960×1231, tỉ lệ 0.78) là **lát cắt nguyên điểm ảnh ở đầu dải
  đó**, dùng cho card ở trạng thái nghỉ. Đây là ngoại lệ duy nhất của quy tắc
  "một ảnh dùng chung mọi nơi": card chỉ để lộ khoảng 10% đầu dải. Đo thực tế: 49 dải dài là 1,34GB
  bitmap sau giải mã — vượt ngân sách cache ảnh của Chrome nên cuộn tới đâu giải
  mã lại tới đó; 49 poster chỉ còn 75MB. **Không thu nhỏ `thumbnail.avif` để
  thay cho việc này** — làm vậy là chữa kho mẫu bằng cách làm mờ homepage.
  Poster do skill `thiep-media` cắt ra từ chính `thumbnail.avif`, không chụp
  lại: chụp hai lần là hai lần render, mẫu có ảnh ngẫu nhiên sẽ cho hai khung
  hình khác nhau và card giật một cái ở frame đầu hover.
  Đường dẫn suy theo quy ước, **không khai trong seed hay spec** — thêm một
  nguồn sự thật thứ tư cho một tệp luôn nằm cạnh tệp kia là tự chuốc việc đồng
  bộ.
- Tên thư mục mẫu là **slug sản phẩm**, không phải codename nội bộ. Không đặt
  ảnh của một mẫu ở thư mục mang tên khác.
- `photos/` giữ ảnh mock cặp đôi (hoặc tranh minh hoạ với mẫu Free). Thư mục đã
  nói mẫu nào rồi nên **filename không lặp lại tier và slug**:
  `templates/hanh-trinh/photos/anh-cuoi-bien-hoang-hon.avif`, không phải
  `diamond-hanh-trinh-anh-cuoi-bien-hoang-hon.avif`.
- Filename viết thường, không dấu, kebab-case, mô tả đúng chủ thể/bối cảnh —
  đường dẫn đầy đủ là thứ Google đọc, nên nó phải đọc ra nghĩa. Không dùng mã mơ
  hồ như `concept-c-05.avif`, không đánh số thay cho mô tả, không nhồi từ khoá.
  Ảnh nội dung (khách nhìn thấy, được index) đặt tên tiếng Việt không dấu; asset
  kỹ thuật trong `decor/` đặt tên tiếng Anh mô tả.
- `decor/` chỉ chứa art direction không dùng chung được. Asset trung tính mà từ
  hai mẫu trở lên dùng phải chuyển sang `images/shared/`.
- **Phong bì dùng một quy ước tên duy nhất**, khác nhau chỉ ở thư mục:

  ```text
  templates/{slug}/envelope-{closed,open}.avif   mẫu có phong bì riêng
  shared/envelope-{closed,open}.avif             mặc định, tự dùng khi không có
  ```

  Mẫu chưa khai phong bì riêng tự rơi về mặc định qua `InvitationGiftBox`, nên
  một mẫu đang dựng dở vẫn có khối mừng cưới hoàn chỉnh. `envelope-neutral-*`
  là một **lựa chọn có chủ đích** (giấy trắng) chứ không phải mặc định — mẫu nào
  muốn thì khai thẳng trong presentation của mình.
  Hai ảnh phải **cùng kích thước** và tỉ lệ ~520/920 (khớp
  `--gift-envelope-ratio`), lệch là méo hình.
- **Đừng phủ hoạ tiết của mẫu lên phong bì mặc định.** `envelopeDecorSrc` chỉ
  dành cho phong bì mà mẫu tự làm chủ; dán hoạ tiết concept lên bao lì xì đỏ là
  hai ngôn ngữ hình đánh nhau.
- **Không để file nguồn trong `public/`.** Sprite gốc và contact sheet từ ChatGPT
  là vật liệu extract, nằm ngoài `public/` (xem `frontend/.template-raw/`, đã
  gitignore) và **xoá sau khi cắt xong** — chúng sinh lại được từ prompt. Mọi
  thứ trong `public/` đều bị serve công khai.
- Chỗ nào chưa có ảnh thật thì trỏ vào `/images/site/placeholder.avif` chứ đừng
  dùng tạm một ảnh khác cho đủ chỗ — placeholder là ô trống nhìn ra ngay, còn
  ảnh mượn thì lẫn vào asset thật và không ai biết đường cập nhật.
- Dùng đường dẫn bắt đầu bằng `/images/...` trong code; không import file từ
  `public` bằng đường dẫn filesystem.

## 3. Dữ liệu mock theo concept

- `lib/data/invitation-sample.ts` là registry duy nhất nối `conceptCode` với bộ
  ảnh mock. Registry phải exhaustive theo `TemplateConceptCode` để TypeScript
  báo lỗi khi thêm concept mà chưa khai báo ảnh.
- Gọi `sampleInvitationContent` bằng object có tên trường (`templateSlug`,
  `photoSlots`, `kind`…). Không quay lại positional arguments.
- Mẫu có `showcase` trong registry (vd. `burgundy-birthday`) trả về đúng tấm
  thiệp mà mẫu được dựng từ đó — cho trang demo, `xem-thu` và nút "Điền dữ liệu
  mẫu" trong editor (điền cả ảnh, vì đó là ảnh của chính mẫu, không phải stock).
- Ưu tiên ảnh ngang ở đầu mảng nếu slot đầu là `cover`; các ảnh dọc đặt sau cho
  `couple`, `groom`, `bride`.
- Ảnh trong các ô thiết kế được quyết định bởi concept và `photoSlots`. Album
  mở trên mọi thiệp (không còn gói).

## 4. Tạo một template mới

1. Thêm metadata vào `lib/data/templates.ts`, gồm `code`, `tier`, `photoSlots` và
   thumbnail nếu đã có.
2. Tạo `components/invitation/templates/<slug>/` cho mẫu mới (một mẫu = một
   thư mục) và đăng ký trong `components/invitation/templates/registry.ts`.
   Gốc `templates/` chỉ giữ hạ tầng: registry, `template-shell.tsx`,
   `template-typography.tsx`.
3. Tạo một CSS Module riêng cho art direction. Khai báo palette bằng semantic
   CSS variables ở root template; không rải mã màu ngẫu nhiên trong JSX.
4. Tạo `public/images/templates/{slug}/` với `decor/` và `photos/`; thumbnail và
   phong bì đặt ở gốc thư mục theo đúng tên vai ở mục 2.
5. Cập nhật registry ảnh mock trỏ vào `templates/{slug}/photos/`; không dùng lại
   ảnh cưới của mẫu khác cho đủ chỗ — thiếu thì để placeholder.
6. Kiểm tra editor desktop/mobile, trang `xem-thu`, trang `demo` và thiệp public.

## 5. Tái sử dụng component

Trước khi tạo component mới, kiểm tra `components/invitation/shared/`. Đó là
nơi **duy nhất** chứa thứ nhiều mẫu dùng chung: countdown/calendar, album, gift
box, sổ lưu bút (`InvitationWishes`), music toggle, màn mở thiệp
(`InvitationOpening`), `Reveal`, `GoogleMapEmbed` và các helper
(`getInvitationFamilySides`, `coupleShortNames`, `invitationBlocks`).

Một file chỉ được nằm trong `shared/` khi **từ hai mẫu trở lên** thật sự dùng
nó. Hero, ceremonies, reception, story, timeline, dress code, thank-you và
`InvitationSection` từng nằm ở đó nhưng chỉ mẫu `classic` dùng — chúng đã về
`templates/classic/`. Đặt ruột của một mẫu vào `shared/` khiến người sau tưởng
sửa nó là đụng cả kho mẫu và không ai dám chạm.

- Template chịu trách nhiệm bố cục section, font, palette và ornament; component
  dùng chung chịu trách nhiệm dữ liệu, trạng thái, accessibility và hành vi.
- Nếu concept cần diện mạo khác, mở rộng component bằng một presentation contract
  nhỏ (asset source, class name hoặc semantic CSS variables). Không thêm prop
  kiểu `isAurora`, không đọc `templateSlug` bên trong common component và không
  fork nguyên component.
- Contract màu phải dùng tên theo vai trò như `--gift-accent`, `--gift-surface`,
  `--calendar-accent`; không dùng tên concept trong common CSS.
- Component render qua portal (Dialog/Popover) phải gắn theme class trực tiếp lên
  popup/backdrop và có fallback token, vì portal không kế thừa root template.
- Giữ default presentation để các template cũ tiếp tục hoạt động khi chưa truyền
  preset riêng.
- Chỉ tạo component mới khi cấu trúc, dữ liệu hoặc hành vi thật sự khác và không
  thể biểu diễn bằng composition/presentation contract hiện có.

## 6. Bất biến nghiệp vụ

- Chỉ có một gói (899.000 ₫, sửa ở CMS, thanh toán trong ứng dụng — xem
  `docs/business-model.md`); thiệp không còn `planTier` nào để rẽ nhánh. Thiệp
  chưa trả là bản nháp, trả xong mới có link. `WeddingTemplate.tier` chỉ là cấp thiết
  kế của mẫu (free 0 ô, gold 1–3 ô, diamond 4–6 ô ảnh).
- Đổi template không được xóa ảnh người dùng đã nhập.
- Album là block dùng chung có trên mọi thiệp, không phải một `photoSlot`.
- Block visibility là dữ liệu của thiệp. Template được thay bố cục nhưng không
  được tự ý sửa nội dung hay bật/tắt block.
- Backend là nơi thực thi giới hạn thật; frontend chỉ phản hồi sớm và hiển thị
  trạng thái phù hợp.

## 7. Checklist trước khi hoàn tất

- Không còn đường dẫn asset chết hoặc ảnh mock nằm trong folder template.
- Common component vẫn chạy với default presentation và template mới dùng preset
  riêng nếu cần.
- Màu, focus ring, modal backdrop và trạng thái hover đều theo concept.
- Ảnh có `sizes`, decorative image có `alt=""`, control có accessible label.
- Chạy ESLint, TypeScript và production build; kiểm tra cả desktop lẫn mobile
  preview khi thay đổi layout.
