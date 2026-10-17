// Turbopack nạp plugin PostCSS bằng require(), nên file này là CommonJS.
/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync, readdirSync } = require("node:fs");
const path = require("node:path");

/**
 * Màu dự phòng cho trình duyệt **không hiểu `color-mix()`** — WebKit trước
 * Safari 16.2, tức mọi trình duyệt trên iPhone còn kẹt ở iOS 15/16.0–16.1, kể
 * cả trình duyệt trong app Facebook/Messenger (WKWebView dùng chung WebKit của
 * hệ điều hành).
 *
 * Không có nó, các trình duyệt đó hỏng theo hai đường:
 *   - Tailwind v4 dịch `bg-foreground/4` thành `background-color:
 *     var(--foreground)` rồi mới bọc bản `color-mix()` trong `@supports`. Không
 *     có `color-mix()` là rơi về màu gốc **đặc 100%**: đầu thẻ editor thành
 *     mảng Ivory và chữ Ivory bên trên biến mất.
 *   - Token khai bằng `color-mix()` (`--card` của `.dark`…) không hợp lệ lúc
 *     tính giá trị, nên mọi chỗ gọi nó thành `unset` — nền trong suốt.
 *
 * **Plugin chỉ thêm, không bao giờ sửa.** Mọi thứ nó sinh ra nằm trong
 * `@supports not (color:color-mix(in lab, red, red))` — đúng điều kiện ngược
 * với của Tailwind — chèn ngay sau rule gốc, nên trình duyệt hiểu `color-mix()`
 * bỏ qua toàn bộ và CSS gốc giữ nguyên từng byte. Biểu thức nào không tính
 * được tĩnh (`currentColor`, trộn biến cục bộ của CSS Module với token của
 * `globals.css`, không gian màu chưa hỗ trợ) thì bỏ qua: trình duyệt cũ giữ
 * đúng hành vi như chưa có plugin.
 *
 * Giá trị được **tính sẵn lúc build** vì không có đường nào khác: trình duyệt
 * không có `color-mix()` thì cũng không có relative color. Token theo theme
 * (`--foreground` đổi giữa `.light`/`.dark`) được tính riêng cho từng scope
 * khai báo nó và gửi xuống qua một biến `--cmfb-<hash>`.
 *
 * Kiểm: `npm run build`, xoá mọi khối `@supports not (color:color-mix(...))`
 * khỏi CSS ra — phải trùng khít bản build khi chưa bật plugin.
 */

const FALLBACK_CONDITION = "not (color:color-mix(in lab, red, red))";
const MARK = Symbol("color-mix-fallback");

/* ---------------------------------------------------------------------------
   Màu: parse, đổi không gian, trộn.
   ------------------------------------------------------------------------ */

const NAMED = {
  transparent: [0, 0, 0, 0],
  white: [1, 1, 1, 1],
  black: [0, 0, 0, 1],
  red: [1, 0, 0, 1],
};

function parseNumber(token, scale = 1) {
  const value = token.trim();
  if (value.endsWith("%")) return (parseFloat(value) / 100) * scale;
  const number = parseFloat(value);
  return Number.isFinite(number) ? number : NaN;
}

