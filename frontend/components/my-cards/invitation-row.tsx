"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Eye,
  Link2,
  MessageSquareHeart,
  Pencil,
  Trash2,
  Users,
  UserRoundCheck,
} from "lucide-react";
import { InvitationKindBadge } from "@/components/shared/invitation-kind-badge";
import { MediaPlaceholder } from "@/components/shared/media-placeholder";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatCurrency, formatShortDate } from "@/lib/format";
import { templatePosterSrc } from "@/lib/template-poster";
import { cn } from "@/lib/utils";
import type { InvitationSummary } from "@/lib/data/invitations";

type Props = {
  invitation: InvitationSummary;
  dict: Dictionary["myCards"];
  commonDict: Dictionary["common"];
  locale: Locale;
  onDelete: (invitation: InvitationSummary) => void;
  /** Mở hộp link mời chung và mã QR. */
  onShare: (invitation: InvitationSummary) => void;
  /** Mở hộp thanh toán cho thiệp nháp chưa có đơn. */
  onPay: (invitation: InvitationSummary) => void;
  /** Giá hiện trên nút thanh toán — sau khuyến mãi gói, trước mã giảm giá. */
  price: number;
};

/**
 * Một dòng thiệp: trạng thái (bản nháp / đã xuất bản), số lượt xem và các hành
 * động sửa · link/QR · xóa.
 */
