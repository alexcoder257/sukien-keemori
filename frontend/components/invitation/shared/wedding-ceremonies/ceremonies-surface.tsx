import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { ceremoniesColorStyle } from "@/components/invitation/shared/ceremonies-presets";
import { ceremoniesTypography } from "@/components/invitation/shared/ceremonies-typography";
import { CeremoniesTitle } from "./ceremony-item";
import { StackCeremonies } from "./stack-ceremonies";
import { TimelineCeremonies } from "./timeline-ceremonies";
import { CardCeremonies } from "./card-ceremonies";
import type { CeremoniesLayoutProps } from "./wedding-ceremonies.types";

const layouts = {
  stack: StackCeremonies,
  timeline: TimelineCeremonies,
  card: CardCeremonies,
};

/**
 * Chọn một bố cục và đặt nền chung cho nó: bảng màu, font, thang nhịp.
 * Cùng vai trò với `DetailsSurface`.
 *
 * Thang nhịp đo theo **bề rộng tấm thiệp** (`cqi`), cùng đơn vị với thang chữ
 * `--tpl-*` — dùng `rem` cố định thì khung preview hẹp trong editor giữ nguyên
 * khoảng trống của bản full-width và nội dung bị đẩy tràn.
 */
export function CeremoniesSurface(props: CeremoniesLayoutProps) {
  const { variant, data, colors, typography, classNames } = props;
  const Layout = layouts[variant];
  const fonts = ceremoniesTypography(typography);

  return (
    <div
      data-ceremony-part="surface"
      data-variant={variant}
      className={cn(
        "grid gap-[var(--ceremony-space-lg)] text-center text-[var(--ceremony-ink,currentColor)] [text-wrap:pretty]",
        fonts.className,
        classNames?.root,
      )}
      style={
        {
          ...ceremoniesColorStyle(colors),
          ...fonts.style,
          "--ceremony-space-2xs": "clamp(0.25rem, 0.8cqi, 0.4rem)",
          "--ceremony-space-xs": "clamp(0.5rem, 1.6cqi, 0.75rem)",
          "--ceremony-space-sm": "clamp(0.875rem, 3cqi, 1.25rem)",
          "--ceremony-space-md": "clamp(1.5rem, 5cqi, 2.5rem)",
          "--ceremony-space-lg": "clamp(2.25rem, 8cqi, 4rem)",
        } as CSSProperties
      }
    >
      {data.title ? (
        <CeremoniesTitle className={classNames?.title}>
          {data.title}
        </CeremoniesTitle>
      ) : null}
      <Layout {...props} />
    </div>
  );
}
