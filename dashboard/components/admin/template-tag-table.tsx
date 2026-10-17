"use client";

import { useEffect, useState } from "react";
import { App } from "antd";
import { Save } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { ApiError } from "@/apis";
import type { Template } from "@/apis/catalog";
import { ActionButton, ActionGroup } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminTable } from "@/components/ui/table";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_COLOR_SWATCHES,
  TEMPLATE_TAGS,
  type TemplateCategory,
  type TemplateTag,
} from "@/constants/template";
import { TIERS, type Tier } from "@/constants/tier";
import {
  useTemplatePageQuery,
  useUpdateTemplateMutation,
} from "@/hooks/use-catalog";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Dictionary } from "@/i18n/dictionaries";
import { templateThumbnailSrc } from "@/lib/card-preview";

type Props = {
  dict: Dictionary["admin"];
  commonDict: Dictionary["common"];
};

/** Phần của một mẫu mà màn này sửa được. */
type Draft = Pick<Template, "tier" | "tags" | "categories" | "isPublished">;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * Quản lý bậc và tag của mẫu thiệp (spec mục 7).
 *
 * Sửa tại chỗ từng dòng rồi lưu từng mẫu: kho mẫu là danh sách dài và người vận
 * hành thường chỉ chỉnh một hai mẫu — một nút "lưu tất cả" sẽ gửi lại cả kho và
 * ghi đè thay đổi mà người khác vừa lưu.
 *
 * `slug` không có ô nhập: nó là khoá nối tới component và thư mục ảnh của trang
 * khách, đổi được thì thiệp đã tạo mất mẫu.
 */
