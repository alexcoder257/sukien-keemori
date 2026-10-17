import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Nút, dải số liệu hoặc ghi chú đặt dưới phần chữ. */
  children?: ReactNode;
  className?: string;
};

/**
 * Đầu trang của các trang nội dung (hướng dẫn, công cụ). Giữ đúng nhịp
 * của `/mau-thiep` và `/bang-gia`: một dải nền `bg-card` có viền dưới, chữ giới
 * hạn trong cột hẹp để không bao giờ dài quá một dòng đọc.
 *
 * Server Component — không có tương tác nào ở đây.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: Props) {
  return (
    <section className={cn("border-b border-border bg-card", className)}>
      <div className="container-page py-16 lg:py-20">
        {eyebrow ? (
          <p className="flex items-center gap-3 text-eyebrow text-primary">
            <span aria-hidden className="h-px w-8 bg-primary/60" />
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-5 max-w-3xl font-editorial text-[clamp(2.15rem,4.2vw,3.5rem)] leading-[1.12] font-medium tracking-[-0.03em]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-5 max-w-2xl text-body-lg text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}
