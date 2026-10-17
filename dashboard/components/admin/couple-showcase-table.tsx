"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/apis";
import type { CoupleShowcase } from "@/apis/content";
import { uploadShowcaseImage } from "@/apis/upload";
import { Badge } from "@/components/ui/badge";
import { ActionButton, ActionGroup } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminTable } from "@/components/ui/table";
import {
  useCoupleShowcasesQuery,
  useCreateCoupleShowcaseMutation,
  useDeleteCoupleShowcaseMutation,
  useReorderCoupleShowcasesMutation,
  useUpdateCoupleShowcaseMutation,
} from "@/hooks/use-content";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  showcasePosterSrc,
  templatePosterSrc,
  templateThumbnailSrc,
} from "@/lib/card-preview";
import { weddingDateLabel } from "@/lib/format";
import { withoutId } from "@/lib/entity";
import {
  coupleShowcaseSchema,
  type CoupleShowcaseValues,
} from "@/lib/schemas/admin";
import { CardPicker } from "./card-picker";
import { CoverImageField } from "./cover-image-field";
import { DragHandle, SortableRow, SortableTable } from "./sortable-table";

type Props = {
  dict: Dictionary["admin"];
  commonDict: Dictionary["common"];
};

/**
 * Neo ảnh ở mép trên: ảnh mặc định là `thumbnail.avif` — ảnh chụp dài toàn bộ
 * thiệp — nên phần lọt vào khung chính là màn bìa. Cùng giá trị mà seed đang
 * dùng, xem `site-content.seed.ts`.
 */
const TOP_ANCHOR = "50% 0%";

/**
 * Ảnh do form tự điền từ kho mẫu — chọn sang thiệp khác thì thay được. Ảnh
 * người vận hành đã tải lên (`/uploads/...`) thì không bao giờ bị thay.
 */
function isTemplateImage(src: string): boolean {
  return !src || src.startsWith("/images/templates/");
}

const EMPTY: CoupleShowcaseValues = {
  slug: "",
  kind: "template",
  names: "",
  weddingDate: "",
  imageSrc: "",
  posterSrc: "",
  imagePosition: TOP_ANCHOR,
  sortOrder: 0,
  isPublished: true,
};

/**
 * Dải "Cặp đôi đã tạo thiệp" ở trang chủ.
 *
 * Chọn thiệp bằng **ảnh** (`CardPicker`), không bằng slug: người vận hành không
 * nhớ `tuan-anh-nhu-binh` là tấm nào. Chọn một thiệp thật thì tên dâu rể và
 * ngày cưới tự điền theo thiệp — vẫn sửa lại được, vì đó là nhãn biên tập.
 * Ảnh bìa và ảnh chụp dài tải lên riêng (`uploadShowcaseImage`) cho thiệp của
 * khách, vì thiệp đó không có ảnh nào trong kho mẫu mang mặt cặp đôi thật.
 *
 * Thứ tự sắp bằng **kéo thả**, không bằng ô số: gõ số tay từng để năm ô cùng
 * mang số 1 và dải hiện theo thứ tự tạo — không ai nhìn bảng mà đoán ra được.
 */
