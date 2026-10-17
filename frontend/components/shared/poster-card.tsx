"use client";

import { useState, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TemplateMedia } from "@/components/template/template-media";
import type { Tier } from "@/constants/invitation";
import { cn } from "@/lib/utils";
import styles from "./poster-card.module.css";

type Media = {
  imageSrc?: string;
  posterSrc?: string | null;
  imagePosition: string;
  alt: string;
  sizes: string;
  eager?: boolean;
};

type Props = {
  /**
   * `bare`: không nền, viền mảnh quanh ảnh (dải mẫu nổi bật, cặp đôi).
   * `surface`: card có nền nhuộm theo gói và phần chữ có đệm (kho mẫu).
   */
  variant?: "bare" | "surface";
  /** Chỉ `surface` dùng: nhuộm nền card theo gói dịch vụ. */
  tier?: Tier;
  media: Media;
  /** Nhãn, nút nổi… đặt tuyệt đối lên khung ảnh. */
  overlay?: ReactNode;
  title: ReactNode;
  titleAs?: "h3" | "p";
  /** Thay cỡ chữ mặc định của tên (`text-body-lg leading-snug`). */
  titleClassName?: string;
  meta?: ReactNode;
  /** Hàng phụ dưới meta, ví dụ điểm đánh giá. */
  extra?: ReactNode;
  /** Góc phải của phần chữ. Mặc định là mũi tên hiện khi hover. */
  trailing?: ReactNode;
  /** Chỉnh khoảng cách giữa ảnh và phần chữ của biến thể `bare`. */
  footerClassName?: string;
  cursor?: "media" | "card";
  cursorLabel?: string;
  /**
   * `href`: cả card là một link. `render`: lớp phủ bấm được (mở dialog…), nhận
   * hàm tắt preview để ảnh chụp dài không tiếp tục chạy sau khi đã mở.
   */
  action:
    | { href: string }
    | { render: (resetPreview: () => void) => ReactNode };
};

/**
 * Khung poster dùng chung cho mọi card thiệp: kho mẫu, dải mẫu nổi bật và
 * thiệp của các cặp đôi ở trang chủ.
 *
 * Card **không tự quyết bề rộng** — `<li>` hay ô grid của từng section giữ
 * quyền đó, chiều cao suy ra từ khung `aspect-[0.78]` (đúng khổ `poster.avif`
 * 960×1231). Nhờ vậy mỗi section giữ nguyên nhịp lưới của mình.
 *
 * Ảnh chụp dài chỉ được gắn vào DOM khi con trỏ chuột thật sự vào card: dải
 * lặp vô tận nhân đôi số card, giải mã sẵn hết là hàng trăm MB bitmap.
 */
export function PosterCard({
  variant = "bare",
  tier,
  media,
  overlay,
  title,
  titleAs: Title = "h3",
  titleClassName = "text-body-lg leading-snug",
  meta,
  extra,
  trailing,
  footerClassName,
  cursor = "media",
  cursorLabel,
  action,
}: Props) {
  const [previewActive, setPreviewActive] = useState(false);
  const surface = variant === "surface";

  const rootProps = {
    "data-cursor": cursor,
    "data-cursor-label": cursorLabel,
    "data-tier": surface ? tier : undefined,
    className: cn(
      "group relative",
      surface
        ? cn(
            styles.card,
            "flex flex-col overflow-hidden transition duration-300",
          )
        : "block",
    ),
    onPointerEnter: (event: PointerEvent) => {
      if (
        event.pointerType === "mouse" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setPreviewActive(true);
      }
    },
    onPointerLeave: () => setPreviewActive(false),
  };

  const text = (
    <div
      className={cn(
        "flex items-start justify-between gap-3",
        // Kho mẫu hai cột trên điện thoại: tên và badge gói không đủ chỗ đứng
        // cạnh nhau, nên badge xuống dòng.
        surface && "max-mobile:flex-col max-mobile:gap-1.5",
      )}
    >
      <div className={cn("min-w-0 space-y-1", surface && "max-mobile:space-y-0.5")}>
        <Title className={cn("font-heading font-medium", titleClassName)}>
          {title}
        </Title>
        {meta ? (
          <p className="text-caption text-muted-foreground">{meta}</p>
        ) : null}
        {extra}
      </div>
      {trailing ?? (
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 translate-y-1 text-primary opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        />
      )}
    </div>
  );

  const content = (
    <>
      <div
        className={cn(
          "relative aspect-[0.78] overflow-hidden",
          // `surface` không kẻ viền quanh ảnh: mép ảnh đã là ranh giới với nền
          // card, viền của card vẽ bằng inset shadow trong CSS Module.
          !surface &&
            "border border-foreground/10 transition-colors duration-300 group-hover:border-primary/40",
        )}
      >
        <TemplateMedia
          imageSrc={media.imageSrc}
          posterSrc={media.posterSrc}
          imagePosition={media.imagePosition}
          alt={media.alt}
          sizes={media.sizes}
          eager={media.eager}
          scrim={false}
          panOnHover
          previewActive={previewActive}
        />
        {overlay}
      </div>

      {surface ? (
        <div className="flex flex-1 flex-col gap-4 p-5 max-mobile:px-2.5 max-mobile:py-2 sm:p-6">{text}</div>
      ) : (
        <div className={cn("mt-4", footerClassName)}>{text}</div>
      )}

      {/* Lớp phủ nằm cuối để đè hết cả ảnh lẫn phần chữ. */}
      {"render" in action
        ? action.render(() => setPreviewActive(false))
        : null}
    </>
  );

  if ("href" in action) {
    return (
      <Link href={action.href} {...rootProps}>
        {content}
      </Link>
    );
  }

  return <article {...rootProps}>{content}</article>;
}
