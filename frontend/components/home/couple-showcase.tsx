import { CoupleSlider } from "@/components/home/story/couple-slider";
import { EditorialBlock } from "@/components/home/story/editorial-block";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { CoupleShowcase as Couple } from "@/lib/data/home";

type Props = {
  couples: Couple[];
  dict: Dictionary["home"]["couples"];
  locale: Locale;
};

/**
 * Chương 4 — thiệp thật đã được gửi đi, dựng thành slider lật theo trang.
 *
 * Chương này đã thử hai bản **chạy liên tục** (dải ngang, rồi tường ba cột trôi
 * dọc); cả hai đều làm cả trang khựng vì một vòng lặp không bao giờ dừng buộc
 * trình duyệt raster lại lớp ảnh thiệp ở mọi khung hình. Đứng yên cho tới khi
 * người xem lật vừa hết hẳn khoản đó, vừa không trùng cảm giác với dải tự chạy
 * ở chương 2 (xem `CoupleSlider`).
 */
export function CoupleShowcase({ couples, dict, locale }: Props) {
  // CMS chưa có ô nào thì bỏ hẳn khối, không vẽ một tiêu đề trên dải trống.
  if (couples.length === 0) return null;

  return (
    <div className="pt-10 pb-section">
      <div className="container-page">
        <EditorialBlock title={dict.title} body={<p>{dict.subtitle}</p>} />
      </div>

      <CoupleSlider couples={couples} dict={dict} locale={locale} />
    </div>
  );
}
