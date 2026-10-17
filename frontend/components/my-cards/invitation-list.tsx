"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/apis";
import { CheckoutDialog } from "@/components/payment/checkout-dialog";
import { useDeleteCardMutation } from "@/hooks/use-card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill } from "@/lib/format";
import type { InvitationSummary } from "@/lib/data/invitations";
import { InvitationRow } from "./invitation-row";
import { ShareLinkDialog } from "./share-link-dialog";

type Props = {
  invitations: InvitationSummary[];
  dict: Dictionary["myCards"];
  commonDict: Dictionary["common"];
  paymentDict: Dictionary["payment"]["upgrade"];
  /** Giá hiện trên nút "Thanh toán" của thiệp nháp. */
  price: number;
  locale: Locale;
  /**
   * Chạy sau khi xoá hoặc đổi đường dẫn một thiệp. Mặc định `router.refresh()`
   * cho "Thiệp của tôi" (Server Component). Chỗ gọi đọc danh sách qua
   * React Query thì truyền hàm xoá cache của nó vào đây.
   */
  onChanged?: () => void;
  /** Ẩn dòng đếm + nút tạo thiệp khi màn bao ngoài đã tự vẽ phần đầu. */
  hideHeader?: boolean;
  /** Thay trạng thái rỗng mặc định — vd. "không có thiệp khớp bộ lọc". */
  emptyState?: ReactNode;
};

/**
 * Danh sách thiệp của người dùng. Xóa thiệp yêu cầu xác nhận; link/QR mở trong
 * một hộp riêng.
 */
export function InvitationList({
  invitations,
  dict,
  commonDict,
  paymentDict,
  price,
  locale,
  onChanged,
  hideHeader = false,
  emptyState,
}: Props) {
  const router = useRouter();
  // Danh sách này nằm ở `/thiep-cua-toi`; dọn `?moi=` thì ở lại đúng trang đang đứng.
  const pathname = usePathname();
  const refresh = onChanged ?? (() => router.refresh());
  const searchParams = useSearchParams();
  const [pendingDelete, setPendingDelete] = useState<InvitationSummary | null>(
    null,
  );
  const [paying, setPaying] = useState<InvitationSummary | null>(null);
  const deleteCard = useDeleteCardMutation();

  /**
   * Editor vừa chuyển sang đây kèm `?moi=<slug>` thì mở luôn hộp link: người ta
   * bấm "Lưu & Tạo link" là để có cái link, không phải để về một danh sách.
   *
   * Suy ra lúc render chứ không chép vào state lúc khởi tạo: chỗ gọi nạp
   * danh sách **sau** khi mount, nên lúc khởi tạo chưa có thiệp
   * nào để tìm. `dismissedJustCreated` giữ cho hộp không bật lại sau khi đóng.
   */
  const justCreated = searchParams.get("moi");
  const [sharing, setSharing] = useState<InvitationSummary | null>(null);
  const [dismissedJustCreated, setDismissedJustCreated] = useState<string | null>(
    null,
  );
  const justCreatedCard =
    justCreated && dismissedJustCreated !== justCreated
      ? (invitations.find((invitation) => invitation.slug === justCreated) ??
        null)
      : null;
  const activeShare = sharing ?? justCreatedCard;

  /**
   * Đóng hộp thì dọn luôn tham số khỏi URL, nếu không thì tải lại trang là hộp
   * bật lên lần nữa. Dọn lúc đóng chứ không phải lúc mở: `replace` kéo theo một
   * lượt render lại từ server, làm việc đó ngay khi hộp vừa hiện là tự mình đá
   * vào chân mình.
   */
  const onShareOpenChange = (open: boolean) => {
    if (open) return;
    setSharing(null);
    if (justCreated) {
      setDismissedJustCreated(justCreated);
      router.replace(pathname, { scroll: false });
    }
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteCard.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
      toast.success(dict.deleteConfirm.done);
      refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : dict.deleteConfirm.failed,
      );
    }
  };

  if (invitations.length === 0) {
    if (emptyState) return emptyState;
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-16 text-center">
        <h2 className="font-heading text-h4 font-medium">{dict.empty.title}</h2>
        <p className="max-w-md text-body text-muted-foreground">
          {dict.empty.subtitle}
        </p>
        <Link href={`/${locale}/mau-thiep`} className={buttonVariants()}>
          {dict.empty.cta}
        </Link>
      </div>
    );
  }

  return (
    <>
      {hideHeader ? null : (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-body text-muted-foreground">
            {fill(dict.count, { count: invitations.length })}
          </p>
          <Link
            href={`/${locale}/mau-thiep`}
            className={buttonVariants({ className: "gap-2" })}
          >
            <Plus aria-hidden className="size-4" />
            {dict.newCard}
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {invitations.map((invitation) => (
          <InvitationRow
            key={invitation.id}
            invitation={invitation}
            dict={dict}
            commonDict={commonDict}
            locale={locale}
            onDelete={setPendingDelete}
            onShare={setSharing}
            onPay={setPaying}
            price={price}
          />
        ))}
      </ul>

      {paying ? (
        <CheckoutDialog
          open
          onOpenChange={(open) => {
            if (!open) setPaying(null);
          }}
          card={{ id: paying.id, title: paying.title }}
          dict={paymentDict}
          commonDict={commonDict}
          locale={locale}
        />
      ) : null}

      {activeShare ? (
        <ShareLinkDialog
          open
          onOpenChange={onShareOpenChange}
          // Đổi thiệp thì khởi tạo lại hộp.
          key={activeShare.id}
          slug={activeShare.slug}
          dict={dict.share}
          commonDict={commonDict}
          // Vừa từ editor sang thì người dùng chưa thấy danh sách phía sau hộp;
          // mở từ nút Link của một dòng thì họ đang đứng ngay trong danh sách.
          doneLabel={justCreated ? dict.share.viewAllCards : undefined}
          locale={locale}
        />
      ) : null}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dict.deleteConfirm.title}</DialogTitle>
            <DialogDescription>
              {fill(dict.deleteConfirm.body, {
                title: pendingDelete?.title ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {commonDict.actions.cancel}
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirmDelete}
              disabled={deleteCard.isPending}
            >
              {dict.deleteConfirm.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
