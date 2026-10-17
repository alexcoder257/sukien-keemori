import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  WeddingDetails,
  DETAILS_VARIANTS,
  weddingDetailsData,
} from "@/components/invitation/shared/wedding-details";
import {
  DETAILS_FONT_COMBOS,
  type DetailsFontCombo,
} from "@/components/invitation/shared/details-typography";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { emptyInvitationContent } from "@/lib/data/invitations";
import { NO_INDEX } from "@/lib/seo";
import styles from "./details.module.css";

/**
 * Trang tham chiếu nội bộ: 3 bố cục × 4 combo font của `InvitationDetails`.
 * Cùng loại với `/design-system` nên nội dung đặt trực tiếp, không qua
 * dictionary — trừ chính khối đang xem, vốn phải chạy bằng chuỗi thật.
 */

export const metadata: Metadata = { robots: NO_INDEX };

const COMBOS = Object.keys(DETAILS_FONT_COMBOS) as DetailsFontCombo[];

/**
 * Dữ liệu mẫu: đủ dấu tiếng Việt khó, hai dòng nơi tổ chức, có ngày để ra ngày
 * âm. `emptyInvitationContent` là object dùng chung của cả app nên phải clone —
 * sửa tại chỗ là làm bẩn giá trị khởi tạo của editor.
 *
 * `long: true` là **ca thử độ dài**, không phải một biến thể trang trí: tên bố
 * mẹ bốn chữ có tiền tố "Ông"/"Bà" là chuỗi dài nhất khối này gặp trong thực
 * tế, và nó là thứ quyết định hai nhà còn đứng cạnh nhau được hay không.
 */
function sampleContent(long = false) {
  const content = structuredClone(emptyInvitationContent);
  content.couple.groomFullName = long ? "Nguyễn Tuấn Anh" : "Tuấn Anh";
  content.couple.brideFullName = long ? "Trần Như Bình" : "Như Bình";
  content.couple.groomChildOrder = "Trưởng nam";
  content.couple.brideChildOrder = "Út nữ";
  content.families.groomFather = long
    ? "Nguyễn Đình Hùng Vương"
    : "Nguyễn Hùng Vương";
  content.families.groomMother = long
    ? "Trần Thị Bích Phượng"
    : "Trần Thị Bích Phượng";
  content.families.groomAddress = "Quận 1, TP. Hồ Chí Minh";
  content.families.brideFather = long ? "Lưu Đăng Chí Hiếu" : "Lưu Chí Hiếu";
  content.families.brideMother = long
    ? "Nguyễn Thị Ngọc Ánh"
    : "Nguyễn Ngọc Ánh";
  content.families.brideAddress = "Quận 3, TP. Hồ Chí Minh";
  content.reception.date = "2026-10-25";
  content.reception.startTime = "17:30";
  content.reception.venueAddress =
    "The Opera Wedding & Convention Center\nLô 18A Lê Hồng Phong, Kiều Sơn, Hải An, Hải Phòng";
  content.reception.mapUrl = "https://maps.google.com/?q=Hai+Phong";
  return content;
}

export default async function DetailsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const content = sampleContent();
  const longContent = sampleContent(true);

  return (
    <div className={`container-page ${styles.page}`}>
      <header className={styles.intro}>
        <h1 className="text-h2">Khối thông tin lễ cưới</h1>
        <p className="mt-4 text-body-lg text-muted-foreground">
          Một component dùng chung, ba bố cục, bốn combo font. Mỗi cột là một bố
          cục; mỗi hàng là một combo. Bảng màu không phải prop — mỗi thẻ dưới đây
          chỉ đặt lại <code>--details-*</code>, đúng cách một mẫu thiệp sẽ làm.
        </p>
      </header>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h2 className="text-h4">Ca thử: tên bốn chữ</h2>
          <span className="text-small text-muted-foreground">
            &quot;Ông Nguyễn Đình Hùng Vương&quot; — chuỗi dài nhất khối này gặp
          </span>
        </div>
        <p className={`text-body ${styles.groupNote}`}>
          Hai nhà phải hoặc đứng cạnh nhau trọn vẹn, hoặc xuống hàng nguyên
          khối. Một cái tên bị bẻ đôi, hay một dòng chỉ có chữ
          &quot;Ông&quot;, đều là hỏng.
        </p>
        <div className={styles.row}>
          {DETAILS_VARIANTS.map((layout) => (
            <div key={layout} className={styles.cell}>
              <p className={styles.cellLabel}>{layout}</p>
              <div
                className={`${styles.canvas} ${styles[layout]} theme-invitation`}
              >
                <WeddingDetails
                  variant={layout}
                  data={weddingDetailsData(
                    longContent,
                    dict.invitation,
                    locale,
                    { variant: layout },
                  )}
                  typography={{ combo: "playfair-display" }}
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
              tên đặt bằng {DETAILS_FONT_COMBOS[combo].names}
            </span>
          </div>
          <div className={styles.row}>
            {DETAILS_VARIANTS.map((layout) => (
              <div key={layout} className={styles.cell}>
                <p className={styles.cellLabel}>{layout}</p>
                <div
                  className={`${styles.canvas} ${styles[layout]} theme-invitation`}
                >
                  <WeddingDetails
                    variant={layout}
                    data={weddingDetailsData(content, dict.invitation, locale, {
                      variant: layout,
                    })}
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
