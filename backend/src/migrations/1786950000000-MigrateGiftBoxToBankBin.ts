import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Khối "Hộp mừng cưới" đổi khoá ngân hàng từ **text tự do sang BIN 6 số** của
 * NAPAS. Lý do: mã QR chuyển khoản là VietQR, payload định danh ngân hàng bằng
 * BIN chứ không phải chuỗi "Vietcombank", nên dữ liệu cũ không sinh được QR.
 *
 * Bảng tra dưới đây **cố tình chép cứng vào migration** thay vì import từ
 * `constants`: migration phải cho ra cùng một kết quả ở mọi thời điểm, mà bảng
 * ngân hàng thì sẽ được cập nhật khi có ngân hàng sáp nhập hay đổi mã.
 *
 * Không khớp được tên cũ (viết tắt lạ, gõ sai) thì `bankBin` để rỗng — khối vẫn
 * còn số tài khoản để khách chuyển tay, chỉ mất QR. Xoá dữ liệu người dùng đã
 * nhập là hỏng nặng hơn nhiều so với thiếu một mã QR.
 */
const BIN_BY_NAME: Record<string, string> = {
  abbank: '970425',
  abb: '970425',
  nganhangtmcpanbinh: '970425',
  acb: '970416',
  nganhangtmcpachau: '970416',
  agribank: '970405',
  vba: '970405',
  nganhangnongnghiepvaphattriennongthonvietnam: '970405',
  bacabank: '970409',
  bab: '970409',
  nganhangtmcpbaca: '970409',
  baovietbank: '970438',
  bvb: '970438',
  nganhangtmcpbaoviet: '970438',
  bidv: '970418',
  nganhangtmcpdautuvaphattrienvietnam: '970418',
  cake: '546034',
  tmcpvietnamthinhvuongnganhangsocakebyvpbank: '546034',
  cimb: '422589',
  nganhangtnhhmtvcimbvietnam: '422589',
  coopbank: '970446',
  nganhanghoptacxavietnam: '970446',
  eximbank: '970431',
  eib: '970431',
  nganhangtmcpxuatnhapkhauvietnam: '970431',
  hdbank: '970437',
  hdb: '970437',
  nganhangtmcpphattrienthanhphohochiminh: '970437',
  kbank: '668888',
  nganhangdaichungtnhhkasikornbank: '668888',
  kienlongbank: '970452',
  klb: '970452',
  nganhangtmcpkienlong: '970452',
  lpbank: '970449',
  lpb: '970449',
  nganhangtmcplocphatvietnam: '970449',
  mbbank: '970422',
  mb: '970422',
  nganhangtmcpquandoi: '970422',
  mbv: '970414',
  nganhangtnhhmtvvietnamhiendai: '970414',
  momo: '971025',
  ctcpdichvudidongtructuyen: '971025',
  msb: '970426',
  nganhangtmcphanghaivietnam: '970426',
  namabank: '970428',
  nab: '970428',
  nganhangtmcpnama: '970428',
  ncb: '970419',
  nganhangtmcpquocdan: '970419',
  ocb: '970448',
  nganhangtmcpphuongdong: '970448',
  pgbank: '970430',
  pgb: '970430',
  nganhangtmcpthinhvuongvaphattrien: '970430',
  pvcombank: '970412',
  pvcb: '970412',
  nganhangtmcpdaichungvietnam: '970412',
  pvcombankpay: '971133',
  pvdb: '971133',
  nganhangtmcpdaichungvietnamnganhangso: '971133',
  sacombank: '970403',
  stb: '970403',
  nganhangtmcpsaigonthuongtin: '970403',
  saigonbank: '970400',
  sgicb: '970400',
  nganhangtmcpsaigoncongthuong: '970400',
  scb: '970429',
  nganhangtmcpsaigon: '970429',
  seabank: '970440',
  seab: '970440',
  nganhangtmcpdongnama: '970440',
  shb: '970443',
  nganhangtmcpsaigonhanoi: '970443',
  shinhanbank: '970424',
  shbvn: '970424',
  nganhangtnhhmtvshinhanvietnam: '970424',
  techcombank: '970407',
  tcb: '970407',
  nganhangtmcpkythuongvietnam: '970407',
  timo: '963388',
  nganhangsotimobybanvietbanktimobybanvietbank: '963388',
  tpbank: '970423',
  tpb: '970423',
  nganhangtmcptienphong: '970423',
  ubank: '546035',
  tmcpvietnamthinhvuongnganhangsoubankbyvpbank: '546035',
  vib: '970441',
  nganhangtmcpquoctevietnam: '970441',
  vietabank: '970427',
  vab: '970427',
  nganhangtmcpvieta: '970427',
  vietbank: '970433',
  nganhangtmcpvietnamthuongtin: '970433',
  vietcapitalbank: '970454',
  vccb: '970454',
  nganhangtmcpbanviet: '970454',
  vietcombank: '970436',
  vcb: '970436',
  nganhangtmcpngoaithuongvietnam: '970436',
  vietinbank: '970415',
  icb: '970415',
  nganhangtmcpcongthuongvietnam: '970415',
  vpbank: '970432',
  vpb: '970432',
  nganhangtmcpvietnamthinhvuong: '970432',
  woori: '970457',
  wvn: '970457',
  nganhangtnhhmtvwoorivietnam: '970457',
};

