import { createHash } from 'node:crypto';
import { AppModule } from '../app.module';
import { Template } from '@modules/catalog/template.entity';
import { WeddingCard } from '@modules/cards/wedding-card.entity';
import { CoupleShowcase } from '@modules/content/couple-showcase.entity';
import { Faq } from '@modules/content/faq.entity';
import { SiteStat } from '@modules/content/site-stat.entity';
import { TemplateReview } from '@modules/interactions/template-review.entity';
import { Wish } from '@modules/interactions/wish.entity';
import { TierPrice } from '@modules/pricing/tier-price.entity';
import { User } from '@modules/user/user.entity';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { Tier } from '@common/enums/tier.enum';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { FAQ_SEEDS } from './data/faqs.seed';
import {
  COUPLE_SHOWCASE_SEEDS,
  SITE_STAT_SEEDS,
} from './data/site-content.seed';
import { SHOWCASE_CARD_SEEDS } from './data/showcase-cards.seed';
import {
  REVIEWER_SEEDS,
  buildTemplateReviewSeeds,
} from './data/template-reviews.seed';
import { TEMPLATE_SEEDS } from './data/templates.seed';
import { TIER_PRICE_SEEDS } from './data/tier-prices.seed';

/**
 * Nạp dữ liệu nền: kho mẫu, nội dung biên tập và tài khoản chủ thiệp trưng bày.
 *
 * **Đây là đường dựng một database từ số 0** — máy dev mới, CI, staging mới
 * toanh — chứ không phải đường đưa thay đổi lên một database đang có người dùng
 * thật. Phân biệt này là chốt chặn, không phải quy ước phải nhớ: `assertNotProduction`
 * ở cuối file từ chối chạy khi `NODE_ENV=production`.
 *
 * Lý do là seed **không có khái niệm "đã chạy rồi"**. Nó luôn áp toàn bộ file
 * đang nằm trên máy đang gõ lệnh, nên một laptop có seed cũ sẽ kéo production
 * lùi về trạng thái cũ mà không có gì cản. Migration thì có bảng `migrations`
 * theo dõi, chạy đúng một lần, và chạy trong pipeline deploy.
 *
 * Vì vậy kho mẫu có **hai đường, cho hai loại database**:
 *
 * - Database mới dựng → `npm run seed` (file này).
 * - Database đang chạy → một migration mới. Thêm mẫu thì `INSERT ... ON
 *   CONFLICT (slug) DO NOTHING`; sửa trường code làm chủ của mẫu cũ thì
 *   `UPDATE ... WHERE slug = ...`. Xem `1789100000000-SyncTemplateCatalog.ts`
 *   làm mẫu, và mục "Kho mẫu và migration" trong `CLAUDE.md`.
 *
 * Migration **không được** `import` từ `seeders/data/`: migration là một lát
 * cắt đông cứng của thời gian, còn `TEMPLATE_SEEDS` thì còn đang được sửa. Nối
 * hai thứ lại thì ý nghĩa của migration cũ đổi ngược về quá khứ, và một DB dựng
 * lại từ đầu sẽ ra kết quả khác DB đã chạy tuần trước. Dữ liệu phải viết thẳng
 * trong file migration; trùng lặp với file seed ở đây là có chủ đích.
 *
 * Luật chung khi chạy lại: thứ gì admin chỉnh được trong CMS thì seed không bao
 * giờ ghi đè. Tài khoản admin theo luật đó từ đầu; kho mẫu chỉ cập nhật các trường
 * suy ra từ code — xem `CODE_OWNED_TEMPLATE_FIELDS`.
 *
 * Dùng: `npm run seed`
 */
const BCRYPT_ROUNDS = 10;
const logger = new Logger('Seed');

/**
 * Chế độ **chỉ thêm mới**: hàng nào đã có trong database thì giữ nguyên tuyệt
 * đối, seed chỉ chèn những hàng còn thiếu.
 *
 * Sinh ra cho production. Mặc định seeder coi file trong repo là bản gốc của
 * nội dung biên tập, nên nó ghi đè nội dung thiệp
 * showcase — đúng thứ ta muốn ở máy dev, và đúng thứ **không** được xảy ra trên
 * một database đang có người dùng thật. Khi chỉ cần đưa một mẫu mới lên, cả
 * phần ghi đè kia là rủi ro thuần tuý, không đổi lấy gì.
 *
 * Bật bằng `SEED_ONLY_NEW=1`.
 */
const ONLY_NEW = process.env.SEED_ONLY_NEW === '1';

