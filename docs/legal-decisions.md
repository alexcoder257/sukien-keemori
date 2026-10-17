# Quyết định nghiệp vụ còn thiếu của khu pháp lý

Bốn trang trong `/legal` đã dựng xong và nội dung khớp với hành vi thật của hệ
thống. Những mục dưới đây là thứ **code không được phép tự quyết** — chúng cần
chủ sản phẩm chốt, và cho tới khi được chốt thì trang tương ứng hiện một khối
cảnh báo (`pending: true` trong dictionary) thay vì một quy định bịa ra.

Mỗi mục ghi rõ: chốt xong thì phải sửa ở đâu.

---

## 1. Thông tin pháp nhân — BUSINESS INFORMATION REQUIRED

**Cập nhật 2026-10-11.** Chủ thể kinh doanh là **hộ kinh doanh**, tên
`HỘ KINH DOANH KEEMORI` (khớp tên chủ tài khoản nhận tiền MB). Trang
`/{locale}/thong-tin-doanh-nghiep` đã dựng: chủ sở hữu, dịch vụ và giá niêm
yết (đọc `GET /pricing`), điều kiện giao dịch, giao nhận, thanh toán. Tài khoản
nhận tiền trên trang đọc từ `GET /payments/receiving-account` — tức đúng ba
biến `SEPAY_*` mà QR thanh toán dùng, không có bản sao thứ hai để lệch.

**Cập nhật 2026-10-13.** Đã có Giấy chứng nhận đăng ký hộ kinh doanh (cấp
09/10/2026): mã số, ngày đăng ký, nơi cấp và địa chỉ đã điền vào
`LEGAL_ENTITY`. **Chủ hộ kinh doanh cố ý để trống** — Bộ Công Thương không đòi
in tên chủ hộ trên website (các site đã thông báo cùng ngành cũng không in),
và đó là tên một cá nhân. Còn thiếu duy nhất đường dẫn hồ sơ trên
online.gov.vn: hồ sơ "Nền tảng TMĐT kinh doanh trực tiếp có đặt hàng trực
tuyến" (Nghị định 248/2026/NĐ-CP) đang khai, huy hiệu "Đã thông báo Bộ Công
Thương" chỉ hiện khi có `moitNotificationUrl`.

Hai kênh hỗ trợ đã được chốt ngày 12/09/2026: email
`hotro@keemori.com` và Facebook Messenger lấy từ `site_settings.messenger_url`.
Hotline mẫu đã được gỡ hoàn toàn. Từ 2026-10-11 có thêm kênh **Zalo** (số
cấu hình ở `site_settings.zalo_phone`, màn Cài đặt của CMS) — đó là kênh nhắn
tin, không phải hotline, nên không kèm cam kết có người trực máy. Chân trang,
trang Liên hệ và trang Thông tin doanh nghiệp hiện nó; **các văn bản có phiên
bản chưa nhắc tới Zalo** — mục liên hệ của chúng vẫn ghi đúng hai kênh email +
Messenger, thêm Zalo vào đó là một lần sửa câu chữ (tăng minor).

Sửa ở: `frontend/constants/legal.ts` → `LEGAL_ENTITY`, `LEGAL_CONTACT`; và
`frontend/constants/contact.ts` (trang Liên hệ đọc từ đó).

Các mục liên hệ cuối mỗi văn bản đã bỏ `pending` và hiển thị hai đường dẫn thật.
Phần còn thiếu trong mục này chỉ là thông tin pháp nhân; sau khi có, dựng khối
thông tin pháp nhân ở chân trang.

Lưu ý: chưa hoàn tất đăng ký kinh doanh thì **không được** hiển thị mã số thuế
hay tên công ty ở footer. Footer chỉ có link "Thông tin doanh nghiệp" (đứng đầu
cột Pháp lý), không in trực tiếp mã số nào.

## 2. Hoàn tiền B2C — ĐÃ CHỐT (2026-09-13)

**Chỉ hoàn tiền khi thiệp lỗi do mình** (thiệp không mở được, nội dung sai hoặc
mất, tính năng thuộc gói đã trả không chạy). Cơ chế: khách gửi khiếu nại → sửa
nhanh nhất có thể → **quá 3 ngày làm việc chưa khắc phục được thì hoàn toàn bộ
số tiền của thiệp đó**, khách không phải yêu cầu lần hai. Mốc 3 ngày trùng với
SLA khiếu nại ở mục 6, cố ý: một con số cho khách nhớ, và nó biến hạn trả lời
thành hạn có hậu quả.

