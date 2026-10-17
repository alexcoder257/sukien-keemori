import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationAlbum } from "@/components/invitation/shared/invitation-album";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { NO_INDEX } from "@/lib/seo";
import styles from "./album.module.css";

export const metadata: Metadata = { robots: NO_INDEX };

// Ảnh cưới của website — kho mẫu đang trống nên không còn bộ ảnh mẫu nào.
const PHOTOS = [
  "/images/site/hero-wedding-1920.avif",
  "/images/site/hero-editorial.avif",
  "/images/site/hero-wedding-mobile.avif",
  "/images/site/hero-wedding-foliage.avif",
];

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const albumDict = dict.invitation.sections.album;

  return (
    <main className={`container-page ${styles.page}`}>
      <header className={styles.intro}>
        <h1 className="text-h2">Album ảnh cưới</h1>
        <p className="mt-4 text-body-lg text-muted-foreground">
          Bốn cách dàn cùng một bộ ảnh. Component chỉ bắt đầu từ vùng ảnh; tiêu
          đề, câu dẫn, câu chuyện và nền chương bên dưới là ví dụ của template
          bao ngoài, không thuộc API album.
        </p>
      </header>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <div>
            <p className={styles.code}>layout=&quot;filmstrip&quot;</p>
            <h2 className="text-h4">Dải phim có ảnh chính</h2>
          </div>
          <p className="text-small text-muted-foreground">
            tự chuyển · thumbnail · vuốt
          </p>
        </div>
        <div
          className={`${styles.canvas} ${styles.filmstrip} theme-invitation`}
        >
          <div className={styles.hostCopy}>
            <h3>Khoảnh khắc của chúng mình</h3>
            <p>Một dải ký ức được template đặt trước vùng ảnh.</p>
          </div>
          <InvitationAlbum
            photos={PHOTOS}
            dict={albumDict}
            layout="filmstrip"
            photoSizes="(max-width: 640px) 92vw, 580px"
          />
        </div>
      </section>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <div>
            <p className={styles.code}>layout=&quot;mosaic&quot;</p>
            <h2 className="text-h4">Mosaic kể chuyện</h2>
          </div>
          <p className="text-small text-muted-foreground">
            ảnh toàn hàng · cặp ảnh đồng chiều cao
          </p>
        </div>
        <div className={`${styles.canvas} ${styles.mosaic} theme-invitation`}>
          <div className={styles.hostCopy}>
            <h3>Golden hour of love</h3>
            <p>
              Những khoảnh khắc bình dị, những yêu thương thật gần. Và một lời
              hẹn cùng nhau đi qua năm tháng.
            </p>
          </div>
          <InvitationAlbum
            photos={PHOTOS}
            dict={albumDict}
            layout="mosaic"
          />
        </div>
      </section>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <div>
            <p className={styles.code}>layout=&quot;swiper&quot;</p>
            <h2 className="text-h4">Swiper có ảnh kế tiếp hé lộ</h2>
          </div>
          <p className="text-small text-muted-foreground">
            scroll snap · nút · bàn phím
          </p>
        </div>
        <div className={`${styles.canvas} ${styles.swiper} theme-invitation`}>
          <div className={styles.hostCopy}>
            <h3>Chạm vào từng kỷ niệm</h3>
            <p>Vuốt ngang hoặc dùng phím mũi tên để đổi ảnh.</p>
          </div>
          <InvitationAlbum
            photos={PHOTOS}
            dict={albumDict}
            layout="swiper"
          />
        </div>
      </section>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <div>
            <p className={styles.code}>layout=&quot;coverflow&quot;</p>
            <h2 className="text-h4">Coverflow ảnh giữa nổi bật</h2>
          </div>
          <p className="text-small text-muted-foreground">
            ảnh kề thu nhỏ · ảnh phẳng · nút tròn theo token
          </p>
        </div>
        <div
          className={`${styles.canvas} ${styles.coverflow} theme-invitation`}
        >
          <div className={styles.hostCopyAside}>
            <h3>Album ảnh cưới</h3>
            <p>Những khoảnh khắc chúng mình muốn giữ mãi.</p>
          </div>
          <InvitationAlbum
            photos={PHOTOS}
            dict={albumDict}
            layout="coverflow"
          />
        </div>
      </section>
    </main>
  );
}
