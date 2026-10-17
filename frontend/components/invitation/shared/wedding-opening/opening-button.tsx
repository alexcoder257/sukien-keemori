import { MoveUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeddingOpeningData } from "./wedding-opening.types";

type Props = {
  labels: WeddingOpeningData["labels"];
  isOpening: boolean;
  onOpen: () => void;
  className?: string;
};

export function OpeningButton({ labels, isOpening, onOpen, className }: Props) {
  return (
    <button
      type="button"
      data-opening-action
      data-opening-text="action"
      disabled={isOpening}
      onClick={onOpen}
      className={cn(
        "relative z-4 inline-flex min-h-12 max-w-full cursor-pointer items-center justify-center gap-5 rounded-full border border-[var(--opening-seal)] bg-[var(--opening-seal)] px-6 py-3 text-(length:--tpl-small) text-[var(--opening-on-seal)]",
        "[font-family:var(--opening-font-action,var(--template-font-body,Georgia,serif))] transition-[box-shadow,filter] duration-180 hover:shadow-[0_5px_20px_var(--opening-shadow)] hover:brightness-108 focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[var(--opening-ink)] disabled:cursor-default motion-reduce:transition-none",
        className,
      )}
    >
      <span>{isOpening ? labels.opening : labels.open}</span>
      <MoveUpRight className="shrink-0" size={18} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
