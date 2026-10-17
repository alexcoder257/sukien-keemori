"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutTemplate,
  LogOut,
  MailOpen,
  Menu,
  Settings,
  Tag,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { BrandWordmark, HeaderBrandLogo } from "@/components/shared/brand-logo";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useCurrentUserQuery, useLogoutMutation } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Chiều cao thanh header, khớp với `h-20`. */
const HEADER_HEIGHT = 80;

type Props = {
  dict: Dictionary["common"];
  locale: Locale;
  /**
   * Chỉ trang **vốn đã động** mới truyền (xem `useSession`). Trang public là
   * trang tĩnh: bỏ trống, header tự đọc phiên ở trình duyệt.
   */
  authenticated?: boolean;
  /**
   * Trang mở đầu bằng một khối tràn khung nền tối (homepage). Header nổi lên
   * trên khối đó, trong suốt và lấy tông tối, chỉ đặc lại sau khi cuộn.
   */
  overlay?: boolean;
};

/**
 * Header của khu vực marketing + tài khoản. Mục nào chưa có route thì để
 * `href: null`: nó hiển thị mờ và không phải link, để không tạo link chết
 * trước khi trang tương ứng tồn tại.
 */
export function SiteHeader({
  dict,
  locale,
  authenticated: authenticatedHint,
  overlay = false,
}: Props) {
  const t = dict.nav;
  const router = useRouter();
  const pathname = usePathname();
  const logoutMutation = useLogoutMutation();
  // `null` = chưa biết (server render, hydrate). Ô tài khoản vẽ khung giữ chỗ
  // cho trạng thái đó thay vì đoán "chưa đăng nhập".
  const session = useSession(authenticatedHint);
  const authenticated = session === true;
  const { data: user } = useCurrentUserQuery(authenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tone, setTone] = useState<"forest" | "paper">("forest");

  useEffect(() => {
    if (!overlay) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-tone]"),
    );
    let frame = 0;

    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);

      // Lấy tông của khối đang nằm ngay dưới header (đo ở mép dưới của nó).
      const probe = HEADER_HEIGHT + 1;
      const current = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= probe && rect.bottom > probe;
      });
      if (current) {
        setTone(current.dataset.tone === "forest" ? "forest" : "paper");
      }
    };

    // Scroll bắn rất dày; gom về mỗi frame một lần đọc layout.
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [overlay]);

  // Menu mobile phủ kín màn hình, nên trang phía dưới phải ngừng cuộn — nếu
  // không, vuốt trong menu sẽ kéo theo nội dung bên dưới. Menu cũng phải tự
  // đóng khi màn hình rộng ra tới `lg`: lúc đó panel bị ẩn nhưng khoá cuộn
  // vẫn còn và trang trông như bị treo.
  useEffect(() => {
    if (!menuOpen) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    // Nút chat và nút lên đầu trang nằm ở layout, ngoài cây của header, và
    // đứng đè lên các nút cuối menu. Cờ trên `<html>` để CSS ẩn chúng mà không
    // phải kéo state menu đi xuyên layout (xem `globals.css`).
    documentElement.dataset.mobileMenuOpen = "";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      body.style.overflow = previousOverflow;
      delete documentElement.dataset.mobileMenuOpen;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [menuOpen]);

  // Menu mở ra cần nền đặc để đọc được, kể cả khi vẫn đang ở đỉnh trang.
  const floating = overlay && !scrolled && !menuOpen;

  const links = [
    // `icon` chỉ vẽ ở menu mobile: ở đó mỗi mục là một hàng rộng cả màn hình
    // và icon là thứ giữ nhịp với cụm nút có icon ở đáy panel. Trên thanh
    // desktop các mục đứng sát nhau, thêm icon chỉ làm hàng chữ rối.
    {
      key: "templates",
      label: t.templates,
      href: `/${locale}/mau-thiep`,
      icon: LayoutTemplate,
    },
    { key: "pricing", label: t.pricing, href: `/${locale}/bang-gia`, icon: Tag },
    // "Thiệp của tôi" đứng trên thanh điều hướng chứ không chôn trong menu tài
    // khoản: khách tự tạo và sửa thiệp, nên đây là màn họ quay lại nhiều nhất.
    // Hiện cả khi chưa đăng nhập: `proxy.ts` gác route này và đẩy về trang
    // đăng nhập kèm `?next=`, nên bấm vào là vào đúng chỗ rồi quay lại.
    {
      key: "myCards",
      label: t.myCards,
      href: `/${locale}/thiep-cua-toi`,
      icon: MailOpen,
    },
  ];
  // CTA chính dẫn sang tư vấn chứ không vào kho mẫu: thiệp custom bắt đầu bằng
  // một cuộc trò chuyện, không phải bằng việc tự chọn mẫu.
  const consultHref = `/${locale}/lien-he`;

  /**
   * Mục đang mở: trùng đúng route hoặc là route con của nó (`/mau-thiep/<slug>`,
   *, `/thiep-cua-toi/<slug>/loi-chuc`). So theo ranh giới
   * `/` để `/bang-gia` không sáng lên ở `/bang-gia-moi`.
   */
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  async function onLogout() {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Logout API có thể lỗi mạng nhưng token local đã bị xóa.
    } finally {
      toast.success(t.logoutSuccess);
      setMenuOpen(false);
      setAccountOpen(false);
      router.replace(`/${locale}`);
      router.refresh();
    }
  }

  return (
    <>
      <header
        className={cn(
          "z-40 border-b text-foreground transition-colors duration-500",
          overlay ? "fixed inset-x-0 top-0" : "sticky top-0",
          // Ở đỉnh trang header biến mất hẳn vào ảnh hero; khi đã cuộn thì nó
          // mượn tông của chương phía dưới và chỉ phủ một lớp mờ có blur, thay vì
          // luôn là một thanh sáng đặc nằm trên nền tối.
          overlay && tone === "forest" ? "theme-forest" : null,
          floating
            ? "border-transparent bg-transparent"
            : // Kính, không phải một dải nền mờ. Khác biệt nằm ở `saturate`: chỉ
              // blur thôi thì màu phía sau xỉn đi và thanh header trông như một
              // tấm nhựa đục; `saturate` giữ lại sắc của ảnh cưới bên dưới nên
              // header đọc ra như kính thật.
              //
              // Không kẻ viền dưới ở chế độ overlay: header nằm đè lên ảnh nên một
              // sợi hairline cắt ngang tấm ảnh đọc ra như vết ghép — thay bằng một
              // vệt sáng champagne ở mép dưới, cùng ngôn ngữ "nguồn sáng" với
              // `surface-glass`.
              [
                "border-transparent backdrop-blur-2xl backdrop-saturate-150",
                overlay ? "bg-background/55" : "bg-background/75",
              ],
        )}
      >
        <div
          className="container-page flex h-20 items-center justify-between gap-4"
          style={
            overlay ? { maxWidth: "none", paddingInline: "5.2%" } : undefined
          }
        >
          <Link href={`/${locale}`} className="shrink-0" aria-label="Keemori">
            {overlay ? (
              <BrandWordmark
                surface={tone === "forest" ? "dark" : "adaptive"}
                className="w-32 xl:w-36"
              />
            ) : (
              <HeaderBrandLogo
                surface={overlay && tone === "forest" ? "dark" : "adaptive"}
                priority
              />
            )}
          </Link>

          <nav
            aria-label={t.menu}
            className="hidden items-center gap-4 whitespace-nowrap lg:flex xl:gap-8"
          >
            {links.map((link) =>
              link.href ? (
                <Link
                  key={link.key}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "text-caption text-foreground/75 transition-colors hover:text-primary xl:text-small",
                    isActive(link.href) && "text-primary",
                  )}
                >
                  {link.label}
                </Link>
              ) : (
                <span
                  key={link.key}
                  aria-disabled
                  className="cursor-default text-small text-foreground/45"
                >
                  {link.label}
                </span>
              ),
            )}
          </nav>

          {/* Chuông đứng ngoài cụm `lg:flex` để trên mobile nó vẫn nằm cạnh nút
            menu thay vì bị chôn trong menu xổ xuống — thông báo mà phải mở menu
            mới thấy thì coi như không có. */}
          <div className="flex items-center gap-2">
            {/* Ngoài cụm `lg:flex` cùng lý do với chuông: trên mobile nút này
              phải thấy ngay ở thanh header, không chôn trong menu xổ xuống. */}
            <ThemeToggle dict={dict.theme} />

            <NotificationBell
              dict={dict.notifications}
              locale={locale}
              authenticated={authenticated}
            />

            <div className="hidden items-center gap-3 lg:flex">
              {session === null ? (
                <Skeleton className="h-8 w-40 rounded-lg" />
              ) : authenticated ? (
                /* Mọi lối tắt của tài khoản gom vào một menu — hàng nút bên phải
               chỉ còn chip tài khoản và CTA chính. */
                <Popover open={accountOpen} onOpenChange={setAccountOpen}>
                  <PopoverTrigger
                    aria-label={t.account}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "gap-2 border-b-0! pl-1.5",
                    })}
                  >
                    <UserAvatar user={user} className="size-7" />
                    <span className="max-w-36 truncate">{user?.fullName}</span>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 px-3.5">
                    <div className="flex items-center gap-3 py-1">
                      <UserAvatar user={user} className="size-9" />
                      <div className="min-w-0">
                        <p className="truncate text-small font-medium">
                          {user?.fullName}
                        </p>
                        <p className="truncate text-caption text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    {/* Không lặp lại "Thiệp của tôi" ở đây: nó đã nằm trên thanh
                      điều hướng. Menu này chỉ còn những mục về *tài khoản*. */}
                    <nav className="flex flex-col gap-1" aria-label={t.account}>
                      <Link
                        href={`/${locale}/tai-khoan`}
                        onClick={() => setAccountOpen(false)}
                        className={cn(
                          buttonVariants({
                            variant: "ghost",
                            size: "sm",
                            className: "justify-start gap-2 border-b-0!",
                          }),
                        )}
                      >
                        <Settings />
                        {t.account}
                      </Link>
                      <LocaleSwitcher
                        dict={dict.language}
                        locale={locale}
                        onSelect={() => setAccountOpen(false)}
                      />
                    </nav>
                    <Separator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start gap-2 border-b-0!"
                      onClick={onLogout}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut />
                      {t.logout}
                    </Button>
                  </PopoverContent>
                </Popover>
              ) : (
                <>
                  {/* Chưa đăng nhập thì không có menu tài khoản để chứa nút
                    chuyển ngôn ngữ, nên nó đứng thẳng trên thanh header. */}
                  <LocaleSwitcher
                    dict={dict.language}
                    locale={locale}
                    showLabel={false}
                  />
                  <Link
                    href={`/${locale}/dang-nhap`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    {t.login}
                  </Link>
                </>
              )}
              <Link
                href={consultHref}
                className={buttonVariants({ size: "sm" })}
              >
                {t.consult}
              </Link>
            </div>

            <Button
              variant="outline"
              size="icon-sm"
              className={cn(
                "lg:hidden",
                overlay &&
                  "size-11 border-transparent bg-transparent shadow-none [&_svg]:size-7",
              )}
              aria-label={menuOpen ? t.closeMenu : t.openMenu}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </header>

      {/* Trên mobile menu chiếm trọn phần màn hình còn lại dưới thanh header:
          danh sách link ngắn nên một panel xổ xuống cao lưng chừng chỉ khiến
          nội dung trang lấp ló phía sau và đọc ra như một lớp phủ hỏng. Neo bằng
          `bottom-0` chứ không đặt chiều cao cố định, để thanh địa chỉ của
          trình duyệt di động co vào ra không cắt mất cụm nút dưới cùng. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-20 z-40 overflow-y-auto overscroll-contain bg-background lg:hidden",
          // Panel là *anh em* của header chứ không nằm trong nó: header có
          // `backdrop-blur`, mà backdrop-filter tạo containing block cho con
          // `fixed` — đặt bên trong thì panel bị ép vào đúng 80px của thanh
          // header và cao bằng không. Vì vậy nó phải tự mang lại tông tối khi
          // header đang ở chế độ overlay.
          overlay && tone === "forest" ? "theme-forest" : null,
          menuOpen
            ? "block animate-in fade-in-0 slide-in-from-top-2 duration-200"
            : "hidden",
        )}
      >
        <nav
          aria-label={t.menu}
          className="container-page flex min-h-full flex-col gap-1 py-6"
        >
          {links.map((link) =>
            link.href ? (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-3 text-body text-foreground hover:bg-secondary",
                  isActive(link.href) && "bg-secondary font-medium text-primary",
                )}
              >
                <link.icon
                  aria-hidden
                  className="size-5 shrink-0 text-(--gold-ink)"
                />
                {link.label}
              </Link>
            ) : (
              <span
                key={link.key}
                aria-disabled
                className="flex items-center gap-3 px-2 py-3 text-body text-muted-foreground/50"
              >
                <link.icon aria-hidden className="size-5 shrink-0" />
                {link.label}
              </span>
            ),
          )}
          {/* Cụm hành động bị đẩy xuống đáy màn hình: CTA chính nằm trong tầm
              ngón cái, và khoảng trống ở giữa là thứ giữ cho panel toàn màn
              hình không đọc ra như một danh sách bị bỏ dở. */}
          <div className="mt-auto flex flex-col gap-3 pt-8">
            {/* Ngoài nhánh đăng nhập: menu mobile là chỗ duy nhất trên màn hình
                nhỏ chứa được nút này, và nó phải có mặt cho cả hai trạng thái. */}
            <LocaleSwitcher
              dict={dict.language}
              locale={locale}
              size="lg"
              className="h-12 rounded-lg border border-border px-2"
              onSelect={() => setMenuOpen(false)}
            />
            {session === null ? null : authenticated ? (
              <>
                <Link
                  href={`/${locale}/tai-khoan`}
                  onClick={() => setMenuOpen(false)}
                  aria-label={t.account}
                  className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-secondary"
                >
                  <UserAvatar user={user} className="size-9" />
                  <div className="min-w-0">
                    <p className="truncate text-small font-medium">
                      {user?.fullName}
                    </p>
                    <p className="truncate text-caption text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </Link>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={onLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut />
                  {t.logout}
                </Button>
              </>
            ) : (
              <Link
                href={`/${locale}/dang-nhap`}
                onClick={() => setMenuOpen(false)}
                className={buttonVariants({ variant: "outline" })}
              >
                {t.login}
              </Link>
            )}
            <Link
              href={consultHref}
              onClick={() => setMenuOpen(false)}
              className={buttonVariants()}
            >
              {t.consult}
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