export function CoupleShowcaseTable({ dict, commonDict }: Props) {
  const { message } = App.useApp();
  const t = dict.coupleShowcase;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CoupleShowcase | null>(null);

  const { data, isLoading } = useCoupleShowcasesQuery();
  const items = useMemo(() => data?.items ?? [], [data]);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const createMutation = useCreateCoupleShowcaseMutation();
  const updateMutation = useUpdateCoupleShowcaseMutation();
  const deleteMutation = useDeleteCoupleShowcaseMutation();
  const reorderMutation = useReorderCoupleShowcasesMutation();

  const schema = useMemo(
    () => coupleShowcaseSchema(dict.errors),
    [dict.errors],
  );
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CoupleShowcaseValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  function reportError(error: unknown) {
    message.error(
      error instanceof ApiError ? error.message : dict.errors.failed,
    );
  }

  function startCreate() {
    setEditing(null);
    // Ô mới vào cuối dải; muốn đưa lên trước thì kéo sau khi lưu.
    const last = Math.max(0, ...items.map((item) => item.sortOrder));
    reset({ ...EMPTY, sortOrder: last + 1 });
    setOpen(true);
  }

  function startEdit(item: CoupleShowcase) {
    setEditing(item);
    // `posterSrc` của hàng cũ là `null`; ô chữ cần chuỗi.
    reset({ ...withoutId(item), posterSrc: item.posterSrc ?? "" });
    setOpen(true);
  }

  function onSubmit(form: CoupleShowcaseValues) {
    const values = { ...form, posterSrc: form.posterSrc || null };
    const handlers = {
      onSuccess: () => {
        message.success(editing ? t.updated : t.created);
        setOpen(false);
      },
      onError: reportError,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, input: values }, handlers);
    } else {
      createMutation.mutate(values, handlers);
    }
  }

  function onDelete(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    deleteMutation.mutate(id, {
      onSuccess: () => message.success(t.deleted),
      onError: reportError,
    });
  }

  function onReorder(next: string[]) {
    reorderMutation.mutate(next, {
      onSuccess: () => message.success(t.reordered),
      onError: reportError,
    });
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<CoupleShowcase> = [
    {
      title: t.columns.order,
      dataIndex: "sortOrder",
      width: 96,
      render: (_, item, index) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <DragHandle label={t.dragHandle} />
          <span className="tabular-nums">{index + 1}</span>
        </div>
      ),
    },
    {
      title: t.columns.preview,
      dataIndex: "imageSrc",
      width: 96,
      render: (_, item) =>
        item.imageSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={showcasePosterSrc(item)}
            alt=""
            style={{ objectPosition: item.imagePosition || TOP_ANCHOR }}
            className="h-20 w-[3.75rem] rounded-md border border-input object-cover"
          />
        ) : (
          <div className="h-20 w-[3.75rem] rounded-md border border-dashed border-input" />
        ),
    },
    {
      title: t.columns.names,
      dataIndex: "names",
      render: (_, item) => (
        <div>
          <div className="font-medium">{item.names}</div>
          <div className="text-caption text-muted-foreground">
            /t/{item.slug}
          </div>
          <div className="text-caption text-muted-foreground">
            {item.weddingDate}
          </div>
        </div>
      ),
    },
    {
      title: t.columns.status,
      dataIndex: "isPublished",
      render: (_, item) => (
        <Badge variant={item.isPublished ? "solid" : "outline"} size="sm">
          {item.isPublished ? t.published : "—"}
        </Badge>
      ),
    },
    {
      title: t.columns.actions,
      dataIndex: "actions",
      render: (_, item) => (
        <ActionGroup>
          <ActionButton
            label={commonDict.actions.edit}
            icon={<Pencil />}
            onClick={() => startEdit(item)}
          />
          <ActionButton
            label={commonDict.actions.delete}
            icon={<Trash2 />}
            tone="danger"
            disabled={deleteMutation.isPending}
            onClick={() => onDelete(item.id)}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <Button type="button" size="sm" onClick={startCreate}>
        <Plus />
        {t.add}
      </Button>

      <p className="text-caption text-muted-foreground">{t.reorderHint}</p>

      <SortableTable ids={ids} onReorder={onReorder}>
        <AdminTable<CoupleShowcase>
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={isLoading}
          emptyText={t.empty}
          pagination={false}
          components={{ body: { row: SortableRow } }}
        />
      </SortableTable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t.edit : t.add}</DialogTitle>
          </DialogHeader>

          <form
            id="couple-showcase-form"
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="space-y-2">
              <Label>{t.card}</Label>
              <Controller
                control={control}
                name="slug"
                render={({ field }) => (
                  <CardPicker
                    value={{ kind: getValues("kind"), slug: field.value }}
                    onChange={(next, card) => {
                      // `kind` đi cùng `slug` như một cặp: đổi một nửa mà quên
                      // nửa kia là ô trỏ vào đúng slug nhưng sai loại đường dẫn.
                      setValue("kind", next.kind, { shouldDirty: true });
                      field.onChange(next.slug);
                      if (card) {
                        // Chọn một thiệp thật là chọn luôn cặp đôi của nó: tên
                        // dâu rể (tiêu đề thiệp do editor dựng từ tên gọi) và
                        // ngày cưới được ghi đè theo thiệp vừa chọn. Thiệp chưa
                        // nhập ngày thì giữ ô ngày như cũ.
                        if (card.title) {
                          setValue("names", card.title, { shouldDirty: true });
                        }
                        const date = weddingDateLabel(card.weddingDate);
                        if (date) {
                          setValue("weddingDate", date, { shouldDirty: true });
                        }
                      }
                      // Ảnh mặc định theo mẫu (thiệp thì mẫu của nó, mẫu thì
                      // chính nó) — chỉ thay ảnh còn trống hoặc ảnh kho mẫu tự
                      // điền lần trước, không đụng ảnh đã tải lên.
                      const templateSlug = card ? card.templateSlug : next.slug;
                      if (isTemplateImage(getValues("imageSrc"))) {
                        setValue("imageSrc", templateThumbnailSrc(templateSlug));
                      }
                      if (isTemplateImage(getValues("posterSrc"))) {
                        setValue("posterSrc", templatePosterSrc(templateSlug));
                      }
                    }}
                    labels={t.picker}
                  />
                )}
              />
              {errors.slug ? (
                <p className="text-caption text-destructive">
                  {errors.slug.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="names">{t.names}</Label>
                <Input
                  id="names"
                  aria-invalid={!!errors.names}
                  {...register("names")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weddingDate">{t.weddingDate}</Label>
                <Input
                  id="weddingDate"
                  placeholder="22/11/2026"
                  aria-invalid={!!errors.weddingDate}
                  {...register("weddingDate")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="posterSrc">{t.posterSrc}</Label>
              <Controller
                control={control}
                name="posterSrc"
                render={({ field }) => (
                  <CoverImageField
                    id="posterSrc"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.posterSrc}
                    upload={uploadShowcaseImage}
                    previewClassName="aspect-[0.78] h-32"
                    labels={{
                      ...t.cover,
                      remove: t.removeImage,
                      hint: t.posterSrcHint,
                    }}
                  />
                )}
              />
              {errors.posterSrc ? (
                <p className="text-caption text-destructive">
                  {errors.posterSrc.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageSrc">{t.imageSrc}</Label>
              <Controller
                control={control}
                name="imageSrc"
                render={({ field }) => (
                  <CoverImageField
                    id="imageSrc"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.imageSrc}
                    upload={uploadShowcaseImage}
                    // Ảnh chụp dài: khung đứng hẹp, chỉ lộ phần đầu — đủ để
                    // nhận ra thiệp mà không kéo dài hộp thoại.
                    previewClassName="aspect-[0.5] h-32"
                    labels={{
                      ...t.cover,
                      remove: t.removeImage,
                      hint: t.imageSrcHint,
                    }}
                  />
                )}
              />
              {errors.imageSrc ? (
                <p className="text-caption text-destructive">
                  {errors.imageSrc.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagePosition">{t.imagePosition}</Label>
              <Input
                id="imagePosition"
                placeholder={TOP_ANCHOR}
                {...register("imagePosition")}
              />
              <p className="text-caption text-muted-foreground">
                {t.imagePositionHint}
              </p>
            </div>

            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <Label className="gap-3 font-normal">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  {t.published}
                </Label>
              )}
            />
          </form>

          <DialogFooter>
            <DialogClose>{commonDict.actions.cancel}</DialogClose>
            <Button
              type="submit"
              form="couple-showcase-form"
              size="sm"
              disabled={saving}
            >
              {commonDict.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