/** Đủ để `down` dựng lại tên hiển thị cũ; không cần chính xác từng chữ. */
const NAME_BY_BIN: Record<string, string> = {
  '970425': 'ABBANK',
  '970416': 'ACB',
  '970405': 'Agribank',
  '970409': 'BacABank',
  '970438': 'BaoVietBank',
  '970418': 'BIDV',
  '546034': 'CAKE',
  '422589': 'CIMB',
  '970446': 'COOPBANK',
  '970431': 'Eximbank',
  '970437': 'HDBank',
  '668888': 'KBank',
  '970452': 'KienLongBank',
  '970449': 'LPBank',
  '970422': 'MBBank',
  '970414': 'MBV',
  '971025': 'MoMo',
  '970426': 'MSB',
  '970428': 'NamABank',
  '970419': 'NCB',
  '970448': 'OCB',
  '970430': 'PGBank',
  '970412': 'PVcomBank',
  '971133': 'PVcomBank Pay',
  '970403': 'Sacombank',
  '970400': 'SaigonBank',
  '970429': 'SCB',
  '970440': 'SeABank',
  '970443': 'SHB',
  '970424': 'ShinhanBank',
  '970407': 'Techcombank',
  '963388': 'Timo',
  '970423': 'TPBank',
  '546035': 'Ubank',
  '970441': 'VIB',
  '970427': 'VietABank',
  '970433': 'VietBank',
  '970454': 'VietCapitalBank',
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970432': 'VPBank',
  '970457': 'Woori',
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

interface LegacyAccount {
  bank?: string;
  bankBin?: string;
  accountNumber?: string;
  accountName?: string;
}

type LegacyGiftBox = Record<'groom' | 'bride', LegacyAccount | undefined>;

interface CardGiftBoxRow {
  id: string;
  giftBox: LegacyGiftBox | null;
}

/** `query` trả `any`, nên chỗ ép kiểu gom về một hàm thay vì rải hai nơi. */
async function loadGiftBoxes(
  queryRunner: QueryRunner,
): Promise<CardGiftBoxRow[]> {
  return (await queryRunner.query(
    `SELECT "id", "content"->'giftBox' AS "giftBox" FROM "wedding_cards"`,
  )) as CardGiftBoxRow[];
}

export class MigrateGiftBoxToBankBin1786950000000 implements MigrationInterface {
  name = 'MigrateGiftBoxToBankBin1786950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await loadGiftBoxes(queryRunner);

    for (const row of rows) {
      if (!row.giftBox) continue;
      const next = {
        groom: convertUp(row.giftBox.groom),
        bride: convertUp(row.giftBox.bride),
      };
      await queryRunner.query(
        `UPDATE "wedding_cards" SET "content" = jsonb_set("content", '{giftBox}', $1::jsonb) WHERE "id" = $2`,
        [JSON.stringify(next), row.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows = await loadGiftBoxes(queryRunner);

    for (const row of rows) {
      if (!row.giftBox) continue;
      const next = {
        groom: convertDown(row.giftBox.groom),
        bride: convertDown(row.giftBox.bride),
      };
      await queryRunner.query(
        `UPDATE "wedding_cards" SET "content" = jsonb_set("content", '{giftBox}', $1::jsonb) WHERE "id" = $2`,
        [JSON.stringify(next), row.id],
      );
    }
  }
}

function convertUp(account: LegacyAccount | undefined) {
  const bankBin = BIN_BY_NAME[normalize(account?.bank ?? '')] ?? '';
  return {
    bankBin,
    // Số tài khoản cũ có thể lẫn khoảng trắng hoặc dấu chấm người dùng gõ cho
    // dễ đọc; payload VietQR chỉ nhận chữ và số.
    accountNumber: (account?.accountNumber ?? '').replace(/[^0-9A-Za-z]/g, ''),
    accountName: '',
  };
}

function convertDown(account: LegacyAccount | undefined) {
  return {
    bank: NAME_BY_BIN[account?.bankBin ?? ''] ?? '',
    accountNumber: account?.accountNumber ?? '',
  };
}