/** Màu tĩnh → `[r, g, b, a]` sRGB 0..1, hoặc `null`. */
function parseLiteral(input) {
  const value = input.trim().toLowerCase();
  if (value in NAMED) return NAMED[value];

  const hex = /^#([0-9a-f]{3,8})$/.exec(value);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      digits = [...digits].map((d) => d + d).join("");
    }
    if (digits.length !== 6 && digits.length !== 8) return null;
    const channel = (i) => parseInt(digits.slice(i, i + 2), 16) / 255;
    return [channel(0), channel(2), channel(4), digits.length === 8 ? channel(6) : 1];
  }

  const fn = /^(rgba?|oklch|oklab)\((.*)\)$/.exec(value);
  if (!fn) return null;
  const [main, alphaPart] = fn[2].includes("/")
    ? fn[2].split("/")
    : [fn[2], undefined];
  const parts = main.includes(",") ? main.split(",") : main.trim().split(/\s+/);
  let alpha = alphaPart === undefined ? 1 : parseNumber(alphaPart);
  if (fn[1].startsWith("rgb")) {
    if (parts.length === 4) alpha = parseNumber(parts[3]);
    const rgb = parts.slice(0, 3).map((p) => parseNumber(p, 255) / 255);
    if (rgb.some(Number.isNaN) || Number.isNaN(alpha)) return null;
    return [...rgb, alpha];
  }
  if (parts.length !== 3 || Number.isNaN(alpha)) return null;
  const L = parseNumber(parts[0]);
  let a;
  let b;
  if (fn[1] === "oklch") {
    const C = parseNumber(parts[1], 0.4);
    const h = (parseFloat(parts[2]) * Math.PI) / 180;
    a = C * Math.cos(h);
    b = C * Math.sin(h);
  } else {
    a = parseNumber(parts[1], 0.4);
    b = parseNumber(parts[2], 0.4);
  }
  if ([L, a, b].some(Number.isNaN)) return null;
  return [...fromOklab([L, a, b]), alpha];
}

const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLinear = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

function toOklab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(fromLinear);
}

const SPACES = {
  oklab: { to: toOklab, from: fromOklab },
  srgb: { to: (c) => c.slice(0, 3), from: (c) => c },
  "srgb-linear": {
    to: (c) => c.slice(0, 3).map(toLinear),
    from: (c) => c.map(fromLinear),
  },
};

/** `color-mix()` theo CSS Color 5: chuẩn hoá phần trăm, trộn premultiplied. */
function mix(space, [c1, p1], [c2, p2]) {
  const fns = SPACES[space];
  if (!fns) return null;
  if (p1 === undefined && p2 === undefined) [p1, p2] = [0.5, 0.5];
  else if (p1 === undefined) p1 = 1 - p2;
  else if (p2 === undefined) p2 = 1 - p1;
  const sum = p1 + p2;
  if (!(sum > 0)) return null;
  const [w1, w2] = [p1 / sum, p2 / sum];
  const alphaScale = Math.min(sum, 1);

  const alpha = c1[3] * w1 + c2[3] * w2;
  if (alpha === 0) return [0, 0, 0, 0];
  const [x1, x2] = [fns.to(c1), fns.to(c2)];
  const mixed = x1.map(
    (v, i) => (v * c1[3] * w1 + x2[i] * c2[3] * w2) / alpha,
  );
  return [...fns.from(mixed), alpha * alphaScale];
}

