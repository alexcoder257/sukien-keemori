# Business model — gói dịch vụ & phân nhóm mẫu thiệp

Tài liệu này là **nguồn tham chiếu duy nhất** cho câu hỏi "khách mua gì và được
gì". Trang giá, editor, CMS và luật phía backend đều phải khớp với đây.

> Đổi mô hình **2026-10-17**: bỏ ba gói Free / Gold / Diamond, bản dùng thử
> 3 ngày / 15 người xem, giá mua lại, Diamond Song Hỷ và màn doanh thu trong
> CMS. **Giữ** thanh toán trong ứng dụng (SePay) và mã giảm giá, nhưng chỉ còn
> **một gói**. Bảng/cột cũ (`expenses`, `site_settings.unpaid_*`,
> `wedding_cards.groom_slug`/`bride_slug`…) vẫn nằm trong database, không còn
> ai đọc ghi.

---

## 1. Một gói duy nhất: thiệp 899.000 ₫

| | |
|---|---|
| Sản phẩm | Thiệp online (sinh nhật, khai trương, hội nghị, tiệc, cưới…) dựng trên một mẫu trong kho |
| Giá niêm yết | **899.000 ₫** — sửa ở CMS "Bảng giá" (`tier_prices`, đúng một hàng `tier='diamond'`, module `pricing`) |
| Giảm giá | Khuyến mãi của gói (% ở "Bảng giá") → rồi mã giảm giá (CMS "Mã giảm giá"); làm tròn **lên** bội số 1.000 ₫ |
| Thanh toán | Chuyển khoản QR **trong ứng dụng** qua SePay; webhook xác nhận, CMS "Giao dịch" ghép tay khoản chuyển sai mã. Đơn 0 ₫ (mã giảm 100%) xác nhận ngay |
| Dùng thử | Không có |
| Ai dựng thiệp | Khách tự dựng: kho mẫu → "Dùng mẫu này" → editor. Keemori vẫn dựng hộ được bằng chính luồng đó |

**Phải trả mới có link.** Soạn và xem thử thoải mái (lưu cần đăng nhập, thiệp
là `draft`). "Lưu & Tạo link" trên thiệp chưa trả mở hộp thanh toán; tiền về
(`markPaid`) thì thiệp được xuất bản vĩnh viễn: `status = 'paid'`, có đường dẫn,
không hạn, không trần người xem. `POST /cards/:id/publish` trên thiệp chưa trả
bị từ chối (`PAYMENT_REQUIRED`).

**Mọi thiệp có mọi tính năng**: xác nhận tham dự, link mời riêng từng khách, sổ
lưu bút, album (trần `ALBUM_PHOTO_CAP`), hộp quà, nhạc.

---

## 2. Cấp thiết kế của mẫu

`template.tier` (free / gold / diamond) **vẫn còn**, nhưng giờ chỉ là cấp thiết
kế của mẫu — mẫu dàn bao nhiêu ô ảnh — không còn là thứ khách mua. Nó không
quyết định giá, tính năng hay quyền của thiệp nào.

### Luật xếp cấp — mặc định lúc dựng mẫu, không phải bất biến

Gói **khởi điểm** của một mẫu suy ra từ số ô ảnh mà thiết kế gốc thực sự cần.
Đây là luật để `thiep-extract` chọn gói lúc dựng mẫu, không phải ràng buộc vĩnh
viễn:

| Gói | Số ô ảnh (`photoSlots`) | Nghĩa |
|---|:--:|---|
| `free` | **0** | mẫu minh hoạ hoặc thuần typography |
| `gold` | **1–3** | ô dàn sẵn, tỉ lệ khung cố định |
| `diamond` | **4–6** | mẫu thiết kế quanh việc có nhiều ảnh |

Tên ô lấy trong `cover · couple · groom · bride · story · closing`. Ảnh gốc có 8
ô mà mẫu định xếp Gold thì chọn 3 ô *đắt nhất* và ghi rõ đã bỏ ô nào.

**CMS là nơi chốt gói của một mẫu, và nó đứng trên bảng này.** Admin nâng một
mẫu Free hoặc Gold lên Diamond ở màn kho mẫu (`PATCH /admin/templates/:slug`) mà
không phải thêm ô ảnh nào: số ô là chuyện bố cục, còn gói là chuyện giá — một
mẫu 2 ô nhưng art direction đắt tiền hoàn toàn có thể bán ở Diamond, vì Diamond
bán chủ yếu bằng **album** chứ không bằng số ô (mục 4).

