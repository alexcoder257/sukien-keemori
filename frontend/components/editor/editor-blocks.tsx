"use client";

import { useRef, useState } from "react";
import {
  Controller,
  useFieldArray,
  type UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";
import {
  Music2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlbumPhoto } from "@/components/shared/album-photo";
import { PhotoUploadProgress } from "./photo-upload-progress";
import { PhotoTilePending } from "./photo-tile-pending";
import {
  useRestoringPhotos,
  type PhotoUploader,
} from "@/hooks/use-photo-upload";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALBUM_PHOTO_CAP,
  MUSIC_TRACKS,
  type PhotoSlotKey,
} from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import {
  ACCEPTED_PHOTO_TYPES,
  photoThumbnail,
  pickPhotos,
  preparePhotos,
  preparingCount,
} from "@/lib/album-uploads";
import { fill } from "@/lib/format";
import { shortName } from "@/components/invitation/shared/couple-name";
import {
  CEREMONY_KINDS,
  TIMELINE_ACTIVITY_KINDS,
  type CeremonyKind,
  type InvitationContent,
  type TimelineActivityKind,
} from "@/lib/schemas/invitation";
import {
  inferTimelineKind,
  TIMELINE_KIND_ICONS,
} from "@/components/invitation/shared/timeline-activity";
import { cn } from "@/lib/utils";
import { EditorBankField } from "./bank-field";
import { EditorPlaceField, type LocalSuggestion } from "./place-field";
import { EditorMapLinkField } from "./map-link-field";
import { EditorNote } from "./editor-block";
import { MusicPickerDialog } from "./music-picker-dialog";
import {
  EditorField,
  EditorDateField,
  EditorTimeField,
  EditorRow,
  EditorTextareaField,
  editorFieldSurface,
} from "./editor-field";

type EditorDict = Dictionary["editor"];
type Form = UseFormReturn<InvitationContent>;
type BlockProps = { form: Form; dict: EditorDict };

export function EnvelopeFields({ form, dict }: BlockProps) {
  const t = dict.blocks.envelope;
  return (
    <>
      <EditorField
        label={t.greeting}
        placeholder={t.greetingPlaceholder}
        registration={form.register("envelope.greeting")}
      />
      <EditorTextareaField
        label={t.invitation}
        placeholder={t.invitationPlaceholder}
        registration={form.register("envelope.invitation")}
      />
      <EditorNote>{dict.notes.envelope}</EditorNote>
    </>
  );
}

export function CoupleFields({ form, dict }: BlockProps) {
  const t = dict.blocks.couple;
  const errors = form.formState.errors.couple;
  // Placeholder cho tên gọi thân mật là tên sẽ tự trích khi để trống, để người
  // dùng thấy trước kết quả thay vì phải đoán.
  const groomFallback = shortName(form.watch("couple.groomFullName"));
  const brideFallback = shortName(form.watch("couple.brideFullName"));
  return (
    <>
      <EditorRow>
        <EditorField
          label={t.groomFullName}
          placeholder={t.fullNamePlaceholder}
          error={errors?.groomFullName?.message}
          required
          registration={form.register("couple.groomFullName")}
        />
        <EditorField
          label={t.brideFullName}
          placeholder={t.fullNamePlaceholder}
          error={errors?.brideFullName?.message}
          required
          registration={form.register("couple.brideFullName")}
        />
      </EditorRow>
      <EditorRow>
        <EditorField
          label={t.groomNickname}
          placeholder={groomFallback || t.nicknamePlaceholder}
          registration={form.register("couple.groomNickname")}
        />
        <EditorField
          label={t.brideNickname}
          placeholder={brideFallback || t.nicknamePlaceholder}
          registration={form.register("couple.brideNickname")}
        />
      </EditorRow>
      <EditorRow>
        <EditorField
          label={t.groomChildOrder}
          placeholder={t.childOrderPlaceholder}
          registration={form.register("couple.groomChildOrder")}
        />
        <EditorField
          label={t.brideChildOrder}
          placeholder={t.childOrderPlaceholder}
          registration={form.register("couple.brideChildOrder")}
        />
      </EditorRow>
      <EditorNote>{dict.notes.couple}</EditorNote>
    </>
  );
}