export function TemplateTagTable({ dict, commonDict }: Props) {
  const { message } = App.useApp();
  const t = dict.templateTags;
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [nameQuery, setNameQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<Tier | "all">("all");

  const [page, setPage] = useState(0);

  // Bộ lọc gửi xuống backend chứ không lọc tại chỗ: lọc trong trang chỉ tìm
  // được trong 20 mẫu đang hiện, và người vận hành sẽ kết luận nhầm là mẫu
  // không tồn tại. `q` hoãn 250ms để một từ khoá bảy chữ không thành bảy
  // request.
  const trimmedQuery = nameQuery.trim();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(trimmedQuery), 250);
    return () => clearTimeout(id);
  }, [trimmedQuery]);

  const { data, isLoading } = useTemplatePageQuery(page, {
    q: debouncedQuery || undefined,
    tier: tierFilter === "all" ? undefined : tierFilter,
  });
  const templates = data?.items ?? [];
  const total = data?.total ?? 0;
  const updateMutation = useUpdateTemplateMutation();

  function draftOf(template: Template): Draft {
    return (
      drafts[template.slug] ?? {
        tier: template.tier,
        tags: template.tags,
        categories: template.categories,
        isPublished: template.isPublished,
      }
    );
  }

  function patch(template: Template, changes: Partial<Draft>) {
    setDrafts((previous) => ({
      ...previous,
      [template.slug]: { ...draftOf(template), ...changes },
    }));
  }

  function onSave(template: Template) {
    updateMutation.mutate(
      { slug: template.slug, input: draftOf(template) },
      {
        onSuccess: () => {
          message.success(t.saved);
          setDrafts((previous) => {
            const next = { ...previous };
            delete next[template.slug];
            return next;
          });
        },
        onError: (error) =>
          message.error(
            error instanceof ApiError ? error.message : dict.errors.failed,
          ),
      },
    );
  }

  const columns: ColumnsType<Template> = [
    {
      title: t.columns.template,
      dataIndex: "name",
      render: (_, template) => (
        <div className="flex items-center gap-3">
          {/* Bảng này gán bậc và nhãn marketing cho từng mẫu — những quyết định
              nhìn vào *thiết kế* mà quyết. Một cột toàn chữ bắt người vận hành
              mở kho mẫu ở tab khác mới biết "Thuỷ Mặc" trông ra sao.

              Thẻ `img` thuần chứ không `next/image`: ảnh đi qua rewrite sang
              frontend (xem `next.config.ts`), và bộ tối ưu của Next không giúp
              gì cho bản xem trước chỉ người vận hành nhìn thấy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={template.imageSrc ?? templateThumbnailSrc(template.slug)}
            alt=""
            loading="lazy"
            style={{ objectPosition: template.imagePosition || "50% 0%" }}
            className="h-14 w-11 shrink-0 rounded border border-border object-cover"
          />
          <div className="min-w-0">
            <div className="font-medium">{template.name}</div>
            <div className="text-caption text-muted-foreground">
              {template.slug}
            </div>
            {/* Chỉ hiển thị: màu chốt lúc dựng mẫu, không có ô sửa ở CMS. */}
            <div
              className="mt-1 flex items-center gap-1"
              title={`${t.colorsTitle}: ${template.colorTones
                .map((color) => t.colorLabels[color])
                .join(", ")}`}
            >
              {template.colorTones.map((color) => (
                <span
                  key={color}
                  role="img"
                  aria-label={t.colorLabels[color]}
                  className="size-3 rounded-full border border-border"
                  style={{ backgroundColor: TEMPLATE_COLOR_SWATCHES[color] }}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t.columns.tier,
      dataIndex: "tier",
      render: (_, template) => {
        const draft = draftOf(template);
        return (
          <Select<Tier>
            value={draft.tier}
            aria-label={t.tier}
            onChange={(value) => patch(template, { tier: value })}
            options={TIERS.map((value) => ({
              value,
              label: commonDict.tier[value],
            }))}
          />
        );
      },
    },
    {
      title: t.columns.tags,
      dataIndex: "tags",
      render: (_, template) => {
        const draft = draftOf(template);
        return (
          <div className="flex flex-col gap-1">
            {TEMPLATE_TAGS.map((tag: TemplateTag) => (
              <label key={tag} className="flex items-center gap-2">
                <Checkbox
                  checked={draft.tags.includes(tag)}
                  onCheckedChange={() =>
                    patch(template, { tags: toggle(draft.tags, tag) })
                  }
                />
                {t.tagLabels[tag]}
              </label>
            ))}
          </div>
        );
      },
    },
    {
      title: t.columns.categories,
      dataIndex: "categories",
      render: (_, template) => {
        const draft = draftOf(template);
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {TEMPLATE_CATEGORIES.map((category: TemplateCategory) => (
              <label key={category} className="flex items-center gap-2">
                <Checkbox
                  checked={draft.categories.includes(category)}
                  onCheckedChange={() =>
                    patch(template, {
                      categories: toggle(draft.categories, category),
                    })
                  }
                />
                {t.categoryLabels[category]}
              </label>
            ))}
          </div>
        );
      },
    },
    {
      title: t.columns.status,
      dataIndex: "isPublished",
      render: (_, template) => {
        const draft = draftOf(template);
        return (
          <>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={draft.isPublished}
                onCheckedChange={(checked) =>
                  patch(template, { isPublished: checked })
                }
              />
              {t.published}
            </label>
            {template.featuredOnHome ? (
              <Badge variant="outline" size="sm" className="mt-2">
                {dict.homepage.title}
              </Badge>
            ) : null}
          </>
        );
      },
    },
    {
      title: t.columns.actions,
      dataIndex: "actions",
      render: (_, template) => {
        const dirty = template.slug in drafts;
        return (
          // Chỉ bật khi dòng có thay đổi chưa lưu: nút xanh lá sáng lên chính là
          // dấu hiệu "dòng này đang sửa dở".
          <ActionGroup>
            <ActionButton
              label={t.save}
              icon={<Save />}
              tone="success"
              disabled={!dirty}
              loading={updateMutation.isPending && dirty}
              onClick={() => onSave(template)}
            />
          </ActionGroup>
        );
      },
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label htmlFor="template-name-search" className="text-sm font-medium">
            {t.searchLabel}
          </label>
          <Input
            id="template-name-search"
            type="search"
            value={nameQuery}
            onChange={(event) => {
              setNameQuery(event.target.value);
              // Đổi bộ lọc là một danh sách khác hẳn — đứng lại ở trang 5 của
              // kết quả cũ thì thường là một bảng trống.
              setPage(0);
            }}
            placeholder={t.searchPlaceholder}
            className="w-full sm:w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t.tierFilter}</span>
          <Select<Tier | "all">
            value={tierFilter}
            aria-label={t.tierFilter}
            onChange={(next) => {
              setTierFilter(next);
              setPage(0);
            }}
            className="min-w-40"
            options={[
              { value: "all", label: t.allTiers },
              ...TIERS.map((value) => ({
                value,
                label: commonDict.tier[value],
              })),
            ]}
          />
        </div>
      </div>
      <AdminTable<Template>
        columns={columns}
        dataSource={templates}
        rowKey="slug"
        loading={isLoading}
        emptyText={
          debouncedQuery.length > 0
            ? t.noSearchMatches
            : tierFilter !== "all"
              ? t.noTierMatches
              : t.empty
        }
        totalLabel={dict.pagination.total}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onChange: setPage,
        }}
      />
    </section>
  );
}