export function InvitationRow({
  invitation,
  dict,
  commonDict,
  locale,
  onDelete,
  onShare,
  onPay,
  price,
}: Props) {
  const draft = invitation.status === "draft";

  return (
    <li
      className={cn(
        // Lưới ở mọi bề rộng, không `flex-wrap`: với flex, thẻ có 7 nút thì hàng
        // nút rớt xuống dưới, thẻ có 6 nút thì nút đứng cạnh chữ và bóp cột chữ
        // lại — cùng một danh sách mà mỗi thẻ một bố cục. Từ `sm` là
        // `[poster | nội dung]`: poster chiếm hai hàng, khối chữ ở hàng trên,
        // hàng nút ở hàng dưới thẳng mép trái với chữ.
        "relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-6 gap-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10",
        // Dưới `sm` là lưới `[poster | chữ | badge]`: khối chữ và hàng tiêu
        // đề bên dưới là `contents`, nên con của chúng thành ô trực tiếp của
        // lưới — nhờ vậy dòng cảnh báo và hàng nút trải hết bề ngang thẻ thay
        // vì thụt vào dưới cột chữ, mà không phải vẽ markup hai lần.
        "max-sm:grid-cols-[auto_minmax(0,1fr)_auto] max-sm:gap-x-3 max-sm:gap-y-2 max-sm:p-4",
      )}
    >
      <time
        dateTime={invitation.createdAt}
        className="absolute top-6 right-6 whitespace-nowrap text-right text-caption text-muted-foreground max-sm:top-4 max-sm:right-4"
      >
        {dict.createdAt}:{" "}
        {formatShortDate(invitation.createdAt, locale, "Asia/Ho_Chi_Minh")}
      </time>

      {/* Thumbnail của mẫu, không phải ảnh cặp đôi: mẫu Free có 0 ô ảnh và
          thiệp nháp thì chưa tải ảnh nào, nên ảnh riêng sẽ vắng đúng ở những
          dòng cần một mỏ neo thị giác nhất. `alt=""` vì tên thiệp và tên mẫu
          đứng ngay cạnh — đọc lên lần nữa chỉ là nhiễu. */}
      {/* Poster (màn bìa), không phải `templateImageSrc` trần: đó là ảnh chụp
          dài toàn bộ thiệp, và `object-cover` trong khung nhỏ chỉ cắt ra khúc
          giữa của dải — thường là tấm lịch. Khung theo đúng tỉ lệ poster
          (960×1231) để không cắt mất tên cô dâu chú rể. */}
      {invitation.templateImageSrc ? (
        <Image
          src={
            templatePosterSrc(invitation.templateImageSrc) ??
            invitation.templateImageSrc
          }
          alt=""
          width={128}
          height={164}
          // Từ `sm` poster cao trọn thẻ (`self-stretch` trên ô chiếm cả khối chữ
          // lẫn hàng nút) thay vì giữ tỉ lệ và lửng lơ ở nửa trên. Khi khung
          // cao hơn tỉ lệ poster thì `object-top` giữ lại màn bìa và tên cô dâu
          // chú rể, chỉ cắt phần dưới.
          // `h-auto` là bắt buộc: thuộc tính `height` của `<img>` được trình
          // duyệt đọc như `height: 164px`, mà `self-stretch` chỉ kéo được phần
          // tử có chiều cao `auto`.
          className="row-span-2 h-auto w-32 shrink-0 self-stretch rounded-xl object-cover object-top max-sm:aspect-[0.78] max-sm:w-18 max-sm:self-start"
        />
      ) : (
        <MediaPlaceholder className="row-span-2 h-auto w-32 shrink-0 self-stretch max-sm:aspect-[0.78] max-sm:w-18 max-sm:self-start" />
      )}

      <div className="min-w-0 space-y-2 max-sm:contents max-sm:space-y-0">
        <div className="flex flex-wrap items-center gap-3 sm:pr-36 max-sm:contents">
          <h3 className="font-heading text-body-lg font-medium max-sm:mt-7">
            {invitation.title}
          </h3>
          {/* Nhãn loại: mọi loại đang dùng chung mẫu dựng sẵn, nên tên mẫu
              một mình không phân biệt được hai tấm thiệp. */}
          <div className="flex flex-wrap items-center gap-2 max-sm:col-span-2 max-sm:col-start-2">
            <InvitationKindBadge
              kind={invitation.kind}
              label={commonDict.invitationKinds[invitation.kind]}
            />
          </div>
        </div>
        <p className="text-small text-muted-foreground max-sm:col-span-2">
          {fill(dict.templateLabel, { name: invitation.templateName })}
        </p>

        {!draft ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small max-sm:col-span-full">
            <span className="text-success">{dict.status.published}</span>
            <span className="text-muted-foreground">{dict.permanentLink}</span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Eye aria-hidden className="size-4" />
              {fill(dict.views, { count: invitation.views })}
            </span>
          </p>
        ) : null}

        {draft ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small max-sm:col-span-full">
            <span className="font-medium">{dict.status.draft}</span>
            <span className="text-muted-foreground">{dict.noLink}</span>
          </p>
        ) : null}

      </div>

      {/* Dưới `sm` các nút chia đều hai cột thay vì rơi thành từng hàng dài ngắn
          theo độ dài chữ: mỗi nút `grow` từ nửa hàng, nên nút lẻ cuối cùng tự
          giãn hết hàng. Nửa hàng trên màn 360px chỉ còn ~136px, không đủ cho "Xác nhận tham
          dự" kèm icon, nên ở đó chữ được xuống dòng và đệm ngang hẹp lại. */}
      <div className="flex flex-wrap gap-3 max-sm:col-span-full max-sm:gap-2 max-sm:[&>*]:h-auto max-sm:[&>*]:min-h-10 max-sm:[&>*]:grow max-sm:[&>*]:basis-[calc(50%-0.25rem)] max-sm:[&>*]:px-2 max-sm:[&>*]:py-1.5 max-sm:[&>*]:text-center max-sm:[&>*]:whitespace-normal">
        <Link
          href={`/${locale}/editor/${invitation.templateSlug}?thiep=${invitation.id}`}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "gap-2",
          })}
        >
          <Pencil aria-hidden className="size-4" />
          {draft ? commonDict.actions.continue : commonDict.actions.edit}
        </Link>

        {/* Thiệp nháp chưa có link: link chỉ có sau khi trả tiền. Đã có đơn
            chờ thì quay lại đúng màn chuyển khoản của đơn đó thay vì tạo đơn
            mới; chưa có thì mở hộp thanh toán (giá, mã giảm giá). */}
        {draft ? (
          invitation.pendingOrderId ? (
            <Link
              href={`/${locale}/thanh-toan/${invitation.pendingOrderId}`}
              className={buttonVariants({
                size: "sm",
                className: "gap-2",
              })}
            >
              <CreditCard aria-hidden className="size-4" />
              {dict.resumePayment}
            </Link>
          ) : (
            <Button size="sm" className="gap-2" onClick={() => onPay(invitation)}>
              <CreditCard aria-hidden className="size-4" />
              {fill(dict.pay, { price: formatCurrency(price, locale) })}
            </Button>
          )
        ) : null}

        {/* Chỉ thiệp đã có link mới có khách để mà gửi lời chúc; bản nháp thì
            sổ lưu bút chắc chắn rỗng. */}
        {!draft ? (
          <Link
            href={`/${locale}/thiep-cua-toi/${invitation.slug}/loi-chuc`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-2",
            })}
          >
            <MessageSquareHeart aria-hidden className="size-4" />
            {dict.wishes.action}
            {invitation.pendingWishes > 0 ? (
              /* Con số trần đọc lên chỉ là "3"; nhãn đầy đủ cho biết 3 cái gì. */
              <span
                aria-label={fill(dict.wishes.pendingBadge, {
                  count: invitation.pendingWishes,
                })}
                className="rounded-full bg-primary px-2 text-caption text-primary-foreground"
              >
                {invitation.pendingWishes}
              </span>
            ) : null}
          </Link>
        ) : null}

        {/* Hiện theo công tắc, kể cả khi chưa có khách: số 0 trên nút chính là
            lời nhắc tính năng đang chờ danh sách, và màn link khách mời có sẵn
            hướng dẫn nhập danh sách. */}
        {!draft && invitation.guestInviteEnabled ? (
          <Link
            href={`/${locale}/thiep-cua-toi/${invitation.slug}/khach-moi`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-2",
            })}
          >
            <Users aria-hidden className="size-4" />
            {dict.guests.action}
            {/* Màu trung tính, không dùng màu nhấn như số lời chúc chờ duyệt:
                đây là số đếm, không phải việc cần xử lý. */}
            <span
              aria-label={fill(dict.guests.count, {
                count: invitation.guestCount,
              })}
              className="rounded-full bg-foreground/10 px-2 text-caption"
            >
              {invitation.guestCount}
            </span>
          </Link>
        ) : null}

        {/* Cùng luật với link khách mời: block mặc định tắt, nên đa số thiệp
            không có gì để xem ở màn này. */}
        {!draft && invitation.rsvpEnabled ? (
          <Link
            href={`/${locale}/thiep-cua-toi/${invitation.slug}/xac-nhan`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-2",
            })}
          >
            <UserRoundCheck aria-hidden className="size-4" />
            {dict.rsvp.action}
          </Link>
        ) : null}

        {/* Mở hộp link thay vì đi thẳng tới thiệp: bấm vào đây là để **lấy**
            link đem gửi, còn xem thử thiệp thì đã có nút riêng trong hộp đó. */}
        {!draft ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onShare(invitation)}
          >
            <Link2 aria-hidden className="size-4" />
            {commonDict.actions.linkQr}
          </Button>
        ) : null}

        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={() => onDelete(invitation)}
        >
          <Trash2 />
          {commonDict.actions.delete}
        </Button>
      </div>
    </li>
  );
}