export function FamiliesFields({ form, dict }: BlockProps) {
  const t = dict.blocks.families;
  return (
    <>
      <EditorRow>
        <EditorField
          label={t.groomFather}
          placeholder={t.fatherPlaceholder}
          registration={form.register("families.groomFather")}
        />
        <EditorField
          label={t.groomMother}
          placeholder={t.motherPlaceholder}
          registration={form.register("families.groomMother")}
        />
      </EditorRow>
      <Controller
        control={form.control}
        name="families.groomAddress"
        render={({ field }) => (
          <EditorPlaceField
            label={t.groomAddress}
            placeholder={t.addressPlaceholder}
            dict={dict.places}
            value={field.value}
            onChange={field.onChange}
            // Địa chỉ nhà không lên bản đồ nào, nên toạ độ ở đây không có chỗ
            // dùng — chỉ mượn danh sách gợi ý cho đỡ phải gõ.
            onPlaceChange={() => {}}
          />
        )}
      />
      <EditorRow>
        <EditorField
          label={t.brideFather}
          placeholder={t.fatherPlaceholder}
          registration={form.register("families.brideFather")}
        />
        <EditorField
          label={t.brideMother}
          placeholder={t.motherPlaceholder}
          registration={form.register("families.brideMother")}
        />
      </EditorRow>
      <Controller
        control={form.control}
        name="families.brideAddress"
        render={({ field }) => (
          <EditorPlaceField
            label={t.brideAddress}
            placeholder={t.addressPlaceholder}
            dict={dict.places}
            value={field.value}
            onChange={field.onChange}
            // Địa chỉ nhà không lên bản đồ nào, nên toạ độ ở đây không có chỗ
            // dùng — chỉ mượn danh sách gợi ý cho đỡ phải gõ.
            onPlaceChange={() => {}}
          />
        )}
      />
      <EditorNote>{dict.notes.families}</EditorNote>
    </>
  );
}

/**
 * Gợi ý cho ô "Địa điểm" của nghi lễ, lấy từ chính những địa chỉ người dùng đã
 * nhập ở block khác. Đây là chỗ trùng lặp nhiều nhất trong cả form: lễ thành
 * hôn thường ở nhà trai, lễ vu quy ở nhà gái, tiệc ở nhà hàng đã khai bên dưới.
 * Không gọi mạng, không tốn hạn mức, chạy cả khi chưa cấu hình Places.
 */
function venueSuggestions(form: Form, dict: EditorDict): LocalSuggestion[] {
  const values = form.getValues();
  return [
    { label: dict.places.fromGroomHome, value: values.families.groomAddress },
    { label: dict.places.fromBrideHome, value: values.families.brideAddress },
    { label: dict.places.fromReception, value: values.reception.venueAddress },
  ].filter((item) => item.value.trim().length > 0);
}

