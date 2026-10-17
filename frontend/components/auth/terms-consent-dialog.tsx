"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { LEGAL_DOCUMENTS, formatLegalDate } from "@/constants/legal";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { toLegalBlocks } from "@/components/legal/legal-blocks";

export type LegalTab = "terms" | "privacy";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mở sẵn ở văn bản người dùng vừa bấm vào. */
  tab: LegalTab;
  onTabChange: (tab: LegalTab) => void;
  /** Người dùng bấm đồng ý — form đánh dấu đã chấp thuận và đóng hộp. */
  onAgree: () => void;
  dict: Dictionary["auth"]["register"]["consent"];
  termsDict: Dictionary["legal"]["terms"];
  privacyDict: Dictionary["legal"]["privacy"];
  /** Nhãn "Phiên bản"/"Cập nhật lần cuối" — dùng chung với trang pháp lý. */
  sharedDict: Dictionary["legal"]["shared"];
  locale: Locale;
};

/**
 * Hộp chấp thuận điều khoản khi đăng ký.
 *
 * Ô tích nằm **trong** hộp này chứ không nằm ngoài form, và đó là toàn bộ lý do
 * hộp tồn tại: một ô tích cạnh hai đường link chỉ chứng minh người dùng bấm
 * trúng ô đó, còn chấp thuận thì phải diễn ra sau khi bản văn đã hiện ra trước
 * mắt họ. Vì vậy đây cũng không phải hai đường link đi nơi khác — rời trang
 * giữa chừng là mất sạch những gì vừa nhập vào form đăng ký.
 *
 * Hai văn bản chia hai tab thay vì nối đuôi nhau: gộp lại là hơn hai mươi mục
 * trong một khung cuộn, và người muốn tra đúng một điều sẽ không tìm nổi.
 */
export function TermsConsentDialog({
  open,
  onOpenChange,
  tab,
  onTabChange,
  onAgree,
  dict,
  termsDict,
  privacyDict,
  sharedDict,
  locale,
}: Props) {
  /**
   * Trạng thái cục bộ, không nối thẳng vào form: đóng hộp giữa chừng phải là
   * **không chấp thuận**. Chỉ nút xác nhận mới ghi giá trị ra ngoài.
   */
  const [checked, setChecked] = useState(false);
  const document = tab === "terms" ? termsDict : privacyDict;
  // Phiên bản hiện ngay trên bản văn, vì đây chính là con số được ghi vào sổ
  // chấp thuận: người dùng phải thấy mình đang đồng ý với bản nào.
  const meta = LEGAL_DOCUMENTS[tab];

  const onDialogOpenChange = (next: boolean) => {
    if (!next) setChecked(false);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      {/* Dưới 440px hộp chiếm trọn màn hình: khung bo góc giữa màn chỉ chừa
          chưa nửa chiều cao cho bản văn — đúng thứ người dùng phải đọc. */}
      <DialogContent className="max-w-2xl gap-0 p-0 max-mobile:inset-0 max-mobile:h-dvh max-mobile:max-h-none max-mobile:w-full max-mobile:max-w-none max-mobile:translate-none max-mobile:overflow-hidden max-mobile:rounded-none max-mobile:bg-background">
        {/* Chỗ cho nút đóng ở góc chừa trên tiêu đề chứ không trên cả header:
            chừa ở header thì thanh tab hẹp lại, nhãn tab xuống dòng và tràn
            khỏi ô cao cố định của nó. */}
        <DialogHeader className="border-b border-border px-8 pt-8 pb-6 max-mobile:px-6 max-mobile:pt-6 max-mobile:pb-5">
          <DialogTitle className="pr-8">{dict.title}</DialogTitle>
          <DialogDescription>{dict.subtitle}</DialogDescription>

          <div className="mt-5">
            <SegmentedControl
              aria-label={dict.tabsLabel}
              className="max-mobile:flex max-mobile:w-full max-mobile:[&>button]:flex-1 max-mobile:[&>button]:justify-center max-mobile:[&>button]:px-2 [&>button]:whitespace-nowrap"
              value={tab}
              onValueChange={onTabChange}
              options={[
                { value: "terms", label: dict.tabs.terms },
                { value: "privacy", label: dict.tabs.privacy },
              ]}
            />
          </div>
        </DialogHeader>

        {/* Khung cuộn riêng cho bản văn: nút xác nhận phải luôn nhìn thấy được,
            không trôi xuống dưới hai mươi mục nội dung. */}
        <div className="max-h-[45svh] overflow-y-auto overscroll-contain px-8 py-6 max-mobile:max-h-none max-mobile:min-h-0 max-mobile:flex-1 max-mobile:px-6">
          <p className="text-small text-muted-foreground">
            {sharedDict.versionLabel}:{" "}
            <span className="tabular-nums text-foreground">{meta.version}</span>
            {" · "}
            {sharedDict.updatedLabel}:{" "}
            <span className="tabular-nums">
              {formatLegalDate(meta.updatedAt, locale)}
            </span>
          </p>

          <div className="mt-6 space-y-8">
            {document.sections.map((section) => (
              <section key={section.heading}>
                <h3 className="font-heading text-body-lg leading-snug font-medium">
                  {section.heading}
                </h3>
                <div className="mt-3 space-y-3">
                  {toLegalBlocks(section.body).map((block, index) =>
                    block.kind === "ul" ? (
                      <ul
                        key={`ul-${index}`}
                        className="list-disc space-y-1.5 pl-5 text-small text-muted-foreground"
                      >
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        key={block.text}
                        className="text-small text-muted-foreground"
                      >
                        {block.text}
                      </p>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border px-8 pt-6 pb-8 max-mobile:px-6 max-mobile:pt-4 max-mobile:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <label className="flex items-start gap-2 text-small text-muted-foreground">
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => setChecked(value === true)}
              className="mt-0.5"
            />
            <span>{dict.agree}</span>
          </label>

          <div className="flex flex-wrap justify-end gap-3 max-mobile:[&>*]:flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDialogOpenChange(false)}
            >
              {dict.cancel}
            </Button>
            <Button size="sm" disabled={!checked} onClick={onAgree}>
              {dict.confirm}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
