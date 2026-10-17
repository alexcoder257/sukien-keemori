"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import styles from "./mobile-nav.module.css";

type Props = {
  /** Tên khu quản trị — dòng nhỏ phía trên tên màn. */
  brand: string;
  /** Tên màn đang mở; `null` cho màn ngoài bản đồ sidebar (404, lỗi). */
  current: string | null;
  email: string | null;
  labels: { open: string; close: string; nav: string };
  /** Bản đồ điều hướng + khối tài khoản, dựng sẵn ở server. */
  children: React.ReactNode;
};

/**
 * Điều hướng CMS dưới `lg`: thanh trên dính đầu trang + ngăn kéo trượt từ trái.
 *
 * Bản trước xếp cả sidebar lên đầu trang (tên, email, ô menu, ba dòng tài
 * khoản) — trên điện thoại người vận hành phải cuộn qua gần nửa màn hình mới
 * tới dữ liệu, ở **mọi** màn. Giờ phần đầu chỉ cao 56px và luôn trong tầm tay.
 *
 * Ngăn kéo là `<dialog>` gốc mở bằng `showModal()`: trình duyệt lo sẵn bẫy
 * focus, phím Esc, lớp nền và top layer — không phải tự dựng lại từng thứ.
 */
export function MobileNav({ brand, current, email, labels, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Bấm một mục là đổi route: đóng ngăn kéo để thấy ngay màn vừa chọn.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // Khoá cuộn trang phía sau — `<dialog>` không tự làm việc này.
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const initial = email?.trim().charAt(0).toUpperCase() ?? "";

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card/85 px-3 backdrop-blur-md backdrop-saturate-150 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={labels.open}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted active:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Menu aria-hidden className="size-5" />
        </button>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-caption text-muted-foreground">{brand}</p>
          <p className="truncate text-small font-semibold">
            {current ?? brand}
          </p>
        </div>
        {initial ? (
          <span
            aria-hidden
            title={email ?? undefined}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground"
          >
            {initial}
          </span>
        ) : null}
      </header>

      <dialog
        id="admin-mobile-nav"
        ref={dialogRef}
        aria-label={labels.nav}
        onClose={() => setOpen(false)}
        // Bấm vào lớp nền (chính phần tử dialog, ngoài khung nội dung) là đóng.
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className={`${styles.drawer} m-0 h-dvh max-h-none w-[min(20rem,86vw)] max-w-none bg-transparent p-0 text-foreground lg:hidden`}
      >
        <div className="flex h-full flex-col overflow-y-auto overscroll-contain border-r border-border bg-card px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="min-w-0 flex-1 px-2">
              <p className="text-body-lg font-semibold">{brand}</p>
              {email ? (
                <p className="truncate text-caption text-muted-foreground">
                  {email}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