/**
 * Các trường mà **code làm chủ**: chúng suy ra được từ chính component và thư
 * mục ảnh của mẫu (màu chủ đạo chốt cùng lúc với bảng màu trong CSS Module),
 * nên file seed là bản gốc của chúng. Với hàng đã có trong DB, seed chỉ ghi
 * đúng những trường này — **mọi trường còn lại thuộc về CMS** và được giữ
 * nguyên tuyệt đối.
 *
 * Đây là whitelist, và chiều của nó là phần quan trọng. Trước đây danh sách
 * chạy theo chiều ngược lại (liệt kê trường CMS làm chủ), nên nó chỉ bảo vệ 4
 * trong 10 trường mà `UpdateTemplateDto` cho admin sửa: `sortOrder` bị
 * `sortOrder = index` reset về vị trí trong file mỗi lần chạy, tức thứ tự kho
 * mẫu admin vừa xếp bị xoá, và bug đó im lặng vì DB vẫn "đúng file". Lật lại
 * chiều thì cột mới thêm vào `Template` mặc định thuộc CMS: quên khai báo là
 * mất một lần cập nhật, chứ không phải mất dữ liệu admin đã nhập.
 */
const CODE_OWNED_TEMPLATE_FIELDS = [
  'name',
  'photoSlots',
  'imagePosition',
  'imageSrc',
  'colorTones',
  'kind',
] as const satisfies readonly (keyof Template)[];

/**
 * Kho mẫu.
 *
 * Mẫu **chưa có** trong DB thì chèn nguyên hàng từ file seed. Mẫu **đã có** thì
 * chỉ cập nhật `CODE_OWNED_TEMPLATE_FIELDS`; tier, tag, trạng thái xuất bản,
 * thứ tự và dải trang chủ giữ nguyên giá trị admin đã đặt.
 *
 * Lưu ý về vai của hàm này sau khi kho mẫu chuyển sang đi bằng migration
 * (`SyncTemplateCatalog`): đây là đường dựng DB **từ số 0**, không phải đường
 * đưa mẫu mới lên một database đang chạy. Xem docblock đầu file.
 */
async function seedTemplates(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(Template);
  let created = 0;
  /*
   * Ở chế độ chỉ-thêm-mới, mẫu mới xếp **sau** mẫu cuối cùng đang có thay vì
   * lấy vị trí của nó trong file: `sortOrder = index` sẽ đẩy mọi mẫu cũ sang
   * chỗ khác, mà thứ tự kho mẫu là thứ khách đang nhìn thấy.
   */
  const maxSortOrder = ONLY_NEW
    ? ((
        await repository
          .createQueryBuilder('t')
          .select('MAX(t.sortOrder)', 'max')
          .getRawOne<{ max: number | null }>()
      )?.max ?? -1)
    : -1;
  let appended = 0;

  for (const [index, seed] of TEMPLATE_SEEDS.entries()) {
    const existing = await repository.findOne({ where: { slug: seed.slug } });
    if (existing && ONLY_NEW) continue;

    // `imageSrc` là trường duy nhất tuỳ chọn trong `TemplateSeed`; chuẩn hoá
    // `undefined` về `null` một lần ở đây để cả hai nhánh dưới dùng chung.
    const row = { ...seed, imageSrc: seed.imageSrc ?? null };

    if (!existing) {
      created += 1;
      await repository.save(
        repository.create({
          ...row,
          sortOrder: ONLY_NEW ? maxSortOrder + ++appended : index,
        }),
      );
      continue;
    }

    await repository.save(
      repository.create({
        ...existing,
        ...Object.fromEntries(
          CODE_OWNED_TEMPLATE_FIELDS.map((field) => [field, row[field]]),
        ),
      }),
    );
  }
  logger.log(
    ONLY_NEW
      ? `Đã thêm ${created} mẫu thiệp mới (mẫu cũ giữ nguyên hoàn toàn)`
      : `Đã nạp ${TEMPLATE_SEEDS.length} mẫu thiệp (${created} mẫu mới; ` +
          `mẫu cũ chỉ cập nhật tên/ảnh/ô ảnh/màu, phần còn lại giữ theo CMS)`,
  );
}

async function seedTierPrices(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(TierPrice);
  let created = 0;
  for (const seed of TIER_PRICE_SEEDS) {
    if (await repository.existsBy({ tier: seed.tier })) continue;
    await repository.save(repository.create(seed));
    created += 1;
  }
  logger.log(`Đã tạo ${created} bảng giá (bỏ qua gói đã cấu hình)`);
}

