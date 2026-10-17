"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  OPENING_ARTWORK,
  OPENING_IMAGE_QUALITY,
  openingImageWidth,
} from "@/constants/opening-artwork";
import type { OpeningArtworkName } from "@/constants/opening-artwork";
import { cn } from "@/lib/utils";

/**
 * Request >= 1.5 × the actual painted frame, including scaled gallery previews.
 * Pin the loader to this width: DPR must not multiply the 1.5 budget again.
 * Reserve geometry on the server, then select the source on ResizeObserver's
 * first measurement. Resizing updates it; animation doesn't trigger new loads.
 */
export function OpeningArtwork({
  asset,
  tone,
  className = "",
}: {
  asset: OpeningArtworkName;
  tone: "paper" | "seal" | "botanical" | "natural";
  className?: string;
}) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const dimensions = OPENING_ARTWORK[asset];
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(() => {
      const measured = frame.getBoundingClientRect().width;
      if (measured > 0) setWidth(openingImageWidth(measured));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  const isGenerated = asset.endsWith("-generated");
  const extension = isGenerated ? "webp" : "avif";
  const version = isGenerated ? "20260911-2" : "20260909-2";
  const src = `/images/shared/opening/${asset}.${extension}?v=${version}`;
  const optimized =
    width === null
      ? undefined
      : isGenerated
        ? src
        : `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${OPENING_IMAGE_QUALITY}`;
  return (
    <span
      ref={frameRef}
      className={cn("pointer-events-none relative isolate block min-h-0 min-w-0 w-full", className)}
      data-artwork={asset}
      data-tone={tone}
      aria-hidden="true"
      style={
        {
          aspectRatio: `${dimensions.width} / ${dimensions.height}`,
          "--artwork-source": optimized ? `url("${optimized}")` : "none",
        } as CSSProperties
      }
    >
      {optimized && (
        <Image
          className={cn(
            "absolute inset-0 block h-full w-full object-fill",
            tone === "paper" && "grayscale",
            tone === "seal" && "[filter:grayscale(1)_contrast(1.4)_brightness(1.15)]",
          )}
          src={src}
          alt=""
          width={dimensions.width}
          height={dimensions.height}
          quality={OPENING_IMAGE_QUALITY}
          loader={isGenerated ? undefined : () => optimized}
          unoptimized={isGenerated}
          loading="eager"
          draggable={false}
        />
      )}
      <span
        className={cn(
          "absolute inset-0 [mask:var(--artwork-source)_center/100%_100%_no-repeat]",
          tone === "paper" && "bg-[var(--opening-paper)] mix-blend-multiply",
          tone === "seal" && "bg-[var(--opening-seal)] mix-blend-multiply",
          tone === "botanical" && "bg-[var(--opening-botanical)] mix-blend-hue",
        )}
      />
    </span>
  );
}