function serialize([r, g, b, a]) {
  const channel = (c) => Math.round(Math.min(1, Math.max(0, c)) * 255);
  const alpha = Math.round(Math.min(1, Math.max(0, a)) * 1000) / 1000;
  const [R, G, B] = [r, g, b].map(channel);
  if (alpha === 1) {
    return `#${[R, G, B].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  }
  return `rgba(${R}, ${G}, ${B}, ${alpha})`;
}

/* ---------------------------------------------------------------------------
   Đọc biểu thức CSS.
   ------------------------------------------------------------------------ */

/** Tách theo dấu phẩy ở cấp ngoài cùng. */
function splitTopLevel(input) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "(") depth++;
    else if (input[i] === ")") depth--;
    else if (input[i] === "," && depth === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(input.slice(start));
  return parts.map((p) => p.trim());
}

/** Mọi lời gọi `color-mix(...)` cấp ngoài cùng: `{ start, end, text }`. */
function findColorMixes(value) {
  const found = [];
  const pattern = /color-mix\(/gi;
  let match;
  while ((match = pattern.exec(value))) {
    let depth = 1;
    let i = pattern.lastIndex;
    while (i < value.length && depth > 0) {
      if (value[i] === "(") depth++;
      else if (value[i] === ")") depth--;
      i++;
    }
    if (depth !== 0) break;
    found.push({ start: match.index, end: i, text: value.slice(match.index, i) });
    pattern.lastIndex = i;
  }
  return found;
}

/** Mọi tên biến `--x` được gọi trong một biểu thức (kể cả lồng nhau). */
function varNames(value) {
  return [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
}

/**
 * Giải một giá trị màu về `[r, g, b, a]` bằng bảng biến `lookup`, hoặc `null`
 * khi có bất kỳ phần nào không tính tĩnh được.
 */
function resolveColor(input, lookup, seen = new Set()) {
  const value = input.trim();
  const varCall = /^var\(\s*(--[\w-]+)\s*(?:,(.*))?\)$/s.exec(value);
  if (varCall) {
    const [, name, fallback] = varCall;
    const raw = lookup(name);
    if (raw !== undefined && !seen.has(name)) {
      return resolveColor(raw, lookup, new Set([...seen, name]));
    }
    return fallback !== undefined ? resolveColor(fallback, lookup, seen) : null;
  }
  const mixes = findColorMixes(value);
  if (mixes.length === 1 && mixes[0].start === 0 && mixes[0].end === value.length) {
    return resolveMix(value, lookup, seen);
  }
  return parseLiteral(value);
}

function resolveMix(text, lookup, seen) {
  const inner = text.slice(text.indexOf("(") + 1, -1);
  const [method, ...stops] = splitTopLevel(inner);
  const space = /^in\s+([\w-]+)$/i.exec(method)?.[1]?.toLowerCase();
  if (!space || stops.length !== 2) return null;
  const parsed = stops.map((stop) => {
    const pct = /\s+(-?[\d.]+)%$/.exec(stop) ?? /^(-?[\d.]+)%\s+/.exec(stop);
    const colorText = pct ? stop.replace(pct[0], "") : stop;
    return [resolveColor(colorText, lookup, seen), pct ? parseFloat(pct[1]) / 100 : undefined];
  });
  if (parsed.some(([color]) => !color)) return null;
  return mix(space, parsed[0], parsed[1]);
}

/**
 * Tên biến `--cmfb-*` của một biểu thức. Chuẩn hoá khoảng trắng trước khi băm:
 * `globals.css` (đã qua Tailwind) và CSS Module (nguyên văn) phải ra cùng tên
 * cho cùng một biểu thức.
 */
function nameFor(text) {
  const normalized = text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s*,\s*/g, ", ");
  return `--cmfb-${hash(normalized)}`;
}

function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/* ---------------------------------------------------------------------------
   Plugin.
   ------------------------------------------------------------------------ */

/**
 * Những gì đọc thẳng từ `globals.css` để dùng ở mọi file: bảng 7 màu thương
 * hiệu (CSS Module của mẫu thiệp gọi `var(--color-ivory)` mà không khai nó) và
 * tên mọi token nó khai. Đường dẫn đi qua option vì Turbopack chép plugin vào
 * `.next/build/` trước khi chạy.
 */
function readGlobals(globalsCss) {
  const brand = new Map();
  const tokens = new Set();
  if (!globalsCss) return { brand, tokens };
  const source = readFileSync(globalsCss, "utf8");
  for (const m of source.matchAll(/(--color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    brand.set(m[1], m[2]);
  }
  for (const m of source.matchAll(/^\s*(--[\w-]+)\s*:/gm)) tokens.add(m[1]);
  return { brand, tokens };
}

/** Token theo theme mà biểu thức gọi (bỏ màu thương hiệu — chúng là hằng số). */
function themedLeaves(text, brand) {
  return varNames(text).filter((name) => !brand.has(name));
}

/** Mọi file CSS nguồn của frontend (trừ `node_modules`, output build). */
function projectCssFiles(globalsCss) {
  const frontendRoot = path.dirname(path.dirname(globalsCss));
  const files = [];
  for (const dir of ["app", "components", "styles"]) {
    let entries = [];
    try {
      entries = readdirSync(path.join(frontendRoot, dir), { recursive: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const file = path.join(frontendRoot, dir, String(entry));
      if (file.endsWith(".css")) files.push(file);
    }
  }
  return files;
}

/** `--x: value;` của cả file, phẳng — đủ để biết token được khai bằng gì. */
function flatCustomProps(source) {
  const map = new Map();
  for (const m of source.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    const list = map.get(m[1]) ?? [];
    list.push(m[2].trim());
    map.set(m[1], list);
  }
  return map;
}

/**
 * Quét toàn bộ CSS nguồn **một lần**. Plugin xử lý từng file riêng, mà có hai
 * câu hỏi chỉ trả lời được khi nhìn cả dự án:
 *
 * - **Token nào bị khai lại ngoài `globals.css`** (gần như mọi mẫu thiệp khai
 *   lại `--foreground`, `--primary`… ở gốc mẫu). Màu tính sẵn ở `globals.css`
 *   cho biểu thức gọi những token này sẽ sai bên trong mẫu thiệp, nên chúng đi
 *   đường kênh màu (`--cmfb-rgb-*`) hoặc không được dự phòng.
 * - **Token nào đặc ở `globals.css`** — chỉ những token đó dùng được kênh màu,
 *   vì không có `calc()` đáng tin trong `rgba()` của WebKit cũ để nhân alpha
 *   của token với phần trăm. Token trong suốt (`--border`…) giữ hành vi cũ.
 *
 * Cộng với danh sách biểu thức của file khác chỉ gọi token **không** bị khai
 * lại — `globals.css` định nghĩa sẵn `--cmfb-*` cho chúng.
 */
function scanProject(globalsCss, brand, tokens) {
  const overridden = new Set();
  const shared = new Set();
  const globalsFlat = flatCustomProps(readFileSync(globalsCss, "utf8"));
  const files = projectCssFiles(globalsCss);
  const sources = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

  for (const [file, source] of sources) {
    if (file === globalsCss) continue;
    for (const name of flatCustomProps(source).keys()) {
      if (tokens.has(name)) overridden.add(name);
    }
  }

  const opaque = new Set();
  const globalsLookup = (name) => globalsFlat.get(name)?.at(-1) ?? brand.get(name);
  for (const [name, values] of globalsFlat) {
    if (!tokens.has(name)) continue;
    const allOpaque = values.every((value) => {
      const color = resolveColor(value, globalsLookup);
      return color !== null && color[3] === 1;
    });
    if (allOpaque) opaque.add(name);
  }

  for (const [file, source] of sources) {
    if (file === globalsCss) continue;
    const local = new Set([...source.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    for (const { text } of findColorMixes(source)) {
      const leaves = themedLeaves(text, brand);
      if (
        leaves.length &&
        leaves.every((l) => tokens.has(l) && !local.has(l) && !overridden.has(l))
      ) {
        shared.add(text);
      }
    }
  }
  return { overridden, opaque, shared };
}

/**
 * `color-mix(in <bất kỳ>, var(--T) P%, transparent)` — dạng Tailwind sinh cho
 * `bg-foreground/4`. Trộn premultiplied với `transparent` thì không gian màu
 * không còn ý nghĩa: kết quả luôn là đúng màu `--T`, alpha nhân với P.
 * Trả `{ token, alpha }` hoặc `null`.
 */
function tokenWithAlpha(text) {
  const inner = text.slice(text.indexOf("(") + 1, -1);
  const [method, ...stops] = splitTopLevel(inner);
  if (!/^in\s+[\w-]+/i.test(method) || stops.length !== 2) return null;
  const parsed = stops.map((stop) => {
    const pct = /\s+(-?[\d.]+)%$/.exec(stop) ?? /^(-?[\d.]+)%\s+/.exec(stop);
    return {
      color: (pct ? stop.replace(pct[0], "") : stop).trim(),
      pct: pct ? parseFloat(pct[1]) / 100 : undefined,
    };
  });
  const tokenIndex = parsed.findIndex((p) => /^var\(\s*--[\w-]+\s*\)$/.test(p.color));
  const other = parsed[1 - tokenIndex];
  if (tokenIndex < 0 || other.color.toLowerCase() !== "transparent") return null;
  const placeholder = [0, 0, 0, 1];
  const stopsForMix = parsed.map((p, i) => [i === tokenIndex ? placeholder : NAMED.transparent, p.pct]);
  const mixed = mix("srgb", stopsForMix[0], stopsForMix[1]);
  if (!mixed) return null;
  const token = /--[\w-]+/.exec(parsed[tokenIndex].color)[0];
  return { token, alpha: Math.round(mixed[3] * 1000) / 1000 };
}

const channelName = (token) => `--cmfb-rgb-${token.slice(2)}`;

function channels([r, g, b]) {
  return [r, g, b].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255)).join(", ");
}

function isTailwindColorMixSupports(node) {
  return (
    node.type === "atrule" &&
    node.name === "supports" &&
    /^\(\s*color\s*:\s*color-mix\(/i.test(node.params)
  );
}

function insideKeyframes(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === "atrule" && /keyframes$/i.test(p.name)) return true;
  }
  return false;
}

const plugin = ({ globalsCss } = {}) => {
  const { brand, tokens } = readGlobals(globalsCss);
  let project = null;
  const scan = () =>
    (project ??= globalsCss
      ? scanProject(globalsCss, brand, tokens)
      : { overridden: new Set(), opaque: new Set(), shared: new Set() });

  return {
    postcssPlugin: "color-mix-fallback",
    OnceExit(root, { AtRule }) {
      const file = root.source?.input?.file;
      const isGlobals = Boolean(globalsCss && file && path.resolve(file) === globalsCss);
      const { overridden, opaque, shared } = scan();
      // 1. Mọi rule khai biến CSS là một "scope" (`:root`, `.dark`, `.theme-*`,
      //    gốc của mẫu thiệp…). Bảng biến của từng selector đơn lẻ = mọi rule
      //    có selector đó, theo thứ tự nguồn, chồng lên `:root`.
      const scopeRules = [];
      root.walkRules((rule) => {
        if (rule[MARK] || insideKeyframes(rule)) return;
        const decls = new Map();
        rule.each((node) => {
          if (node.type === "decl" && node.prop.startsWith("--")) decls.set(node.prop, node.value);
        });
        if (decls.size) scopeRules.push({ rule, decls, selectors: rule.selectors });
      });

      const bySelector = new Map();
      for (const scope of scopeRules) {
        for (const selector of scope.selectors) {
          const map = bySelector.get(selector) ?? new Map();
          for (const [k, v] of scope.decls) map.set(k, v);
          bySelector.set(selector, map);
        }
      }
      const rootMap = new Map();
      for (const selector of [":root", ":host", ":root, :host", "html"]) {
        for (const [k, v] of bySelector.get(selector) ?? []) rootMap.set(k, v);
      }
      const fileMap = new Map();
      for (const scope of scopeRules) for (const [k, v] of scope.decls) fileMap.set(k, v);
      const lookupFor = (...maps) => (name) => {
        for (const map of maps) if (map?.has(name)) return map.get(name);
        return brand.get(name);
      };

      // 2. Những `--cmfb-*` cần định nghĩa, gom theo scope rule.
      const defsByRule = new Map(); // rule -> Map(selector -> Map(prop -> value))
      const emitted = new Set(); // tên biến đã định nghĩa ở ít nhất một scope

      function addDef(rule, selector, prop, value) {
        const groups = defsByRule.get(rule) ?? new Map();
        const decls = groups.get(selector) ?? new Map();
        decls.set(prop, value);
        groups.set(selector, decls);
        defsByRule.set(rule, groups);
      }

      const selectorLookup = (scope, selector) => {
        const isRoot = rootMap.size && [":root", ":host", "html"].includes(selector);
        return lookupFor(scope.decls, bySelector.get(selector), isRoot ? null : rootMap, fileMap);
      };

      // Kênh màu của token, khai **ngay chỗ khai token** — ở `globals.css` lẫn
      // ở gốc từng mẫu thiệp — nên nó đi theo token qua mọi lần khai lại, đúng
      // như chính token. Chỗ khai `inherit` thì để kênh tự kế thừa theo; chỗ
      // khai màu trong suốt hoặc không tính tĩnh được (biến gắn bằng inline
      // style) thì kênh thành `initial`: khai báo dùng nó thành `unset`, thay
      // vì mang một màu sai kế thừa từ ngoài vào.
      for (const scope of scopeRules) {
        for (const [prop, value] of scope.decls) {
          if (!tokens.has(prop) || !opaque.has(prop)) continue;
          if (/^(inherit|unset)$/i.test(value.trim())) continue;
          for (const selector of scope.selectors) {
            const color = resolveColor(`var(${prop})`, selectorLookup(scope, selector));
            const channel = color && color[3] === 1 ? channels(color) : "initial";
            addDef(scope.rule, selector, channelName(prop), channel);
          }
        }
      }

      /**
       * Biểu thức gọi token theo theme: tính lại ở **mọi** scope khai một
       * trong các token đó, mỗi selector một giá trị (cùng rule `:root, .dark`
       * thì hai selector có thể ra hai màu khác nhau).
       */
      function defineThemed(text) {
        const name = nameFor(text);
        if (emitted.has(name)) return name;
        const leaves = themedLeaves(text, brand);
        let any = false;
        for (const scope of scopeRules) {
          if (!leaves.some((leaf) => scope.decls.has(leaf))) continue;
          for (const selector of scope.selectors) {
            const color = resolveMix(text, selectorLookup(scope, selector), new Set());
            if (!color) continue;
            addDef(scope.rule, selector, name, serialize(color));
            any = true;
          }
        }
        if (any) emitted.add(name);
        return any ? name : null;
      }

      /**
       * Giá trị dự phòng cho một khai báo, hoặc `null` nếu có biểu thức nào
       * không tính được — khi đó khai báo đó không được nhân bản.
       */
      function fallbackValue(decl, ownDecls, tailwind) {
        const mixes = findColorMixes(decl.value);
        if (!mixes.length) return null;
        let out = "";
        let cursor = 0;
        for (const m of mixes) {
          // Tĩnh trong chính rule này (màu thương hiệu, hex, biến cùng rule).
          let replacement = null;
          const own = resolveMix(m.text, lookupFor(ownDecls), new Set());
          const single = own ? null : tokenWithAlpha(m.text);
          const leaves = themedLeaves(m.text, brand);
          if (own) replacement = serialize(own);
          else if (single && opaque.has(single.token)) {
            replacement = `rgba(var(${channelName(single.token)}), ${single.alpha})`;
          } else if (isGlobals && leaves.some((l) => overridden.has(l))) {
            // Token bị mẫu thiệp khai lại: màu tính ở đây sẽ sai bên trong mẫu.
            replacement = null;
          } else {
            const name = defineThemed(m.text);
            if (name) {
              // Tailwind vốn rơi về màu gốc; giữ đúng hành vi đó ở chỗ biến
              // chưa được định nghĩa thay vì để nó thành `unset`.
              const first = splitTopLevel(m.text.slice(m.text.indexOf("(") + 1, -1))[1];
              const firstColor = first?.replace(/\s+-?[\d.]+%$/, "").replace(/^-?[\d.]+%\s+/, "");
              replacement = tailwind && firstColor ? `var(${name}, ${firstColor})` : `var(${name})`;
            } else if (!isGlobals && sharedWithGlobals(m.text)) {
              // Token khai ở `globals.css`: biến đã được định nghĩa ở đó.
              replacement = `var(${nameFor(m.text)})`;
            }
          }
          if (!replacement) return null;
          out += decl.value.slice(cursor, m.start) + replacement;
          cursor = m.end;
        }
        return out + decl.value.slice(cursor);
      }

      function sharedWithGlobals(text) {
        const leaves = themedLeaves(text, brand);
        return (
          leaves.length > 0 &&
          leaves.every(
            (l) => tokens.has(l) && !overridden.has(l) && !scopeRules.some((s) => s.decls.has(l)),
          )
        );
      }

      // `globals.css`: định nghĩa trước biến cho biểu thức của các file khác.
      if (isGlobals) for (const text of shared) defineThemed(text);

      function ownCustomProps(rule) {
        const map = new Map();
        rule.each((node) => {
          if (node.type === "decl" && node.prop.startsWith("--")) map.set(node.prop, node.value);
        });
        return map;
      }

      /** Bản sao của `rule` chỉ chứa các khai báo có giá trị dự phòng. */
      function fallbackRule(rule, tailwind) {
        const own = ownCustomProps(rule);
        const copy = rule.clone({ nodes: [] });
        rule.each((node) => {
          if (node.type !== "decl") return;
          const value = fallbackValue(node, own, tailwind);
          if (value !== null) copy.append(node.clone({ value }));
        });
        return copy.nodes.length ? copy : null;
      }

      function wrap(nodes) {
        const block = new AtRule({ name: "supports", params: FALLBACK_CONDITION });
        block[MARK] = true;
        for (const node of nodes) {
          node[MARK] = true;
          block.append(node);
        }
        return block;
      }

      // 3a. Khối `@supports (color:color-mix(...))` của Tailwind → khối ngược.
      const tailwindBlocks = [];
      root.walkAtRules("supports", (atRule) => {
        if (!atRule[MARK] && isTailwindColorMixSupports(atRule)) tailwindBlocks.push(atRule);
      });
      for (const atRule of tailwindBlocks) {
        const copies = [];
        atRule.walkRules((rule) => {
          const copy = fallbackRule(rule, true);
          if (copy) copies.push(copy);
        });
        if (copies.length) atRule.after(wrap(copies));
      }

      // 3b. Mọi rule khác có `color-mix()` (token theme, utility tự viết,
      //     CSS Module của mẫu thiệp).
      const plainRules = [];
      root.walkRules((rule) => {
        if (rule[MARK] || insideKeyframes(rule)) return;
        if (rule.parent?.type === "rule") return; // CSS lồng nhau: bỏ qua
        for (let p = rule.parent; p; p = p.parent) {
          if (p[MARK] || isTailwindColorMixSupports(p)) return;
        }
        if (rule.some((n) => n.type === "decl" && /color-mix\(/i.test(n.value))) {
          plainRules.push(rule);
        }
      });
      const pending = new Map(); // rule -> fallback copy
      for (const rule of plainRules) {
        const copy = fallbackRule(rule, false);
        if (copy) pending.set(rule, copy);
      }

      // 3c. Định nghĩa `--cmfb-*` ngay sau scope rule khai token đó, nên thứ
      //     tự cascade giữa `:root` / `.dark` / `.theme-forest` y như bản gốc.
      for (const [rule, groups] of defsByRule) {
        // Selector cùng một bộ giá trị thì gộp lại một rule.
        const merged = new Map();
        for (const [selector, decls] of groups) {
          const key = JSON.stringify([...decls]);
          const entry = merged.get(key) ?? { selectors: [], decls };
          entry.selectors.push(selector);
          merged.set(key, entry);
        }
        const extra = [];
        for (const { selectors, decls } of merged.values()) {
          const copy = rule.clone({ nodes: [] });
          copy.selector = selectors.join(", ");
          for (const [prop, value] of decls) copy.append({ prop, value });
          extra.push(copy);
        }
        const existing = pending.get(rule);
        pending.set(rule, existing ? [existing, ...extra] : extra);
      }

      for (const [rule, copies] of pending) {
        const list = Array.isArray(copies) ? copies : [copies];
        if (!list.length) continue;
        // Scope rule nằm trong `@supports (color:color-mix(...))` thì đặt sau
        // khối đó — đặt bên trong là trình duyệt cũ không bao giờ đọc tới.
        let anchor = rule;
        for (let p = rule.parent; p; p = p.parent) {
          if (isTailwindColorMixSupports(p)) anchor = p;
        }
        anchor.after(wrap(list));
      }
    },
  };
};
plugin.postcss = true;

module.exports = plugin;
