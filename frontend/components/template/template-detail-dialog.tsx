"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { templateFeatures } from "@/components/template/template-features";
import { previewSrc } from "@/components/template/template-media";
import { usePreviewAutoscroll } from "@/hooks/use-preview-autoscroll";
import { useScaledFrame } from "@/hooks/use-scaled-frame";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill } from "@/lib/format";
import { reportTemplateView } from "@/lib/template-view";
import { templateEditorHref } from "@/lib/template-links";
import { templatePosterSrc } from "@/lib/template-poster";
import { cn } from "@/lib/utils";
import type { WeddingTemplate } from "@/lib/data/templates";
import styles from "./template-detail-dialog.module.css";

type Props = {
  template: WeddingTemplate;
  dict: Dictionary["templates"];
  commonDict: Dictionary["common"];
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Chi tiết một mẫu thiệp. Dialog chỉ nhận `open` từ bên ngoài: card tự vẽ lớp
 * phủ trong suốt trùm cả card (một link thật tới trang mẫu) nên bấm bất cứ đâu
 * trên card cũng mở được. Gallery chỉ dựng đúng một instance dialog cho mẫu
 * đang chọn, thay vì gắn toàn bộ hook/modal vào từng card.
 *
 * Hành động chính là **dùng mẫu**: vào thẳng editor, tự điền nội dung, ảnh và
 * danh sách khách mời. Liên hệ tư vấn là lối phụ cho ai cần thiết kế riêng.
 * Không có nhãn gói, nút yêu thích hay khối đánh giá.
 */
export function TemplateDetailDialog({
  template,
  dict,
  commonDict,
  locale,
  open,
  onOpenChange,
}: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  // Dựng y như bản xem thử trong card: thiệp khổ desktop thu nhỏ vừa khung.
  // Cùng cách dựng thì lượt tự cuộn mới cho cùng một cảm giác — chạy 1:1 trong
  // khung hẹp, mỗi px cuộn là một px trên màn hình nên nhìn vun vút.
  const { boxRef, ready, frameStyle } = useScaledFrame();
  const { play, stop } = usePreviewAutoscroll(frameRef);
  const detail = dict.detail;

  // Mở hộp thoại là "khách bấm vào mẫu này" — số liệu màn "Mẫu xem nhiều" của
  // CMS. Đặt ở đây chứ không ở từng card: kho mẫu, dải mẫu trang chủ và danh
  // sách yêu thích đều mở cùng một hộp thoại này.
  useEffect(() => {
    if (open) reportTemplateView(template.slug, "open");
  }, [open, template.slug]);
  const features = templateFeatures(
    template,
    detail.features,
    photoSlotsLabel(detail.photos, template.photoSlots.length),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) stop();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className={`flex max-h-[85svh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-4rem)] ${styles.dialog}`}>
        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {/* Bản thiệp sống, tự cuộn một lượt như khi hover card và cuộn tay
              được. Dùng route xem thử (đã bỏ phong bì) để người xem thấy nội
              dung luôn, không dừng ở màn "Mở thiệp".

              Khung có padding và nền trùng nền dialog: thiệp nằm *trên* nền
              modal như một tấm thiệp thật, thay vì hai mảng màu chạm nhau. */}
          <div className="hidden p-6 pr-0 md:block">
            {/* `aspect-[0.78]` = đúng khổ `poster.avif` (960×1231), cũng là
                khổ card. Khung từng là 0.62 (cao hơn): lớp ảnh giữ chỗ chỉ phủ
                ~80% trên, phần dưới hở ra một khoảng trống trong lúc iframe
                tải. Iframe co theo bề ngang khung (`useScaledFrame`) nên đổi
                tỉ lệ không ảnh hưởng tới nó. */}
            <div
              ref={boxRef}
              className="relative aspect-[0.78] overflow-hidden rounded-xl ring-1 ring-foreground/10"
            >
              {open && ready ? (
                <PreviewFrame
                  frameRef={frameRef}
                  src={`/${locale}/mau-thiep/${template.slug}/xem-thu`}
                  title={fill(dict.playLabel, { name: template.name })}
                  frameStyle={frameStyle}
                  thumbnailSrc={template.imageSrc}
                  onLoad={play}
                />
              ) : null}
            </div>
          </div>

          {/* Cột phải là phần đọc và tự cuộn; thanh nút nằm ngoài nó nên hành
              động chính luôn thấy được. */}
          <div className={`flex min-h-0 flex-col gap-6 overflow-y-auto overscroll-contain p-6 sm:p-8 ${styles.body}`}>
            <div className="space-y-3 pr-8">
              <div className="flex flex-wrap items-center gap-3">
                <DialogTitle className="font-heading text-h4 leading-tight font-medium">
                  {template.name}
                </DialogTitle>
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="sm">
                    {commonDict.tag[tag]}
                  </Badge>
                ))}
              </div>
              <p className="text-small text-muted-foreground">
                {template.categories
                  .map((category) => dict.categories[category])
                  .join(" · ")}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-small font-medium">{detail.featuresTitle}</h3>
              <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {features.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-small text-muted-foreground"
                  >
                    <Icon className="size-4 shrink-0 text-primary" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <p className="-mt-3 text-caption text-muted-foreground">
              {detail.customNote}
            </p>
          </div>
        </div>

        {/* Thanh hành động trải hết bề ngang modal và luôn nằm đáy, không
              cuộn theo cột phải. Nền trong suốt để nó là một tầng nổi trên
              thiệp chứ không phải một khối riêng — chỉ đường viền trên giữ
              ranh giới khi nội dung cuộn tới sát. */}
        <div className={`shrink-0 border-t border-border/60 p-6 sm:px-8 ${styles.actions}`}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={templateEditorHref(locale, template)}
              className={buttonVariants({ className: "sm:flex-1" })}
            >
              <PenLine />
              {detail.use}
            </Link>
            {/* Điều hướng trong cùng tab và giữ một entry trong history: xem
                xong demo, người dùng chỉ cần Back để trở lại gallery. */}
            <Link
              href={`/${locale}/mau-thiep/${template.slug}/demo`}
              className={buttonVariants({
                variant: "outline",
                className: "sm:flex-1",
              })}
            >
              <Eye />
              {detail.demo}
            </Link>
          </div>
          <Link
            href={`/${locale}/lien-he`}
            className="mt-3 block text-center text-small text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            {detail.choose}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type PreviewFrameProps = {
  frameRef: React.RefObject<HTMLIFrameElement | null>;
  src: string;
  title: string;
  frameStyle?: React.CSSProperties;
  /** `thumbnail.avif` của mẫu — ảnh chụp toàn thiệp ở đúng khung này. */
  thumbnailSrc?: string;
  onLoad: () => void;
};

