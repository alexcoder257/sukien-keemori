"use client";

import Link from "next/link";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill } from "@/lib/format";
import { parseGuestNames } from "@/lib/guest-list";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { EditorBlock, EditorNote } from "./editor-block";
import { EditorTextareaField } from "./editor-field";

type EditorDict = Dictionary["editor"];

/**
 * Link mời riêng cho từng khách. Đứng ngay dưới thẻ Phong bì vì thứ nó đổi là
 * đúng lời chào trên màn mở đầu đó.
 *
 * Không nằm trong `INVITATION_BLOCKS`: công tắc ở đây không ẩn/hiện section nào
 * mà bật một cách gửi thiệp khác, nên nó dùng `guestInvite.enabled` thay vì
 * `visibility`.
 *
 * Mặc định bật và công tắc đổi thẳng, không hộp xác nhận: danh sách rỗng thì
 * không có link riêng nào nên bật không đổi gì với khách, còn tắt thì giữ
 * nguyên danh sách lẫn mã link. Chỗ nói link nằm ở đâu là các dòng ghi chú
 * ngay trong thẻ.
 */
export function GuestInviteBlock({
  form,
  dict,
  locale,
  cardSlug,
}: {
  form: UseFormReturn<InvitationContent>;
  dict: EditorDict;
  locale: Locale;
  /** Có khi thiệp đã nằm trên server — lúc đó mới có trang link để mở tới. */
  cardSlug?: string;
}) {
  const t = dict.blocks.guestInvite;
  const enabled = useWatch({
    control: form.control,
    name: "guestInvite.enabled",
  });
  const guestList = useWatch({
    control: form.control,
    name: "guestInvite.guestList",
  });
  const count = parseGuestNames(guestList ?? "").length;
  const error = form.formState.errors.guestInvite?.guestList?.message;

  return (
    <EditorBlock
      // Mở sẵn kể cả khi đang tắt: gập lại thì tính năng chỉ còn một dòng
      // tiêu đề, người dùng không thấy nó làm gì để mà bật.
      title={t.title}
      visible={enabled}
      onVisibleChange={(next) =>
        form.setValue("guestInvite.enabled", next, { shouldDirty: true })
      }
      toggleLabel={dict.toggleBlock}
    >
      <EditorTextareaField
        label={t.guestList}
        placeholder={t.guestListPlaceholder}
        rows={8}
        error={error}
        registration={form.register("guestInvite.guestList")}
      />
      <p className="-mt-3 text-caption text-muted-foreground">
        {count > 0 ? fill(t.count, { count }) : t.empty}
      </p>
      <EditorNote>{t.naming}</EditorNote>
      {cardSlug ? (
        <EditorNote>
          {t.whereLinksSaved}{" "}
          {/* Tab mới: editor không cất nháp khi rời trang, mở cùng tab là
              mất danh sách đang gõ dở. */}
          <Link
            href={`/${locale}/thiep-cua-toi/${cardSlug}/khach-moi`}
            target="_blank"
            rel="noopener"
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            {t.openGuestLinks}
          </Link>
        </EditorNote>
      ) : (
        <EditorNote>{t.whereLinks}</EditorNote>
      )}
      <EditorNote>{t.renameWarning}</EditorNote>
      {enabled && count > 0 ? (
        <p className="text-caption text-muted-foreground">{t.preview}</p>
      ) : null}
    </EditorBlock>
  );
}
