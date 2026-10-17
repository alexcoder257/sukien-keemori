"use client";

import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { atlasCell } from "@/lib/atlas";
import { cn } from "@/lib/utils";
import styles from "./template-media.module.css";
import { templatePosterSrc } from "@/lib/template-poster";

// Stable preview path (as stored in the DB) → versioned URL. Static imports get
// content-hashed URLs, so replacing a preview also changes its browser/CDN cache
// key. Empty while the catalog has no templates; add entries per new template.
const previewAssets: Record<string, string> = {};

/**
 * URL thật của ảnh preview (kèm hash/phiên bản). Nơi khác muốn **dùng lại đúng
 * bản đã nằm trong cache** của trình duyệt — dialog chi tiết mẫu — phải đi qua
 * hàm này, lệch một query string là tải lại cả ảnh.
 */
export function previewSrc(src: string) {
  return previewAssets[src] ?? src;
}

type Props = {
  /** Ảnh độc lập của mẫu. Nếu chưa có thì component dùng ô trong atlas cũ. */
  imageSrc?: string;
  /**
   * Ảnh bìa khai riêng. Bỏ trống thì suy từ `imageSrc` theo quy ước tên; ảnh
   * tải lên qua CMS không theo quy ước đó nên phải truyền vào đây.
   */
  posterSrc?: string | null;
  /** Toạ độ ô trong atlas, ví dụ `"100% 0%"`. */
  imagePosition: string;
  /** Để chuỗi rỗng khi ảnh chỉ là bản lặp lại của nội dung đã có ở nơi khác. */
  alt: string;
  sizes: string;
  /** Lớp phủ tối để chữ ivory đè lên ảnh vẫn đọc được. */
  scrim?: boolean;
  /** Cuộn ảnh chụp dài từ đầu xuống cuối khi card cha được hover. */
  panOnHover?: boolean;
  /** Chỉ nạp ảnh chụp dài khi card thật sự đang được hover. */
  previewActive?: boolean;
  /** Ảnh đầu tiên trong viewport là LCP, không để browser trì hoãn nó. */
  eager?: boolean;
  className?: string;
};

/**
 * Một nguồn ảnh preview dùng chung cho card kho mẫu và dải mẫu ở homepage.
 *
 * `imageSrc` là ảnh chụp toàn bộ chiều dài thiệp: lúc nghỉ khung nhìn nằm ở
 * đầu ảnh, hover card cha thì ảnh trượt dần xuống cuối. Nhờ cả hai trạng thái
 * dùng cùng một bitmap, preview không còn đổi tỷ lệ hoặc giật bố cục như lúc
 * thay thumbnail bằng iframe. Mẫu chưa có ảnh riêng tiếp tục dùng atlas tĩnh.
 *
 * Khung cha phải có `position: relative`, component tự phủ kín khung đó.
 */
export function TemplateMedia({
  imageSrc,
  posterSrc: explicitPosterSrc,
  imagePosition,
  alt,
  sizes,
  scrim = true,
  panOnHover = false,
  previewActive = panOnHover,
  eager = false,
  className,
}: Props) {
  const posterSrc =
    explicitPosterSrc || (templatePosterSrc(imageSrc) ?? imageSrc);
  // Ảnh card là `lazy`: trên mạng chậm khung ảnh đứng trống vài giây, và một
  // mảng tối phẳng thì đọc ra là card hỏng chứ không phải đang tải. Gỡ hẳn
  // skeleton khi ảnh về để animation không chạy mãi dưới ảnh.
  const [posterLoaded, setPosterLoaded] = useState(false);
  const onPosterLoad = () => setPosterLoaded(true);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Poster 960×1231 là đúng lát cắt của khung card. Ảnh chụp dài chỉ được
          gắn vào DOM cho card đang hover, tránh giải mã trước hàng trăm MB
          bitmap ở các card nằm ngoài viewport. */}
      <div
        className={cn(
          "absolute inset-0",
          imageSrc && panOnHover && styles.panFrame,
        )}
      >
        {imageSrc && posterSrc && !posterLoaded ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : null}
        {imageSrc && posterSrc ? (
          panOnHover ? (
            <>
              <Image
                src={previewSrc(posterSrc)}
                alt={alt}
                fill
                unoptimized
                loading={eager ? "eager" : "lazy"}
                fetchPriority={eager ? "high" : "auto"}
                sizes={sizes}
                className="object-cover object-top"
                onLoad={onPosterLoad}
              />
              {previewActive ? (
                <AnimatedPreview src={previewSrc(imageSrc)} sizes={sizes} />
              ) : null}
            </>
          ) : (
            <Image
              src={previewSrc(imageSrc)}
              alt={alt}
              fill
              unoptimized
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : "auto"}
              sizes={sizes}
              className="object-cover object-top"
              onLoad={onPosterLoad}
            />
          )
        ) : (
          <div style={atlasCell(imagePosition)}>
            <Image
              src="/images/site/template-atlas.avif"
              alt={alt}
              fill
              loading="lazy"
              sizes={sizes}
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Ảnh phủ kín khung nên chữ luôn nằm trên ảnh: scrim phải bật sẵn ở
          trạng thái nghỉ, không chỉ khi hover. */}
      {scrim ? (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-forest-ink/90 via-forest-ink/20 to-forest-ink/35",
            panOnHover && styles.panScrim,
          )}
        />
      ) : null}
    </div>
  );
}

function AnimatedPreview({ src, sizes }: { src: string; sizes: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={960}
      height={960}
      unoptimized
      loading="eager"
      fetchPriority="high"
      sizes={sizes}
      data-loaded={loaded}
      className={styles.panImage}
      onLoad={() => setLoaded(true)}
    />
  );
}
