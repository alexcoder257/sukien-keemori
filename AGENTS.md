# Keemori — hướng dẫn cho agent

## Quy ước dự án

Toàn bộ quy ước đặt code, layer, design system và bất biến nghiệp vụ nằm ở
**`CLAUDE.md`** (gốc repo) và **`frontend/CLAUDE.md`**. Đọc chúng trước khi sửa
code — chúng áp dụng cho mọi agent, không riêng Claude, tên file chỉ là lịch sử.

Đọc thêm khi đụng tới:

| Việc | File |
|---|---|
| Gói, số ô ảnh, block | `docs/business-model.md` |
| Mẫu thiệp cụ thể | `docs/templates/<slug>.md` |
| Font đã tải và vai của chúng | `docs/fonts.catalog.json` |
| API Next.js | `frontend/node_modules/next/dist/docs/` — bản này khác bản trong trí nhớ, **bắt buộc đọc** |

## Skill của dự án

**Skill `thiep-*` chỉ chạy khi người dùng gọi ĐÍCH DANH tên skill.** Không có
ngoại lệ nào khác.

Gọi đích danh nghĩa là trong tin nhắn của người dùng có **tên skill viết ra**:
`$thiep-build`, `/thiep-build`, hay câu "chạy skill thiep-build". Chỉ khi đó mới
mở file SKILL.md tương ứng và làm theo trọn quy trình — đừng tự dựng lại quy
trình từ tên skill, vì phần lớn giá trị của chúng nằm ở các cái bẫy đã ghi lại.

| Skill | File đọc khi được gọi đích danh |
|---|---|
| `thiep-extract` | `.claude/skills/thiep-extract/SKILL.md` |
| `thiep-build` | `.claude/skills/thiep-build/SKILL.md` |
| `thiep-diamond` | `.claude/skills/thiep-diamond/SKILL.md` |

### Không suy ra lệnh gọi từ ý định

Mô tả công việc **không** phải lệnh gọi skill, kể cả khi trùng khít việc mà
skill đó làm. Những câu sau đây và mọi biến thể của chúng phải được **làm trực
tiếp**, không mở SKILL.md, không chạy quy trình nào:

- "làm mẫu mới từ inspire-16", "tạo mẫu từ ảnh này"
- "dựng mẫu moc-lan", "làm UI mẫu thiệp", "hoàn thiện mẫu X"
- "test UI mẫu thiệp", "QA mẫu X", "mẫu nào đã pass"
- "nâng mẫu Tình Ca lên Diamond premium", "refactor mẫu X cho đẹp"
- "dọn ảnh thừa", "kiểm asset chết", "chụp lại thumbnail"

Lý do: quy trình skill rất dài và tốn kém, còn phần lớn yêu cầu về mẫu thiệp chỉ
cần sửa vài file. Chạy nguyên dây chuyền cho một yêu cầu nhỏ là làm sai việc
người dùng nhờ, không phải làm kỹ hơn. Người dùng **muốn** chạy quy trình thì họ
gõ tên skill — và họ biết cách gõ.

Nghi ngờ thì mặc định là **không** chạy skill; nếu thấy quy trình đó thật sự
đáng chạy, cứ làm việc được nhờ rồi nói một câu gợi ý ở cuối, đừng tự chạy.

### Ranh giới giữa các skill

Dây chuyền chỉ có **hai bước**: `thiep-extract` → (spec + ảnh) → `thiep-build`.
Mỗi bước tự đóng lại bằng một cổng chất lượng; không có skill QA riêng và không
có skill dọn dẹp riêng — hai việc đó nằm trong cổng của chính bước sinh ra
chúng. Chi tiết ranh giới và nội dung từng cổng: `docs/business-model.md` mục 4.

`thiep-diamond` không thêm bước sản xuất thứ ba: nó là refactor tuỳ chọn cho một
mẫu tier Diamond **đã dựng**, giữ nguyên ranh giới spec/asset của hai bước trên.

Trong Codex, cú pháp gọi là `$thiep-extract`, `$thiep-build`, `$thiep-diamond`;
dấu `/` không phải cú pháp gọi skill của Codex.

> Thư mục `.claude/skills/` là **nơi đặt file**, không phải giới hạn công cụ.
> Codex không tự nạp thư mục đó nên phải chủ động đọc; nội dung bên trong không
> phụ thuộc công cụ nào.

## Lệnh kiểm tra

```bash
cd frontend && node scripts/check-templates.mjs   # spec ↔ asset ↔ registry
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

`check-templates.mjs` kiểm **hai chiều**: spec khai file không có trên đĩa → lỗi;
file có trên đĩa mà spec không khai → cũng lỗi. Thêm hay xoá ảnh đều phải cập
nhật `assets.*` trong spec.

Frontend **không có** script `format` hay `test`; đừng báo là đã chạy chúng.
