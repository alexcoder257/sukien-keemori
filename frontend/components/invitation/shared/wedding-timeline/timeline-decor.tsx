"use client";

import Image from "next/image";
import { Clock3 } from "lucide-react";
import { isValidElement, useState } from "react";
import { cn } from "@/lib/utils";
import type { TimelineDecor as Decor } from "@/components/invitation/shared/wedding-timeline/wedding-timeline.types";
import styles from "@/components/invitation/shared/wedding-timeline/wedding-timeline.module.css";

type ImageDecor = Extract<Decor, { kind: "image" }>;
function DecorImage({ decor }: { decor: ImageDecor }) {
  const [attempt, setAttempt] = useState(0);
  const sources = [
    decor.src.trim(),
    decor.fallbackSrc?.trim(),
    "/images/site/placeholder.avif",
  ].filter((src): src is string => Boolean(src));
  const src = sources[Math.min(attempt, sources.length - 1)];
  return (
    <Image
      src={src}
      data-timeline-fallback={src !== decor.src ? "image" : undefined}
      alt=""
      fill
      sizes="96px"
      loading="lazy"
      unoptimized={decor.unoptimized}
      style={{ objectFit: decor.fit ?? "contain" }}
      onError={() =>
        setAttempt((value) => Math.min(value + 1, sources.length - 1))
      }
    />
  );
}

export function TimelineDecor({
  decor,
  className,
}: {
  decor: Decor;
  className?: string;
}) {
  return (
    <span
      data-timeline-part="decor"
      aria-hidden="true"
      className={cn(styles.decor, className)}
    >
      {decor?.kind === "image" ? (
        <DecorImage
          key={`${decor.src}:${decor.fallbackSrc ?? ""}`}
          decor={decor}
        />
      ) : decor?.kind === "icon" && isValidElement(decor.node) ? (
        decor.node
      ) : (
        <Clock3 data-timeline-fallback />
      )}
    </span>
  );
}
