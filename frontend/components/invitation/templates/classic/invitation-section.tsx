import { cn } from "@/lib/utils";

/**
 * Khung chung của mọi section trên thiệp: tiêu đề serif căn giữa và vùng nội
 * dung giới hạn bề rộng để dễ đọc trên cả mobile và desktop.
 *
 * Đây là mẫu duy nhất không đi qua `TemplateSection`, nên luật lề đọc 16px ở
 * `globals.css` (`[data-template-section]`) không với tới nó — `px-4` dưới đây
 * là bản chép tay của luật đó. Nó cũng là mẫu duy nhất không có
 * `container-type` ở gốc, nên mốc phải là `sm:` (theo cửa sổ) chứ không phải
 * `@container` (theo bề ngang thiệp): trong khung xem thử "Mobile" của editor
 * section vẫn ăn `sm:px-10`. Sửa được bằng cách cho gốc mẫu một container,
 * nhưng `container-type` kéo theo `contain: layout` — tức gốc thành containing
 * block của mọi decor `absolute` bên trong — nên đó là một thay đổi riêng.
 */
export function InvitationSection({
  title,
  subtitle,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "border-t border-border/70 px-4 py-14 first:border-t-0 sm:px-10",
        className,
      )}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8">
        {title ? (
          <div className="space-y-2 text-center">
            <h2 className="font-heading text-h4 font-medium">{title}</h2>
            {subtitle ? (
              <p className="text-small text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
        <div className="w-full">{children}</div>
      </div>
    </section>
  );
}
