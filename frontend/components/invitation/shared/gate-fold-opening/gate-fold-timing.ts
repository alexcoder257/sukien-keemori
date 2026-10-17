import type { CSSProperties } from "react";

/** One clock for the ribbon, four paper hinges and the final camera move. */
export const GATE_FOLD_OPENING = {
  ribbon: 2800,
  outerLeft: 2900,
  outerRight: 3400,
  innerLeft: 4350,
  innerRight: 4800,
  fold: 850,
  zoom: 5700,
  zoomDuration: 1300,
  duration: 7000,
} as const;

/**
 * Gắn lên gốc của mẫu: cả màn gói lẫn bìa bên trong (CSS Module của mẫu) đọc
 * cùng một nhịp từ đây.
 */
export const GATE_FOLD_OPENING_STYLE = Object.fromEntries(
  Object.entries(GATE_FOLD_OPENING).map(([key, value]) => [
    `--gate-opening-${key}`,
    `${value}ms`,
  ]),
) as CSSProperties;
