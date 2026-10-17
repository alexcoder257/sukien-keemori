import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { detailsColorStyle } from "@/components/invitation/shared/details-presets";
import { detailsTypography } from "@/components/invitation/shared/details-typography";
import { ClassicDetails } from "./classic-details";
import { FormalDetails } from "./formal-details";
import { ModernDetails } from "./modern-details";
import type { DetailsLayoutProps } from "./wedding-details.types";

const layouts = {
  classic: ClassicDetails,
  formal: FormalDetails,
  modern: ModernDetails,
};

/**
 * Chọn một bố cục và đặt nền chung cho nó: bảng màu, font, thang nhịp.
 * Cùng vai trò với `OpeningCover` bên màn mở thiệp.
 *
 * Thang nhịp đo theo **bề rộng tấm thiệp** (`cqi`), cùng đơn vị với thang chữ
 * `--tpl-*`. Dùng `rem` cố định thì khung preview hẹp trong editor giữ nguyên
 * khoảng trống của bản full-width và nội dung bị đẩy tràn.
 *
 * Có năm bậc chứ không phải một `gap` đều: nhịp đều làm mọi khối nặng ngang
 * nhau. Cặp tên → thứ bậc con phải sát nhau để đọc ra một cụm, còn giữa hai cụm
 * lớn thì phải rất thoáng.
 */
export function DetailsSurface(props: DetailsLayoutProps) {
  const { variant, data, colors, typography, classNames } = props;
  const Layout = layouts[variant];
  const fonts = detailsTypography(typography);

  return (
    <div
      data-details-part="surface"
      data-variant={variant}
      className={cn(
        "flex flex-col items-center text-center text-[var(--details-ink,currentColor)] [text-wrap:balance]",
        variant === "formal"
          ? "gap-[var(--details-space-lg)]"
          : "gap-[var(--details-space-md)]",
        fonts.className,
        classNames?.root,
      )}
      style={
        {
          ...detailsColorStyle(colors),
          ...fonts.style,
          "--details-space-2xs": "clamp(0.25rem, 0.8cqi, 0.4rem)",
          "--details-space-xs": "clamp(0.5rem, 1.6cqi, 0.75rem)",
          "--details-space-sm": "clamp(0.875rem, 3cqi, 1.25rem)",
          "--details-space-md": "clamp(1.5rem, 5cqi, 2.5rem)",
          "--details-space-lg": "clamp(2.25rem, 8cqi, 4rem)",
          /**
           * Độ dài tên **dài nhất trong hai người**, để cỡ chữ tự co. Lấy giá
           * trị lớn hơn chứ không tính riêng từng tên: hai tên phải cùng một cỡ,
           * nếu không thì "Anh" to gấp rưỡi "Nguyễn Thị Bích Phượng" và tấm
           * thiệp đọc ra như một người quan trọng hơn người kia.
           */
          "--details-name-length": Math.max(
            data.coupleNames[0].trim().length,
            data.coupleNames[1].trim().length,
          ),
        } as CSSProperties
      }
    >
      <Layout {...props} />
    </div>
  );
}
