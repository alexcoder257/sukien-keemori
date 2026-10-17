import sharp from "sharp";
import { fileURLToPath } from "node:url";

// Resize/crop the generated event hero; preserve the original outside public/.
const source = fileURLToPath(
  new URL("../../output/imagegen/hero-su-kien-sinh-nhat.png", import.meta.url),
);
const output = new URL("../public/images/site/", import.meta.url);
const encoding = { quality: 70, effort: 6, chromaSubsampling: "4:4:4" };
const variants = [
  { name: "hero-su-kien-sinh-nhat-1280.avif", width: 1280 },
  { name: "hero-su-kien-sinh-nhat-1672.avif", width: 1672 },
  {
    name: "hero-su-kien-sinh-nhat-mobile.avif",
    width: 1044,
    crop: { left: 628, top: 0, width: 1044, height: 941 },
  },
  {
    name: "hero-su-kien-sinh-nhat-backdrop.avif",
    width: 560,
    crop: { left: 0, top: 0, width: 560, height: 700 },
  },
];

for (const { name, width, crop } of variants) {
  let pipeline = sharp(source).rotate();
  if (crop) pipeline = pipeline.extract(crop);
  const result = await pipeline
    .resize({ width })
    .avif(encoding)
    .toFile(fileURLToPath(new URL(name, output)));
  console.log(
    `${name}: ${result.width}×${result.height}, ${result.size} bytes, q70`,
  );
}
