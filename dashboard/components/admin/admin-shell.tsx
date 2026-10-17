import Link from "next/link";
import {
  BadgeDollarSign,
  BarChart3,
  CalendarHeart,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileQuestion,
  Files,
  GalleryHorizontalEnd,
  Gauge,
  HeartHandshake,
  Link2,
  Lock,
  MonitorPlay,
  Tags,
  TrendingUp,
  Users,
  type LucideIcon,
  ScrollText,
  KeyRound,
} from "lucide-react";
import {
  hasPermission,
  type AdminPermission,
  type AdminSession,
} from "@/constants/permission";
import { ActiveNavScroll } from "./active-nav-scroll";
import { MobileNav } from "./mobile-nav";
import { SignOutButton } from "./sign-out-button";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { ThemeToggle } from "@/components/shared/theme-toggle";

type NavKey = keyof Dictionary["admin"]["nav"]["items"];
type NavGroup = keyof Dictionary["admin"]["nav"]["groups"];

/**
 * Bản đồ khu CMS.
 *
 * `href: null` là **màn chưa dựng** — vẫn hiện tên để người vận hành thấy toàn
 * cảnh 13 mục của spec và biết cái gì đang tới, thay vì một sidebar cụt lủn nở
 * dần ra sau mỗi đợt.
 *
 * `requires` là quyền CMS mà màn đó cần — cùng quyền backend gác route
 * của nó bằng `@Permissions(...)`. Ẩn ở đây chỉ là chuyện giao diện; backend
 * mới là hàng rào.
 */
const NAV: {
  key: NavKey;
  path: string | null;
  requires: AdminPermission;
  group: NavGroup;
  icon: LucideIcon;
}[] = [
  {
    key: "dashboard",
    path: "",
    requires: "dashboard:view",
    group: "overview",
    icon: Gauge,
  },
  {
    key: "users",
    path: "nguoi-dung",
    requires: "users:view",
    group: "operations",
    icon: Users,
  },
  {
    key: "cards",
    path: "thiep",
    requires: "cards:manage",
    group: "operations",
    icon: Files,
  },
  // Đám cưới nào sắp tới để gửi lời chúc — một lát cắt của danh sách thiệp.
  {
    key: "weddings",
    path: "lich-ngay-cuoi",
    requires: "cards:manage",
    group: "operations",
    icon: CalendarHeart,
  },
  // Tra soát tiền về là việc vận hành hằng ngày: quyền riêng.
  {
    key: "payments",
    path: "giao-dich",
    requires: "payments:manage",
    group: "operations",
    icon: CreditCard,
  },
  {
    key: "faq",
    path: "faq",
    requires: "content:manage",
    group: "content",
    icon: FileQuestion,
  },
  {
    key: "templateReviews",
    path: "danh-gia-mau",
    requires: "reviews:manage",
    group: "content",
    icon: ClipboardCheck,
  },
  {
    key: "templateTags",
    path: "tag-mau-thiep",
    requires: "templates:manage",
    group: "content",
    icon: Tags,
  },
  // Mẫu nào trong kho được khách bấm vào nhiều — cùng người quyết tag và dải
  // mẫu trang chủ nên cùng quyền.
  {
    key: "templateStats",
    path: "mau-xem-nhieu",
    requires: "templates:manage",
    group: "content",
    icon: TrendingUp,
  },
  // Ba màn cùng dựng nên trang chủ, xếp đúng thứ tự chúng xuất hiện trên đó:
  // hero → dải mẫu nổi bật → dải cặp đôi.
  {
    key: "homepageHero",
    path: "thiep-mau-trang-chu",
    requires: "settings:manage",
    group: "homepage",
    icon: MonitorPlay,
  },
  {
    key: "homepage",
    path: "mau-trang-chu",
    requires: "templates:manage",
    group: "homepage",
    icon: GalleryHorizontalEnd,
  },
  {
    key: "coupleShowcase",
    path: "cap-doi-trang-chu",
    requires: "content:manage",
    group: "homepage",
    icon: HeartHandshake,
  },
  {
    key: "siteStats",
    path: "so-lieu",
    requires: "content:manage",
    group: "content",
    icon: BarChart3,
  },
  {
    key: "settings",
    path: "cai-dat",
    requires: "settings:manage",
    group: "configuration",
    icon: Link2,
  },
  {
    key: "priceConfig",
    path: "bang-gia",
    requires: "pricing:manage",
    group: "commercial",
    icon: BadgeDollarSign,
  },
  // Mã giảm giá đứng ngay sau bảng giá: nó trừ thẳng vào doanh thu.
  {
    key: "vouchers",
    path: "ma-giam-gia",
    requires: "vouchers:manage",
    group: "commercial",
    icon: CircleDollarSign,
  },
  // Nhật ký để soi lại chính người vận hành, nên đừng gán `audit:view` cho
  // role vận hành thường — người bị soi không nên đọc được nhật ký về mình.
  // Đứng ở nhóm cấu hình vì nó không phải hàng đợi việc hằng ngày.
  {
    key: "audit",
    path: "nhat-ky",
    requires: "audit:view",
    group: "configuration",
    icon: ScrollText,
  },
];

