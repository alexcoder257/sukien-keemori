import type { ReactNode } from "react";
import { Diamond, Flower2, Heart, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpeningMotif } from "@/components/invitation/shared/opening-presets";

type MotifProps = { motif?: OpeningMotif; custom?: ReactNode };

function OpeningMotifIcon({ motif = "none", custom }: MotifProps) {
  if (custom !== undefined) return custom;
  if (motif === "none") return null;
  if (motif === "double-happiness") return <>囍</>;
  const Icon = { flower: Flower2, sprig: Sprout, heart: Heart, diamond: Diamond }[motif];
  return <Icon className="block" size="1em" strokeWidth={1} aria-hidden="true" />;
}

function isVisible({ motif, custom }: MotifProps) {
  return custom !== undefined ? custom !== null && custom !== false : motif !== "none";
}

export function OpeningAmbient({ motif = "diamond", custom }: MotifProps) {
  return (
    <div
      data-opening-part="ambient"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-1 overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_srgb,var(--opening-accent)_12%,transparent),transparent_65%)]"
    >
      {isVisible({ motif, custom }) &&
        ["top-[22%] left-[8%]", "top-[71%] right-[7%]", "bottom-[10%] left-[18%]"].map(
          (position) => (
            <span
              key={position}
              data-opening-motif="ambient"
              data-motif={custom === undefined ? motif : "custom"}
              className={cn(
                "absolute text-[var(--opening-accent)] opacity-50",
                motif === "diamond" && custom === undefined
                  ? "size-2 text-[8px]"
                  : "size-3 text-[12px]",
                position,
              )}
            >
              <OpeningMotifIcon motif={motif} custom={custom} />
            </span>
          ),
        )}
    </div>
  );
}

export function OpeningCorners({
  motif = "double-happiness",
  custom,
  hideStart = false,
  hideEnd = false,
}: MotifProps & { hideStart?: boolean; hideEnd?: boolean }) {
  if (!isVisible({ motif, custom })) return null;
  return (
    <>
      {[
        { position: "top-0 -left-7", hidden: hideStart },
        { position: "right-[-28px] bottom-[18px]", hidden: hideEnd },
      ].map(
        ({ position, hidden }) =>
          !hidden && (
            <div
              key={position}
              data-opening-motif="corner"
              data-motif={custom === undefined ? motif : "custom"}
              aria-hidden="true"
              className={cn(
                "absolute -z-1 -rotate-18 text-(length:--tpl-ornament) leading-none text-[var(--opening-accent)] opacity-12 [&_svg]:block",
                position,
              )}
            >
              <OpeningMotifIcon motif={motif} custom={custom} />
            </div>
          ),
      )}
    </>
  );
}

export function OpeningDivider({ motif = "none", custom }: MotifProps) {
  if (!isVisible({ motif, custom })) return null;
  return (
    <div
      data-opening-motif="divider"
      data-motif={custom === undefined ? motif : "custom"}
      aria-hidden="true"
      className="flex items-center justify-center gap-3.5 text-[18px] text-[var(--opening-accent)]"
    >
      <span className="h-px w-[42px] bg-current" />
      <OpeningMotifIcon motif={motif} custom={custom} />
      <span className="h-px w-[42px] bg-current" />
    </div>
  );
}
