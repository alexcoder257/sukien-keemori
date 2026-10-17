"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Copy, Download, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { cn } from "@/lib/utils";
import { giftAccountsOf } from "./invitation-blocks";
import styles from "./invitation-gift-box.module.css";

export type InvitationGiftBoxPresentation = {
  /** Inline bank/QR cards; the same dialog keeps copy and download behavior. */
  layout?: "envelopes" | "qr-cards";
  /** Hai trạng thái phải cùng tỉ lệ và cùng điểm neo để cross-fade không giật. */
  envelopeClosedSrc?: string;
  envelopeOpenSrc?: string;
  envelopeAspectRatio?: string;
  /**
   * Phong bì riêng cho từng nhà, thắng cặp `envelopeClosedSrc`/`envelopeOpenSrc`
   * ở bên được khai. Mọi cặp phải cùng khổ với `envelopeAspectRatio`.
   */
  envelopesBySide?: Partial<
    Record<"groom" | "bride", { closedSrc: string; openSrc: string }>
  >;
  /** Hoạ tiết riêng của concept, phủ trên cả hai trạng thái phong bì. */
  envelopeDecorSrc?: string;
  /** Cùng một class theme được gắn lên section, popup và backdrop portal. */
  themeClassName?: string;
  dialogClassName?: string;
  backdropClassName?: string;
  /** Open the paper first, then let the QR card rise from that envelope. */
  openingMotion?: "paper";
};

type Props = {
  giftBox: InvitationContent["giftBox"];
  dict: Dictionary["invitation"]["sections"]["giftBox"];
  presentation?: InvitationGiftBoxPresentation;
};

/**
 * **Phong bì mặc định của toàn hệ.** Một quy ước tên duy nhất cho cả hệ:
 *
 *   templates/<slug>/envelope-{closed,open}.webp   mẫu có phong bì riêng
 *   shared/envelope-{closed,open}.webp             mặc định, dùng khi không có
 *
 * Mọi thiệp chưa khai phong bì riêng đều rơi về đây — mẫu mới chưa dựng xong, slug chưa có trong bảng của
 * `ClassicInvitation`, hay preview một mẫu đang làm dở. Vì vậy nó phải luôn
 * dựng được mà không cần asset của concept nào: bao lì xì đỏ chữ hỉ là hình ảnh
 * trung tính nhất với đám cưới Việt, không mượn art direction của mẫu nào cả.
 *
 * Đây là *fallback*, không phải "phong bì trung tính": mẫu nào cố ý muốn giấy
 * trắng thì khai thẳng `envelope-neutral-*` trong presentation của mình
 * (`ClassicInvitation`, `BachMaiInvitation`), chứ không đổi hai hằng số này.
 *
 * Hai ảnh cùng khổ 520×920 và cùng canh đáy: ảnh mở chỉ khác ở tấm thiệp nhô
 * lên khỏi miệng bao. Chồng đúng vị trí rồi đổi độ mờ là ra động tác rút thiệp,
 * không cần sprite hay khung hình trung gian. Đổi ảnh mặc định thì phải giữ
 * đúng cặp cùng kích thước và tỉ lệ 520/920 — bằng đúng giá trị mặc định của
 * `--gift-envelope-ratio` trong CSS Module, nếu lệch là phong bì bị méo.
 */
const FALLBACK_ENVELOPE_CLOSED = "/images/shared/envelope-closed.avif";
const FALLBACK_ENVELOPE_OPEN = "/images/shared/envelope-open.avif";

/** Góc nghiêng lệch nhau phá thế đối xứng cứng của hai ô cạnh nhau. */
const TILTS = ["-6deg", "5deg"];

/**
 * Mã QR sinh ngay tại client từ BIN ngân hàng + số tài khoản (`lib/vietqr.ts`),
 * không gọi backend và không gọi dịch vụ ngoài nào: payload VietQR là hàm thuần
 * của hai giá trị đó. Nhờ vậy trang thiệp không phụ thuộc bên thứ ba nào để vẽ
 * được mã, và số tài khoản của cặp đôi không đi qua server lạ.
 *
 * Thiếu dữ liệu thì `qrPayload` là `null` và khối lùi về biểu tượng QR mờ —
 * khách vẫn copy được số tài khoản.
 *
 * Chỉ vẽ phần ruột — tiêu đề và khung section do template bọc ngoài quyết định.
 */
/**
 * Kích thước file PNG tải về. 1024px cho mã ~57 module là thừa nét để in lên
 * bảng đặt ở bàn lễ tân; vùng lặng (quiet zone) trắng quanh mã là yêu cầu của
 * chuẩn QR — thiếu nó nhiều máy quét không bắt được mã từ ảnh.
 */
const QR_EXPORT_SIZE = 1024;
const QR_EXPORT_PADDING = 96;

