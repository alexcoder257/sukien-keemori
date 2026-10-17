"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, MessageSquareHeart, XIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/hooks/use-notification";
import type { AppNotification } from "@/apis";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  dict: Dictionary["common"]["notifications"];
  locale: Locale;
  /** Chưa đăng nhập thì không gọi API và không render gì. */
  authenticated: boolean;
  className?: string;
};

/**
 * Chuông thông báo trên header.
 *
 * Danh sách được nạp một lần lúc mount (xem `useNotificationsQuery`) nên chấm
 * đỏ phản ánh trạng thái tại thời điểm tải trang, không phải thời gian thực.
 * Đây là đánh đổi có chủ đích: không polling, không websocket, không email.
 */
export function NotificationBell({
  dict,
  locale,
  authenticated,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  // Dưới 440px popover 320px gần như phủ kín màn mà vẫn hở mép, và danh sách
  // bị kẹp trong 384px — nên ở đó bảng thông báo mở thành màn toàn màn hình.
  // Không ép Popover thành fullscreen bằng CSS được: Positioner của Base UI
  // đặt `transform` inline, `fixed inset-0` bên trong sẽ không phủ viewport.
  const fullscreen = useMediaQuery("(max-width: 439.98px)");
  const { data: notifications } = useNotificationsQuery(authenticated);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  if (!authenticated) return null;

  const items = notifications ?? [];
  const unreadCount = items.filter((item) => !item.readAt).length;

  // `buttonVariants` thay vì bọc `<Button>`: primitive Base UI tự render thẻ
  // button, không nhận `asChild`.
  const triggerProps = {
    "aria-label":
      unreadCount > 0
        ? fill(dict.unreadLabel, { count: unreadCount })
        : dict.title,
    className: buttonVariants({
      variant: "ghost",
      size: "icon-sm",
      className: cn("relative border-b-0!", className),
    }),
    children: (
      <>
        <Bell />
        {unreadCount > 0 ? (
          /* Chấm đỏ mang luôn con số; quá 9 thì rút gọn để không phá nút. */
          <span
            aria-hidden
            className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-caption leading-4 text-primary-foreground"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </>
    ),
  };

  const markAllButton =
    unreadCount > 0 ? (
      <Button
        variant="ghost"
        size="sm"
        // `ghost` mặc định là link gạch chân (`border-b`, `rounded-none`); ở
        // thanh tiêu đề đứng cạnh nút ✕ nó đọc ra như hai đường kẻ lạc chỗ.
        className="h-auto rounded-md border-b-0! px-2 py-1 text-caption hover:bg-foreground/8"
        onClick={() => markAllRead.mutate()}
        disabled={markAllRead.isPending}
      >
        {dict.markAllRead}
      </Button>
    ) : null;

  const list =
    items.length === 0 ? (
      <p className="px-3 py-8 text-center text-small text-muted-foreground">
        {dict.empty}
      </p>
    ) : (
      <ul
        className={cn(
          "overflow-y-auto overscroll-contain",
          fullscreen ? "min-h-0 flex-1" : "max-h-96",
        )}
      >
        {items.map((item) => (
          <li key={item.id}>
            <NotificationRow
              notification={item}
              dict={dict}
              locale={locale}
              onOpen={() => {
                if (!item.readAt) markRead.mutate(item.id);
                setOpen(false);
              }}
            />
          </li>
        ))}
      </ul>
    );

  if (fullscreen) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger {...triggerProps} />
        <DialogContent
          showCloseButton={false}
          className="inset-0 h-dvh max-h-none w-full max-w-none translate-none gap-0 overflow-hidden rounded-none bg-background p-0"
        >
          <div className="flex items-center gap-2 px-4 py-3">
            <DialogTitle className="flex-1 font-sans text-body font-medium">
              {dict.title}
            </DialogTitle>
            {markAllButton}
            <DialogClose
              aria-label={dict.close}
              className={buttonVariants({
                variant: "ghost",
                size: "icon-sm",
                className: "rounded-md border-b-0! hover:bg-foreground/8",
              })}
            >
              <XIcon />
            </DialogClose>
          </div>
          <Separator />
          {list}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger {...triggerProps} />

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <p className="text-small font-medium">{dict.title}</p>
          {markAllButton}
        </div>
        <Separator />
        {list}
      </PopoverContent>
    </Popover>
  );
}

/** Câu chữ, biểu tượng và đích đến của một dòng — mỗi loại thông báo một bộ. */
interface RowPresentation {
  text: string;
  href: string;
  icon: ReactNode;
}

/**
 * Dựng nội dung dòng theo `type`. Backend chỉ gửi dữ liệu thô: chuỗi hiển thị
 * phải nằm trong `dictionaries/` để dịch được cả hai locale.
 *
 * Mỗi loại có **đích đến riêng**, và đó là phần quan trọng nhất: lời chúc dẫn
 * tới màn duyệt lời chúc. Bấm vào một lời nhắc mà không tới được chỗ xử lý nó
 * thì lời nhắc chỉ là tiếng ồn.
 */
function presentRow(
  notification: AppNotification,
  dict: Dictionary["common"]["notifications"],
  locale: Locale,
): RowPresentation {
  switch (notification.type) {
    case "payment_success":
      return {
        text: dict.paymentSuccess,
        href: `/${locale}/t/${notification.payload.cardSlug}`,
        icon: (
          <CheckCircle2
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-success"
          />
        ),
      };
    case "wish_pending": {
      const { count, latestName, cardSlug } = notification.payload;
      return {
        text: fill(count > 1 ? dict.wishPendingMany : dict.wishPendingOne, {
          name: latestName,
          count: count - 1,
        }),
        href: `/${locale}/thiep-cua-toi/${cardSlug}/loi-chuc`,
        icon: (
          <MessageSquareHeart
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
        ),
      };
    }
  }
}

function NotificationRow({
  notification,
  dict,
  locale,
  onOpen,
}: {
  notification: AppNotification;
  dict: Dictionary["common"]["notifications"];
  locale: Locale;
  onOpen: () => void;
}) {
  const unread = !notification.readAt;
  const { text, href, icon } = presentRow(notification, dict, locale);

  return (
    <Link
      href={href}
      onClick={onOpen}
      className={cn(
        "flex gap-3 px-3 py-3 transition-colors hover:bg-secondary",
        unread ? "bg-primary/5" : null,
      )}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-small">{text}</p>
        <p className="truncate text-caption text-muted-foreground">
          {notification.payload.cardTitle || dict.untitledCard}
        </p>
        <p className="text-caption text-muted-foreground/70">
          {formatDateTime(notification.lastEventAt, locale)}
        </p>
      </div>
      {unread ? (
        <span aria-hidden className="mt-1.5 size-2 rounded-full bg-primary" />
      ) : null}
    </Link>
  );
}
