"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { Plus, Search, X } from "lucide-react";
import { ApiError } from "@/apis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TierBadge } from "@/components/shared/tier-badge";
import {
  useSetHomepageTemplatesMutation,
  useAllTemplatesQuery,
} from "@/hooks/use-catalog";
import type { Dictionary } from "@/i18n/dictionaries";
import { templateCoverSrc } from "@/lib/card-preview";
import { fill } from "@/lib/format";
import {
  homepageTemplateSchema,
  type HomepageTemplateValues,
} from "@/lib/schemas/admin";
import { DragHandle, SortableListItem, SortableTable } from "./sortable-table";

type Props = {
  dict: Dictionary["admin"];
  commonDict: Dictionary["common"];
};

/** Bỏ dấu để gõ "ha noi" vẫn ra "Hà Nội Xưa". */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

function sameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((slug, index) => slug === b[index]);
}

/**
 * Dải mẫu ở trang chủ (spec mục 8), chia hai cột:
 *
 * - **Trên trang chủ**: lưới thẻ dọc theo đúng thứ tự khách sẽ thấy, kéo thẻ
 *   để đổi chỗ, bấm × để gỡ. Lưới chứ không phải danh sách: 15 mẫu xếp thành
 *   15 hàng thì cả màn chỉ còn là một cột chữ dài, và người vận hành sắp dải
 *   theo *mắt* — mẫu nào đứng cạnh mẫu nào — chứ không theo tên.
 * - **Kho mẫu**: chỉ những mẫu **chưa** chọn, có ô tìm kiếm, bấm một lần là
 *   thêm vào cuối dải. Bản trước bắt cuộn qua cả kho có ô tick để tìm một mẫu,
 *   và mẫu đã chọn hiện hai lần ở hai nơi.
 *
 * Lưu một lệnh cho cả dải theo đúng thứ tự đang hiện. Mọi mẫu đã chọn đều lên
 * trang chủ; `site_settings.homepageTemplateCount` chỉ còn dùng cho nhánh dự
 * phòng ở backend khi chưa chọn mẫu nào.
 */