Không hoàn: đổi ý, mua nhầm gói, chọn nhầm mẫu, nội dung khách tự nhập sai,
thiệp chạy đúng nhưng không hợp mắt, sự cố ngoài hệ thống của mình.

Chuyển thừa/chuyển trùng **không nằm trong luật này**: đó là trả lại tiền nhận
thừa, luôn trả, và đã có mục 5 của chính văn bản đó nói. Gộp nó vào "hoàn tiền"
là biến một khoản mình không có quyền giữ thành một khoản có điều kiện.

Văn bản lên `2.0` — major, vì bản 1.x nói "chưa ấn định" nên mọi yêu cầu đều
ngỏ, còn bản này vừa cam kết một trường hợp vừa **đóng** những trường hợp còn
lại.

Bản `1.0` của Điều khoản từng có câu "các khoản đã thanh toán không được hoàn
lại sau khi link thiệp đã được kích hoạt vĩnh viễn". Câu đó chưa từng được chốt
và đã bị gỡ ở bản `2.0`; luật mới không khôi phục nó — "không hoàn" giờ là một
danh sách trường hợp cụ thể, không phải một câu quét sạch.

**Còn thiếu ở phía code, và đây là một chênh lệch thật.** `ORDER_STATUSES` chỉ
có `pending` / `paid` / `cancelled` — không có `refunded`, và không có route nào
hạ `planTier` của một thiệp đã thanh toán. Nghĩa là hoàn tiền hiện là một thao
tác **hoàn toàn thủ công ngoài hệ thống**: chuyển khoản trả lại, còn trong cơ sở
dữ liệu đơn vẫn `paid` và thiệp vẫn giữ quyền lợi.

Văn bản đã được viết để **không nói dối về điều đó**: nó không hứa hệ thống tự
hạ gói, chỉ nói hoàn tiền là chấm dứt giao dịch với thiệp đó và khách không
dùng tiếp. Đúng ràng buộc hợp đồng, không phải một hành vi hệ thống chưa tồn
tại. Khi nào có ca hoàn tiền thật thì việc cần làm là: thêm `refunded` vào
`ORDER_STATUSES` (kèm migration), một route `super_admin` đánh dấu đơn và hạ
thiệp về chưa thanh toán, và một dòng `AuditAction` cho nó — hoàn tiền là thao
tác không hồi phục được và đổi quyền lợi của một tài khoản, đúng hai tiêu chí
để vào nhật ký.

## 3. Credits — KHÔNG CÒN LÀ CÂU HỎI

Ba quyết định từng nằm ở đây (hạn dùng Credits, hoàn Credits khi chấm dứt quan
hệ đối tác, Credits khuyến mãi) **đã hết hiệu lực**: đơn vị quy đổi point/
Credits bị gỡ khỏi sản phẩm trong migration `RemovePointsAndCredits`. Đối tác
B2B trả tiền theo đúng bảng giá chung và được ưu đãi bằng phần trăm chiết khấu,
nên không còn số dư nào để hết hạn hay hoàn lại.

Chính sách Credits (`/chinh-sach-credits`) đã bị xoá cùng giá trị `credit_policy`
trong enum văn bản pháp lý. Nếu sau này dựng lại một dạng tín dụng trả trước thì
**ba câu hỏi trên phải được chốt trước khi viết dòng code đầu tiên** — chúng là
lý do lần trước phải dừng lại.

## 4. Thời gian lưu trữ dữ liệu — đã chốt một phần

**Đã chốt (2026-09-07): thiệp chưa thanh toán.** Vòng đời đầy đủ:

1. Xuất bản → link sống `site_settings.unpaid_link_days` ngày (mặc định 3).
2. Hết hạn → job `link-expired-notice` (mỗi giờ) gửi email + thông báo trong
   ứng dụng và đóng dấu `wedding_cards.expiry_notified_at`.
3. Sau `site_settings.unpaid_purge_days` ngày (mặc định 1, trước 2026-09-28 là
   5) kể từ **thông báo** → job `expired-card-purge` (mỗi giờ) xoá hàng thiệp và
   cả thư mục ảnh `cards/<id>` trong kho lưu trữ. Không hồi phục được.