Hệ quả bắt buộc giữ: cột `templates.tier` trong DB là nguồn sự thật, còn
`templates.seed.ts` chỉ là **giá trị khởi tạo cho mẫu chưa có trong DB**. Với
mẫu đã tồn tại, `seedTemplates` chỉ ghi đúng bốn trường mà code làm chủ
(`name`, `photoSlots`, `imagePosition`, `imageSrc` —
`CODE_OWNED_TEMPLATE_FIELDS`); mọi trường còn lại thuộc CMS và được giữ nguyên,
gồm cả `sortOrder`, `featuredOnHome` và `homepageOrder`. Danh sách là
**whitelist**, nên cột mới thêm vào `Template` mặc định thuộc CMS. Chạy
`npm run seed` sau khi admin xếp lại gói **không** được kéo cấu hình về file.

Và từ nay seed không còn là đường lên production: mẫu mới đi bằng migration.
Xem mục "Kho mẫu và migration" trong `CLAUDE.md`.

Luật này được kiểm bằng máy: `frontend/scripts/check-templates.mjs` đối chiếu
`docs/templates/<slug>.md` với `backend/src/seeders/data/templates.seed.ts` và
báo lỗi nếu `tier` lệch hoặc `photoSlots` lệch. Riêng "số ô không khớp bảng
trên" chỉ là **cảnh báo**, vì nó có thể là một quyết định xếp gói có chủ ý.

> **Kho mẫu đã chuyển sang backend.** Metadata của mẫu (id, tier, photoSlots,
> categories, imageSrc) nằm ở `backend/src/seeders/data/templates.seed.ts`;
> `frontend/lib/data/templates.ts` giờ chỉ còn hàm gọi API. Skill nào còn bảo
> "khai vào `lib/data/templates.ts`" là đang nói bản cũ.

> **Tài liệu này chỉ giữ phần chính sách: mẫu nào thuộc gói nào.** Spec dựng của
> từng mẫu — font, art direction, danh sách asset, trạng thái — nằm ở
> `docs/templates/<slug>.md`, mỗi mẫu một file. Đừng chép font, asset hay danh
> sách mẫu vào đây: hai bản sao chắc chắn sẽ lệch, và `check-templates.mjs`
> không đọc tài liệu này.

**Phân bố giữa ba gói là kết quả, không phải chỉ tiêu.** Không có hạn ngạch "mỗi
gói bao nhiêu mẫu": ảnh gốc cần mấy ô thì mẫu vào gói đó. Diamond ít mẫu là
chuyện bình thường — mẫu 4–6 ô ảnh vốn hiếm, và Diamond bán chủ yếu bằng **album
mở trên mẫu Free/Gold** (mục 2), không bằng số mẫu riêng.

**Danh mục mẫu không nằm ở đây.** Nó sinh ra được từ repo, nên chép vào tài liệu
chỉ tạo thêm một bản sao để lệch:

```bash
ls docs/templates/                                  # mẫu nào đang có
grep -h '^tier:' docs/templates/*.md | sort | uniq -c   # phân bố gói
grep -cE '^\s+"[a-z-]+":' frontend/components/invitation/templates/registry.ts  # đã dựng
```

Trạng thái thật của một mẫu đọc theo thứ tự: `registry.ts` nói **đã dựng hay
chưa** (`status.build` trong spec có thể cũ hơn), `templates.seed.ts` nói **tier
và ô ảnh đang chạy**, spec nói phần còn lại.

---

## 3. Dây chuyền sản xuất mẫu — đúng hai bước

Một mẫu đi từ ảnh Pinterest tới card kho mẫu qua **hai skill**, không hơn. Mỗi
bước tự chịu trách nhiệm chất lượng đầu ra của mình: cuối bước có một **cổng
chất lượng**, chưa qua cổng thì bước đó chưa xong.

```text
inspire-N.jpg ──$thiep-extract N──▶ spec + asset + entry seed ──cổng 1──▶ assets: done
                     └──$thiep-build <slug>──▶ .tsx/.css + registry + thumbnail ──cổng 2──▶ build: done
```

Không có skill QA riêng và không có skill dọn dẹp riêng: kiểm và dọn nằm trong
cổng của chính bước sinh ra chúng. Tách ra thì chúng chỉ chạy khi có người nhớ
gọi — và cái không ai gọi thì không bao giờ chạy. Đổi lại, `done` có nghĩa chặt:
**đã qua cổng**, không phải "đã làm xong tay".

