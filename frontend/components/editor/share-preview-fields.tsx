"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Check, ImageIcon, Share2 } from "lucide-react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BRAND_ASSETS, BRAND_DOMAIN } from "@/constants/brand";
import type { PhotoSlotKey } from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { coupleShortNames } from "@/components/invitation/shared/couple-name";
import { invitationMetaCopy } from "@/components/invitation/shared/invitation-display-name";
import { invitationKindOf } from "@/constants/invitation";
import { sharePreviewPhotos, sharePreviewSource } from "@/lib/share-preview";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  form: UseFormReturn<InvitationContent>;
  dict: Dictionary["editor"]["sharePreview"];
  /** Chữ của thiệp — câu tiêu đề/mô tả khi chia sẻ, theo loại thiệp. */
  invitationDict: Dictionary["invitation"];
  slots: PhotoSlotKey[];
  cardSlug?: string;
  locale: Locale;
};

export function SharePreviewFields({
  form,
  dict,
  invitationDict,
  slots,
  cardSlug,
  locale,
}: Props) {
  const content = useWatch({ control: form.control }) as InvitationContent;
  const [pickerOpen, setPickerOpen] = useState(false);
  const previewId = useId();
  const settings = content.sharePreview;
  // Nút Điền dữ liệu mẫu trong dev đổ ảnh mẫu vào form: preview cũng cần bám
  // theo chúng. Metadata và backend vẫn chỉ nhận ảnh tải lên của chủ thiệp.
  const includeSamplePhotos = process.env.NODE_ENV === "development";
  const candidates = sharePreviewPhotos(content, slots, includeSamplePhotos);
  const source = sharePreviewSource(content, slots, includeSamplePhotos);
  const positionY = source ? (settings?.positionY ?? 50) : 50;
  // Thiệp cưới chưa có tên vẫn đọc ra như một thẻ chia sẻ ("Thiệp cưới Cô dâu
  // & Chú rể"); loại khác dựng câu theo loại — xem `invitationMetaCopy`.
  const { title, description } =
    invitationKindOf(content) === "wedding"
      ? {
          title: fill(invitationDict.meta.title, {
            couple: coupleShortNames(content.couple) || dict.unnamedCouple,
          }),
          description: fill(invitationDict.meta.description, {
            couple: coupleShortNames(content.couple) || dict.unnamedCouple,
          }),
        }
      : invitationMetaCopy(invitationDict, content);
  const pickerPhotos = [
    {
      url: BRAND_ASSETS.openGraph.dark,
      label: dict.brand,
      mode: "brand" as const,
    },
    ...candidates.map(({ url }, index) => ({
      url,
      label:
        slots.includes("cover") && url === content.photos.cover
          ? dict.cover
          : fill(dict.photo, { number: index + 1 }),
      mode: "photo" as const,
    })),
  ];

  return (
    <section
      aria-labelledby={`${previewId}-title`}
      className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/15"
    >
      <div className="flex items-center gap-2 border-b border-foreground/15 bg-foreground/4 px-6 py-4 max-mobile:px-4">
        <Share2 aria-hidden className="size-4 shrink-0 text-primary" />
        <h2
          id={`${previewId}-title`}
          className="min-w-0 font-heading text-body-lg leading-snug font-medium max-mobile:text-body"
        >
          {dict.title}
        </h2>
        <Button
          type="button"
          variant="outline"
          className="ml-auto h-11 shrink-0 px-3 text-caption"
          onClick={() => setPickerOpen(true)}
        >
          <ImageIcon aria-hidden className="size-4" />
          {dict.choose}
        </Button>
      </div>
      <div className="flex flex-col gap-4 p-6">
        <p
          role="status"
          className="text-center text-caption text-muted-foreground"
        >
          {source ? dict.usingPhoto : dict.usingBrand}
        </p>
        <p className="sr-only">{dict.description}</p>
        <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-xl border border-foreground/15 bg-background">
          <div className="relative aspect-[1200/630] overflow-hidden bg-muted">
            <Image
              src={source ?? BRAND_ASSETS.openGraph.dark}
              alt={title}
              fill
              unoptimized
              sizes="(max-width: 480px) calc(100vw - 96px), 420px"
              className="object-cover"
              style={{ objectPosition: `50% ${source ? positionY : 50}%` }}
            />
          </div>
          <div className="flex flex-col gap-2 p-4">
            <p className="break-words text-body font-semibold" title={title}>
              {title}
            </p>
            <p
              className="break-words text-small text-muted-foreground"
              title={description}
            >
              {description}
            </p>
            <p
              className="truncate text-caption text-muted-foreground"
              title={
                cardSlug
                  ? `${BRAND_DOMAIN}/${locale}/t/${cardSlug}`
                  : dict.pendingLink
              }
            >
              {BRAND_DOMAIN}
            </p>
          </div>
        </div>
        <p className="text-center text-caption text-muted-foreground">
          {dict.note}
        </p>
      </div>
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl max-mobile:inset-0 max-mobile:h-dvh max-mobile:max-h-none max-mobile:w-full max-mobile:max-w-none max-mobile:translate-none max-mobile:rounded-none max-mobile:bg-background max-mobile:px-6 max-mobile:pt-[max(1.5rem,env(safe-area-inset-top))] max-mobile:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <DialogHeader>
            <DialogTitle>{dict.pickerTitle}</DialogTitle>
            <DialogDescription>{dict.pickerDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3">
            {pickerPhotos.map(({ url, label, mode }) => {
              const selected = mode === "brand" ? !source : source === url;
              return (
                <button
                  key={url}
                  type="button"
                  aria-label={label}
                  aria-pressed={selected}
                  className={cn(
                    "flex cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-transparent text-left transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    selected && "border-primary",
                  )}
                  onClick={() => {
                    form.setValue(
                      "sharePreview",
                      {
                        mode,
                        photoUrl: mode === "photo" ? url : "",
                        positionY: source === url ? positionY : 50,
                      },
                      { shouldDirty: true },
                    );
                    setPickerOpen(false);
                  }}
                >
                  <span className="relative block aspect-[1200/630] w-full overflow-hidden bg-muted">
                    <Image
                      src={url}
                      alt=""
                      fill
                      unoptimized
                      sizes="200px"
                      className="object-cover"
                    />
                    {selected ? (
                      <span className="absolute right-2 bottom-2 rounded-full bg-primary p-1 text-primary-foreground">
                        <Check aria-hidden className="size-4" />
                      </span>
                    ) : null}
                  </span>
                  <span className="w-full px-2 py-2 text-caption">{label}</span>
                </button>
              );
            })}
          </div>
          {candidates.length === 0 ? (
            <p className="text-small text-muted-foreground">{dict.empty}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
