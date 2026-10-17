"use client";

import { HoverPrefetchLink } from "@/components/shared/hover-prefetch-link";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Props = {
  dict: Dictionary["common"]["language"];
  locale: Locale;
  className?: string;
  /**
   * Trong menu thì có nhãn "Ngôn ngữ" đứng trước; đứng thẳng trên thanh header
   * thì bỏ nhãn đi, hai chữ VI/EN đã tự nói nó là gì mà không chiếm chỗ.
   */
  showLabel?: boolean;
  /**
   * `sm` khớp các dòng trong popover tài khoản. `lg` khớp menu mobile, nơi mỗi
   * mục điều hướng là chữ `text-body` kèm icon 20px — để `sm` ở đó thì riêng
   * hàng ngôn ngữ trông như chú thích lạc vào giữa danh sách.
   */
  size?: "sm" | "lg";
  /** Đóng menu chứa nó sau khi chọn (popover tài khoản, menu mobile). */
  onSelect?: () => void;
};

/**
 * Nút chuyển ngôn ngữ.
 *
 * Ngôn ngữ của trang **chỉ đến từ prefix locale trên URL** (`proxy.ts` không
 * đọc cookie hay `Accept-Language`), nên chuyển ngôn ngữ đúng nghĩa là thay
 * đoạn đầu của đường dẫn hiện tại. Vì vậy mỗi lựa chọn là một `<Link>` thật:
 * người dùng ở lại đúng trang đang đọc, mở tab mới hay bookmark đều ra bản
 * ngôn ngữ đó, và không cần JavaScript mới bấm được.
 *
 * Chỉ có hai ngôn ngữ nên vẽ cả hai cạnh nhau (segmented) thay vì một nút
 * xoay vòng: người dùng thấy ngay mình đang ở bản nào và bản kia là gì.
 */
export function LocaleSwitcher({
  dict,
  locale,
  className,
  showLabel = true,
  size = "sm",
  onSelect,
}: Props) {
  const large = size === "lg";
  const pathname = usePathname();
  const router = useRouter();

  // `pathname` luôn có dạng `/{locale}` hoặc `/{locale}/...` (proxy đảm bảo).
  const rest = pathname.replace(/^\/[^/]+/, "");

  /**
   * Query string được ghép **lúc bấm**, không phải lúc render.
   *
   * `useSearchParams()` ở đây sẽ kéo cả cây trang xuống render phía client vì
   * component này nằm trong header của mọi layout — đắt cho một khu marketing
   * sống bằng SEO. Đọc `window.location.search` khi bấm giữ nguyên bộ lọc
   * (`/mau-thiep?tier=...`) lẫn `?next=` của trang đăng nhập, mà `href` dựng ở
   * server vẫn tĩnh và khớp với lúc hydrate.
   */
  function onClick(event: React.MouseEvent<HTMLAnchorElement>, target: Locale) {
    onSelect?.();
    const search = window.location.search;
    if (!search) return;
    // Nhường lại cho trình duyệt khi người dùng mở tab mới.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    router.push(`/${target}${rest}${search}`);
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        // Cùng chiều cao, cùng lề trái và cùng cỡ chữ với các dòng khác trong
        // menu tài khoản (`buttonVariants({ variant: "ghost", size: "sm" })`).
        showLabel &&
          (large ? "h-11 text-body" : "h-9 text-caption font-medium"),
        className,
      )}
    >
      {showLabel ? (
        <span
          className={cn(
            "flex items-center text-foreground",
            large ? "gap-3" : "gap-2",
          )}
        >
          <Globe
            aria-hidden
            className={large ? "size-5 text-(--gold-ink)" : "size-4"}
          />
          {dict.label}
        </span>
      ) : null}
      <div
        role="group"
        aria-label={dict.label}
        className={cn(
          "flex items-center gap-0.5 rounded-lg border border-primary/45 p-0.5",
          // Đứng trên thanh header thì phải cao bằng các nút icon cạnh nó.
          !showLabel && "h-9",
        )}
      >
        {locales.map((item) => {
          const active = item === locale;
          // Chỉ prefetch khi hover: nút này có mặt trên mọi trang, prefetch lúc
          // lọt khung nhìn là mỗi trang tốn thêm vài request cho bản ngôn ngữ
          // kia — thứ hiếm ai bấm, trên 3G nó xếp hàng chen với link người ta
          // thật sự bấm.
          return (
            <HoverPrefetchLink
              key={item}
              href={`/${item}${rest}`}
              hrefLang={item}
              aria-current={active ? "true" : undefined}
              onClick={(event) => onClick(event, item)}
              className={cn(
                "flex items-center rounded-md font-medium uppercase transition-colors",
                large ? "px-3 py-1 text-small" : "px-2 py-0.5 text-caption",
                !showLabel && "h-full",
                // Không tô nền đặc cho mục đang chọn: cả menu này chỉ có chữ
                // và icon, một mảng champagne đặc đọc ra như nút bấm chính.
                active
                  ? "bg-primary/15 text-(--gold-ink)"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={dict[item]}
            >
              {item}
            </HoverPrefetchLink>
          );
        })}
      </div>
    </div>
  );
}
