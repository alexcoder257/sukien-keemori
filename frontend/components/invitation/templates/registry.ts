"use client";

import dynamic from "next/dynamic";
import { createElement } from "react";
import type {
  InvitationTemplate,
  InvitationTemplateProps,
} from "@/components/invitation/shared/invitation-template";
import { invitationKindOf } from "@/constants/invitation";
import { invitationDictForKind } from "@/lib/invitation-kind-dict";

/**
 * Slug mẫu thiệp → component dựng mẫu đó. Thêm mẫu mới là thêm đúng một dòng ở
 * đây; không nơi nào khác được kiểm tra slug bằng `if`.
 *
 * Mỗi mẫu là một `dynamic()` riêng chứ không phải import tĩnh: import tĩnh kéo
 * CSS Module và JS của **mọi** mẫu vào mọi trang dựng thiệp (~1.4MB CSS, ~2MB
 * JS cho một tấm thiệp chỉ dùng một mẫu). `dynamic()` trong Client Component
 * vẫn SSR bình thường và tự chèn đúng CSS của mẫu được dựng vào HTML, nên
 * không có khung hình trắng hay nháy chữ chưa style.
 *
 * Đường dẫn phải là chuỗi cố định trong từng `import()` để bundler tách được
 * chunk — đừng gom lại thành `import(\`./${slug}/...\`)`.
 *
 * Slug phải khớp `lib/data/templates.ts` (sau này là dữ liệu backend).
 */
const TEMPLATES: Record<string, InvitationTemplate> = {
  "burgundy-birthday": dynamic(() =>
    import("./burgundy-birthday/burgundy-birthday").then(
      (m) => m.BurgundyBirthday,
    ),
  ),
};

/**
 * Mẫu chưa có bản dựng riêng vẫn phải xem được — chúng rơi về mẫu mặc định
 * thay vì trang trắng.
 */
const FallbackTemplate: InvitationTemplate = dynamic(() =>
    import("./classic/classic-invitation").then((m) => m.ClassicInvitation),
  );

/**
 * Chỗ chọn mẫu phải nằm phía client: `InvitationView` là Server Component, mà
 * Server Component không gọi được hàm của một module `"use client"` — nó chỉ
 * render được component của module đó.
 */
export function InvitationTemplateRenderer(props: InvitationTemplateProps) {
  // `createElement` thay vì `<Template />`: đặt kết quả tra bảng vào một biến
  // viết hoa rồi dùng làm thẻ JSX bị hiểu nhầm là component dựng ngay trong lúc
  // render. Component ở đây lấy từ hằng số cấp module nên danh tính vẫn ổn định.
  const template =
    (props.templateSlug && TEMPLATES[props.templateSlug]) || FallbackTemplate;
  // Chữ của thiệp theo loại (sinh nhật, sự kiện…) được trộn ở đây, một chỗ cho
  // mọi mẫu — xem `invitationDictForKind`.
  const dict = invitationDictForKind(props.dict, invitationKindOf(props.content));
  return createElement(template, { ...props, dict });
}