export function InvitationGiftBox({ giftBox, dict, presentation }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [origin, setOrigin] = useState<CSSProperties>({});
  const openingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (openingTimer.current) clearTimeout(openingTimer.current);
  }, []);
  const qrFrameRef = useRef<HTMLDivElement>(null);
  const envelopeClosedSrc =
    presentation?.envelopeClosedSrc ?? FALLBACK_ENVELOPE_CLOSED;
  const envelopeOpenSrc =
    presentation?.envelopeOpenSrc ?? FALLBACK_ENVELOPE_OPEN;

  const accounts = giftAccountsOf(giftBox).map((account) => ({
    ...account,
    label: account.side === "groom" ? dict.groom : dict.bride,
    closedSrc:
      presentation?.envelopesBySide?.[account.side]?.closedSrc ??
      envelopeClosedSrc,
    openSrc:
      presentation?.envelopesBySide?.[account.side]?.openSrc ?? envelopeOpenSrc,
  }));

  if (accounts.length === 0) return null;

  const opened = accounts.find((account) => account.side === openKey);

  function openEnvelope(side: string, button: HTMLButtonElement) {
    if (openingKey) return;
    if (presentation?.openingMotion !== "paper" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpenKey(side);
      return;
    }
    const box = button.getBoundingClientRect();
    setOrigin({
      "--gift-reveal-x": `${box.left + box.width / 2 - window.innerWidth / 2}px`,
      "--gift-reveal-y": `${box.top + box.height / 3 - window.innerHeight / 2}px`,
    } as CSSProperties);
    setOpeningKey(side);
    openingTimer.current = setTimeout(() => {
      setOpenKey(side);
      setOpeningKey(null);
      openingTimer.current = null;
    }, 560);
  }

  async function copy(accountNumber: string) {
    await navigator.clipboard.writeText(accountNumber);
    toast.success(dict.copied);
  }

  /**
   * Tải mã QR đang mở về dưới dạng PNG.
   *
   * Xuất từ chính SVG đang hiện chứ không sinh lại: `react-qr-code` là
   * component nên không có API "encode ra chuỗi", và mã trên màn với mã tải về
   * phải là một. SVG được vẽ lại lên canvas với **nền trắng, mực đen tuyền** —
   * ảnh tải về sẽ sống ngoài theme của thiệp (in giấy, dán Zalo) nên không được
   * mang màu `var(--gift-qr-ink)` của mẫu, và canvas cũng không resolve được
   * CSS variable trong SVG rời.
   */
  function downloadQr(account: (typeof accounts)[number]) {
    const svg = qrFrameRef.current?.querySelector("svg");
    if (!svg) return;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(QR_EXPORT_SIZE));
    clone.setAttribute("height", String(QR_EXPORT_SIZE));
    for (const path of clone.querySelectorAll("[fill]")) {
      const fill = path.getAttribute("fill") ?? "";
      path.setAttribute("fill", fill.startsWith("var(") ? "#000000" : fill);
    }

    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], {
        type: "image/svg+xml",
      }),
    );
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const total = QR_EXPORT_SIZE + QR_EXPORT_PADDING * 2;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = total;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, total, total);
      context.drawImage(
        image,
        QR_EXPORT_PADDING,
        QR_EXPORT_PADDING,
        QR_EXPORT_SIZE,
        QR_EXPORT_SIZE,
      );

      const link = document.createElement("a");
      // Tên file đọc ra được chủ nhân: "qr-mung-cuoi-techcombank-1903....png".
      link.download = ["qr-mung-cuoi", account.bank, account.accountNumber]
        .filter(Boolean)
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .concat(".png");
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  }

  return (
    <>
      {/* `items-end` + mép chồng nhau ở màn rộng: hai phong bì cùng nằm trên một
          mặt phẳng thay vì hai ô lưới cạnh nhau. */}
      <div
        className={cn(
          styles.theme,
          presentation?.layout === "qr-cards"
            ? styles.qrAccounts
            : styles.accounts,
          presentation?.themeClassName,
        )}
      >
        {accounts.map((account, index) => (
          <div key={account.side} className={styles.account}>
            <p className={cn("text-eyebrow", styles.accountLabel)}>
              {account.label}
            </p>

            {presentation?.layout === "qr-cards" ? (
              <button
                type="button"
                onClick={() => setOpenKey(account.side)}
                aria-label={fill(dict.qrLabel, { side: account.label })}
                className={styles.qrAccountButton}
              >
                <span className={styles.inlineQr}>
                  {account.qrPayload ? (
                    <QRCode
                      value={account.qrPayload}
                      bgColor="#ffffff"
                      fgColor="#14110d"
                      level="M"
                    />
                  ) : (
                    <QrCode aria-hidden />
                  )}
                </span>
                <span className={styles.inlineBank}>{account.bank}</span>
                <span className={styles.inlineOwner}>
                  {account.accountName}
                </span>
                <span>{account.accountNumber}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(event) => openEnvelope(account.side, event.currentTarget)}
                data-opening={openingKey === account.side || undefined}
                aria-busy={openingKey === account.side || undefined}
                aria-disabled={openingKey !== null || undefined}
                aria-label={fill(dict.openEnvelope, { side: account.label })}
                className={styles.envelope}
                style={
                  {
                    "--tilt": TILTS[index % TILTS.length],
                    "--gift-envelope-ratio":
                      presentation?.envelopeAspectRatio ?? "520 / 920",
                  } as CSSProperties
                }
              >
                <span className={styles.sheet}>
                  <Image
                    src={account.closedSrc}
                    alt=""
                    fill
                    sizes="240px"
                    className={`${styles.face} ${styles.faceClosed}`}
                  />
                  {/* Ảnh mở nằm trên và hiện dần khi trỏ vào. */}
                  <Image
                    src={account.openSrc}
                    alt=""
                    fill
                    sizes="240px"
                    className={`${styles.face} ${styles.faceOpen}`}
                  />
                  {presentation?.envelopeDecorSrc ? (
                    <Image
                      src={presentation.envelopeDecorSrc}
                      alt=""
                      fill
                      sizes="180px"
                      className={styles.envelopeDecor}
                    />
                  ) : null}
                </span>
                {/* Nằm ngoài `.sheet`: bóng tiếp đất thuộc về mặt bàn, không được
                  nghiêng và nhấc lên theo phong bì. */}
                <span className={styles.contact} aria-hidden />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={opened !== undefined}
        onOpenChange={(open) => {
          if (!open) setOpenKey(null);
        }}
      >
        <DialogContent
          data-gift-motion={presentation?.openingMotion}
          style={origin}
          className={cn(
            styles.theme,
            styles.dialog,
            // `max-w-md` chứ không phải `sm`: hai nút "Copy số tài khoản" và
            // "Tải mã QR" cộng lại rộng hơn 384px trừ đệm, nên ở khổ `sm` nút
            // thứ hai luôn rơi xuống hàng dưới trên mọi mẫu. Điện thoại hẹp
            // hơn khổ này thì `flex-wrap` của `.dialogActions` vẫn lo phần
            // xuống hàng.
            "max-w-md items-center gap-5 text-center",
            presentation?.themeClassName,
            presentation?.dialogClassName,
          )}
          backdropClassName={cn(
            styles.theme,
            styles.dialogBackdrop,
            presentation?.themeClassName,
            presentation?.backdropClassName,
          )}
        >
          <span className={styles.dialogOrnament} aria-hidden />
          <DialogTitle className={cn("text-eyebrow", styles.dialogTitle)}>
            {opened?.label}
          </DialogTitle>

          <div
            ref={qrFrameRef}
            aria-label={fill(dict.qrLabel, { side: opened?.label ?? "" })}
            className={styles.qrFrame}
          >
            {opened?.qrPayload ? (
              /* Nền giấy do CSS Module vẽ (kèm vùng lặng), nên `bgColor` để
                 trong suốt. Mực phải sẫm hơn nền ở mọi mẫu — xem `.qrCode`. */
              <QRCode
                value={opened.qrPayload}
                bgColor="transparent"
                fgColor="var(--gift-qr-ink, #14110d)"
                className={styles.qrCode}
                /* Mức M là mặc định của VietQR: dư sức chịu nếp gấp ảnh chụp
                   màn hình mà không làm ô vuông dày thêm. */
                level="M"
              />
            ) : (
              <QrCode aria-hidden className="size-12" />
            )}
          </div>

          {opened ? (
            <div className={styles.accountDetails}>
              {opened.bank ? (
                <p className={styles.bankName}>{opened.bank}</p>
              ) : null}
              {/* Tên chủ tài khoản không nằm trong mã QR — app ngân hàng tự tra
                  ra. Hiện ở đây để khách đối chiếu trước khi bấm chuyển, vì mã
                  sinh offline không xác minh được số tài khoản có thật không. */}
              {opened.accountName ? (
                <p className={styles.accountName}>{opened.accountName}</p>
              ) : null}
              {opened.accountNumber ? (
                <p className={styles.accountNumber}>
                  <span>{dict.accountNumber}</span>
                  <strong>{opened.accountNumber}</strong>
                </p>
              ) : null}
            </div>
          ) : null}

          {opened?.accountNumber ? (
            <div className={styles.dialogActions}>
              <Button
                variant="outline"
                size="sm"
                className={cn("gap-2", styles.copyButton)}
                onClick={() => copy(opened.accountNumber)}
              >
                <Copy />
                {dict.copy}
              </Button>
              {opened.qrPayload ? (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("gap-2", styles.copyButton)}
                  onClick={() => downloadQr(opened)}
                >
                  <Download />
                  {dict.download}
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
