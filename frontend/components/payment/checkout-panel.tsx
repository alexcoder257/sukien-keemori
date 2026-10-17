"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CircleCheck,
  Copy,
  Download,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/apis";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCancelOrderMutation } from "@/hooks/use-order";
import { useNow } from "@/hooks/use-now";
import { useCheckoutQuery, useReturnToCardsAfterPayment } from "@/hooks/use-payment";
import { cardQueryKeys } from "@/hooks/use-card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatCurrency } from "@/lib/format";
import { PaymentSuccessDialog } from "./payment-success-dialog";

type Props = {
  orderId: string;
  dict: Dictionary["payment"]["checkout"];
  successDict: Dictionary["payment"]["success"];
  locale: Locale;
  onCancelled?: () => void;
};

/** Cạnh ảnh QR — đủ nét trên màn hình retina mà vẫn tải nhanh trên 3G. */
const QR_SIZE = 280;

/**
 * Trả xong bao lâu thì vẫn tính là "vừa xảy ra". Rộng rãi một phút vì nó chỉ
 * quyết định có bắn pháo giấy hay không: mừng nhầm một lần tải lại trang thì
 * vô hại, còn bỏ lỡ khoảnh khắc thật thì mất hẳn.
 */
const JUST_PAID_MS = 60_000;

/**
 * `mm:ss` cho thời gian còn lại. Không dùng `Intl`: đây là một đồng hồ đếm
 * ngược, đọc giống nhau ở mọi ngôn ngữ, và định dạng theo locale sẽ cho ra
 * "10 phút" khi cần thấy từng giây trôi.
 */
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Màn chuyển khoản của một đơn.
 *
 * Trang này **tự cập nhật** khi tiền về: webhook đi vào backend chứ không đi vào
 * trình duyệt, nên không có đường nào khác để biết ngoài việc hỏi lại (xem ghi
 * chú ở `useCheckoutQuery`). Người dùng đang ngồi nhìn màn hình chờ, và nhịp hỏi
 * tự tắt ngay khi đơn rời khỏi `pending`.
 */
