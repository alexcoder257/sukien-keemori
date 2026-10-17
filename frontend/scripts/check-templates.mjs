#!/usr/bin/env node
/**
 * Cổng kiểm tra giữa ba nguồn sự thật về mẫu thiệp:
 *
 *   docs/templates/<slug>.md   spec  — tier, font, ô ảnh, asset
 *   backend/.../templates.seed.ts code — metadata kho mẫu
 *   public/images/templates/   đĩa   — asset thật
 *
 * Chạy: `node scripts/check-templates.mjs` (từ frontend/). Không phụ thuộc gói
 * ngoài nên chạy được cả trong skill lẫn CI.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const FE = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(FE, "..");
const SPECS = join(REPO, "docs", "templates");
const IMAGES = join(FE, "public", "images", "templates");
const TEMPLATES_DIR = join(FE, "components", "invitation", "templates");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

/** Parser frontmatter tối giản — chỉ đủ cho schema phẳng của spec. */
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  let parent = null;
  for (const raw of m[1].split("\n")) {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim()) continue;
    const indented = /^\s{2,}/.test(line);
    const [k, ...rest] = line.trim().split(":");
    let v = rest.join(":").trim();
    if (v === "~" || v === "") v = v === "~" ? null : "";
    if (v && v.startsWith("[")) {
      v = v.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (typeof v === "string") v = v.replace(/^"(.*)"$/, "$1");
    if (indented && parent) out[parent][k.trim()] = v;
    else if (v === "") { parent = k.trim(); out[parent] = {}; }
    else { out[k.trim()] = v; parent = null; }
  }
  return out;
}

// ---- nguồn 1: spec ----
const specs = new Map();
for (const f of readdirSync(SPECS).filter((f) => f.endsWith(".md"))) {
  const raw = readFileSync(join(SPECS, f), "utf8");
  const fm = parseFrontmatter(raw);
  if (!fm) { err(`docs/templates/${f}: thiếu frontmatter`); continue; }
  if (fm.slug !== f.replace(/\.md$/, ""))
    err(`docs/templates/${f}: slug "${fm.slug}" không khớp tên file`);
  // Giữ nguyên văn để kiểm được phần văn xuôi, không chỉ frontmatter.
  fm.__raw = raw;
  specs.set(fm.slug, fm);
}

// ---- nguồn 2: code ----
// Kho mẫu đã chuyển sang backend; frontend/lib/data/templates.ts chỉ còn client
// gọi API nên không chứa object metadata để đối chiếu nữa.
const tsSrc = readFileSync(
  join(REPO, "backend", "src", "seeders", "data", "templates.seed.ts"),
  "utf8",
);
const code = new Map();
for (const block of tsSrc.split(/\{\s*\n\s*slug:/).slice(1)) {
  const g = (re) => (block.match(re) || [])[1];
  const slug = g(/^\s*'([^']+)'/);
  if (!slug) continue;
  code.set(slug, {
    tier: g(/tier:\s*'([^']+)'/),
    imageSrc: g(/imageSrc:\s*'([^']+)'/) ?? null,
    photoSlots: (g(/photoSlots:\s*\[([^\]]*)\]/) ?? "")
      .split(",").map((s) => s.trim().replace(/'/g, "")).filter(Boolean),
    colorTones: (g(/colorTones:\s*\[([^\]]*)\]/) ?? "")
      .split(",").map((s) => s.trim().replace(/'/g, "")).filter(Boolean),
  });
}