/**
 * Tài khoản **chủ các thiệp trưng bày** lấy từ `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
 * Mật khẩu được SHA-256 trước rồi mới bcrypt, đúng như đường đi của mật khẩu
 * từ client qua `AuthService.register` — bỏ bước SHA-256 thì đăng nhập sẽ
 * không khớp.
 *
 * Đây là một tài khoản **khách thường**, không phải tài khoản quản trị: người
 * vận hành CMS nằm ở bảng riêng `admin_users`. Tên biến giữ `ADMIN_*` để
 * `.env` đang có không phải sửa, và bước seed giữ tên `admin` vì
 * `seedShowcaseCards` tra chủ thiệp theo đúng email này.
 */
async function seedAdmin(dataSource: DataSource): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    logger.warn(
      'Bỏ qua chủ thiệp trưng bày: chưa khai ADMIN_EMAIL/ADMIN_PASSWORD trong .env',
    );
    return;
  }

  const repository = dataSource.getRepository(User);
  if (await repository.existsBy({ email })) return;

  const sha256 = createHash('sha256').update(password).digest('hex');
  await repository.save(
    repository.create({
      email,
      fullName: 'Keemori',
      passwordHash: await bcrypt.hash(sha256, BCRYPT_ROUNDS),
    }),
  );
  logger.log(`Đã tạo tài khoản chủ thiệp trưng bày ${email}`);
}

/**
 * Nạp nội dung biên tập: FAQ, lời chứng thực, dải thiệp trưng bày và số liệu
 * marketing.
 *
 * Mọi bảng ở đây đều **cập nhật theo file seed** chứ không bỏ qua bản đã có:
 * đây là nội dung do repo quản, và file seed là bản gốc của nó. Khoá đối chiếu
 * là `slug`/`key`; bảng không có khoá tự nhiên (FAQ, lời chứng thực) thì chỉ
 * nạp khi bảng còn rỗng để chạy lại không sinh bản trùng.
 */
async function seedContent(dataSource: DataSource): Promise<void> {
  const faqs = dataSource.getRepository(Faq);
  if ((await faqs.count()) === 0) {
    await faqs.save(
      FAQ_SEEDS.map((seed, index) =>
        faqs.create({ ...seed, sortOrder: index }),
      ),
    );
    logger.log(`Đã tạo ${FAQ_SEEDS.length} câu hỏi thường gặp`);
  }

  const showcases = dataSource.getRepository(CoupleShowcase);
  const showcaseTail = ONLY_NEW ? await showcases.count() : 0;
  let showcaseAppended = 0;
  for (const [index, seed] of COUPLE_SHOWCASE_SEEDS.entries()) {
    const existing = await showcases.findOne({ where: { slug: seed.slug } });
    if (existing && ONLY_NEW) continue;
    await showcases.save(
      showcases.create({
        ...existing,
        ...seed,
        sortOrder: ONLY_NEW ? showcaseTail + showcaseAppended++ : index,
      }),
    );
  }
  // Hàng cũ phải đi hẳn, không chỉ thôi được cập nhật: dải trước đây trỏ vào
  // những slug không có thiệp nào, mà một ô còn sót lại là một link 404 nằm
  // trên trang chủ.
  if (!ONLY_NEW) {
    const remove = showcases.createQueryBuilder().delete();
    // Danh sách rỗng thì xoá hết: `NOT IN ()` là lỗi cú pháp ở Postgres.
    if (COUPLE_SHOWCASE_SEEDS.length > 0) {
      remove.where('slug NOT IN (:...slugs)', {
        slugs: COUPLE_SHOWCASE_SEEDS.map((seed) => seed.slug),
      });
    }
    await remove.execute();
  }
  logger.log(`Đã nạp ${COUPLE_SHOWCASE_SEEDS.length} ô cho dải trang chủ`);

  const stats = dataSource.getRepository(SiteStat);
  for (const seed of SITE_STAT_SEEDS) {
    const existing = await stats.findOne({ where: { key: seed.key } });
    // Số liệu marketing do admin chỉnh khi số thật vượt số công bố, nên bản đã
    // có thì giữ nguyên.
    if (existing) continue;
    await stats.save(
      stats.create({ key: seed.key, value: String(seed.value) }),
    );
  }
}

/**
 * Tier của mẫu **theo DB**, không theo file seed: thiệp mẫu và dải trang chủ
 * dùng chung kho mẫu với khách, nên admin xếp lại gói một mẫu thì chúng phải đi
 * theo. Mẫu chưa có trong DB (chạy seed lần đầu) thì rơi về giá trị trong file.
 */
async function liveTemplateTier(
  dataSource: DataSource,
  slug: string,
  fallback: Tier,
): Promise<Tier> {
  const template = await dataSource
    .getRepository(Template)
    .findOne({ where: { slug } });
  return template?.tier ?? fallback;
}

