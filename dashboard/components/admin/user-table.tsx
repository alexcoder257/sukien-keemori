"use client";

import { useState } from "react";
import { App } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Eye, Trash2 } from "lucide-react";
import { ApiError, type AdminUser } from "@/apis";
import { ActionButton, ActionGroup } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminTable } from "@/components/ui/table";
import {
  useAdminUsersQuery,
  useAdminUserSummaryQuery,
  useDeleteUserMutation,
} from "@/hooks/use-admin";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import {
  fill,
  formatDateTime,
  formatNumber,
} from "@/lib/format";

type Props = {
  dict: Dictionary["admin"];
  commonDict: Dictionary["common"];
  locale: Locale;
  /** Có quyền `users:delete` — backend cũng gác lại. */
  canDelete: boolean;
  /** Có quyền `payments:manage` — hiện lối sang lịch sử thanh toán. */
  canViewPayments: boolean;
};

/**
 * Bảng người dùng của CMS (spec mục 1).
 *
 * "User" trong spec là tài khoản khách (`customer`). Tài khoản quản trị nằm ở
 * bảng `admin_users`, không hiện ở đây.
 */
export function UserTable({
  dict,
  commonDict,
  locale,
  canDelete,
  canViewPayments,
}: Props) {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [viewing, setViewing] = useState<AdminUser | null>(null);

  const [page, setPage] = useState(0);
  const { data, isLoading } = useAdminUsersQuery({
    q: search.trim() || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const deleteMutation = useDeleteUserMutation();

  function onDelete(user: AdminUser) {
    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        message.success(fill(dict.users.deleted, { name: user.fullName }));
        setDeleting(null);
      },
      onError: (error) =>
        message.error(
          error instanceof ApiError ? error.message : dict.errors.failed,
        ),
    });
  }

  const users = data?.items ?? [];

  const columns: ColumnsType<AdminUser> = [
    {
      title: dict.users.columns.name,
      dataIndex: "fullName",
      render: (_, user) => (
        <div>
          <div className="font-medium">{user.fullName}</div>
          <div className="text-caption text-muted-foreground">
            {user.email}
          </div>
        </div>
      ),
    },
    {
      title: dict.users.columns.role,
      dataIndex: "role",
      width: 180,
      // Chỉ hiển thị: tài khoản quản trị không nằm ở bảng này mà ở `admin_users`.
      render: (_, user) => (
        <Badge variant="outline" size="sm">
          {dict.roles[user.role]}
        </Badge>
      ),
    },
    {
      title: dict.users.columns.createdAt,
      dataIndex: "createdAt",
      className: "text-muted-foreground",
      width: 180,
      render: (_, user) => formatDateTime(user.createdAt, locale),
    },
    {
      title: dict.users.columns.actions,
      dataIndex: "actions",
      width: 100,
      align: "right",
      render: (_, user) => {
        const deletable = canDelete;

        return (
          <ActionGroup>
            <ActionButton
              label={dict.users.view}
              icon={<Eye />}
              tone="view"
              onClick={() => setViewing(user)}
            />
            {deletable ? (
              <ActionButton
                label={dict.users.delete}
                icon={<Trash2 />}
                tone="danger"
                onClick={() => setDeleting(user)}
              />
            ) : null}
          </ActionGroup>
        );
      },
    },
  ];

  const { data: summary, isLoading: summaryLoading } = useAdminUserSummaryQuery(
    viewing?.id ?? null,
  );
  const detail = dict.users.detail;
  const yesNo = (value: boolean | undefined) =>
    value === undefined ? detail.empty : value ? detail.yes : detail.no;

  const stats: { label: string; value?: number }[] = [
    { label: detail.cards, value: summary?.cards },
    { label: detail.cardViews, value: summary?.cardViews },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={dict.users.searchPlaceholder}
          aria-label={dict.users.searchPlaceholder}
          className="max-w-xs"
        />
        {data ? (
          <span className="text-caption text-muted-foreground">
            {fill(dict.users.total, { count: data.total })}
          </span>
        ) : null}
      </div>

      <AdminTable<AdminUser>
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        emptyText={dict.users.empty}
        totalLabel={dict.pagination.total}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onChange: setPage,
        }}
      />

      {/* Xoá là soft delete: tài khoản mất đường đăng nhập và email bị giữ chỗ
          vĩnh viễn, nhưng dữ liệu ở lại. Câu xác nhận phải nói đúng cả hai vế,
          nếu không người vận hành tưởng mình vừa xoá sạch một khách hàng. */}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dict.users.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {fill(dict.users.deleteConfirmBody, {
                name: deleting?.fullName ?? "",
                email: deleting?.email ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>{commonDict.actions.cancel}</DialogClose>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && onDelete(deleting)}
            >
              {dict.users.deleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.fullName}</DialogTitle>
            <DialogDescription>{viewing?.email}</DialogDescription>
          </DialogHeader>

          {/* Ba số liệu hoạt động đứng trên cùng: câu hỏi đầu tiên của người
              vận hành khi mở một tài khoản là "người này đã làm gì", không phải
              "họ có bật nhận email không". */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border p-3">
                <div className="text-caption text-muted-foreground">
                  {stat.label}
                </div>
                <div className="text-body-lg font-medium tabular-nums">
                  {summaryLoading || stat.value === undefined
                    ? "—"
                    : formatNumber(stat.value, locale)}
                </div>
              </div>
            ))}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-small">
            <dt className="text-muted-foreground">
              {dict.users.columns.role}
            </dt>
            <dd>{viewing ? dict.roles[viewing.role] : null}</dd>

            <dt className="text-muted-foreground">{detail.phone}</dt>
            <dd>{viewing?.phone || detail.empty}</dd>

            <dt className="text-muted-foreground">{detail.google}</dt>
            <dd>{yesNo(Boolean(viewing?.googleId))}</dd>

            <dt className="text-muted-foreground">{detail.emailNotifications}</dt>
            <dd>{yesNo(viewing?.emailNotifications)}</dd>

            <dt className="text-muted-foreground">{detail.allowShowcase}</dt>
            <dd>{yesNo(viewing?.allowShowcase)}</dd>

            <dt className="text-muted-foreground">
              {dict.users.columns.createdAt}
            </dt>
            <dd>{viewing ? formatDateTime(viewing.createdAt, locale) : null}</dd>

            <dt className="text-muted-foreground">{detail.updatedAt}</dt>
            <dd>
              {viewing?.updatedAt
                ? formatDateTime(viewing.updatedAt, locale)
                : detail.empty}
            </dd>
          </dl>

          <DialogFooter>
            {canViewPayments && viewing ? (
              <Button
                variant="outline"
                href={`/${locale}/giao-dich?q=${encodeURIComponent(viewing.email)}`}
              >
                {detail.paymentHistory}
              </Button>
            ) : null}
            <DialogClose>{commonDict.actions.close}</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
