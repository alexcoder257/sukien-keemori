#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

function loadTypeScript(path) {
  const source = readFileSync(join(root, path), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", outputText)(require, loaded, loaded.exports);
  return loaded.exports;
}

const { timelineActivityKind, timelineDecorFor } = loadTypeScript(
  "components/invitation/shared/timeline-activity.ts",
);
const { timelineActivityImages } = loadTypeScript(
  "components/invitation/shared/timeline-activity-images.ts",
);
const schema = readFileSync(join(root, "lib/schemas/invitation/content.ts"), "utf8");
const kindDeclaration = schema.match(/TIMELINE_ACTIVITY_KINDS = \[([\s\S]*?)\]/)?.[1];
assert.ok(kindDeclaration, "Missing timeline activity schema");
const kinds = [...kindDeclaration.matchAll(/"([a-z]+)"/g)].map((match) => match[1]);
const scenarios = [
  ["Lễ gia tiên tại nhà gái", "ancestral"],
  ["Đón dâu về nhà trai", "procession"],
  ["Đón khách tại trung tâm tiệc cưới", "welcome"],
  ["Khai tiệc", "reception"],
  ["Tea ceremony", "ancestral"],
  ["Wedding ceremony", "ceremony"],
  ["Tiệc tối & giao lưu", "music"],
  ["Chụp ảnh lưu niệm", "photo"],
  ["Cắt bánh cưới", "cake"],
  ["Nâng ly", "toast"],
  ["Tiễn khách", "farewell"],
  ["Hoạt động riêng", undefined],
];
for (const [activity, expected] of scenarios) {
  assert.equal(timelineActivityKind({ activity }), expected, activity);
  assert.equal(timelineActivityKind({ activity, kind: null }), expected, activity);
}

// Mẫu có bộ tranh lịch trình riêng. Kho đang trống; thêm slug khi mẫu mới khai
// `timelineActivityImages`.
const templates = [];
for (const slug of templates) {
  const set = timelineActivityImages(`/images/templates/${slug}/decor`);
  assert.deepEqual(Object.keys(set.byKind).sort(), [...kinds].sort(), `${slug}: incomplete artwork`);
  assert.equal(new Set(Object.values(set.byKind)).size, kinds.length, `${slug}: reused event artwork`);
  // Explicit choice overrides contradictory text, regardless of ordering or duplicates.
  for (const kind of [...kinds].reverse().concat(kinds)) {
    assert.equal(timelineDecorFor({ activity: "Khai tiệc", kind }, set), set.byKind[kind]);
  }
  for (const [activity, kind] of scenarios) {
    assert.equal(timelineDecorFor({ activity }, set), kind ? set.byKind[kind] : set.neutral);
  }
  for (const src of [...Object.values(set.byKind), set.neutral]) {
    const file = join(root, "public", src);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.format, "heif", `${src}: expected AVIF`);
    assert.equal(metadata.width, 320, `${src}: unexpected width`);
    assert.equal(metadata.height, 320, `${src}: unexpected height`);
    assert.ok(metadata.hasAlpha, `${src}: missing transparent background`);
    const { channels } = await sharp(file).stats();
    assert.equal(channels[3].min, 0, `${src}: background is opaque`);
    assert.ok(channels[3].max > 200, `${src}: empty or invisible artwork`);
  }
}
console.log(`PASS: ${templates.length} templates × ${kinds.length} activity kinds, neutral fallback, explicit overrides, reordered/repeated events, and ${templates.length * (kinds.length + 1)} transparent AVIF assets.`);