/**
 * Chín thiệp của dải "Cặp đôi đã tạo thiệp" ở trang chủ. Ba điều kiện bắt buộc
 * (`paid`, chủ là tài khoản `ADMIN_EMAIL`, chạy sau `seedAdmin`) vì chúng là link công khai nằm
 * ngay trên trang chủ — xem `showcase-cards.seed.ts`.
 *
 * Ô đầu tiên còn là **thiệp mẫu của CTA "Xem thiệp mẫu"** ở hero
 * (`frontend/constants/invitation.ts` → `DEMO_INVITATION_SLUG`), nên bỏ hàm này
 * đi là hero mất luôn cả mặt thiệp lẫn nút.
 */
async function seedShowcaseCards(dataSource: DataSource): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  if (!email) return;

  const owner = await dataSource
    .getRepository(User)
    .findOne({ where: { email } });
  if (!owner) return;

  const cards = dataSource.getRepository(WeddingCard);
  const wishes = dataSource.getRepository(Wish);

  for (const seed of SHOWCASE_CARD_SEEDS) {
    const existing = await cards.findOne({ where: { slug: seed.slug } });
    if (existing && ONLY_NEW) continue;
    const card = await cards.save(
      cards.create({
        ...existing,
        ownerId: owner.id,
        slug: seed.slug,
        title: seed.title,
        templateSlug: seed.templateSlug,
        templateTier: await liveTemplateTier(
          dataSource,
          seed.templateSlug,
          seed.templateTier,
        ),
        // `plan_tier` là cột di sản của mô hình nhiều gói; thiệp nào cũng ghi
        // `diamond` và mọi thiệp đều có đủ tính năng, kể cả album.
        planTier: 'diamond',
        status: 'paid',
        content: seed.content,
        publishedAt: existing?.publishedAt ?? new Date(),
        expiresAt: null,
      }),
    );

    if ((await wishes.countBy({ cardId: card.id })) === 0) {
      await wishes.save(
        seed.wishes.map((wish) =>
          wishes.create({ ...wish, cardId: card.id, approved: true }),
        ),
      );
    }
  }
  logger.log(`Đã nạp ${SHOWCASE_CARD_SEEDS.length} thiệp cho dải trang chủ`);
}

/**
 * Đánh giá mồi cho kho mẫu — xem `template-reviews.seed.ts` cho luật của bộ dữ
 * liệu (chỉ 4–5 sao, số lượng theo gói, tất định theo slug).
 *
 * Hai điều đáng nói ở phần ghi xuống DB.
 *
 * Tier đọc **từ DB** chứ không từ file seed, cùng lý do với `liveTemplateTier`:
 * admin xếp lại gói một mẫu thì số lượng đánh giá phải đi theo quyết định đó.
 *
 * Và insert đi qua query builder chứ không qua `repository.save`, vì `save`
 * luôn tự đặt `createdAt` bằng thời điểm hiện tại (`SubjectExecutor` ghi đè giá
 * trị mình gán) — cả kho sẽ mang đúng một dấu thời gian, thứ lộ ra ngay trên
 * màn hình là dữ liệu nạp sẵn. `updatedAt` cố ý bằng `createdAt`: lệch nhau là
 * UI gắn nhãn "đã sửa".
 *
 * Mẫu đã có đánh giá thì bỏ qua hoàn toàn — chạy lại seed không được đụng vào
 * nhận xét người dùng thật đã gửi.
 */
async function seedTemplateReviews(dataSource: DataSource): Promise<void> {
  const users = dataSource.getRepository(User);
  const reviewerIds = new Map<string, string>();
  for (const seed of REVIEWER_SEEDS) {
    const existing = await users.findOne({ where: { email: seed.email } });
    const reviewer =
      existing ??
      (await users.save(
        users.create({
          email: seed.email,
          fullName: seed.fullName,
          role: 'customer',
          // Không mật khẩu, không nhận thư: đây là tài khoản đứng tên nhận xét
          // mồi, không phải một hộp thư có thật.
          passwordHash: null,
          emailNotifications: false,
        }),
      ));
    reviewerIds.set(seed.email, reviewer.id);
  }

  const templates = await dataSource.getRepository(Template).find();
  const reviews = dataSource.getRepository(TemplateReview);
  let created = 0;
  for (const template of templates) {
    if (await reviews.existsBy({ templateSlug: template.slug })) continue;

    const rows = buildTemplateReviewSeeds(template.slug, template.tier).map(
      (seed) => {
        const createdAt = new Date(
          Date.now() - seed.daysAgo * 24 * 60 * 60 * 1000,
        );
        return {
          userId: reviewerIds.get(seed.reviewerEmail),
          templateSlug: seed.templateSlug,
          rating: seed.rating,
          comment: seed.comment,
          createdAt,
          updatedAt: createdAt,
        };
      },
    );

    await reviews
      .createQueryBuilder()
      .insert()
      .into(TemplateReview)
      .values(rows)
      .execute();
    created += rows.length;
  }
  logger.log(
    `Đã nạp ${created} đánh giá mẫu thiệp cho ${templates.length} mẫu ` +
      `(mẫu đã có đánh giá thì giữ nguyên)`,
  );
}