/**
 * Bản thiệp sống trong dialog, kèm ảnh giữ chỗ trong lúc nó tải.
 *
 * Iframe là **một trang Next riêng** (`xem-thu`): tải HTML, hydrate, rồi mới
 * tải font và ảnh của mẫu — trên mạng chậm là vài giây nhìn một khung trống,
 * đọc ra như dialog hỏng. Trong lúc đó khung hiện `thumbnail.avif`: chính tấm
 * thiệp này, chụp ở đúng khung preview, lấy từ cache của card (`previewSrc`
 * giữ đúng URL để trúng cache). Iframe tải xong thì mờ dần lên trên, cùng một
 * hình nên không có cú nhảy nào.
 *
 * Tách thành component riêng để trạng thái "đã tải" tự reset: nó chỉ mount khi
 * dialog mở, đóng dialog là unmount.
 */
function PreviewFrame({
  frameRef,
  src,
  title,
  frameStyle,
  thumbnailSrc,
  onLoad,
}: PreviewFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const cardPosterSrc = templatePosterSrc(thumbnailSrc);

  return (
    <>
      {/* Lớp dưới cùng: phần khung poster chưa phủ tới (poster ngắn hơn khung)
          vẫn đọc ra là "đang tải", không phải một mảng trống. */}
      <Skeleton className="absolute inset-0 rounded-none" />
      {thumbnailSrc ? (
        <>
          {/* Hai lớp, cùng xếp theo bề ngang khung và bám mép trên, nên chồng
              lên nhau trùng khít: `poster.avif` là lát cắt nguyên điểm ảnh ở
              đầu `thumbnail.avif`. Poster chắc chắn đã trong cache (card đang
              hiện nó); ảnh dài thì chỉ khi người dùng đã hover card đủ lâu. */}
          {cardPosterSrc ? (
            <Image
              src={previewSrc(cardPosterSrc)}
              alt=""
              aria-hidden
              width={960}
              height={1231}
              unoptimized
              sizes="20rem"
              className="absolute top-0 left-0 h-auto w-full"
            />
          ) : null}
          <Image
            src={previewSrc(thumbnailSrc)}
            alt=""
            aria-hidden
            width={960}
            height={960}
            unoptimized
            sizes="20rem"
            className="absolute top-0 left-0 h-auto w-full"
          />
        </>
      ) : null}
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        tabIndex={-1}
        style={frameStyle}
        // Không nhận chuột, giống bản xem thử trong card. Để iframe bắt sự kiện
        // thì: con trỏ tự vẽ của trang tắt ngóm khi chuột đi vào, và một cú bấm
        // lọt vào bản đồ nhúng đủ để cả khung nhảy sang Google Maps. Đây là một
        // bản trình diễn, không phải chỗ để thao tác — muốn tự xem thì đã có
        // nút "Xem demo".
        className={cn(
          "pointer-events-none absolute top-0 left-0 border-0 transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={() => {
          setLoaded(true);
          onLoad();
        }}
      />
    </>
  );
}

