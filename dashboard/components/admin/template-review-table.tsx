"use client";

import { useState } from "react";
import { App } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Trash2 } from "lucide-react";
import { ApiError } from "@/apis";
import type { AdminTemplateReview } from "@/apis/reviews";
import { ActionButton, ActionGroup } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminTable } from "@/components/ui/table";
import { RatingStars } from "@/components/shared/rating-stars";
import {
  useAdminTemplateReviewsQuery,
  useDeleteTemplateReviewMutation,
} from "@/hooks/use-reviews";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatDateTime } from "@/lib/format";

const RATINGS = [1, 2, 3, 4, 5];

type Props = {
  dict: Dictionary["admin"];
  locale: Locale;
};

/**
 * Kiểm duyệt đánh giá mẫu thiệp do người dùng gửi.
 *
 * Khác "Đánh giá trang chủ" (trích dẫn biên tập tự soạn) và khác lời chúc trong
 * sổ lưu bút (khách mời viết, cặp đôi duyệt): đánh giá mẫu **hiện ngay khi
 * gửi**, không có bước duyệt trước. Vì vậy màn này chỉ có đọc và gỡ — admin
 * không sửa điểm hay lời của người khác, một nhận xét bị biên tập lại thì không
 * còn là nhận xét của ai cả.
 */
export function TemplateReviewTable({ dict, locale }: Props) {
  const { message } = App.useApp();
  const t = dict.templateReviews;
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useAdminTemplateReviewsQuery({
    q: search.trim() || undefined,
    rating: rating || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const deleteMutation = useDeleteTemplateReviewMutation();

  function onDelete(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    deleteMutation.mutate(id, {
      onSuccess: () => message.success(t.deleted),
      onError: (error) =>
        message.error(
          error instanceof ApiError ? error.message : dict.errors.failed,
        ),
    });
  }

  const reviews = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: ColumnsType<AdminTemplateReview> = [
    {
      title: t.columns.template,
      dataIndex: "templateSlug",
      className: "text-muted-foreground",
    },
    {
      title: t.columns.author,
      dataIndex: "author",
      render: (_, review) => (
        <div>
          <div>{review.author.fullName || t.anonymous}</div>
          <div className="text-caption text-muted-foreground">
            {review.author.email}
          </div>
        </div>
      ),
    },
    {
      title: t.columns.rating,
      dataIndex: "rating",
      render: (_, review) => <RatingStars value={review.rating} />,
    },
    {
      title: t.columns.comment,
      dataIndex: "comment",
      render: (_, review) => (
        <div className="max-w-md">
          {review.comment ? (
            <p className="whitespace-pre-line">{review.comment}</p>
          ) : (
            <span className="text-muted-foreground">{t.noComment}</span>
          )}
          <div className="text-caption text-muted-foreground">
            {formatDateTime(review.createdAt, locale)}
            {review.updatedAt !== review.createdAt ? ` · ${t.edited}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: t.columns.actions,
      dataIndex: "actions",
      render: (_, review) => (
        <ActionGroup>
          <ActionButton
            label={t.delete}
            icon={<Trash2 />}
            tone="danger"
            disabled={deleteMutation.isPending}
            onClick={() => onDelete(review.id)}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className="max-w-xs"
        />
        <Select<number | "">
          value={rating}
          onChange={(value) => {
            setRating(value);
            setPage(0);
          }}
          aria-label={t.ratingFilter}
          options={[
            { value: "", label: t.allRatings },
            ...RATINGS.map((value) => ({
              value,
              label: fill(t.starLabel, { count: value }),
            })),
          ]}
        />
        {data ? (
          <span className="text-caption text-muted-foreground">
            {fill(t.total, { count: total })}
          </span>
        ) : null}
      </div>

      <AdminTable<AdminTemplateReview>
        columns={columns}
        dataSource={reviews}
        rowKey="id"
        loading={isLoading}
        emptyText={t.empty}
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
