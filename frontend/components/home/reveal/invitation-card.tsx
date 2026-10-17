import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import styles from "./invitation-card.module.css";

export type InvitationCardData = {
  /** Lời mời ngắn phía trên tên, ví dụ "Trân trọng kính mời". */
  greeting: string;
  title: string;
  occasion: string;
  /** Ngày sự kiện đã định dạng sẵn cho mặt thiệp. */
  date: string;
  venue: string;
};

type Props = {
  data: InvitationCardData;
  className?: string;
};

/**
 * Tấm thiệp sự kiện — vật thể ký hiệu của cảnh mở đầu: nó bay vào từ giữa màn
 * hình khi hai cánh giấy mở ra, đậu lại ở hero, rồi hé mở khi người xem cuộn.
 *
 * Server Component: toàn bộ nội dung nằm trong HTML đầu tiên. Mọi chuyển động
 * do `HeroStage` điều khiển từ ngoài qua các `data-*` bên dưới, nên component
 * này không cần biết gì về GSAP.
 */
export function InvitationCard({ data, className }: Props) {
  return (
    <article
      data-reveal-card
      className={cn(styles.card, className)}
      aria-label={`${data.occasion}: ${data.title} — ${data.date}`}
    >
      <div aria-hidden className={styles.thickness} />
      <div aria-hidden className={styles.inner} />
      <div aria-hidden className={styles.frame} />

      <div className={styles.body}>
        {/* Không dùng thẻ heading: mặt thiệp là ảnh minh hoạ sản phẩm, chen h2
            vào đây sẽ phá cấp tiêu đề của hero (h1 là headline bên trái). */}
        <p className={styles.greeting}>{data.greeting}</p>
        <p className={styles.occasion}>{data.occasion}</p>
        <p className={styles.names}>{data.title}</p>

        <span aria-hidden className={styles.rule} />
        <p className={styles.date}>{data.date}</p>
        <p className={styles.venue}>{data.venue}</p>
      </div>

      {/* Nắp gấp: nằm phẳng ở hero, lật lên theo tiến độ cuộn. */}
      <div data-reveal-card-flap className={styles.flap}>
        <BrandLogo
          alt=""
          surface="light"
          variant="stacked"
          className={styles.brandLogo}
          sizes="180px"
        />
      </div>

      <div aria-hidden className={styles.grain} />
      <div aria-hidden className={styles.foil} />
    </article>
  );
}