/**
 * Các bước của seed, theo **thứ tự phụ thuộc** — chạy cả bộ là chạy đúng danh
 * sách này từ trên xuống. Đừng đảo thứ tự: `showcase-cards` cần thiệp mà
 * `content` trỏ tới, và `template-reviews` đọc tier của mẫu trong DB nên phải
 * đứng sau `templates`.
 */
const SEED_STEPS = [
  ['templates', seedTemplates],
  ['tier-prices', seedTierPrices],
  ['content', seedContent],
  ['admin', seedAdmin],
  ['showcase-cards', seedShowcaseCards],
  ['template-reviews', seedTemplateReviews],
] as const satisfies readonly (readonly [
  string,
  (dataSource: DataSource) => Promise<void>,
])[];

/**
 * `npm run seed` chạy cả bộ; thêm tên bước thì **chỉ** chạy bước đó:
 *
 *     node dist/seeders/seed.js template-reviews
 *
 * Chọn bước không phải tiện nghi mà là thứ bắt buộc phải có trước khi seed
 * chạm vào production: `content` **ghi đè** dải trang chủ theo file trong repo, nên nạp mấy dòng đánh giá bằng cách chạy cả bộ là
 * đổi luôn nội dung biên tập viên đã sửa trong CMS. Tên sai thì dừng ngay và
 * liệt kê tên đúng, chứ không lặng lẽ chạy cả bộ.
 */
function selectedSteps(): typeof SEED_STEPS | (typeof SEED_STEPS)[number][] {
  const requested = process.argv.slice(2);
  if (!requested.length) return SEED_STEPS;

  const unknown = requested.filter(
    (name) => !SEED_STEPS.some(([step]) => step === name),
  );
  if (unknown.length) {
    throw new Error(
      `Bước seed không tồn tại: ${unknown.join(', ')}. ` +
        `Chọn trong: ${SEED_STEPS.map(([step]) => step).join(', ')}`,
    );
  }
  return SEED_STEPS.filter(([step]) => requested.includes(step));
}

/**
 * Chặn cứng seed chạy nhầm vào database production.
 *
 * Đây là lớp phòng thủ duy nhất **không** phụ thuộc vào việc người gõ lệnh nhớ
 * một quy ước. `SEED_ONLY_NEW` và cơ chế chọn bước ở dưới đều là kỷ luật: quên
 * bật là `seedContent` chạy ở chế độ mặc định, mà chế độ đó có lệnh **xoá**
 * — `slug NOT IN (...)` của dải trang chủ. Trên một
 * database có nội dung biên tập thật thì đó là mất dữ liệu, không hồi phục và
 * không có cảnh báo nào trước đó.
 *
 * Cửa thoát là `SEED_ALLOW_PRODUCTION` mang **đúng tên database** đang kết nối,
 * chứ không phải `=1`. Bắt gõ lại tên là bắt dừng lại đọc xem mình đang trỏ vào
 * đâu — và nó không copy-paste được từ lịch sử shell của một môi trường khác.
 */
function assertNotProduction(dataSource: DataSource): void {
  if (process.env.NODE_ENV !== 'production') return;

  const database = String(dataSource.options.database ?? '');
  if (process.env.SEED_ALLOW_PRODUCTION === database) {
    logger.warn(`Chạy seed trên database production "${database}"`);
    return;
  }

  throw new Error(
    `Từ chối chạy seed: NODE_ENV=production (database "${database}"). ` +
      `Mẫu thiệp mới lên production bằng migration, không bằng seed — xem ` +
      `docblock đầu file. Nếu thật sự cần, đặt SEED_ALLOW_PRODUCTION="${database}".`,
  );
}

async function bootstrap(): Promise<void> {
  const steps = selectedSteps();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const dataSource = app.get<DataSource>(getDataSourceToken());
    assertNotProduction(dataSource);
    for (const [name, run] of steps) {
      logger.log(`— ${name}`);
      await run(dataSource);
    }
    logger.log('Seed xong');
  } finally {
    await app.close();
  }
}

void bootstrap();
