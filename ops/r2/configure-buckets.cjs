/**
 * Cấu hình bucket tạm của R2 qua API S3: CORS cho lệnh PUT từ trình duyệt và
 * lifecycle tự xoá sau 1 ngày. Chạy **bên trong container backend** — image đã
 * có `@aws-sdk/client-s3` và đủ biến môi trường:
 *
 *   docker compose exec -T backend node - < ops/r2/configure-buckets.cjs
 *
 * Idempotent: chạy lại chỉ ghi đè đúng hai cấu hình này. Xem README.md.
 */
const {
  GetBucketCorsCommand,
  GetBucketLifecycleConfigurationCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketLifecycleConfigurationCommand,
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

const accountId = required('R2_ACCOUNT_ID');
const publicBucket = required('R2_BUCKET');
const stagingBucket = required('R2_STAGING_BUCKET');
// Trình duyệt của khách mở editor ở trang khách, không ở CMS — nhưng CORS
// liệt kê đủ những gì backend đang cho phép thì không phải nhớ sửa hai nơi.
const origins = required('FRONTEND_ORIGIN')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (publicBucket === stagingBucket) {
  console.error(
    'R2_STAGING_BUCKET trùng R2_BUCKET. Bucket tạm phải là bucket RIÊNG, không gắn custom domain — nếu không ảnh chưa kiểm của khách chưa đăng nhập sẽ có URL công khai.',
  );
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: required('R2_ACCESS_KEY_ID'),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
  },
});

async function main() {
  for (const bucket of [publicBucket, stagingBucket]) {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`✓ Truy cập được bucket ${bucket}`);
  }

  await client.send(
    new PutBucketCorsCommand({
      Bucket: stagingBucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ['PUT'],
            // Presigned URL ký cả `Content-Type`, nên trình duyệt phải được
            // phép gửi header này trong preflight.
            AllowedHeaders: ['content-type'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  console.log(`✓ CORS PUT cho ${origins.join(', ')}`);

  await client.send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket: stagingBucket,
      LifecycleConfiguration: {
        Rules: [
          {
            ID: 'expire-staging-after-1-day',
            Status: 'Enabled',
            Filter: { Prefix: '' },
            Expiration: { Days: 1 },
            AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
          },
        ],
      },
    }),
  );
  console.log('✓ Lifecycle: tự xoá mọi tệp tạm sau 1 ngày');

  const cors = await client.send(
    new GetBucketCorsCommand({ Bucket: stagingBucket }),
  );
  const lifecycle = await client.send(
    new GetBucketLifecycleConfigurationCommand({ Bucket: stagingBucket }),
  );
  console.log(
    JSON.stringify({ cors: cors.CORSRules, lifecycle: lifecycle.Rules }, null, 2),
  );
}

main().catch((error) => {
  console.error(`✗ ${error.name}: ${error.message}`);
  process.exit(1);
});
