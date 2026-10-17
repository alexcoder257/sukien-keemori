import { ShieldCheck } from "lucide-react";
import { playfairDisplay } from "@/assets/fonts";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { SignInForm } from "./sign-in-form";
import styles from "./sign-in-page.module.css";

type Props = {
  dict: Dictionary["auth"];
  locale: Locale;
  /** Trang định mở trước khi bị đưa về đăng nhập; `/api/auth/login` lọc lại. */
  next: string | null;
  /** Lời nhắn sau một lần đăng xuất có lý do (`?notice=`), vd. vừa đổi mật khẩu. */
  notice: string | null;
};

type NoticeKey = keyof Dictionary["auth"]["notices"];

function isNoticeKey(
  notices: Dictionary["auth"]["notices"],
  value: string | null,
): value is NoticeKey {
  return !!value && Object.prototype.hasOwnProperty.call(notices, value);
}

/**
 * Cửa vào CMS, mang diện mạo thương hiệu Keemori (xem CSS Module đi kèm).
 *
 * Khung là Server Component; chỉ form là client. Logo lấy qua rewrite
 * `/images/*` sang trang khách, không chép tệp sang repo này. Cố ý không có
 * ảnh minh hoạ: đây là cửa vào công cụ nội bộ, không phải trang marketing.
 */
export function SignInPanel({ dict, locale, next, notice }: Props) {
  const t = dict.login;

  return (
    <main className={`${styles.root} ${playfairDisplay.variable}`}>
      <section className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh đi qua rewrite sang trang khách, không qua bộ tối ưu ảnh của app này */}
        <img
          src="/images/site/brand/logo-stacked-gold.png"
          alt="Keemori"
          width={800}
          height={960}
          className={styles.logo}
        />
        <p className={styles.eyebrow}>{t.eyebrow}</p>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>

        {isNoticeKey(dict.notices, notice) ? (
          <p role="status" className={styles.notice}>
            {dict.notices[notice]}
          </p>
        ) : null}

        <SignInForm dict={dict} locale={locale} next={next} />

        <p className={styles.note}>
          <ShieldCheck aria-hidden size={16} />
          {t.securityNote}
        </p>
      </section>
    </main>
  );
}