**Nội dung từng cổng nằm trong chính skill, không chép lại ở đây** —
`thiep-extract` bước 9 và `thiep-build` bước 3. Tài liệu này chỉ giữ phần hai
skill phải thống nhất với nhau.

### Ranh giới — ai quyết cái gì

| Quyết định | Ai quyết |
|---|---|
| Mẫu thuộc gói nào, mấy ô ảnh | **tài liệu này**, mục 3 |
| Ảnh gốc trông thế nào; diện mạo block ảnh gốc không có | `thiep-extract` |
| Asset đạt hay không | `thiep-extract`, cổng 1 |
| Bố cục, CSS, component | `thiep-build` |
| Mẫu đạt hay không | `thiep-build`, cổng 2 |

Hai luật chống trôi:

1. **`thiep-extract` không viết code UI.** Không `.tsx`/`.css`/HTML, kể cả khi
   thừa sức làm. (Khai metadata vào `templates.seed.ts` thì được — không có entry
   thì mẫu không tồn tại để dựng.)
2. **`thiep-build` không sửa spec ngoài phần của mình.** Nó *được* mở ảnh gốc để
   soi bản dựng, nhưng thấy asset hỏng hoặc spec đọc sót ảnh thì **dừng và ghi
   mục "Yêu cầu sinh lại"** vào spec — build không sinh được ảnh, và spec sai
   thường kéo theo manifest sai.

**Hai skill trả việc cho nhau qua repo, không qua chat.** Chúng chạy ở hai
session khác nhau (có thể hai model khác nhau), nên mọi thứ nói miệng đều mất.
Mục `## Yêu cầu sinh lại` là kênh chính thức: build viết yêu cầu kèm **triệu
chứng đo được**, extract mở nó ở **chế độ vá** — chỉ sinh lại đúng file được
liệt kê, không chạy lại từ đầu, xong thì xoá mục. `check-templates.mjs` cảnh báo
khi mục còn tồn tại, nên nó không rơi mất giữa hai phiên.

### Cả hai cùng ghi vào `docs/templates/<slug>.md`

Không chồng lấn, vì mỗi bên sở hữu một tập trường:

| Phần của spec | Ai ghi |
|---|---|
| `slug` `name` `tier` `photoSlots` `fonts` `assets.envelope/photos/decor` · 9 mục văn xuôi (kiểm kê, bảng màu, từ vựng, bảng phủ 14 block, manifest, prompt…) | **extract** |
| `assets.thumbnail` · `status.build` · mục **Art direction** · mục **Yêu cầu sinh lại** | **build** |
| `status.assets` | extract |
| `inspiration` | extract đặt `extracted`, build đổi thành `done` |

Luật này giữ cho cổng 2 còn kiểm được: `Kiểm kê từng màn` là **thước đo** mà
build dùng để chấm bản dựng. Cho build sửa kiểm kê là cho nó tự nắn thước cho
vừa bản dựng của mình, và cổng Concept sẽ luôn PASS. Hiện chưa có gì kiểm bằng
máy — cách phát hiện là đọc `git diff` của spec sau một lượt build: thấy dòng
nào ngoài bốn thứ ở hàng thứ hai là build đã vượt quyền.

### Gọi skill nào

| Muốn gì | Gọi | Đầu vào |
|---|---|---|
| Tạo mẫu mới từ ảnh inspiration | `$thiep-extract` | số hiệu ảnh (`24`) |
| Dựng UI cho mẫu đã qua cổng 1 | `$thiep-build` | slug (`luc-ly`) |
| Kiểm lại / dọn lại mẫu đã dựng | `$thiep-build` | slug — chạy thẳng cổng 2 |

Cứ nhìn đầu vào: có số hiệu ảnh thì extract, có slug thì build. Không có skill
thứ ba để gọi khi muốn QA.

**Điều kiện bắt đầu.** Extract cần ảnh trong `docs/inspiration/` đúng quy ước tên
(bảng hậu tố `inprogress|extracted|abandon|done` nằm trong `thiep-extract`) và
**phải có công cụ sinh ảnh** — không có thì spec vẫn ra nhưng dừng ở
`status.assets: todo`. Build cần `status.assets: done` và `check-templates.mjs`
`0 lỗi`.

### Việc còn tồn — cập nhật 2026-08-12

