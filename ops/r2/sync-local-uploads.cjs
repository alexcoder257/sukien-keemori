/**
 * Chép ảnh đã tải lên từ đĩa backend (`UPLOAD_DIR`, mặc định /app/uploads) sang
 * bucket công khai R2, **giữ nguyên đường dẫn**: tệp `uploads/cards/<id>/a.avif`
 * trên đĩa thành khoá `uploads/cards/<id>/a.avif` — đúng khoá `R2Provider` dùng,
 * nên URL `/uploads/...` đã ghi trong database không phải sửa gì.
 *
 * Chạy bên trong container backend:
 *
 *   docker compose exec -T -e DRY_RUN=1 backend node - < ops/r2/sync-local-uploads.cjs
 *   docker compose exec -T backend node - < ops/r2/sync-local-uploads.cjs
 *
 * Idempotent: tệp đã có trên R2 (cùng dung lượng) thì bỏ qua, nên chạy lại sau
 * khi đổi `STORAGE_DRIVER` để vét nốt ảnh tải lên trong lúc chuyển là an toàn.
 * Không bao giờ xoá gì, ở cả hai phía.
 */
const { readdir, readFile, stat } = require('node:fs/promises');
const { extname, join, relative, sep } = require('node:path');
const {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Thiếu biến môi trường ${name}`);
    process.exit(1);
  }
  return value;
}

const dryRun = process.env.DRY_RUN === '1';
const rootDir = join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
const keyPrefix = (process.env.UPLOAD_PUBLIC_PATH || '/uploads').replace(
  /^\/+|\/+$/g,
  '',
);
const bucket = required('R2_BUCKET');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${required('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: required('R2_ACCESS_KEY_ID'),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
  },
});

const CONTENT_TYPES = {
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile()) yield path;
  }
}

async function remoteSize(key) {
  try {
    const head = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    return head.ContentLength ?? null;
  } catch {
    return null;
  }
}

async function main() {
  let copied = 0;
  let skipped = 0;
  let bytes = 0;

  for await (const path of walk(rootDir)) {
    const key = `${keyPrefix}/${relative(rootDir, path).split(sep).join('/')}`;
    const size = (await stat(path)).size;
    if ((await remoteSize(key)) === size) {
      skipped += 1;
      continue;
    }
    const contentType =
      CONTENT_TYPES[extname(path).toLowerCase()] || 'application/octet-stream';
    if (!dryRun) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: await readFile(path),
          ContentType: contentType,
          // Cùng header với `R2Provider.save` — thiếu nó Cloudflare chỉ cache
          // 120 phút và mỗi POP hỏi lại R2 theo nhịp đó.
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    }
    copied += 1;
    bytes += size;
    console.log(`${dryRun ? '[dry-run] ' : ''}↑ ${key}`);
  }

  console.log(
    `${dryRun ? '[dry-run] ' : ''}Xong: ${copied} tệp chép (${(bytes / 1024 / 1024).toFixed(1)}MB), ${skipped} tệp đã có sẵn.`,
  );
}

main().catch((error) => {
  console.error(`✗ ${error.name}: ${error.message}`);
  process.exit(1);
});
