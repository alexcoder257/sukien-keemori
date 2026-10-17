"use client";

import { useState } from "react";
import { App } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Copy } from "lucide-react";
import { ApiError } from "@/apis";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminTable } from "@/components/ui/table";
import { InvitationKindTag } from "@/components/shared/invitation-kind-tag";
import type { AdminCard } from "@/apis/cards";
import {
  INVITATION_KINDS,
  type InvitationKind,
} from "@/constants/invitation-kind";
import { CARD_STATUSES, type CardStatus } from "@/constants/template";
import {
  useAdminCardsQuery,
  useSetCardCoupleNamesLockMutation,
  useSetCardShowcaseMutation,
} from "@/hooks/use-cards";
import { cardPublicUrl } from "@/lib/card-preview";
import { coupleNamesLockAt } from "@/lib/couple-names-lock";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatDateTime, formatNumber } from "@/lib/format";

type Props = {
  dict: Dictionary["admin"];
  locale: Locale;
};

/**
 * Lịch sử thiệp toàn hệ thống (spec mục 9).
 *
 * Chỉ đọc, cộng một công tắc trưng bày trang chủ. Không có nút sửa hay xoá:
 * thiệp là dữ liệu của khách, và bảng này cũng **không nhận nội dung thiệp** từ
 * backend — chỉ metadata đủ để trả lời "thiệp nào, của ai, đang ở đâu".
 */
export function CardTable({ dict, locale }: Props) {
  const { message } = App.useApp();
  const t = dict.cards;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CardStatus | "">("");
  const [kind, setKind] = useState<InvitationKind | "">("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useAdminCardsQuery({
    q: search.trim() || undefined,
    status: status || undefined,
    kind: kind || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const showcaseMutation = useSetCardShowcaseMutation();
  const namesLockMutation = useSetCardCoupleNamesLockMutation();

  function onToggleNamesUnlocked(id: string, unlocked: boolean) {
    namesLockMutation.mutate(
      { id, unlocked },
      {
        onSuccess: () =>
          message.success(
            unlocked ? t.coupleNames.unlockedDone : t.coupleNames.lockedDone,
          ),
        onError: (error) =>
          message.error(
            error instanceof ApiError ? error.message : dict.errors.failed,
          ),
      },
    );
  }

  function onToggleShowcase(id: string, value: boolean) {
    showcaseMutation.mutate(
      { id, value },
      {
        onSuccess: () =>
          message.success(value ? t.showcaseOn : t.showcaseOff),
        onError: (error) =>
          message.error(
            error instanceof ApiError ? error.message : dict.errors.failed,
          ),
      },
    );
  }

  const cards = data?.items ?? [];
  const total = data?.total ?? 0;

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      message.success(t.linkCopied);
    } catch {
      // Trình duyệt chặn clipboard (http không an toàn): link vẫn đọc được trên màn.
    }
  };

  const columns: ColumnsType<AdminCard> = [
    {
      title: t.columns.card,
      dataIndex: "title",
      render: (_, card) => {
        const url = cardPublicUrl(card.slug, locale);
        return (
          <div>
            <div className="font-medium">{card.title || card.slug}</div>
            <div className="text-caption text-muted-foreground">
              {/* Thiệp nháp chưa xuất bản nên link chưa mở được — chỉ hiện chữ. */}
              {card.status === "draft" ? (
                <span className="break-all">{url}</span>
              ) : (
                <>
                  <a href={url} className="break-all text-primary hover:underline">
                    {url}
                  </a>
                  {/* Luôn hiện chứ không chờ hover: trên điện thoại không có hover. */}
                  <button
                    type="button"
                    onClick={() => copyLink(url)}
                    title={t.copyLink}
                    aria-label={t.copyLink}
                    className="ml-1 inline-flex size-6 items-center justify-center rounded align-middle text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Copy aria-hidden className="size-3.5" />
                  </button>
                </>
              )}{" "}
              · {formatDateTime(card.createdAt, locale)}
            </div>
          </div>
        );
      },
    },
    {
      title: t.columns.kind,
      dataIndex: "kind",
      render: (_, card) => (
        <InvitationKindTag kind={card.kind} label={t.kinds[card.kind]} />
      ),
    },
    {
      title: t.columns.owner,
      dataIndex: "owner",
      render: (_, card) => (
        <div>
          <div>{card.owner.fullName}</div>
          <div className="text-caption text-muted-foreground">
            {card.owner.email}
          </div>
        </div>
      ),
    },
    {
      title: t.columns.template,
      dataIndex: "templateSlug",
      className: "text-muted-foreground",
    },
    {
      title: t.columns.status,
      dataIndex: "status",
      render: (_, card) => (
        <Badge variant={card.status === "paid" ? "solid" : "outline"} size="sm">
          {t.status[card.status]}
        </Badge>
      ),
    },
    {
      title: t.columns.views,
      dataIndex: "viewCount",
      className: "text-muted-foreground",
      render: (_, card) => formatNumber(card.viewCount, locale),
    },
    {
      title: t.columns.showcase,
      dataIndex: "showcasedOnHome",
      render: (_, card) => (
        <Checkbox
          checked={card.showcasedOnHome}
          disabled={showcaseMutation.isPending || card.status === "draft"}
          onCheckedChange={(checked) => onToggleShowcase(card.id, checked)}
          aria-label={t.showcase}
        />
      ),
    },
    {
      // Tên cô dâu chú rể tự khoá 15 ngày sau lần xuất bản đầu. Ô tick là
      // đường hỗ trợ: cặp đôi liên hệ → mở cho sửa → sửa xong thì bỏ tick để
      // luật thời gian có hiệu lực trở lại.
      title: t.columns.coupleNames,
      dataIndex: "coupleNamesUnlocked",
      render: (_, card) => {
        if (card.status !== "paid") {
          return (
            <span className="text-muted-foreground">
              {t.coupleNames.notPaid}
            </span>
          );
        }
        const lockAt = coupleNamesLockAt(card.paidAt);
        const locked =
          !card.coupleNamesUnlocked &&
          lockAt !== null &&
          Date.now() >= lockAt.getTime();
        const state = card.coupleNamesUnlocked
          ? t.coupleNames.unlocked
          : locked || !lockAt
            ? t.coupleNames.locked
            : fill(t.coupleNames.locksOn, {
                date: formatDateTime(lockAt.toISOString(), locale),
              });
        return (
          <div className="space-y-1">
            <Checkbox
              checked={card.coupleNamesUnlocked}
              disabled={namesLockMutation.isPending}
              onCheckedChange={(checked) =>
                onToggleNamesUnlocked(card.id, checked)
              }
            >
              {t.coupleNames.allowEdit}
            </Checkbox>
            <div className="text-caption text-muted-foreground">{state}</div>
          </div>
        );
      },
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
        <Select<CardStatus | "">
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(0);
          }}
          aria-label={t.statusFilter}
          options={[
            { value: "", label: t.allStatuses },
            ...CARD_STATUSES.map((value) => ({
              value,
              label: t.status[value],
            })),
          ]}
        />
        <Select<InvitationKind | "">
          value={kind}
          onChange={(value) => {
            setKind(value);
            setPage(0);
          }}
          aria-label={t.kindFilter}
          options={[
            { value: "", label: t.allKinds },
            ...INVITATION_KINDS.map((value) => ({
              value,
              label: t.kinds[value],
            })),
          ]}
        />
        {data ? (
          <span className="text-caption text-muted-foreground">
            {fill(t.total, { count: total })}
          </span>
        ) : null}
      </div>

      <AdminTable<AdminCard>
        columns={columns}
        dataSource={cards}
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
