import type { CSSProperties, ReactNode } from "react";

import { InvitationPhotoLoading } from "@/components/invitation/shared/invitation-photo-loading";
import {
  cormorant,
  cormorantSc,
  greatVibes,
  inter,
  playfairDisplay,
} from "@/assets/fonts";

type TemplateFontProperties = CSSProperties & {
  "--template-font-accent": string;
  "--template-font-display": string;
  "--template-font-body": string;
  "--template-font-script"?: string;
  "--template-font-ornament"?: string;
  "--template-font-numerals"?: string;
};

type TemplateTypographyDefinition = {
  /** Tên combo để kiểm tra nhanh trên DOM và dùng lại ở trang giới thiệu mẫu. */
  label: string;
  /** Các class `next/font` cung cấp biến font self-host cho đúng template. */
  variables: string;
  fonts: TemplateFontProperties;
};

const interFamily = "var(--font-inter), ui-sans-serif, system-ui, sans-serif";

const defaultTypography: TemplateTypographyDefinition = {
  label: "Inter",
  variables: inter.variable,
  fonts: {
    "--template-font-accent": interFamily,
    "--template-font-display": interFamily,
    "--template-font-body": interFamily,
  },
};

/**
 * Registry typography theo mẫu. Mỗi combo chỉ khai báo font thật một lần rồi
 * ánh xạ vào ba vai trò ổn định; CSS của template không được biết tên font cụ
 * thể. Thêm mẫu mới chỉ cần thêm một entry và dùng ba token `--template-font-*`.
 */
export const TEMPLATE_TYPOGRAPHY: Record<
  string,
  TemplateTypographyDefinition
> = {
  "burgundy-birthday": {
    label: "Playfair Display / Cormorant / Great Vibes",
    // `cormorantSc` chỉ cho lời chào trên màn giấy gấp cổng (chép từ Đỏ
    // Burgundy) — xem `.opening` trong CSS Module của mẫu.
    variables: `${playfairDisplay.variable} ${cormorant.variable} ${cormorantSc.variable} ${greatVibes.variable}`,
    fonts: {
      "--template-font-accent": "var(--font-cormorant), Georgia, serif",
      "--template-font-display": "var(--font-playfair), Georgia, serif",
      "--template-font-body": "var(--font-cormorant), Georgia, serif",
      "--template-font-script": "var(--font-great-vibes), cursive",
    },
  },
};

export function TemplateTypography({
  templateSlug,
  children,
}: {
  templateSlug?: string;
  children: ReactNode;
}) {
  const typography =
    (templateSlug && TEMPLATE_TYPOGRAPHY[templateSlug]) || defaultTypography;

  return (
    <div
      // `theme-invitation` là chốt chặn dark mode của mẫu thiệp: chế độ tối là
      // của **giao diện website**, còn tấm thiệp thì mang art direction do cặp
      // đôi chọn và khách mời không bật/tắt được. Đặt ở đây vì đây là điểm vào
      // duy nhất của mọi tấm thiệp (trang khách, xem thử, demo, preview trong
      // editor) — xem `app/globals.css`.
      className={`theme-invitation relative ${typography.variables}`}
      data-template-slug={templateSlug}
      style={typography.fonts}
      data-template-fonts={typography.label}
    >
      {children}
      {/* Nền "đang tải" cho ảnh cặp đôi khi mạng chậm — cùng lý do đặt ở đây. */}
      <InvitationPhotoLoading />
    </div>
  );
}
