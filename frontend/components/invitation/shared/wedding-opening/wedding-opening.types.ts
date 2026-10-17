import type { ReactNode } from "react";
import type {
  OpeningDecor,
  OpeningPalette,
  OpeningVariant,
} from "@/components/invitation/shared/opening-presets";
import type { OpeningTypography } from "@/components/invitation/shared/opening-typography";

export type OpeningPhase = "closed" | "opening" | "open";
export type WeddingOpeningMotion = "fade" | "paper-lift" | "paper-bloom";
export type WeddingOpeningData = {
  coupleNames: [string, string];
  dateLabel: string;
  monogram?: string;
  /**
   * Nhãn khối lời mời riêng khi mở bằng link mời riêng, `null` với link chung.
   * Khác `null` thì khối "Trân trọng kính mời: <tên>" hiện trên tên cô dâu chú
   * rể và `labels.invitation` ẩn đi. `WeddingOpening` tự điền từ context, mẫu
   * không phải truyền.
   */
  guestGreeting?: string | null;
  labels: {
    invitation: string;
    open: string;
    opening: string;
    save: string;
    theDate: string;
  };
};

/** Optional Tailwind overrides for visible parts; autocomplete lists the slots. */
export type OpeningClassNames = Partial<
  Record<
    | "scene"
    | "paper"
    | "names"
    | "invitation"
    | "date"
    | "envelope"
    | "seal"
    /** Khung định vị con dấu trên phong bì (top/left/translate). */
    | "sealSlot"
    | "action",
    string
  >
>;

export type OpeningDesignProps = {
  variant: OpeningVariant;
  data: WeddingOpeningData;
  colors?: Partial<OpeningPalette>;
  typography?: OpeningTypography;
  decor?: Partial<OpeningDecor>;
  /** undefined uses the preset, null hides the slot, ReactNode replaces it. */
  customDecor?: Partial<Record<keyof OpeningDecor | "flowersLeft" | "flowersRight" | "seal" | "envelope" | "ribbon", ReactNode>>;
  classNames?: OpeningClassNames;
};

export type WeddingOpeningProps = OpeningDesignProps & {
  enabled: boolean;
  /** Keep scrolling and height inside a preview frame. */
  contained?: boolean;
  /** Default 1100ms; reduced motion is capped at 160ms. */
  durationMs?: number;
  /** Omit to use the variant's default transition. */
  motion?: WeddingOpeningMotion;
  coverClassName?: string;
  contentClassName?: string;
  /** Floating controls outside the animated content, e.g. music. */
  renderOutside?: (state: { opened: boolean }) => ReactNode;
  children: ReactNode;
};

/** Internal contract shared by the three concept layouts. */
export type OpeningLayoutProps = OpeningDesignProps & {
  isOpening: boolean;
  onOpen: () => void;
};