export function CheckoutPanel({
  orderId,
  dict,
  successDict,
  locale,
  onCancelled,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const returnToCards = useReturnToCardsAfterPayment(locale);
  const now = useNow();
  const { data, isPending, isError, isFetching, refetch } =
    useCheckoutQuery(orderId);
  const cancelOrder = useCancelOrderMutation();

  /**
   * Còn bao nhiêu mili giây trước khi trang ngừng chờ. `null` khi chưa đo được
   * đồng hồ (lần render đầu trên client, `useNow` trả `0`) hoặc chưa có đơn —
   * lúc đó chưa kết luận được gì nên không được coi là hết giờ.
   */
  const remainingMs =
    now === 0 || !data?.holdExpiresAt
      ? null
      : new Date(data.holdExpiresAt).getTime() - now;
  const expired = remainingMs !== null && remainingMs <= 0;

  /**
   * Tiền về thì đánh dấu danh sách thiệp đã cũ. Khi bấm về danh sách, hook còn
   * xoá query và revalidate trang đích trước khi chuyển trang.
   * Refresh màn thanh toán một mình không làm mới cache React Query này.
   */
  useEffect(() => {
    if (data?.status !== "paid") return;
    void queryClient.invalidateQueries({ queryKey: cardQueryKeys.all });
    router.refresh();
  }, [data?.status, queryClient, router]);

  /**
   * Hộp mừng chỉ bật khi đơn **vừa** trả xong. Mở lại URL của một đơn đã trả từ
   * hôm trước thì đó là tra cứu chứ không phải một khoảnh khắc vừa xảy ra, nên
   * chỉ còn thẻ trạng thái.
   *
   * Hai dấu hiệu, vì có hai đường tới `paid`. Đơn chuyển khoản đi qua
   * `pending → paid` ngay trước mắt người dùng, bắt bằng `wasPending`. Đơn 0₫
   * (mã giảm 100%, hoặc khuyến mãi gói 100%) thì `createOrder` chốt luôn nên
   * trang này mở ra đã thấy `paid` — không có lượt chuyển nào để bắt, phải hỏi
   * `paidAt` xem việc đó vừa xảy ra hay đã lâu.
   */
  const wasPending = useRef(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!data) return;
    if (data.status === "pending") {
      wasPending.current = true;
      return;
    }
    if (data.status !== "paid") return;

    const justPaid =
      data.paidAt !== null &&
      Date.now() - new Date(data.paidAt).getTime() < JUST_PAID_MS;

    if (wasPending.current || justPaid) {
      wasPending.current = false;
      setCelebrating(true);
    }
  }, [data]);

  const onCancel = async () => {
    try {
      await cancelOrder.mutateAsync(orderId);
      if (onCancelled) onCancelled();
      else router.push(`/${locale}/thiep-cua-toi`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : dict.cancelFailed,
      );
    }
  };

  if (isPending) {
    return (
      <p className="flex items-center gap-3 text-body text-muted-foreground">
        <Loader2 aria-hidden className="size-5 animate-spin" />
        {dict.loading}
      </p>
    );
  }

  if (isError || !data) {
    return (
      <StatusCard
        tone="warning"
        icon={<TriangleAlert aria-hidden className="size-6" />}
        title={dict.failed.title}
        body={dict.failed.body}
      >
        <Button size="sm" onClick={() => refetch()}>
          {dict.failed.retry}
        </Button>
        <Link
          href={`/${locale}/thiep-cua-toi`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {dict.back}
        </Link>
      </StatusCard>
    );
  }

  /**
   * Tiền đã về. Thẻ trạng thái ở lại làm nội dung trang (người dùng đóng hộp,
   * hoặc quay lại URL này sau, vẫn phải đọc được kết quả), còn hộp mừng nằm đè
   * lên trên: khoảnh khắc đáng ăn mừng phải chiếm giữa màn hình chứ không nằm
   * lẫn trong một trang tĩnh.
   */
  if (data.status === "paid") {
    return (
      <>
        <StatusCard
          tone="success"
          icon={<CircleCheck aria-hidden className="size-6" />}
          title={dict.paid.title}
          body={dict.paid.body}
        >
          <Button
            size="sm"
            disabled={returnToCards.isPending}
            onClick={() => returnToCards.mutate(data.cardSlug)}
          >
            {dict.paid.cta}
          </Button>
          {data.cardSlug ? (
            <Link
              href={`/${locale}/t/${data.cardSlug}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {dict.paid.viewCard}
            </Link>
          ) : null}
        </StatusCard>

        <PaymentSuccessDialog
          open={celebrating}
          onOpenChange={(open) => {
            if (!open) setCelebrating(false);
          }}
          dict={successDict}
          onDone={() => returnToCards.mutate(data.cardSlug)}
          donePending={returnToCards.isPending}
        />
      </>
    );
  }

  if (data.status === "cancelled") {
    return (
      <StatusCard
        tone="warning"
        icon={<TriangleAlert aria-hidden className="size-6" />}
        title={dict.cancelled.title}
        body={dict.cancelled.body}
      >
        <Link
          href={`/${locale}/thiep-cua-toi`}
          className={buttonVariants({ size: "sm" })}
        >
          {dict.cancelled.cta}
        </Link>
      </StatusCard>
    );
  }

  /**
   * Hết thời gian chờ. Đây là **màn hình thay thế**, không phải đơn bị huỷ:
   * `holdExpiresAt` chỉ nói trang ngừng tự hỏi. Vì vậy chỗ này không đưa người
   * dùng đi đâu cả mà nói rõ mã vẫn còn hiệu lực — đẩy họ sang trang khác khi
   * tiền có thể đang trên đường về là cách chắc chắn nhất khiến họ nghĩ mình
   * vừa mất tiền. Ba lối ra: kiểm tra lại, huỷ đơn, hoặc quay về danh sách.
   */
  if (expired) {
    return (
      <StatusCard
        tone="warning"
        icon={<TriangleAlert aria-hidden className="size-6" />}
        title={dict.expired.title}
        body={fill(dict.expired.body, { code: data.paymentCode })}
      >
        <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? dict.expired.checking : dict.expired.recheck}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={cancelOrder.isPending}
        >
          {cancelOrder.isPending ? dict.cancelling : dict.cancel}
        </Button>
        <Link
          href={`/${locale}/thiep-cua-toi`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {dict.back}
        </Link>
      </StatusCard>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[auto_1fr]">
      {/* `self-start`: khung QR cao đúng nội dung của nó, không kéo dài theo
          cột thông tin bên cạnh thành một mảng trống. */}
      <div className="flex flex-col items-center gap-4 self-start rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
        <h2 className="font-heading text-body-lg font-medium">
          {dict.qr.title}
        </h2>
        {/* Nền trắng cố định: QR đảo màu là máy quét của app ngân hàng đọc hụt,
            và đây là đường thanh toán chính chứ không phải một hình trang trí. */}
        <div className="rounded-xl bg-white p-3">
          <Image
            src={data.qrImageUrl}
            alt={fill(dict.qr.alt, { code: data.paymentCode })}
            width={QR_SIZE}
            height={QR_SIZE}
            /* Ảnh do SePay dựng theo tham số trên URL, không phải asset của ta;
               tối ưu lại qua loader của Next chỉ thêm một chặng mà không đổi gì. */
            unoptimized
            priority
          />
        </div>
        <p className="max-w-[280px] text-center text-caption text-muted-foreground">
          {dict.qr.hint}
        </p>
        <QrDownloadButton
          src={data.qrImageUrl}
          fileName={`keemori-${data.paymentCode}.png`}
          dict={dict}
        />
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="font-heading text-body-lg font-medium">
            {dict.summary.title}
          </h2>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-body">
            <dt className="text-muted-foreground">{dict.summary.package}</dt>
            <dd>{dict.summary.packageName}</dd>
            <dt className="text-muted-foreground">{dict.summary.amount}</dt>
            <dd className="font-medium">
              {formatCurrency(data.amount, locale)}
            </dd>
          </dl>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-body-lg font-medium">
            {dict.manual.title}
          </h2>
          <div className="space-y-3">
            <ReadOnlyField
              label={dict.manual.bank}
              value={data.bankCode}
              dict={dict}
            />
            <ReadOnlyField
              label={dict.manual.account}
              value={data.accountNumber}
              dict={dict}
              copyable
            />
            {data.accountName ? (
              <ReadOnlyField
                label={dict.manual.name}
                value={data.accountName}
                dict={dict}
                />
            ) : null}
            <ReadOnlyField
              label={dict.manual.content}
              value={data.paymentCode}
              dict={dict}
              copyable
              highlight
            />
          </div>
          <p className="text-caption text-muted-foreground">
            {dict.manual.contentHint}
          </p>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          {/* `items-start` + `mt-0.5`: icon đứng ngang dòng đầu. Căn giữa thì
              nó trôi xuống giữa khối ba dòng và trông như một ký tự lạc. */}
          <p className="flex min-w-0 flex-1 basis-64 items-start gap-3 text-small text-muted-foreground">
            <Loader2 aria-hidden className="mt-0.5 size-4 shrink-0 animate-spin" />
            <span>
              {dict.waiting}
              <span className="block text-caption">{dict.waitingHint}</span>
              {/* Đồng hồ chỉ hiện khi đã đo được thời gian trên client; server
                  render ra một dòng trống thay vì một con số sai. */}
              {remainingMs !== null ? (
                <span className="mt-1 block text-caption font-medium tabular-nums text-foreground">
                  {fill(dict.countdown, { time: formatRemaining(remainingMs) })}
                </span>
              ) : null}
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={cancelOrder.isPending}
          >
            {cancelOrder.isPending ? dict.cancelling : dict.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Lưu ảnh QR về máy — cho người trả tiền trên **chính** chiếc điện thoại đang
 * mở trang này: không có máy thứ hai để quét, nên họ lưu ảnh rồi để app ngân
 * hàng quét từ thư viện ảnh.
 *
 * Ảnh nằm ở `qr.sepay.vn`, khác origin, nên `<a download>` trỏ thẳng vào URL bị
 * trình duyệt lờ đi và chỉ mở ảnh ra. Phải tải về thành blob trước (SePay trả
 * `Access-Control-Allow-Origin: *`). Luôn tải thẳng, không mở bảng chia sẻ của
 * hệ điều hành: bấm "Tải" mà hiện ra AirDrop/Tin nhắn là sai lời hứa của nút.
 */
function QrDownloadButton({
  src,
  fileName,
  dict,
}: {
  src: string;
  fileName: string;
  dict: Dictionary["payment"]["checkout"];
}) {
  const [pending, setPending] = useState(false);

  const onDownload = async () => {
    setPending(true);
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Mạng chặn hoặc trình duyệt trong app không cho tải: mở ảnh ở tab mới,
      // nhấn giữ để lưu vẫn là một đường đi được.
      window.open(src, "_blank", "noopener,noreferrer");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={onDownload}
      disabled={pending}
    >
      {pending ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : (
        <Download aria-hidden className="size-4" />
      )}
      {pending ? dict.qr.downloading : dict.qr.download}
    </Button>
  );
}

/** Một dòng thông tin chuyển khoản, chép được bằng một cú bấm. */
function ReadOnlyField({
  label,
  value,
  dict,
  copyable = false,
  highlight = false,
}: {
  label: string;
  value: string;
  dict: Dictionary["payment"]["checkout"];
  copyable?: boolean;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Trình duyệt từ chối quyền clipboard (hoặc trang không chạy HTTPS). Giá
      // trị vẫn nằm nguyên trên màn hình để gõ lại, nên không báo lỗi cho một
      // thứ người dùng không sửa được.
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span
        className="w-40 shrink-0 text-small text-muted-foreground max-mobile:w-24"
      >
        {label}
      </span>
      <span
        className={
          highlight
            ? "min-w-0 flex-1 font-mono text-body-lg font-medium tracking-widest"
            : "min-w-0 flex-1 break-all text-body"
        }
      >
        {value}
      </span>
      {copyable ? (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={onCopy}
        >
          {copied ? (
            <Check aria-hidden className="size-4" />
          ) : (
            <Copy aria-hidden className="size-4" />
          )}
          {copied ? dict.copied : dict.copy}
        </Button>
      ) : null}
    </div>
  );
}

/** Khung thông báo cho ba nhánh không-còn-gì-để-chuyển: xong, huỷ, hỏng. */
function StatusCard({
  tone,
  icon,
  title,
  body,
  children,
}: {
  tone: "success" | "warning";
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex max-w-xl flex-col items-start gap-4 rounded-2xl bg-card p-8 ring-1 ring-foreground/10">
      <span className={tone === "success" ? "text-success" : "text-warning"}>
        {icon}
      </span>
      <h2 className="font-heading text-h4 font-medium">{title}</h2>
      <p className="text-body text-muted-foreground">{body}</p>
      <div className="mt-2 flex flex-wrap gap-3">{children}</div>
    </div>
  );
}