Đếm từ lúc báo chứ không từ `expiresAt`: job báo tin chạy trễ thì cửa sổ cứu dữ
liệu vẫn đủ một ngày. Rút từ 5 xuống 1 ngày ở Điều khoản 6.0 / Chính sách bảo
mật 4.0. Cột `expiry_notified_at` mặc định `NULL` và `NULL` nghĩa là
**chưa được phép xoá**, nên một job báo tin hỏng không bao giờ dẫn tới xoá nhầm.

Công bố ở: `legal.privacy.sections` mục 13 và `legal.terms.sections` mục 3. Cả
hai văn bản lên `3.0` — đây là **thay đổi major**: bản 2.x nói thẳng rằng không
có cơ chế xoá tự động theo thời hạn, và câu đó giờ đã sai.

Hai con số nằm ở `site_settings`, vận hành chỉnh được mà không cần deploy. Nới
rộng có hồi tố (cứu được thiệp đang chờ xoá); rút ngắn thì có hiệu lực ngay, nên
**rút ngắn là việc phải cân nhắc như một thay đổi chính sách**, không phải một ô
cấu hình bình thường.

**Đã chốt nốt phần còn lại (2026-09-13).** Mục 13 của Chính sách bảo mật **hết
cờ `pending`**; văn bản lên `3.2` ở cả hai nơi khai phiên bản.

| Loại | Thời hạn | Đứng sau nó là gì |
|---|---|---|
| Thiệp **đã** thanh toán | Không xoá tự động | Không cần code — đúng hành vi hiện tại |
| Tài khoản | Không xoá vì không hoạt động | Không cần code |
| `audit_logs` | 24 tháng | `audit-log-purge` (Chủ nhật 4h) |
| Bản sao lưu | 30 ngày | `prune_backups` trong `deploy-server.py` |

Hai loại đầu chốt là "không xoá" chứ không phải một con số, và đó là câu trả
lời thật chứ không phải cách né: sản phẩm bán **link vĩnh viễn**, nên một hạn
kiểu "24 tháng không đăng nhập thì xoá" là tự mâu thuẫn với chính lời chào
hàng. "Nhật ký bảo mật" trong danh sách cũ không tồn tại như một bảng riêng —
nó chính là `audit_logs`, nên gộp làm một dòng.

Hai loại sau cần con số vì chúng giữ dữ liệu cá nhân **không còn mục đích**:
`audit_logs` mang email và hành vi của người vận hành; bản sao lưu là ảnh chụp
toàn bộ cơ sở dữ liệu, tức chứa cả những hàng người dùng đã yêu cầu xoá. Trước
2026-09-13 mỗi lần deploy backend tạo một `pg_dump` đầy đủ vào
`/var/backups/keemori/` và **không có gì dọn chúng** — nghĩa là "đã xoá tài
khoản" trên thực tế không đúng. Đó là lý do 30 ngày phải là một dòng code, và
lý do Chính sách bảo mật nay nói thẳng rằng dữ liệu đã xoá còn sống trong sao
lưu chậm nhất 30 ngày.

Đúng thứ tự đã học ở mục 7 phần "Đã sửa": **cron trước, công bố sau**. Cả hai
job đã chạy trong cùng thay đổi này, không có câu nào trong văn bản chờ code
đuổi theo.

`AUDIT_LOG_RETENTION_MONTHS` và `BACKUP_RETENTION_DAYS` nằm trong code chứ
không nằm ở `site_settings`: khác với số ngày sống của link chưa thanh toán,
đây là cam kết pháp lý đã công bố, không phải cấu hình vận hành. Rút ngắn
`AUDIT_LOG_RETENTION_MONTHS` còn là rút ngắn bằng chứng về chính người vận
hành — đó phải là một commit có người review, không phải một ô nhập trong CMS.

**Thiệp `draft` chưa từng xuất bản không nằm trong luật này.** Chúng không có
`expiresAt` nên không bao giờ bị quét, và ảnh đã tải lên cho chúng ở lại kho vô
thời hạn. Muốn dọn thì cần một luật riêng đếm theo `updated_at` — chưa chốt.

## 5. Xoá tài khoản — cần xác nhận phạm vi

Hành vi hiện tại đã được mô tả đúng trong Chính sách bảo mật mục 12. Cần chủ
sản phẩm xác nhận đây là điều mong muốn:

- Người dùng **tự** xoá → xoá thật, email được giải phóng, đăng ký lại được.
- Admin xoá từ CMS → soft delete, email **không** đăng ký lại được, dữ liệu giữ
  nguyên.
- Đơn hàng và giao dịch thanh toán **không** bị xoá theo trong cả hai trường
  hợp. Đúng như vậy kể từ migration `KeepOrdersOnDelete1788900000000`
  (2026-09-06): trước đó `orders.user_id` và `orders.card_id` đều `CASCADE`, tức
  code làm **ngược** với câu này và với mục 12 của Chính sách bảo mật. Giờ cả
  hai là `SET NULL` — đơn ở lại đầy đủ số tiền và mã thanh toán, chỉ mất phần
  danh tính.

## 6. Thời hạn xử lý khiếu nại — ĐÃ CHỐT (2026-09-13)

**Trả lời trong tối đa 3 ngày làm việc**, xử lý nhanh nhất có thể. Chỉ **một**
mốc chứ không tách "tiếp nhận" và "trả lời": hai mốc là hai lời hứa phải giữ,
mà ở quy mô hiện tại một cái email xác nhận tự động không nói thêm được gì so
với chính câu trả lời.

Đi kèm một van an toàn, và nó là phần bắt buộc chứ không phải chữ đệm: khiếu
nại về tiền thường phải chờ ngân hàng hoặc SePay, tức kết luận **không** nằm
trong tay mình. Trong trường hợp đó, thứ được hứa trong 3 ngày là **một câu trả
lời nêu tình trạng và thời điểm dự kiến**, không phải kết luận cuối. Bỏ vế này
đi là biến một cam kết giữ được thành một cam kết vi phạm mỗi lần ngân hàng trả
lời chậm.

"Ngày làm việc" chứ không phải ngày lịch — khiếu nại gửi tối thứ Sáu mà đếm
ngày lịch thì hạn rơi vào Chủ nhật.

Đã sửa: `legal.terms.sections` mục 12 ở `vi.json`/`en.json` (bỏ `pending`),
`frontend/constants/legal.ts` và `backend/src/constant/legal-documents.ts`
(`terms` lên `3.2`).

## 7. Trang Khiếu nại đã được gộp vào Điều khoản — KHÔNG CÒN LÀ CÂU HỎI

`/khieu-nai` từng là văn bản thứ năm. Hai phần ba nội dung của nó chỉ trỏ sang
`/lien-he`; phần còn lại — thông tin cần cung cấp khi khiếu nại và đường khiếu
nại lên cơ quan có thẩm quyền — nay là mục 12 của Điều khoản sử dụng (`2.1`).
Nghị định 52/2013 đòi **công bố** cơ chế giải quyết khiếu nại, không đòi nó
phải là một URL riêng.

Hệ quả phải giữ: `/{locale}/khieu-nai` redirect 301 sang `/{locale}/dieu-khoan`
(`frontend/next.config.ts`) vì đường dẫn cũ đã được nhắc trong chính các văn
bản pháp lý; và giá trị `complaints` **vẫn nằm trong** enum backend — Postgres
không xoá được giá trị enum, mà giữ lại thì vô hại vì chưa có hàng nào dùng.

Cùng lúc đó, Điều khoản đối tác được gỡ khỏi cột pháp lý ở chân trang
(`FOOTER_LEGAL_KEYS`): nó chỉ ràng buộc đơn vị B2B, nên với cặp đôi đi mua một
tấm thiệp nó là một dòng nhiễu. Nó vẫn có route riêng và được nêu ở đúng chỗ nó
có hiệu lực — trang `/doi-tac` và ô chấp thuận trong đơn đăng ký đối tác.

---

# Chênh lệch giữa chính sách và code — đã sửa

Ghi lại để không ai vô tình khôi phục lại hành vi cũ.

## Đã sửa trong lần này

1. **Chấp thuận điều khoản không được lưu.** Ô tick lúc đăng ký chỉ là trạng
   thái của form; backend không nhận và không ghi gì. Giờ `POST /auth/register`
   bắt buộc có `acceptedDocuments`, và bảng `legal_acceptances` lưu theo từng
   phiên bản.

2. **Ảnh không bao giờ bị xoá.** `StorageProvider.remove()` tồn tại nhưng không
   nơi nào gọi; xoá thiệp chỉ xoá hàng trong cơ sở dữ liệu, ảnh nằm lại trên
   đĩa hoặc R2 vĩnh viễn. Giờ `CardsService.remove` xoá cả thư mục
   `cards/<id>` qua `StorageProvider.removeFolder`.