// Nhóm màu hợp lệ đọc thẳng từ enum backend, để script không giữ bản sao thứ ba.
const TEMPLATE_COLORS = (
  readFileSync(join(REPO, "backend", "src", "common", "enums", "invitation.enum.ts"), "utf8")
    .match(/TEMPLATE_COLORS = \[([^\]]*)\]/)?.[1] ?? ""
).split(",").map((s) => s.trim().replace(/'/g, "")).filter(Boolean);

const fonts = JSON.parse(readFileSync(join(REPO, "docs", "fonts.catalog.json"), "utf8")).fonts;
const registry = readFileSync(join(FE, "components/invitation/templates/registry.ts"), "utf8");
const typography = readFileSync(join(FE, "components/invitation/templates/template-typography.tsx"), "utf8");

// ---- đối chiếu ----
for (const slug of new Set([...specs.keys(), ...code.keys()])) {
  const s = specs.get(slug), c = code.get(slug);
  if (!s) { err(`${slug}: có trong templates.seed.ts nhưng chưa có docs/templates/${slug}.md`); continue; }
  // TẠM THỜI: khai backend seed đang được hoãn để giảm tải mỗi lượt extract.
  // Frontmatter của spec là nơi giữ tier/photoSlots trong lúc chờ, và seed sẽ
  // được backfill một lượt từ chính các spec này. Khi backfill xong thì đổi
  // `warn` dưới đây về `err`.
  // Bắt tay giữa hai phiên chạy phải được kiểm TRƯỚC mọi lối `continue`: mẫu
  // chưa seed vẫn có thể đang chờ sinh lại asset, và nếu cảnh báo này bị lối
  // thoát bên dưới nuốt mất thì phiên `thiep-extract` sau không thấy gì.
  if (/^##\s+Yêu cầu sinh lại/im.test(s.__raw || ""))
    warn(`${slug}: đang chờ sinh lại asset — xem mục "Yêu cầu sinh lại" trong spec, chạy $thiep-extract ${slug} ở chế độ vá`);

  // Màu chủ đạo chốt lúc dựng mẫu (1 màu nền + 1 màu concept, mẫu đơn sắc chỉ
  // một), nên spec phải có ngay từ lúc extract, kể cả khi mẫu chưa seed.
  const tones = Array.isArray(s.colorTones) ? s.colorTones : [];
  if (tones.length < 1 || tones.length > 2)
    err(`${slug}: colorTones phải có 1–2 màu, đang có [${tones.join(",")}]`);
  for (const tone of tones)
    if (!TEMPLATE_COLORS.includes(tone))
      err(`${slug}: màu "${tone}" không nằm trong TEMPLATE_COLORS (${TEMPLATE_COLORS.join(", ")})`);

  if (!c) { warn(`${slug}: chưa khai trong backend templates.seed.ts — mẫu chưa lên kho mẫu cho tới khi seed`); continue; }

  if (s.tier !== c.tier) err(`${slug}: tier lệch — spec "${s.tier}" vs code "${c.tier}"`);

  const a = (s.photoSlots || []).join(","), b = c.photoSlots.join(",");
  if (a !== b) err(`${slug}: photoSlots lệch — spec [${a}] vs code [${b}]`);

  const ta = tones.join(","), tb = c.colorTones.join(",");
  if (ta !== tb) err(`${slug}: colorTones lệch — spec [${ta}] vs code [${tb}]`);

  // business-model mục 3: Free 0 ô, Gold 1–3, Diamond 4–6 — đây là luật chọn
  // gói LÚC DỰNG MẪU, không phải bất biến của hệ thống. Gói của một mẫu là
  // quyết định thương mại và CMS mới là nơi chốt nó (`PATCH /admin/templates`),
  // nên lệch bảng này chỉ là `warn`: nó nhắc "mẫu này xếp gói khác thói quen",
  // không chặn build của một quyết định vận hành hợp lệ.
  const n = (s.photoSlots || []).length;
  const ok = { free: n === 0, gold: n >= 1 && n <= 3, diamond: n >= 4 && n <= 6 }[s.tier];
  if (!ok) warn(`${slug}: gói ${s.tier} với ${n} ô ảnh là ngoài bảng mặc định (business-model.md mục 3) — chỉ hợp lệ nếu đây là chủ ý xếp gói`);

  // font phải nằm trong danh mục đã tải, và đúng vai
  for (const [role, key] of Object.entries(s.fonts || {})) {
    if (!key || role.startsWith("#")) continue;
    if (!fonts[key]) { err(`${slug}: font "${key}" không có trong fonts.catalog.json`); continue; }
    if (!fonts[key].roles.includes(role))
      warn(`${slug}: "${key}" dùng ở vai ${role} nhưng catalog xếp nó vào ${fonts[key].roles.join("/")}`);
  }

  // asset khai trong spec phải tồn tại thật
  const dir = join(IMAGES, slug);
  if (!existsSync(dir)) { err(`${slug}: thiếu thư mục public/images/templates/${slug}/`); continue; }
  for (const [sub, list] of [["photos", s.assets?.photos], ["decor", s.assets?.decor]]) {
    for (const f of list || [])
      if (!existsSync(join(dir, sub, f))) err(`${slug}: spec khai ${sub}/${f} nhưng không có trên đĩa`);
  }
  if (s.assets?.thumbnail && !existsSync(join(dir, s.assets.thumbnail)))
    err(`${slug}: spec khai thumbnail nhưng không có trên đĩa`);

  /*
   * Sàn asset. `thiep-extract` chỉ có luật chặn asset THỪA ("không truy được về
   * toạ độ trong ảnh gốc thì bỏ"), không có luật chặn THIẾU — nên nó trôi được
   * về một bộ asset quá mỏng mà vẫn qua mọi kiểm tra hai chiều ở trên. Các ngưỡng
   * dưới đây rút từ 12 mẫu đã dựng, cả 12 đều thoả.
   *
   * Chỉ kiểm khi `status.assets: done`; mẫu đang chờ sinh ảnh thì các con số này
   * chưa có nghĩa.
   */
  if (s.status?.assets === "done") {
    const photos = s.assets?.photos || [];
    const decor = s.assets?.decor || [];

    // `lib/data/invitation-sample.ts` đổ mock theo từng ô ảnh, và thumbnail là
    // ảnh chụp chính mẫu đã dựng — thiếu mock thì cả demo lẫn thumbnail ra ô rỗng.
    const albumOnly = s.assets?.albumOnly || [];
    if (new Set(albumOnly).size !== albumOnly.length || albumOnly.some((photo) => !photos.includes(photo)))
      err(`${slug}: assets.albumOnly phải là danh sách ảnh duy nhất có trong assets.photos`);
    if (n > 0 && photos.length !== n + albumOnly.length)
      err(`${slug}: có ${n} ô ảnh nhưng ${photos.length} ảnh mock trong photos/ — mỗi photoSlot cần một ảnh, ảnh album bổ sung phải khai assets.albumOnly`);
    if (n === 0 && photos.length < 1)
      err(`${slug}: mẫu 0 ô ảnh vẫn cần ít nhất 1 tranh minh hoạ trong photos/`);

    /*
     * Số asset decor đúng là do ảnh gốc quyết định, không có ngưỡng chung — mẫu
     * thuần typography thật sự ít hoạ tiết. Nên đây KHÔNG phải luật thiết kế mà
     * là bẫy bắt một lỗi cụ thể: extract gộp nhiều LẦN hoạ tiết xuất hiện (khác
     * cỡ, khác số bông, khác hướng mọc, khác mép cắt) thành một hai file rồi để
     * khâu dựng cắt cúp — mà khâu dựng chỉ đặt được nguyên ảnh.
     */
    /*
     * Có ảnh gốc thật sự ít hoạ tiết — mẫu thuần typography, mẫu chỉ có thớ
     * giấy. Nên ngưỡng này CÓ đường thoát, và đường thoát phải là một đoạn viết
     * ra được đọc lại: spec ghi `Giải trình sàn decor` nói vì sao ảnh gốc ít
     * đến vậy. Không có nó thì con số thấp là dấu hiệu đọc sót, không phải kết
     * luận về ảnh gốc. Tiền lệ hợp lệ: `phong-thu` (2 plate giấy, không ornament
     * hữu cơ nào trong inspiration).
     */
    const waived = /Giải trình sàn decor/i.test(s.__raw || "");
    if (decor.length < 6 && !waived) {
      const msg = `${slug}: ${decor.length} asset trong decor/ — đếm lại theo từng LẦN XUẤT HIỆN trong bảng kiểm kê, không theo loại hoạ tiết; nếu ảnh gốc thật sự ít thì thêm mục "Giải trình sàn decor" vào spec`;
      if (decor.length < 3) err(msg);
      else warn(msg);
    }
  }

  // thumbnail có trên đĩa mà code chưa trỏ tới thì kho mẫu vẫn hiện ảnh atlas
  const thumb = join(dir, "thumbnail.avif");
  if (existsSync(thumb) && !c.imageSrc)
    warn(`${slug}: có thumbnail.avif nhưng templates.seed.ts chưa khai imageSrc → card vẫn dùng atlas`);
  if (c.imageSrc && !existsSync(join(FE, "public", c.imageSrc)))
    err(`${slug}: imageSrc "${c.imageSrc}" trỏ vào file không tồn tại`);

  // mẫu đã dựng thì phải có mặt ở cả hai registry
  if (s.status?.build === "done") {
    if (!registry.includes(`"${slug}"`))
      err(`${slug}: status.build=done nhưng chưa đăng ký trong registry.ts`);
    if (!typography.includes(`"${slug}"`))
      err(`${slug}: status.build=done nhưng chưa có entry trong TEMPLATE_TYPOGRAPHY`);

    // Hợp đồng class của `template-shell.tsx`. TypeScript không kiểm được: Next
    // gõ `*.module.css` là index signature nên `styles.section` luôn hợp lệ về
    // kiểu, kể cả khi CSS Module không hề khai class đó — lỗi chỉ lộ ra khi mở
    // trang và thấy section mất nền.
    const cssPath = join(TEMPLATES_DIR, `${slug}-invitation.module.css`);
    const tsxPath = join(TEMPLATES_DIR, `${slug}-invitation.tsx`);
    if (existsSync(cssPath) && existsSync(tsxPath)) {
      const css = readFileSync(cssPath, "utf8");
      const tsx = readFileSync(tsxPath, "utf8");
      const need = [
        ...(tsx.includes("TemplateSection")
          ? ["section", "sectionInner", "sectionHeader", "sectionLead", "reveal"]
          : []),
        ...(tsx.includes("TemplateDecor") ? ["decor"] : []),
      ];
      for (const cls of need) {
        if (!new RegExp(`^\\.${cls}[\\s,{:.]`, "m").test(css))
          err(`${slug}: dùng template-shell nhưng CSS Module thiếu class .${cls}`);
      }
    }
  }
}

/*
 * KHÔNG kiểm tra trùng bộ ba font giữa các mẫu. Font của một mẫu được chọn vì
 * nó hợp concept của mẫu đó; hai concept khác nhau vẫn có thể cần cùng một họ
 * chữ, và đó là chuyện bình thường. Ép mỗi mẫu một bộ font riêng là ràng buộc
 * do công cụ nghĩ ra chứ không phải yêu cầu thiết kế — nó đẩy mẫu sang font
 * kém hợp hơn chỉ để làm hài lòng một cảnh báo. Cái phân biệt hai mẫu là bảng
 * màu, bố cục, hoạ tiết và cách chia vai chữ, không phải danh sách tên font.
 */

// ---- asset trên đĩa mà spec không khai ----
for (const slug of readdirSync(IMAGES).filter((f) => !f.startsWith("."))) {
  const s = specs.get(slug);
  if (!s) { err(`public/images/templates/${slug}/ không ứng với mẫu nào`); continue; }
  for (const sub of ["photos", "decor"]) {
    const p = join(IMAGES, slug, sub);
    if (!existsSync(p)) continue;
    for (const f of readdirSync(p))
      if (!(s.assets?.[sub] || []).includes(f))
        warn(`${slug}: ${sub}/${f} có trên đĩa nhưng spec không khai`);
  }
}

const out = (label, list) => list.forEach((m) => console.log(`${label} ${m}`));
out("✗", errors);
out("!", warnings);
console.log(
  `\n${specs.size} mẫu · ${errors.length} lỗi · ${warnings.length} cảnh báo`,
);
process.exit(errors.length ? 1 : 0);