| Việc | Số lượng | Xử lý |
|---|--:|---|
| Ảnh `inprogress` chưa có spec (#42, #43, #44, #46–#51) | 9 | `$thiep-extract <id>` |
| Mẫu có spec nhưng chưa qua cổng 1 (`tham-luc`, `thanh-su`) | 2 | `$thiep-extract` lại, nhánh sinh ảnh |
| Mẫu đã qua cổng 1, chờ dựng | 23 | `$thiep-build <slug>` |
| Thư mục asset mồ côi (`ai-tinh/`, `tinh-ca/`) | 2 | cổng 1 của lượt extract tương ứng |
| Mẫu đã dựng nhưng chưa có `thumbnail.webp` → card còn dùng atlas | 13 | `$thiep-build <slug>`, chạy thẳng bước 4 |
| `ti-hon` còn trích ảnh đã `abandon` (#10) trong *Kiểm kê từng màn* và *Manifest asset* | 1 | `$thiep-extract` chạy lại phần đó — khoá `inspiration:` đã gỡ, phần văn xuôi thì chưa |

Hai dòng cuối là drift `check-templates.mjs` **không** bắt. Tám khoá hỏng vì ba
lý do: ảnh bị hạ về `inprogress` sau khi spec đã ghi (#4, #6, #7, #9), ảnh đã đổi
sang `abandon` (#10), và tên ghép hai slug bị tách lại còn một (#8, #11).
Build mở ảnh gốc theo khoá này, nên tên sai là cổng 2 không có gì để đối chiếu.

---

## 4. Hệ quả kỹ thuật

Schema thật nằm ở TypeORM entity trong `backend/src/modules/<domain>/`; phần dưới
là *luật nghiệp vụ*.

### Trạng thái thiệp

```text
draft ──đơn hàng được trả (markPaid)──▶ paid   // link vĩnh viễn, không trần người xem
```

`free` và `unpaid` không bao giờ được ghi nữa (migration `CollapseCardPlans`
chuyển mọi thiệp cũ sang `paid`). `markPaid` ghi `paidAt ??=` — mốc của luật
khoá tên 15 ngày (`COUPLE_NAMES_LOCK_DAYS`).

Đơn hàng (`orders`) vẫn mang cột `tier` (NOT NULL) — luôn ghi `diamond`, cùng lý
do với `plan_tier`; `family_split` và `is_repeat_purchase` luôn `false`.

`wedding_cards.plan_tier` là cột cũ: mọi thiệp mang `diamond` để không còn phép
kiểm nào chặn tính năng. Client không đọc cột này.

### Hai loại ảnh, không gộp làm một

| Loại | Do ai quy định | Lưu ở đâu |
|---|---|---|
| Ảnh trong thiết kế | Từng mẫu (`template.photoSlots`) | Ràng buộc theo `slotKey` |
| Ảnh album | Mọi thiệp | Danh sách, có trần `ALBUM_PHOTO_CAP` |

Thiệp là link vĩnh viễn nên chi phí lưu trữ cũng vĩnh viễn — album luôn có trần.

### Album là section dùng chung

Album là **một section dùng chung** ăn token màu/chữ của mẫu đang dùng — đúng
điều kiện (3) mục "Template thiệp là ngoại lệ có phạm vi" trong `CLAUDE.md`.

---

## 5. Ghi chú sản xuất

**Tranh minh hoạ cho Tí Hon và Thuỷ Mặc.** Sinh bằng AI thì:

- Không đưa `inspire-6/7/10` làm ảnh tham chiếu, không nhắc tên hoạ sĩ/studio
  trong prompt. Mô tả bằng ngôn ngữ phong cách chung.
- Tranh AI có bảo hộ bản quyền rất mỏng — chỉnh tay hoặc vector hoá phần chính
  để có thứ sở hữu rõ ràng.
- **Không tách lớp ghép tổ hợp.** AI không giữ nhân vật nhất quán qua nhiều file
  rời có alpha sạch. Sinh ~6 **cảnh hoàn chỉnh** cố định cho khách chọn; mỗi
  cảnh chỉ cần nhất quán với chính nó. Hoa lá / khung / texture thì ngược lại —
  sinh thoải mái, không có vấn đề nhất quán.

**Ngân sách ảnh.** Mẫu nền tranh tràn viền rất nặng. Đặt trần ~200KB/màn ở
AVIF/WebP. Phần lớn khách mở thiệp bằng 4G trên điện thoại; mẫu đẹp mà tải 3
giây thì hỏng đúng khoảnh khắc quan trọng nhất.
