import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  WeddingCeremonies,
  CEREMONIES_VARIANTS,
  weddingCeremoniesData,
} from "@/components/invitation/shared/wedding-ceremonies";
import {
  CEREMONIES_FONT_COMBOS,
  type CeremoniesFontCombo,
} from "@/components/invitation/shared/ceremonies-typography";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { invitationBlocks } from "@/components/invitation/shared/invitation-blocks";
import { emptyInvitationContent } from "@/lib/data/invitations";
import { NO_INDEX } from "@/lib/seo";
import styles from "./ceremonies.module.css";

/**
 * Trang tham chiếu nội bộ: 3 bố cục × 4 combo font của `WeddingCeremonies`.
 * Cùng loại với `/design-system` nên nội dung đặt trực tiếp, không qua
 * dictionary — trừ chính khối đang xem, vốn phải chạy bằng chuỗi thật.
 */

export const metadata: Metadata = { robots: NO_INDEX };

const COMBOS = Object.keys(CEREMONIES_FONT_COMBOS) as CeremoniesFontCombo[];

/**
 * Dữ liệu mẫu **điền đủ bốn ô của form**: loại nghi lễ, ngày giờ, địa điểm, lời
 * thông báo. Đó là trạng thái mặc định của trang này — muốn thấy khối trông thế
 * nào khi đầy đủ thì không được để sẵn ô trống.
 */
const ceremony = (
  kind: "engagement" | "bride" | "groom",
  dateTime: string,
  venue: string,
  note: string,
) => ({ kind, customKind: "", dateTime, venue, venuePlace: null, note });

const FULL = [
  ceremony(
    "engagement",
    "08:00 · 14/11/2026",
    "Tư gia nhà gái, 48 Lê Lợi, Hải Châu, Đà Nẵng",
    "Gia đình làm lễ gia tiên và trao nhẫn.",
  ),
  ceremony(
    "bride",
    "09:30 · 22/11/2026",
    "Tư gia nhà gái, 48 Lê Lợi, Hải Châu, Đà Nẵng",
    "Kính mời cô bác hai họ dự lễ vu quy.",
  ),
  ceremony(
    "groom",
    "17:30 · 22/11/2026",
    "Trung tâm tiệc cưới Keemori, Hà Nội",
    "Tiệc mừng bắt đầu ngay sau lễ thành hôn.",
  ),
];

/**
 * Ca thử **ô trống**: form đánh dấu ngày giờ và địa điểm là bắt buộc, nhưng
 * thiệp đang soạn dở vẫn phải xem trước được — và lời thông báo thì vốn tuỳ
 * chọn. Ô nào trống thì phần đó **không được vẽ ra**, kể cả một dòng rỗng.
 */
const SPARSE = [
  ceremony("engagement", "08:00 · 14/11/2026", "", ""),
  ceremony("bride", "", "Tư gia nhà gái, 48 Lê Lợi, Hải Châu, Đà Nẵng", ""),
  ceremony(
    "groom",
    "17:30 · 22/11/2026",
    "Trung tâm tiệc cưới Keemori, Hà Nội",
    "",
  ),
];

function sampleContent(items: typeof FULL) {
  const content = structuredClone(emptyInvitationContent);
  content.ceremonies = items;
  return content;
}

export default async function CeremoniesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  /* Đi qua `invitationBlocks` đúng như một mẫu thiệp thật, thay vì tự lọc — luật
     "nghi lễ rỗng thì không tính" chỉ được nằm ở một chỗ. */
  const build = (items: typeof FULL) =>
    weddingCeremoniesData(
      invitationBlocks(sampleContent(items)).ceremonies,
      dict.invitation.sections.ceremonies,
      dict.editor.ceremonyKinds,
      locale,
    );
  const many = build(FULL);
  const one = build([FULL[0]]);
  const sparse = build(SPARSE);

  return (
    <div className={`container-page ${styles.page}`}>
      <header className={styles.intro}>
        <h1 className="text-h2">Khối nghi lễ</h1>
        <p className="mt-4 text-body-lg text-muted-foreground">
          Một component dùng chung, ba bố cục, bốn combo font. Ba bố cục rút từ
          chính kho mẫu: <code>stack</code> là cách Lan Trắng và Xích Duyên đang
          bày, <code>timeline</code> là Vòm Ngà, <code>card</code> là Classic và
          Đỏ Thắm.
        </p>
      </header>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h2 className="text-h4">Ca thử: chỉ một nghi lễ</h2>
          <span className="text-small text-muted-foreground">
            trường hợp phổ biến nhất
          </span>
        </div>
        <p className={`text-body ${styles.groupNote}`}>
          Một nghi lễ duy nhất phải chiếm trọn bề rộng. Ở bố cục{" "}
          <code>card</code>, thẻ đơn độc co lại còn nửa khung là hỏng — trông như
          lỗi dàn trang chứ không phải một lựa chọn. Ở <code>timeline</code>, trục
          dọc chỉ có một mốc thì phải thu về đúng chiều cao mốc đó, không được
          thò ra thành một sợi chỉ cắt dở.
        </p>
        <div className={styles.row}>
          {CEREMONIES_VARIANTS.map((variant) => (
            <div key={variant} className={styles.cell}>
              <p className={styles.cellLabel}>{variant}</p>
              <div className={`${styles.canvas} theme-invitation`}>
                <WeddingCeremonies
                  variant={variant}
                  data={one}
                  typography={{ combo: "playfair-display" }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h2 className="text-h4">Ca thử: bỏ trống ô</h2>
          <span className="text-small text-muted-foreground">
            thiếu địa điểm · thiếu ngày giờ · không lời thông báo
          </span>
        </div>
        <p className={`text-body ${styles.groupNote}`}>
          Khối phải bám đúng những gì đã điền: ô trống thì phần đó biến mất hẳn,
          không để lại dòng rỗng, dấu chấm hay khoảng thụt. Nghi lễ đầu chỉ có
          giờ, nghi lễ hai chỉ có địa điểm, nghi lễ ba không có lời thông báo.
        </p>
        <div className={styles.row}>
          {CEREMONIES_VARIANTS.map((variant) => (
            <div key={variant} className={styles.cell}>
              <p className={styles.cellLabel}>{variant}</p>
              <div className={`${styles.canvas} theme-invitation`}>
                <WeddingCeremonies
                  variant={variant}
                  data={sparse}
                  /* Cố tình khai đè vùng số bằng một font oldstyle: chốt chặn
                     trong `ceremoniesTypography` phải thay nó tại chỗ. Đây là ca
                     kiểm, không phải cấu hình mẫu. */
                  typography={{
                    combo: "playfair-display",
                    regions: { time: "cormorant-sc" },
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {COMBOS.map((combo) => (
        <section key={combo} className={styles.group}>
          <div className={styles.groupHeader}>
            <h2 className="text-h4">{combo}</h2>
            <span className="text-small text-muted-foreground">
              măng sét bằng {CEREMONIES_FONT_COMBOS[combo].title}
            </span>
          </div>
          <div className={styles.row}>
            {CEREMONIES_VARIANTS.map((variant) => (
              <div key={variant} className={styles.cell}>
                <p className={styles.cellLabel}>{variant}</p>
                <div className={`${styles.canvas} theme-invitation`}>
                  <WeddingCeremonies
                    variant={variant}
                    data={many}
                    typography={{ combo }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
