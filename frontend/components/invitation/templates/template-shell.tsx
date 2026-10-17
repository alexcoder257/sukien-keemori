"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/invitation/shared/reveal";

/**
 * CSS Module của mẫu, truyền nguyên vào primitive.
 *
 * Không khai được kiểu chặt hơn: Next gõ `*.module.css` là index signature, mà
 * index signature không gán được vào type có key bắt buộc (TS2739). Vì vậy hợp
 * đồng class dưới đây do `scripts/check-templates.mjs` kiểm, không phải
 * TypeScript — nó quét CSS Module của từng mẫu và báo lỗi nếu thiếu class.
 *
 * Class bắt buộc khi dùng `TemplateSection`:
 *   .section .sectionInner .sectionHeader .sectionLead .reveal
 * Class bắt buộc khi dùng `TemplateDecor`:
 *   .decor
 */
export type TemplateStyles = Readonly<Record<string, string>>;

/**
 * Hoạ tiết trang trí: luôn `aria-hidden` và không nhận chuột — chúng không mang
 * thông tin nào của thiệp, chỉ dựng không khí cho từng màn.
 *
 * `sizes` không có mặc định chung: mỗi mẫu treo hoạ tiết ở bề rộng rất khác
 * nhau (mẫu này 50vw, mẫu kia 70vw), đặt một con số chung sẽ khiến mẫu này tải
 * ảnh thừa còn mẫu kia tải ảnh vỡ.
 */
export function TemplateDecor({
  styles,
  src,
  className = "",
  sizes,
  priority = false,
  openingMotion = false,
  openingBurstOrigin = false,
}: {
  styles: TemplateStyles;
  src: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  /** Cho preset màn mở điều khiển decor mà không biết class của từng mẫu. */
  openingMotion?: boolean;
  /** Lấy tâm decor làm điểm phát của burst thay cho tâm CTA. */
  openingBurstOrigin?: boolean;
}) {
  return (
    <div
      className={`${styles.decor} ${className}`}
      data-opening-decor={openingMotion ? "" : undefined}
      data-opening-burst-origin={openingBurstOrigin ? "" : undefined}
      aria-hidden
    >
      <Image src={src} alt="" fill sizes={sizes} priority={priority} />
    </div>
  );
}

/**
 * Khung một mục của thiệp: nền + hoạ tiết neo theo mép, bên trong là cụm tiêu
 * đề và nội dung, cả hai bọc `Reveal` để hiện dần khi cuộn tới.
 *
 * Bốn mẫu đầu tiên đều tự viết lại component này và ra kết quả gần như trùng
 * khít, có hai mẫu giống nhau từng ký tự. Phần **thật sự** khác
 * nhau giữa các mẫu chỉ có ba thứ, và cả ba đều là tham số ở đây: chữ trong
 * `eyebrow` (mẫu báo cưới dùng số trang thay cho một cụm mô tả), hình `divider`
 * (nhành hoa / đường kẻ / sao) và `decoration` treo ở mép.
 *
 * Hoạ tiết `decoration` neo vào chính `<section>` chứ không vào khối nội dung:
 * chúng chạy ra sát mép giấy, mà `.sectionInner` thì bị giới hạn bề rộng.
 */
export function TemplateSection({
  styles,
  id,
  eyebrow,
  eyebrowClassName,
  title,
  lead,
  divider,
  decoration,
  className = "",
  children,
}: {
  styles: TemplateStyles;
  /** Đích của liên kết trong mẫu — vd mục lục trang nhất của mẫu báo cưới. */
  id?: string;
  /** Cụm chữ nhỏ trên tiêu đề, hoặc số trang ở mẫu báo cưới. */
  eyebrow?: string;
  /** Mặc định `.kicker`; mẫu nào gọi tên khác thì truyền class của mình. */
  eyebrowClassName?: string;
  title?: ReactNode;
  lead?: string;
  /** Dấu ngắt giữa tiêu đề và phần dẫn — hình riêng của từng mẫu. */
  divider?: ReactNode;
  /** Hoạ tiết neo theo mép section. */
  decoration?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`${styles.section} ${className}`}
      // Móc để `globals.css` với tới lề đọc của mọi mẫu bằng MỘT chỗ. Class
      // `.section` của CSS Module bị băm tên nên global không gọi được, còn
      // sửa tay 49 CSS Module thì đúng cái bẫy mà thang `--tpl-*` đã tránh.
      data-template-section
    >
      {decoration}
      <div className={styles.sectionInner} data-template-section-inner>
        {eyebrow || title ? (
          <Reveal className={styles.reveal}>
            <header className={styles.sectionHeader}>
              {eyebrow ? (
                <p className={eyebrowClassName ?? styles.kicker}>{eyebrow}</p>
              ) : null}
              {title ? (typeof title === "string" ? <h2>{title}</h2> : title) : null}
              {divider}
              {lead ? <p className={styles.sectionLead}>{lead}</p> : null}
            </header>
          </Reveal>
        ) : null}
        <Reveal className={styles.reveal} delay={80}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}
