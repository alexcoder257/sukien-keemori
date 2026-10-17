import Image from "next/image";
import { BrandWordmark } from "@/components/shared/brand-logo";
import {
  InvitationCard,
  type InvitationCardData,
} from "@/components/home/reveal/invitation-card";
import { HERO_PORTRAIT } from "@/components/home/reveal/portrait";
import { BRAND_TAGLINE } from "@/constants/brand";
import styles from "./reveal-loader.module.css";

type Props = {
  /** Nội dung tấm thiệp — đúng tấm thiệp sẽ đậu lại ở hero. */
  card: InvitationCardData;
};

/**
 * Màn mở đầu "The Invitation Reveal": mở một phong bì thật.
 *
 * Server Component — không có logic, chỉ là các lớp hình mà `HeroStage` điều
 * khiển qua `data-loader-*`. Toàn bộ lớp này là trang trí: `aria-hidden` +
 * `inert` giữ nó ngoài cây trợ năng và ngoài thứ tự tab, nên bàn phím không
 * bao giờ bị kẹt trong lúc animation chạy, còn nội dung thật của trang vẫn
 * nguyên vẹn với screen reader.
 */
export function RevealLoader({ card }: Props) {
  return (
    <div data-reveal-loader className={styles.loader} aria-hidden inert>
      <div data-loader-backdrop className={styles.backdrop}>
        <div className={styles.paperTexture} />
      </div>

      <div data-loader-brand className={styles.brandSignature}>
        <BrandWordmark
          surface="dark"
          className={styles.loaderWordmark}
          sizes="280px"
          priority
        />
        <p data-loader-tagline className={styles.tagline}>
          {BRAND_TAGLINE}
        </p>
      </div>

      <div data-loader-halo className={styles.stageHalo} />
      <div data-loader-stage className={styles.stage}>
        <Image
          src="/images/site/phong-bi-km.avif"
          alt=""
          width={1468}
          height={860}
          sizes="(max-width: 640px) 88vw, 420px"
          loading="eager"
          fetchPriority="high"
          unoptimized
          className={styles.envelopePreload}
        />
        <div data-loader-env-inside className={styles.envInside} />

        <div className={styles.cardClip}>
          <div data-loader-card className={styles.cardSlot}>
            <InvitationCard data={card} />

            {/* Khung 3: thân tấm thiệp hé bức ảnh sự kiện trước khi hero thật
                xuất hiện ngay bên dưới lớp nền đang tan. */}
            <div data-loader-window className={styles.window}>
              <Image
                src={HERO_PORTRAIT.src}
                alt=""
                fill
                sizes="40vw"
                loading="eager"
                fetchPriority="high"
                className={`${styles.windowImage} object-[58%_34%]`}
              />
            </div>
          </div>
        </div>

        <div data-loader-env-front className={styles.envFront} />

        <div data-loader-flap className={styles.envFlap}>
          <div className={styles.envFlapBack} />
        </div>

        <div data-loader-seal className={styles.seal}>
          <Image
            src="/images/site/dau-sap-km.avif"
            alt=""
            width={512}
            height={512}
            sizes="125px"
            loading="eager"
            fetchPriority="high"
            unoptimized
            className={styles.sealImage}
          />
        </div>
      </div>
    </div>
  );
}
