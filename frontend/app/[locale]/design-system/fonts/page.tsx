import type { CSSProperties } from "react";
import type { Metadata } from "next";
import {
  COUPLE_NAME_FONTS,
  COUPLE_NAME_FONT_STYLES,
  COUPLE_NAME_FONT_VARIABLES,
  VIETNAMESE_STRESS_TEST,
  type CoupleNameFont,
  type CoupleNameFontStyle,
} from "@/constants/couple-name-fonts";
import { NO_INDEX } from "@/lib/seo";
import styles from "./fonts.module.css";

/**
 * Trang tham chiếu nội bộ: đối chiếu font đặt **tên cô dâu chú rể**. Cùng loại
 * với `/design-system` nên nội dung đặt trực tiếp, không qua dictionary.
 *
 * Mọi font ứng viên được khai một lần ở `COUPLE_NAME_FONTS`; trang này chỉ vẽ.
 */

export const metadata: Metadata = { robots: NO_INDEX };

const FIRST_NAME = "Tuấn Anh";
const SECOND_NAME = "Như Bình";

const GROUPS: Record<CoupleNameFontStyle, { title: string; note: string }> = {
  calligraphy: {
    title: "Thư pháp",
    note: "Nét bút liền mạch, có swash. Đây là nhóm hay dùng nhất cho tên cặp đôi, và cũng là nhóm dễ hỏng nhất với tiếng Việt: dấu chồng lên swash của chữ bên cạnh, nên tên dài phải nới line-height chứ không chỉ giảm cỡ.",
  },
  signature: {
    title: "Chữ ký",
    note: "Viết tay hiện đại, ít trang trí hơn thư pháp. Thân chữ đều hơn nên dấu tiếng Việt có chỗ thở — an toàn hơn cho tên bốn chữ.",
  },
  "serif-display": {
    title: "Serif display",
    note: "Không phải chữ viết tay. Tương phản nét cao, đặt tên ở dạng hoa toàn bộ với letter-spacing rộng. Đây là hướng của font-1 và font-3 trong docs/shares/combo-font — trang trọng hơn và đọc được ở cỡ nhỏ, thứ chữ thư pháp không làm được.",
  },
  blackletter: {
    title: "Blackletter",
    note: "Gothic. Rất kén — chỉ hợp mẫu tối, và gần như không đọc được khi viết hoa toàn bộ.",
  },
  sans: {
    title: "Sans",
    note: "Chỉ dành cho mẫu tối giản, nơi tên cặp đôi cố ý không được trang trí.",
  },
};

function FontCard({ font }: { font: CoupleNameFont }) {
  return (
    <article
      className={`${styles.card} ${font.vietnamese ? "" : styles.cardUnusable}`}
      style={
        {
          "--preview-family": font.family,
          "--preview-scale": font.scale,
        } as CSSProperties
      }
    >
      <header className={styles.cardHead}>
        <span className={styles.fontName}>{font.label}</span>
        {font.vietnamese ? (
          <span className={styles.headroom} title="Độ nhô của dấu, % em (ấ so với a)">
            dấu +{font.headroom}%
          </span>
        ) : (
          <span className={styles.flag}>Thiếu dấu</span>
        )}
      </header>
      <div className={styles.preview}>
        <p className={styles.name}>{FIRST_NAME}</p>
        <p className={styles.ampersand}>&amp;</p>
        <p className={styles.name}>{SECOND_NAME}</p>
      </div>
      <p className={styles.stress}>{VIETNAMESE_STRESS_TEST}</p>
    </article>
  );
}

export default function CoupleNameFontsPage() {
  const unusable = COUPLE_NAME_FONTS.filter((font) => !font.vietnamese);

  return (
    <div className={`${COUPLE_NAME_FONT_VARIABLES} container-page ${styles.page}`}>
      <header className={styles.intro}>
        <h1 className="text-h2">Font đặt tên cô dâu chú rể</h1>
        <p className="mt-4 text-body-lg text-muted-foreground">
          Mỗi thẻ hiển thị <span className={styles.demoString}>Tuấn Anh &amp; Như Bình</span>{" "}
          ở đúng bậc <code className={styles.demoString}>--tpl-h1</code> của mẫu thiệp,
          trên bề mặt giấy sáng — thiệp không có chế độ tối nên so sánh trên nền
          tối là so sai. Dòng dưới mỗi thẻ là chuỗi thử dấu.
        </p>
        <p className="mt-4 text-body text-muted-foreground">
          Chỉ số <strong>dấu +n%</strong> là chiều cao dấu nhô thêm so với nguyên
          âm trần, đo thẳng trong file font (`ấ` so với `a`, tính theo % em). Nó
          quyết định <code className={styles.demoString}>line-height</code> cho
          tên hai dòng: số càng lớn thì dấu càng vươn lên và càng dễ chạm dòng
          trên khi để leading chặt.
        </p>
        {unusable.length > 0 && (
          <p className="mt-4 text-body text-muted-foreground">
            {unusable.length === 1 ? "Một font" : `${unusable.length} font`} trong
            kho <strong>không có bộ dấu tiếng Việt</strong> và được đánh dấu đỏ:{" "}
            {unusable.map((font) => font.label).join(", ")}. Ở những font đó trình
            duyệt rơi về font dự phòng tại đúng các chữ có dấu, nên một cái tên ra
            hai kiểu chữ — thấy rõ ngay trong thẻ bên dưới.
          </p>
        )}
      </header>

      {COUPLE_NAME_FONT_STYLES.map((style) => {
        const fonts = COUPLE_NAME_FONTS.filter((font) => font.style === style);
        if (fonts.length === 0) return null;
        return (
          <section key={style} className={styles.group}>
            <div className={styles.groupHeader}>
              <h2 className="text-h4">{GROUPS[style].title}</h2>
              <span className="text-small text-muted-foreground">
                {fonts.length} font
              </span>
            </div>
            <p className={`text-body ${styles.groupNote}`}>{GROUPS[style].note}</p>
            <div className={styles.grid}>
              {fonts.map((font) => (
                <FontCard key={font.id} font={font} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
