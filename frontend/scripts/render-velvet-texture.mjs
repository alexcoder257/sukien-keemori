import sharp from "sharp";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Nền nhung đỏ rượu vang của mẫu `burgundy-birthday`, dựng bằng SVG
// feTurbulence: dải sáng tối chạy dọc như vải rủ, nếp "crushed velvet" mờ và
// thớ lông nhung mịn. Màu đo trên khăn nhung của ảnh bàn tiệc
// (`candlelit-table.avif`): nền #4d0b11, tối #2d0507, ánh #5d1016–#7e1c22 — đỏ
// rượu vang thuần, không ngả mận như giấy của màn opening.
//
//   node scripts/render-velvet-texture.mjs
//
// Ghi đè hai ảnh `velvet-texture-{landscape,portrait}.avif`. Đổi màu hay seed
// thì chạy lại cả hai để bản Desktop và Mobile không lệch tông.
const output = fileURLToPath(
  new URL("../public/images/templates/burgundy-birthday/decor/", import.meta.url),
);

function svg(w, h, seed) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <!-- Vùng sáng/tối lớn: ánh đèn trượt trên mặt nhung rủ, kéo dài theo chiều dọc. -->
    <filter id="light" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0009" numOctaves="3" seed="${seed}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -1.05" result="a"/>
      <feFlood flood-color="#82161f"/>
      <feComposite in2="a" operator="in"/>
      <feGaussianBlur stdDeviation="18"/>
    </filter>
    <filter id="shade" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.0028 0.0008" numOctaves="3" seed="${seed + 7}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 1.25" result="a"/>
      <feFlood flood-color="#1c0204"/>
      <feComposite in2="a" operator="in"/>
      <feGaussianBlur stdDeviation="22"/>
    </filter>
    <!-- Nếp "crushed velvet": turbulence gần 0 ở các gờ, đảo lại thành vệt ánh mảnh. -->
    <filter id="creases" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="turbulence" baseFrequency="0.0042 0.0011" numOctaves="2" seed="${seed + 13}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -5 0 0 0 0.62" result="a"/>
      <feFlood flood-color="#9c2430"/>
      <feComposite in2="a" operator="in"/>
      <feGaussianBlur stdDeviation="7"/>
    </filter>
    <!-- Thớ lông nhung: hạt mịn, hơi dài theo chiều sợi. -->
    <filter id="pile" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.62 0.95" numOctaves="2" seed="${seed + 3}" result="n"/>
      <!-- Hạt phải khác nhau về **độ sáng**, không chỉ về sắc đỏ: AVIF nén
           kênh màu mạnh hơn kênh sáng, hạt chỉ khác sắc thì bị xoá sạch. -->
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.16  0 0 0 0 0.19  0 0 0 0.62 -0.3" result="lit"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.05  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.62 0.29" result="dark"/>
      <feMerge><feMergeNode in="dark"/><feMergeNode in="lit"/></feMerge>
    </filter>
    <radialGradient id="vignette" cx="50%" cy="40%" r="78%">
      <stop offset="50%" stop-color="#140103" stop-opacity="0"/>
      <stop offset="100%" stop-color="#140103" stop-opacity="0.6"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#4d0b11"/>
  <rect width="100%" height="100%" filter="url(#shade)"/>
  <rect width="100%" height="100%" filter="url(#light)"/>
  <rect width="100%" height="100%" filter="url(#creases)" opacity="0.3"/>
  <rect width="100%" height="100%" filter="url(#pile)"/>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
</svg>`;
}

async function render(name, width, height, seed) {
  const file = `${output}${name}.avif`;
  await sharp(Buffer.from(svg(width, height, seed)))
    .avif({ quality: 74, effort: 6, chromaSubsampling: "4:4:4" })
    .toFile(file);
  console.log(name, `${width}x${height}`, `${Math.round(statSync(file).size / 1024)}KB`);
}

// Kích thước giữ đúng hai ảnh cũ: Desktop phủ `cover`, Mobile là artboard dọc.
await render("velvet-texture-landscape", 1800, 1500, 11);
await render("velvet-texture-portrait", 780, 2508, 23);