/**
 * Thứ tự nhóm trong sidebar. `homepage` đứng ngay sau `content` vì ba màn của
 * nó đều là nội dung — chỉ khác ở chỗ cả ba cùng vẽ lên **một trang duy nhất**,
 * nên gom lại thì sửa trang chủ là mở đúng một nhóm chứ không phải nhớ ba mục
 * nằm rải trong hai nhóm khác nhau.
 */
const GROUPS: NavGroup[] = [
  "overview",
  "operations",
  "content",
  "homepage",
  "configuration",
  "commercial",
];

type NavItem = (typeof NAV)[number];

function AdminNavGroups({
  items,
  dict,
  locale,
  active,
  className,
}: {
  items: NavItem[];
  dict: Dictionary["admin"];
  locale: Locale;
  active: NavKey | null;
  className: string;
}) {
  return (
    <div className={className}>
      {GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group);
        if (groupItems.length === 0) return null;

        return (
          <section key={group} aria-label={dict.nav.groups[group]}>
            <p
              aria-hidden
              className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
            >
              {dict.nav.groups[group]}
            </p>
            <ul className="space-y-1">
              {groupItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <li key={item.key}>
                    {item.path !== null ? (
                      <Link
                        href={`/${locale}${item.path ? `/${item.path}` : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        style={{
                          backgroundColor: isActive
                            ? "var(--primary)"
                            : undefined,
                          color: isActive
                            ? "var(--primary-foreground)"
                            : "var(--foreground)",
                        }}
                        className={
                          isActive
                            ? "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-small font-semibold shadow-sm"
                            : "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-small transition-colors duration-200 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        }
                      >
                        <Icon aria-hidden className="size-[18px] shrink-0" />
                        <span>{dict.nav.items[item.key]}</span>
                      </Link>
                    ) : (
                      <span
                        aria-disabled
                        title={dict.nav.comingSoon}
                        className="flex min-h-11 items-center gap-3 px-3 py-2 text-small text-muted-foreground"
                      >
                        <Icon aria-hidden className="size-[18px] shrink-0" />
                        <span>{dict.nav.items[item.key]}</span>
                        <Lock aria-hidden className="ml-auto size-3" />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

type Props = {
  dict: Dictionary["admin"];
  locale: Locale;
  /** `null` cho màn không nằm trong bản đồ sidebar (404, lỗi): không tô mục nào. */
  active: NavKey | null;
  /** Phiên CMS; quyền trong đó quyết định mục nào hiện ra. */
  session: AdminSession | null;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AdminShell({
  dict,
  locale,
  active,
  session,
  title,
  subtitle,
  children,
}: Props) {
  const items = NAV.filter((item) => hasPermission(session, item.requires));

  const navGroups = (className: string) => (
    <AdminNavGroups
      items={items}
      dict={dict}
      locale={locale}
      active={active}
      className={className}
    />
  );

  /* Khối cuối sidebar là **việc thuộc về tài khoản mình**, tách khỏi bản đồ
     tính năng ở trên: thông tin tài khoản rồi đăng xuất. */
  const accountBlock = (className: string) => (
    <div className={className}>
      <Link
        href={`/${locale}/tai-khoan`}
        className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-small text-foreground transition-colors hover:bg-muted lg:min-h-9"
      >
        <KeyRound aria-hidden className="size-[18px] text-muted-foreground" />
        <span>{dict.account.navLabel}</span>
      </Link>
      <ThemeToggle dict={dict.theme} />
      <SignOutButton label={dict.signOut} locale={locale} />
    </div>
  );

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <a
        href="#admin-main"
        className="fixed top-2 left-2 z-50 -translate-y-16 rounded-md bg-card px-4 py-2 text-small shadow-lg transition-transform focus:translate-y-0"
      >
        {dict.nav.skipToContent}
      </a>

      <MobileNav
        brand={dict.title}
        current={active ? dict.nav.items[active] : null}
        email={session?.email ?? null}
        labels={{
          open: dict.nav.menu,
          close: dict.nav.close,
          nav: dict.nav.label,
        }}
      >
        {navGroups("w-full space-y-5")}
        {accountBlock("mt-6 w-full space-y-1 border-t border-border pt-4")}
      </MobileNav>

      <nav
        id="admin-sidebar"
        aria-label={dict.nav.label}
        className="hidden border-r border-border bg-card px-5 py-6 text-foreground lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-72 lg:shrink-0 lg:flex-col lg:overflow-y-auto"
      >
        <ActiveNavScroll activeKey={active} containerId="admin-sidebar" />
        <div className="w-full">
          <p className="mb-1 text-body-lg font-semibold">{dict.title}</p>
          {session?.email ? (
            <p className="truncate text-caption text-muted-foreground">
              {session.email}
            </p>
          ) : null}
        </div>

        {navGroups("mt-6 w-full space-y-5")}
        {accountBlock("mt-auto w-full space-y-1 border-t border-border pt-4")}
      </nav>

      <main
        id="admin-main"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 pt-5 pb-10 outline-none sm:px-6 sm:pt-8 lg:px-10 lg:py-10"
      >
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
          <header className="space-y-1">
            <h1 className="text-[22px] leading-tight font-semibold sm:text-h4">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-small text-muted-foreground">{subtitle}</p>
            ) : null}
          </header>
          {children}
          <p className="text-caption text-muted-foreground">
            {dict.backendNote}
          </p>
        </div>
      </main>
    </div>
  );
}