type TriggerProps = Omit<Props, "open" | "onOpenChange">;

/**
 * Bản tự quản dành cho các dải nhỏ ngoài kho mẫu. Kho mẫu dùng dialog tập
 * trung ở gallery để không nhân hook theo số card; homepage chỉ có vài panel
 * nên wrapper này giữ call site gọn và vẫn trả focus về đúng trigger.
 */
export function TemplateDetailDialogTrigger(props: TriggerProps) {
  const { template, locale, dict } = props;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLAnchorElement>(null);

  return (
    <>
      {/* Lớp phủ là **link thật** tới trang giới thiệu mẫu, cùng cách với card
          ở kho mẫu (`template-card.tsx`): trang chủ là trang mạnh nhất site,
          nên dải mẫu nổi bật là đường thẩm quyền chảy xuống `/mau-thiep/<slug>`.
          Click thường vẫn chỉ mở dialog; Ctrl/Cmd/Shift/chuột giữa mới đi theo
          `href`. `<a>` trần thay vì `next/link` để không prefetch cả dải trang
          mẫu đang nằm trong khung nhìn. */}
      <a
        ref={triggerRef}
        href={`/${locale}/mau-thiep/${template.slug}`}
        aria-label={fill(dict.detail.open, { name: template.name })}
        className="absolute inset-0 z-10 cursor-pointer rounded-none outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
          }
          event.preventDefault();
          setOpen(true);
        }}
      />
      <TemplateDetailDialog
        {...props}
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          // Dialog mở bằng state chứ không qua trigger của nó, nên phải tự trả
          // focus về card khi đóng.
          if (!nextOpen) requestAnimationFrame(() => triggerRef.current?.focus());
        }}
      />
    </>
  );
}

/**
 * Số ô ảnh là thuộc tính của **mẫu**, nên nó hiện ở đây. Album thì thuộc
 * **gói** và không phải tính năng của mẫu — nó nằm ở trang giá, không nằm trên
 * card kho mẫu (`docs/business-model.md` mục 1).
 */
function photoSlotsLabel(
  dict: Dictionary["templates"]["detail"]["photos"],
  count: number,
) {
  return count === 0 ? dict.none : fill(dict.count, { count });
}