export function CeremoniesFields({ form, dict }: BlockProps) {
  const t = dict.blocks.ceremonies;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ceremonies",
  });
  const errors = form.formState.errors.ceremonies;

  return (
    <>
      {fields.map((field, index) => (
        <fieldset
          key={field.id}
          className="flex flex-col gap-4 rounded-xl border border-foreground/15 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <legend className="text-eyebrow text-primary">
              {fill(t.itemTitle, { index: index + 1 })}
            </legend>
            {fields.length > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                aria-label={fill(t.remove, { index: index + 1 })}
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>

          <div>
            <Label className="mb-2">{dict.ceremonyKinds.label}</Label>
            <Controller
              control={form.control}
              name={`ceremonies.${index}.kind`}
              render={({ field: kindField }) => (
                <Select
                  value={kindField.value}
                  onValueChange={(value) => kindField.onChange(value)}
                >
                  <SelectTrigger className={editorFieldSurface}>
                    {/* Không có children thì Base UI hiện thẳng value (key
                        `groom`…) thay vì nhãn đã dịch. */}
                    <SelectValue>
                      {(kind: CeremonyKind) => dict.ceremonyKinds[kind]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CEREMONY_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {dict.ceremonyKinds[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* `other` không có nhãn dịch sẵn nên tên nghi lễ phải nhập tay. */}
          {form.watch(`ceremonies.${index}.kind`) === "other" ? (
            <EditorField
              label={t.customKind}
              placeholder={t.customKindPlaceholder}
              error={errors?.[index]?.customKind?.message}
              required
              registration={form.register(`ceremonies.${index}.customKind`)}
            />
          ) : null}

          <EditorRow>
            <Controller
              control={form.control}
              name={`ceremonies.${index}.dateTime`}
              render={({ field }) => {
                const [time = "", date = ""] = field.value.split(" · ");
                return (
                  // Ngày cần nhiều chỗ hơn giờ: "14/11/2026" dài gấp đôi
                  // "08 : 00", chia đôi cứng thì ô giờ thừa chỗ còn ô ngày chật.
                  // Ô giờ cần bề rộng **cố định** khi hai ô nằm cùng hàng: nội
                  // dung của nó luôn là hai số nên chia theo tỉ lệ chỉ khiến nó
                  // co lại tới mức cắt chữ. Ở mobile, xếp dọc để ngày vẫn đủ chỗ
                  // cho cả giá trị và icon; từ `sm`, 170px vừa đủ hai select
                  // cộng dấu hai chấm.
                  <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
                    <EditorDateField
                      label={t.dateTime}
                      value={date}
                      onChange={(nextDate) =>
                        field.onChange(`${time} · ${nextDate}`)
                      }
                      error={errors?.[index]?.dateTime?.message}
                      required
                    />
                    <EditorTimeField
                      label="Giờ"
                      value={time}
                      onChange={(nextTime) =>
                        field.onChange(`${nextTime} · ${date}`)
                      }
                    />
                  </div>
                );
              }}
            />
            <Controller
              control={form.control}
              name={`ceremonies.${index}.venue`}
              render={({ field }) => (
                <EditorPlaceField
                  label={t.venue}
                  placeholder={t.venuePlaceholder}
                  error={errors?.[index]?.venue?.message}
                  required
                  dict={dict.places}
                  localSuggestions={venueSuggestions(form, dict)}
                  value={field.value}
                  onChange={field.onChange}
                  onPlaceChange={(place) =>
                    form.setValue(`ceremonies.${index}.venuePlace`, place, {
                      shouldDirty: true,
                    })
                  }
                />
              )}
            />
          </EditorRow>

          <EditorTextareaField
            label={t.note}
            placeholder={t.notePlaceholder}
            registration={form.register(`ceremonies.${index}.note`)}
          />
        </fieldset>
      ))}

      <EditorNote>{dict.notes.ceremonies}</EditorNote>

      <Button
        variant="outline"
        size="sm"
        className="self-start gap-2"
        onClick={() =>
          append({
            kind: "other",
            customKind: "",
            dateTime: "",
            venue: "",
            venuePlace: null,
            note: "",
          })
        }
      >
        <Plus />
        {t.add}
      </Button>
    </>
  );
}

/** Tiệc cưới / thời gian & địa điểm của thiệp. */
export function ReceptionFields({ form, dict }: BlockProps) {
  const t = dict.blocks.reception;
  const errors = form.formState.errors.reception;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Controller
          control={form.control}
          name="reception.date"
          render={({ field }) => (
            <EditorDateField
              label={t.date}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="reception.welcomeTime"
          render={({ field }) => (
            <EditorTimeField
              label={t.welcomeTime}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="reception.startTime"
          render={({ field }) => (
            <EditorTimeField
              label={t.startTime}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
      </div>
      <EditorField
        label={t.venueLabel}
        placeholder={t.venueLabelPlaceholder}
        registration={form.register("reception.venueLabel")}
      />
      <Controller
        control={form.control}
        name="reception.venueAddress"
        render={({ field }) => (
          <EditorPlaceField
            label={t.venueAddress}
            placeholder={t.venueAddressPlaceholder}
            dict={dict.places}
            value={field.value ?? ""}
            onChange={field.onChange}
            onPlaceChange={(place) =>
              form.setValue("reception.venuePlace", place, {
                shouldDirty: true,
              })
            }
          />
        )}
      />
      <Controller
        control={form.control}
        name="reception.mapUrl"
        render={({ field }) => (
          <EditorMapLinkField
            label={t.mapUrl}
            placeholder={t.mapUrlPlaceholder}
            error={errors?.mapUrl?.message}
            dict={dict.places}
            value={field.value ?? ""}
            onChange={field.onChange}
            onPlaceChange={(place) =>
              form.setValue("reception.venuePlace", place, {
                shouldDirty: true,
              })
            }
            onPlaceName={(address) => {
              // Dán link là xong: địa chỉ điền hộ luôn, khỏi gõ tay. Ô vẫn sửa
              // được bình thường sau đó — tên Google đặt không phải lúc nào
              // cũng là tên người ta muốn in lên thiệp.
              form.setValue("reception.venueAddress", address, {
                shouldDirty: true,
              });
            }}
          />
        )}
      />
      <EditorNote>{dict.notes.reception}</EditorNote>
    </>
  );
}

/** Giá trị riêng của ô chọn cho "Tự động"; trong form nó là `null`. */
const TIMELINE_KIND_AUTO = "auto";
type TimelineKindOption = TimelineActivityKind | typeof TIMELINE_KIND_AUTO;

/**
 * Nhãn một lựa chọn biểu tượng. Ở "Tự động" nó hiện luôn loại đang được đoán
 * từ chữ ("Tự động · Khai tiệc"), để người dùng biết khi nào cần chọn tay thay
 * vì phải mở thiệp ra mới thấy icon sai.
 */
function TimelineKindLabel({
  option,
  inferred,
  dict,
}: {
  option: TimelineKindOption;
  inferred?: TimelineActivityKind;
  dict: EditorDict["blocks"]["timeline"];
}) {
  const kind = option === TIMELINE_KIND_AUTO ? inferred : option;
  const Icon = kind ? TIMELINE_KIND_ICONS[kind] : Sparkles;
  const label =
    option !== TIMELINE_KIND_AUTO
      ? dict.kinds[option]
      : kind
        ? `${dict.iconAuto} · ${dict.kinds[kind]}`
        : dict.iconAuto;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function TimelineFields({
  form,
  dict,
  hiddenKinds = [],
}: BlockProps & {
  /**
   * Loại mốc không có nghĩa với loại thiệp đang soạn (lễ gia tiên, đón dâu của
   * một thiệp sinh nhật) — không có trong danh sách chọn. Mốc đã lưu với loại
   * đó vẫn giữ nguyên giá trị.
   */
  hiddenKinds?: readonly TimelineActivityKind[];
}) {
  const t = dict.blocks.timeline;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "timeline.items",
  });
  const errors = form.formState.errors.timeline?.items;

  return (
    <>
      <EditorField
        label={t.customTitle}
        placeholder={t.customTitlePlaceholder}
        registration={form.register("timeline.title")}
      />

      {fields.map((field, index) => (
        <div
          key={field.id}
          role="group"
          aria-labelledby={`timeline-item-${field.id}`}
          className="flex flex-col gap-4 rounded-xl border border-foreground/15 bg-foreground/2 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <p
              id={`timeline-item-${field.id}`}
              className="text-eyebrow text-primary"
            >
              {fill(t.itemTitle, { index: index + 1 })}
            </p>
            <Button
              variant="destructive"
              aria-label={fill(t.remove, { index: index + 1 })}
              onClick={() => remove(index)}
            >
              <Trash2 />
              {t.delete}
            </Button>
          </div>

          {/* `items-start`, không phải `items-end`: dòng báo lỗi dưới ô giờ làm
              cột đó cao thêm, căn đáy thì các cột còn lại bị kéo xuống theo và
              nhãn lệch nhau. Ba nhãn cùng một dòng nên căn đầu vẫn giữ các ô
              nhập thẳng hàng. */}
          <div className="grid gap-4 sm:grid-cols-[9rem_9rem_minmax(0,1fr)] sm:items-start">
            {/* `EditorTimeField` chứ không phải `input[type="time"]`: xem lý do ở
                chính component — input gốc hiện 12h hay 24h theo locale của máy,
                nên editor đọc "05:30 PM" trong khi thiệp in "17:30". Nó cũng là
                thứ giữ ô rỗng ở `--:--` thay vì để picker gốc seed giờ hiện tại
                vào một ô người dùng chưa đụng tới. */}
            <Controller
              control={form.control}
              name={`timeline.items.${index}.startTime`}
              render={({ field }) => (
                <EditorTimeField
                  label={t.fromTime}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors?.[index]?.startTime?.message}
                  required
                />
              )}
            />
            {/* Không `required`: giờ kết thúc là tuỳ chọn, xem `timelineItemSchema`. */}
            <Controller
              control={form.control}
              name={`timeline.items.${index}.endTime`}
              render={({ field }) => (
                <EditorTimeField
                  label={t.toTime}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors?.[index]?.endTime?.message}
                />
              )}
            />
            {/* Chọn **nghĩa** của biểu tượng, không chọn hình: mỗi mẫu tự vẽ
                loại này bằng icon/ảnh decor của nó, xem `timeline-activity.ts`. */}
            <Controller
              control={form.control}
              name={`timeline.items.${index}.kind`}
              render={({ field: kindField }) => {
                const inferred = inferTimelineKind(
                  form.watch(`timeline.items.${index}.activity`) ?? "",
                );
                return (
                  <div className="min-w-0">
                    <Label className="mb-2">{t.icon}</Label>
                    <Select
                      value={kindField.value ?? TIMELINE_KIND_AUTO}
                      onValueChange={(value) => {
                        const next =
                          value === TIMELINE_KIND_AUTO
                            ? null
                            : (value as TimelineActivityKind);
                        // Chọn biểu tượng thì điền luôn tên loại vào ô Hoạt
                        // động — nhưng chỉ khi ô đang trống hoặc vẫn là chữ
                        // tự điền từ lần chọn trước. Chữ người dùng tự gõ thì
                        // không bao giờ bị ghi đè.
                        const activityPath =
                          `timeline.items.${index}.activity` as const;
                        const current = (
                          form.getValues(activityPath) ?? ""
                        ).trim();
                        const previous = kindField.value
                          ? t.kinds[kindField.value]
                          : "";
                        if (next && (!current || current === previous)) {
                          form.setValue(activityPath, t.kinds[next], {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                        kindField.onChange(next);
                      }}
                    >
                      <SelectTrigger
                        className={cn(editorFieldSurface, "w-full")}
                        aria-label={t.icon}
                      >
                        <SelectValue>
                          {(option: TimelineKindOption) => (
                            <TimelineKindLabel
                              option={option}
                              inferred={inferred}
                              dict={t}
                            />
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TIMELINE_KIND_AUTO}>
                          <TimelineKindLabel
                            option={TIMELINE_KIND_AUTO}
                            inferred={inferred}
                            dict={t}
                          />
                        </SelectItem>
                        {TIMELINE_ACTIVITY_KINDS.filter(
                          (kind) =>
                            !hiddenKinds.includes(kind) || kindField.value === kind,
                        ).map((kind) => (
                          <SelectItem key={kind} value={kind}>
                            <TimelineKindLabel option={kind} dict={t} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }}
            />
          </div>
          <EditorField
            label={t.activity}
            placeholder={t.activityPlaceholder}
            error={errors?.[index]?.activity?.message}
            required
            registration={form.register(`timeline.items.${index}.activity`)}
          />
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="self-start gap-2"
        onClick={() =>
          append({ startTime: "", endTime: "", activity: "", kind: null })
        }
      >
        <Plus />
        {t.add}
      </Button>

      <EditorNote>{dict.notes.timeline}</EditorNote>
    </>
  );
}

export function CountdownFields({ form, dict }: BlockProps) {
  const t = dict.blocks.countdown;
  return (
    <>
      <Controller
        control={form.control}
        name="countdown.weddingDate"
        render={({ field }) => {
          const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(
            field.value ?? "",
          );
          const date = match ? `${match[3]}/${match[2]}/${match[1]}` : "";
          const time = match?.[4] ?? "";
          return (
            <EditorRow>
              <EditorDateField
                label={t.weddingDate}
                value={date}
                onChange={(nextDate) => {
                  const [day, month, year] = nextDate.split("/");
                  field.onChange(
                    `${year}-${month}-${day}T${time || "00:00"}:00+07:00`,
                  );
                }}
              />
              <EditorTimeField
                label="Giờ"
                value={time}
                onChange={(nextTime) => {
                  const nextDate = date
                    ? date.split("/").reverse().join("-")
                    : "";
                  if (nextDate)
                    field.onChange(`${nextDate}T${nextTime}:00+07:00`);
                }}
              />
            </EditorRow>
          );
        }}
      />
      <EditorNote>{dict.notes.countdown}</EditorNote>
    </>
  );
}

export function StoryFields({ form, dict }: BlockProps) {
  const t = dict.blocks.story;
  return (
    <>
      <EditorTextareaField
        label={t.message}
        placeholder={t.messagePlaceholder}
        rows={5}
        registration={form.register("story.message")}
      />
      <EditorNote>{dict.notes.story}</EditorNote>
    </>
  );
}

/**
 * Ảnh chọn xong được gửi ngay lên vùng tạm, kể cả khi chưa đăng nhập (xem
 * `lib/photo-staging.ts`), và chỉ thành ảnh của thiệp lúc bấm Lưu. Giới hạn
 * hiển thị ở đây để người dùng biết trước, nhưng backend vẫn là nơi kiểm tra
 * thật.
 *
 * Ô ảnh trong thiết kế — thứ phân biệt gói Gold với gói Free
 * (`docs/business-model.md` mục 1). Số ô và ý nghĩa từng ô do mẫu quy định nên
 * đây là một danh sách cố định, không thêm không bớt: khách chỉ đổ ảnh vào.
 *
 * Ảnh của ô mà mẫu hiện tại không có vẫn nằm nguyên trong form, chỉ là không
 * hiện ở đây — đổi mẫu rồi đổi lại là thấy lại đủ.
 */
export function PhotoSlotFields({
  form,
  dict,
  slots,
  uploader,
}: BlockProps & {
  slots: PhotoSlotKey[];
  uploader: PhotoUploader;
}) {
  const t = dict.blocks.photos;
  const photos = form.watch("photos");
  const restoring = useRestoringPhotos();

  /**
   * Đọc lại giá trị hiện tại thay vì dùng bản chụp của lần render này, để hai
   * ô đổi gần như cùng lúc không đè lên nhau.
   */
  const setPhoto = (key: PhotoSlotKey, value: string | undefined) => {
    const next = { ...form.getValues("photos") };
    if (value) next[key] = value;
    else delete next[key];
    form.setValue("photos", next, { shouldDirty: true });
  };

  return (
    <>
      {/* Ô ảnh có tỉ lệ khung cố định theo mẫu, nên lưới ở đây để ô vuông cho
          đều — người dùng thấy khung thật ở chế độ xem thiệp. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {slots.map((slot) => (
          <PhotoSlotPicker
            key={slot}
            label={t.slots[slot]}
            value={photos[slot]}
            restoring={restoring.slots.has(slot)}
            onChange={(value) => setPhoto(slot, value)}
            uploader={uploader}
            uploadDict={dict.photoUpload}
            dict={t}
          />
        ))}
      </div>
      <EditorNote>
        {fill(dict.notes.photoSlots, { count: slots.length })}
      </EditorNote>
    </>
  );
}

/** Một ô ảnh: bấm để chọn, có ảnh rồi thì đổi hoặc gỡ. */
function PhotoSlotPicker({
  label,
  value,
  restoring,
  onChange,
  uploader,
  uploadDict,
  dict,
}: {
  label: string;
  value?: string;
  /** Ảnh của bản nháp cho ô này còn đang tải lại. */
  restoring: boolean;
  onChange: (value: string | undefined) => void;
  uploader: PhotoUploader;
  uploadDict: EditorDict["photoUpload"];
  dict: EditorDict["blocks"]["photos"];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Cho phép chọn lại đúng file vừa gỡ.
    event.target.value = "";
    if (files.length === 0) return;

    // Mỗi ô đúng một ảnh: chọn nhiều thì chỉ lấy tấm đầu.
    const { accepted, rejections } = pickPhotos(files.slice(0, 1), 1);

    // Ô đơn chỉ nhận đúng một file nên định dạng là lý do bị loại duy nhất.
    if (rejections.length > 0) toast.error(dict.rejectedType);
    if (accepted.length === 0) return;

    // Thu nhỏ trước rồi mới vào form — xem `preparePhotos`.
    setPreparing(true);
    void preparePhotos(accepted, (picked) => {
      if (value) uploader.remove(value);
      onChange(picked);
      // Gửi ngay lên vùng tạm, không đợi lượt lưu: xem `lib/photo-staging.ts`.
      uploader.upload([picked], "photo");
    }).finally(() => setPreparing(false));
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {preparing || (restoring && !value) ? (
        <PhotoTilePending label={uploadDict.pending} />
      ) : value ? (
        <div className="relative">
          {/* Thumbnail chứ không phải bản chính — xem `photoThumbnail`. */}
          <AlbumPhoto src={photoThumbnail(value)} label={label} />
          <PhotoUploadProgress
            url={value}
            failedLabel={uploadDict.retryLater}
          />
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={fill(dict.removeSlot, { name: label })}
            className="absolute -top-2 -right-2 rounded-full bg-background"
            onClick={() => {
              uploader.remove(value);
              onChange(undefined);
            }}
          >
            <X />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="aspect-square h-auto w-full flex-col gap-2 border-dashed text-caption"
          onClick={() => inputRef.current?.click()}
        >
          <Plus />
          {dict.upload}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_PHOTO_TYPES.join(",")}
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}

/**
 * Album ảnh của thiệp — loại ảnh thứ hai, tách hẳn khỏi ô ảnh trong thiết kế
 * của mẫu. Thiệp nào cũng có album, giới hạn bởi `ALBUM_PHOTO_CAP`.
 */
export function AlbumFields({
  form,
  dict,
  uploader,
}: BlockProps & {
  uploader: PhotoUploader;
}) {
  const t = dict.blocks.album;
  const photos = form.watch("album.photos");
  const inputRef = useRef<HTMLInputElement>(null);
  // Số tấm đã chọn, đang thu nhỏ, chưa vào form — vẽ thành ô giữ chỗ.
  const [preparing, setPreparing] = useState(0);
  // Tấm của bản nháp còn đang tải lại: đã có chỗ trong album, chỉ chưa có ảnh.
  const restoring = useRestoringPhotos().album;

  const limit = ALBUM_PHOTO_CAP;
  const full = photos.length + preparing + restoring >= limit;

  const setPhotos = (next: string[]) =>
    form.setValue("album.photos", next, { shouldDirty: true });

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Cho phép chọn lại đúng file vừa xoá.
    event.target.value = "";
    if (files.length === 0) return;

    const { accepted, rejections } = pickPhotos(
      files,
      limit - photos.length - restoring - preparingCount(),
      photos,
    );

    if (accepted.length > 0) {
      // Thu nhỏ từng tấm rồi mới vào form (xem `preparePhotos`): tấm nào xong
      // thì hiện và gửi lên vùng tạm ngay, không đợi cả lô. Đọc `getValues`
      // chứ không dùng `photos` của lần render này — form đổi sau mỗi tấm.
      let done = 0;
      setPreparing((count) => count + accepted.length);
      void preparePhotos(accepted, (url) => {
        done += 1;
        setPreparing((count) => count - 1);
        setPhotos([...form.getValues("album.photos"), url]);
        uploader.upload([url], "album");
      }).finally(() =>
        // Chỉ trả phần còn lại của *lô này* nếu nó dừng giữa chừng.
        setPreparing((count) => count - (accepted.length - done)),
      );
    }

    for (const reason of new Set(rejections)) {
      toast.error(
        reason === "type"
          ? t.rejectedType
          : reason === "duplicate"
            ? t.rejectedDuplicate
            : fill(t.rejectedLimit, { limit }),
      );
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <div key={photo} className="relative">
            <AlbumPhoto
              src={photoThumbnail(photo)}
              label={fill(t.photoLabel, { index: index + 1 })}
            />
            <PhotoUploadProgress
              url={photo}
              failedLabel={dict.photoUpload.retryLater}
            />
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={fill(t.removePhoto, { index: index + 1 })}
              className="absolute -top-2 -right-2 rounded-full bg-background"
              onClick={() => {
                uploader.remove(photo);
                setPhotos(
                  photos.filter((_, photoIndex) => photoIndex !== index),
                );
              }}
            >
              <X />
            </Button>
          </div>
        ))}

        {Array.from({ length: restoring + preparing }, (_, index) => (
          <PhotoTilePending key={index} label={dict.photoUpload.pending} />
        ))}

        {!full ? (
          <Button
            variant="outline"
            className="aspect-square h-auto flex-col gap-2 border-dashed text-caption"
            onClick={() => inputRef.current?.click()}
          >
            <Plus />
            {t.upload}
          </Button>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_PHOTO_TYPES.join(",")}
          className="hidden"
          onChange={onPick}
        />
      </div>

      <p className="text-caption text-muted-foreground">
        {fill(t.countLabel, {
          count: photos.length + restoring + preparing,
        })}
      </p>
      <EditorNote>{dict.notes.album}</EditorNote>
    </>
  );
}

export function GiftBoxFields({
  form,
  dict,
  singleAccount = false,
}: BlockProps & {
  /**
   * Thiệp khác thiệp cưới chỉ có một tài khoản nhận quà, nằm ở ô `groom` —
   * xem `giftBoxForKind`.
   */
  singleAccount?: boolean;
}) {
  const t = dict.blocks.giftBox;
  return (
    <>
      <GiftAccountFields side="groom" form={form} dict={dict} />
      {singleAccount ? null : (
        <GiftAccountFields side="bride" form={form} dict={dict} />
      )}
      <EditorNote>{t.qrNote}</EditorNote>
    </>
  );
}

/**
 * Một bên nhận mừng cưới. Ba ô đi liền nhau vì chúng mô tả **một** tài khoản:
 * tách ngân hàng ra một hàng và số tài khoản sang hàng khác thì nhìn như hai
 * việc rời nhau, mà nhập thiếu một ô là mất mã QR.
 */
function GiftAccountFields({
  side,
  form,
  dict,
}: BlockProps & { side: "groom" | "bride" }) {
  const t = dict.blocks.giftBox;
  const errors = form.formState.errors.giftBox?.[side];
  const accountNumber = form.register(`giftBox.${side}.accountNumber`);

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:[&>*]:min-w-0">
      <Controller
        control={form.control}
        name={`giftBox.${side}.bankBin`}
        render={({ field }) => (
          <EditorBankField
            label={side === "groom" ? t.groomBank : t.brideBank}
            placeholder={t.bankPlaceholder}
            value={field.value}
            onChange={field.onChange}
            error={errors?.bankBin?.message}
            dict={dict.banks}
          />
        )}
      />
      <EditorField
        label={side === "groom" ? t.groomAccount : t.brideAccount}
        placeholder={t.accountPlaceholder}
        error={errors?.accountNumber?.message}
        registration={{
          ...accountNumber,
          // Người dùng quen gõ số tài khoản có khoảng trắng cho dễ đọc, và dán
          // từ app ngân hàng thì hay dính dấu chấm. Payload VietQR chỉ nhận chữ
          // và số, nên lọc ngay lúc gõ. Sửa thẳng `event.target.value` chứ không
          // dùng `setValueAs`: ô nhập là uncontrolled nên nếu chỉ lọc ở form
          // state thì màn hình hiện một đằng, dữ liệu lưu một nẻo.
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
            event.target.value = event.target.value.replace(
              /[^0-9A-Za-z]/g,
              "",
            );
            return accountNumber.onChange(event);
          },
        }}
      />
      <EditorField
        label={side === "groom" ? t.groomAccountName : t.brideAccountName}
        placeholder={t.accountNamePlaceholder}
        error={errors?.accountName?.message}
        className="sm:col-span-2"
        registration={form.register(`giftBox.${side}.accountName`)}
      />
    </div>
  );
}

export function MusicFields({ form, dict }: BlockProps) {
  const t = dict.blocks.music;
  const [pickerOpen, setPickerOpen] = useState(false);
  // Fragment chứ không bọc `div`, để khoảng cách giữa field và ghi chú do
  // `gap` của EditorBlock quyết định giống mọi block khác.
  return (
    <>
      <div>
        <Label className="mb-2">{t.track}</Label>
        <Controller
          control={form.control}
          name="music.trackId"
          render={({ field }) => {
            const selected = MUSIC_TRACKS.find(
              (track) => track.id === field.value,
            );
            return (
              <>
                {/* Chọn nhạc mở modal chứ không phải dropdown, để nghe thử được
                    từng bài trước khi chốt. */}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className={cn(
                    "flex h-11 w-full items-center justify-between gap-3 rounded-lg border px-4 text-left text-body transition-colors hover:bg-foreground/8 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                    editorFieldSurface,
                    !selected && "text-foreground/35",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <Music2
                      aria-hidden
                      className="size-4 shrink-0 text-primary"
                    />
                    {selected ? (
                      <>
                        <span className="truncate">{selected.title}</span>
                        <span className="shrink-0 text-small text-muted-foreground">
                          · {selected.artist}
                        </span>
                      </>
                    ) : (
                      t.trackPlaceholder
                    )}
                  </span>
                  <span className="shrink-0 text-small text-muted-foreground">
                    {selected ? t.change : t.choose}
                  </span>
                </button>
                <MusicPickerDialog
                  open={pickerOpen}
                  onOpenChange={setPickerOpen}
                  value={field.value}
                  onSelect={field.onChange}
                  dict={t}
                  cancelLabel={t.cancel}
                />
              </>
            );
          }}
        />
      </div>
      <EditorNote>{dict.notes.music}</EditorNote>
    </>
  );
}

/**
 * Sổ lưu bút trong editor: chỉ có công tắc của thẻ và lối sang trang quản lý.
 *
 * Duyệt/xoá lời chúc **không** nằm ở đây. Editor là chỗ soạn nội dung thiệp;
 * duyệt lời chúc và đếm khách là việc làm đi làm lại sau khi đã gửi thiệp, và
 * chỗ của nó là Thiệp của tôi (`thiep-cua-toi/<slug>/loi-chuc`). Một danh sách
 * thứ hai ở đây chỉ kéo dài form và chia một việc ra hai nơi.
 */
export function WishesFields({
  cardSlug,
  dict,
  locale,
}: Omit<BlockProps, "form"> & { cardSlug?: string; locale: Locale }) {
  const t = dict.blocks.wishes;
  return (
    <>
      <EditorNote>{dict.notes.wishes}</EditorNote>
      <ManageElsewhereNote
        href={
          cardSlug ? `/${locale}/thiep-cua-toi/${cardSlug}/loi-chuc` : undefined
        }
        savedText={t.whereWishesSaved}
        unsavedText={t.whereWishes}
        linkText={t.openWishes}
      />
    </>
  );
}

/**
 * Xác nhận tham dự: công tắc của thẻ và lối sang trang quản lý, cùng lý do với
 * sổ lưu bút — danh sách phản hồi nằm
 * ở `thiep-cua-toi/<slug>/xac-nhan`, không nằm trong form soạn thiệp.
 */
export function RsvpFields({
  cardSlug,
  dict,
  locale,
}: Omit<BlockProps, "form"> & {
  cardSlug?: string;
  locale: Locale;
}) {
  const t = dict.blocks.rsvp;
  return (
    <>
      <EditorNote>{dict.notes.rsvp}</EditorNote>
      <ManageElsewhereNote
        href={
          cardSlug ? `/${locale}/thiep-cua-toi/${cardSlug}/xac-nhan` : undefined
        }
        savedText={t.whereResponsesSaved}
        unsavedText={t.whereResponses}
        linkText={t.openResponses}
      />
    </>
  );
}

/**
 * "Việc này quản lý ở Thiệp của tôi". Thiệp đã lưu thì kèm link mở thẳng màn
 * đó; chưa lưu lần nào thì chưa có đường dẫn, chỉ nói chỗ tìm.
 */
function ManageElsewhereNote({
  href,
  savedText,
  unsavedText,
  linkText,
}: {
  href?: string;
  savedText: string;
  unsavedText: string;
  linkText: string;
}) {
  if (!href) return <EditorNote>{unsavedText}</EditorNote>;
  return (
    <EditorNote>
      {savedText}{" "}
      {/* Tab mới: editor không cất nháp khi rời trang, mở cùng tab là mất
          những gì đang gõ dở. */}
      <Link
        href={href}
        target="_blank"
        rel="noopener"
        className="font-medium text-primary underline underline-offset-4 hover:no-underline"
      >
        {linkText}
      </Link>
    </EditorNote>
  );
}

export function ThankYouFields({ form, dict }: BlockProps) {
  const t = dict.blocks.thankYou;
  return (
    <>
      <EditorTextareaField
        label={t.message}
        placeholder={t.messagePlaceholder}
        rows={4}
        registration={form.register("thankYou.message")}
      />
      <EditorNote>{dict.notes.thankYou}</EditorNote>
    </>
  );
}