export function HomepageTemplateForm({ dict, commonDict }: Props) {
  const { message } = App.useApp();
  const t = dict.homepage;
  const { data, isLoading } = useAllTemplatesQuery();
  const templates = data?.items;
  const saveMutation = useSetHomepageTemplatesMutation();
  const [query, setQuery] = useState("");

  const schema = useMemo(() => homepageTemplateSchema(), []);
  const { control, setValue, reset, handleSubmit } =
    useForm<HomepageTemplateValues>({
      resolver: zodResolver(schema),
      defaultValues: { selected: [] },
    });

  const serverSelected = useMemo(
    () =>
      (templates ?? [])
        .filter((template) => template.featuredOnHome)
        .sort((a, b) => a.homepageOrder - b.homepageOrder)
        .map((template) => template.slug),
    [templates],
  );

  // Giá trị thật chỉ có sau khi query xong, mà form đã dựng từ trước — nạp lại
  // khi dữ liệu về thay vì để form trống lúc đầu. Không phụ thuộc `reset` để
  // tránh chạy lại mỗi lần React Query refetch và nuốt thao tác sắp xếp dở tay.
  useEffect(() => {
    if (templates) reset({ selected: serverSelected });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates]);

  const selected = useWatch({ control, name: "selected" });
  // So thứ tự chứ không dùng `isDirty`: kéo đi rồi kéo về chỗ cũ là không đổi.
  const dirty = !sameOrder(selected, serverSelected);

  function setSelected(next: string[]) {
    setValue("selected", next, { shouldDirty: true });
  }

  const onSave = handleSubmit(async (values) => {
    try {
      await saveMutation.mutateAsync(values.selected);
      message.success(t.saved);
    } catch (error) {
      message.error(
        error instanceof ApiError ? error.message : dict.errors.failed,
      );
    }
  });

  const bySlug = useMemo(
    () =>
      new Map((templates ?? []).map((template) => [template.slug, template])),
    [templates],
  );
  const chosen = selected
    .map((slug) => bySlug.get(slug))
    .filter((template) => template !== undefined);
  // `ids` của dnd-kit phải trùng đúng những thẻ đang vẽ.
  const chosenIds = chosen.map((template) => template.slug);

  const needle = normalize(query);
  const library = (templates ?? [])
    .filter((template) => !selected.includes(template.slug))
    .filter(
      (template) =>
        !needle ||
        normalize(template.name).includes(needle) ||
        template.slug.includes(needle),
    )
    // Mẫu chưa xuất bản xuống cuối: thêm vào dải cũng không lên trang chủ.
    .sort((a, b) => Number(b.isPublished) - Number(a.isPublished));
  const unselectedCount = (templates?.length ?? 0) - chosen.length;

  if (isLoading) {
    return <p className="text-small text-muted-foreground">{dict.loading}</p>;
  }
  if (!templates?.length) {
    return <p className="text-small text-muted-foreground">{t.empty}</p>;
  }

  return (
    <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-body-lg font-semibold">
              {fill(t.selected, { count: chosen.length })}
            </h2>
            <p className="text-caption text-muted-foreground">
              {t.selectedHint}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dirty ? (
              <>
                <span className="text-caption text-muted-foreground">
                  {t.unsaved}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => reset({ selected: serverSelected })}
                >
                  {t.discard}
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={!dirty || saveMutation.isPending}
            >
              {t.save}
            </Button>
          </div>
        </div>

        {chosen.length ? (
          <SortableTable ids={chosenIds} onReorder={setSelected} layout="grid">
            <ol className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
              {chosen.map((template, index) => (
                <SortableListItem
                  key={template.slug}
                  id={template.slug}
                  className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div className="relative aspect-[3/4] bg-muted">
                    {/* Thẻ `img` thuần chứ không `next/image`: ảnh đi qua
                        rewrite sang frontend (xem `next.config.ts`), và bộ tối
                        ưu của Next không giúp gì cho bản xem trước nội bộ. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={templateCoverSrc(template)}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      className={`size-full object-cover object-top ${template.isPublished ? "" : "opacity-40"}`}
                    />
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-caption font-semibold text-white tabular-nums">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected(
                          selected.filter((slug) => slug !== template.slug),
                        )
                      }
                      aria-label={`${t.remove}: ${template.name}`}
                      title={t.remove}
                      className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-md bg-black/65 text-white transition-colors hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                    {!template.isPublished ? (
                      <span
                        title={t.unpublishedHint}
                        className="absolute inset-x-1.5 bottom-1.5"
                      >
                        <Badge variant="outline" size="sm">
                          {t.unpublished}
                        </Badge>
                      </span>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 items-center">
                    <DragHandle label={t.dragHandle} />
                    <span className="min-w-0 flex-1 truncate pr-2 text-small">
                      {template.name}
                    </span>
                  </div>
                </SortableListItem>
              ))}
            </ol>
          </SortableTable>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-small text-muted-foreground">
            {t.emptySelected}
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card sm:p-5 lg:sticky lg:top-6">
        <div className="space-y-1">
          <h2 className="text-body-lg font-semibold">
            {fill(t.library, { count: unselectedCount })}
          </h2>
          <p className="text-caption text-muted-foreground">{t.libraryHint}</p>
        </div>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.librarySearch}
            aria-label={t.librarySearch}
            className="w-full pl-8"
          />
        </div>
        {library.length ? (
          <ul className="-mx-2 max-h-[28rem] space-y-0.5 overflow-y-auto overscroll-contain lg:max-h-[calc(100svh-16rem)]">
            {library.map((template) => (
              <li key={template.slug}>
                <button
                  type="button"
                  onClick={() => setSelected([...selected, template.slug])}
                  aria-label={`${t.add}: ${template.name}`}
                  className="group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={templateCoverSrc(template)}
                    alt=""
                    loading="lazy"
                    className={`h-12 w-9 shrink-0 rounded border border-border object-cover object-top ${template.isPublished ? "" : "opacity-40"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small">
                      {template.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <TierBadge
                        tier={template.tier}
                        dict={commonDict.tier}
                        size="xs"
                      />
                      {!template.isPublished ? (
                        <span className="text-caption text-muted-foreground">
                          {t.unpublished}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <Plus
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-small text-muted-foreground">
            {needle ? t.noMatches : t.libraryEmpty}
          </p>
        )}
      </div>
    </section>
  );
}