3. **Tiêu Credits không để lại dấu vết.** Chỉ chiều nạp có sổ
   (`point_top_ups`); `spendPoints` chỉ `UPDATE partner_stores SET points =
   points - n`. Đã có lúc được vá bằng `credit_transactions` ghi cả hai chiều,
   và sau đó **cả hai bảng lẫn toàn bộ luồng point đều bị gỡ** — xem mục 3.

4. **"Gói Diamond album không giới hạn"** trong Điều khoản `1.0`. Sai:
   `ALBUM_PHOTO_CAP = 30`. Bản `2.0` nói đúng con số và nói rõ đây không phải
   dịch vụ lưu trữ ảnh không giới hạn.

5. **"Thiệp chỉ hiển thị nội dung, không có form phản hồi"** trong Chính sách
   bảo mật `1.0`. Sai: sổ lưu bút cho khách mời nhập tên và lời chúc. Bản `2.0`
   mô tả đúng, kèm luật duyệt trước khi hiển thị.

6. **Danh sách bên thứ ba thiếu gần hết.** Bản `1.0` chỉ nhắc reCAPTCHA. Thực
   tế còn: Resend, SePay, Cloudflare R2, Google OAuth, Facebook Login, Google
   Maps Embed (chạy trong trình duyệt **khách mời**), Photon/OpenStreetMap, và
   một nhà cung cấp mô hình ngôn ngữ tuỳ chọn.

7. **"Dữ liệu liên quan được xoá theo định kỳ"** trong Chính sách bảo mật
   `1.0`. Không có job nào làm việc đó. Bản `2.0` rút lại lời tuyên bố đó, và
   bản `3.0` (2026-09-07) mới đưa nó trở lại — lần này có job thật đứng sau:
   `link-expired-notice` và `expired-card-purge` ở `backend/src/cronjob/`. Thứ
   tự đó là bài học của chính mục này: viết cron trước, công bố sau.

8. **Điều khoản đối tác chưa từng được ai chấp thuận.** Văn bản có phiên bản,
   enum có sẵn nguồn `partner_onboarding`, hằng số `PARTNER_LEGAL_DOCUMENTS`
   tồn tại — nhưng không nơi nào dùng, và form nộp đơn không có ô đồng ý nào.
   Giờ `POST /partner-stores/apply` bắt buộc có `acceptedDocuments` chứa
   `partner_terms`, chặn ở `PartnersService.apply` **trước** khi động vào hồ sơ:
   nộp đơn là lúc duy nhất hỏi được câu này, sau bước duyệt thì tài khoản đã là
   đối tác rồi.

   **Cập nhật 2026-10-17:** chương trình đối tác đã bị gỡ khỏi sản phẩm (migration
   `RemovePartnersAndBlog`), kèm route `/dieu-khoan-doi-tac` và `/doi-tac`. Giá
   trị `partner_terms`/`partner_onboarding` vẫn nằm trong enum để hàng chấp thuận
   cũ còn đọc được.

## Chưa sửa — cần quyết định trước khi làm

**Chưa có chức năng gỡ xuất bản (unpublish).** Trạng thái thiệp chỉ có
`draft` / `unpaid` / `paid`, và đường duy nhất để gỡ một thiệp khỏi công khai
là **xoá hẳn**. Không sửa ngay vì thêm một trạng thái đụng vào luật hết hạn
(`expiresAt` chốt lúc xuất bản, không hồi tố) và luật đếm lượt xem — đó là
quyết định nghiệp vụ, không phải một nút bấm.

Không văn bản pháp lý nào hiện hứa có tính năng này, nên chưa có chênh lệch.
Nếu làm, cần chốt: gỡ rồi xuất bản lại thì `expiresAt` tính lại hay giữ nguyên?

---

# Căn cứ pháp lý tham chiếu

Dành cho người viết lại nội dung, không nhồi số điều luật vào trang khách:

- Luật Thương mại điện tử 122/2025/QH15
- Nghị định 248/2026/NĐ-CP
- Luật Bảo vệ quyền lợi người tiêu dùng 19/2023/QH15
- Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15
- Nghị định 52/2024/NĐ-CP về thanh toán không dùng tiền mặt
- Quy định hiện hành về hoá đơn, chứng từ và thuế
