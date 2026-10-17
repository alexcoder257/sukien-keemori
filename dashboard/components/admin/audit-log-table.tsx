"use client";

import { useState } from "react";
import type { ColumnsType } from "antd/es/table";
import { Eraser } from "lucide-react";
import {
  AUDIT_ACTIONS,
  type AuditAction,
  type AuditLog,
} from "@/apis/audit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AdminTable } from "@/components/ui/table";
import { useAuditLogsQuery } from "@/hooks/use-audit";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatDateTime } from "@/lib/format";

type Props = {
  dict: Dictionary["admin"];
  locale: Locale;
};

/**
 * Tông của mỗi hành động. Chỉ ba mức, cố ý không tô màu từng loại một: mắt
 * người quét một bảng dài tìm **thứ bất thường**, mà bảy màu khác nhau thì
 * không còn cái nào nổi lên nữa.
 *
 * `danger` dành riêng cho thứ **không lấy lại được** — xoá tài khoản thật và
 * xoá đánh giá. `warning` cho thứ đổi quyền lực hoặc đụng tới tiền.
 */
const ACTION_TONE: Record<AuditAction, "danger" | "warning" | "default"> = {
  "user.self_deleted": "danger",
  "template_review.deleted": "danger",
  "user.disabled": "warning",
  "user.role_changed": "warning",
  "order.matched_manually": "warning",
  // Mở khoá tên là mở ngoại lệ của luật chống dùng lại thiệp đã trả tiền.
  "card.couple_names_unlocked": "warning",
  // Hành động `partner.*` chỉ còn ở các dòng nhật ký cũ (tính năng đối tác đã gỡ).
  "partner.approved": "default",
  "partner.rejected": "default",
  "partner.promoted": "default",
  "partner.revoked": "warning",
  "card.couple_names_locked": "default",
};

/**
 * Nhật ký thao tác — màn `super_admin`.
 *
 * Chỉ đọc, không có nút sửa hay xoá dòng nào, kể cả cho `super_admin`: một
 * cuốn sổ mà người dùng nó xoá được dòng thì không còn là bằng chứng.
 *
 * Bộ lọc theo **id đối tượng** là đường dùng nhiều nhất khi có sự cố — cầm id
 * của một tài khoản đã biến mất và hỏi "đã có chuyện gì xảy ra với nó". Vì vậy
 * nó là ô nhập tự do chứ không phải danh sách chọn: đối tượng cần tra thường
 * không còn tồn tại để mà liệt kê.
 */
export function AuditLogTable({ dict, locale }: Props) {
  const t = dict.audit;
  const [action, setAction] = useState<AuditAction | "">("");
  const [targetId, setTargetId] = useState("");
  // 0-index theo đúng quy ước `AdminTable` đang dùng ở các màn khác.
  const [page, setPage] = useState(0);

  const { data, isLoading } = useAuditLogsQuery({
    action: action || undefined,
    // Chỉ gửi khi trông giống uuid: backend khai `@IsUUID()` nên một chuỗi gõ
    // dở sẽ thành lỗi 400 ngay giữa lúc người dùng đang gõ.
    targetId: /^[0-9a-f-]{36}$/i.test(targetId.trim())
      ? targetId.trim()
      : undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const onResetFilters = () => {
    setAction("");
    setTargetId("");
    setPage(0);
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: t.columns.time,
      dataIndex: "createdAt",
      width: 170,
      render: (_, row) => (
        <span className="whitespace-nowrap">
          {formatDateTime(row.createdAt, locale)}
        </span>
      ),
    },
    {
      title: t.columns.action,
      dataIndex: "action",
      width: 200,
      render: (_, row) => {
        const tone = ACTION_TONE[row.action];
        return (
          <Badge variant={tone === "default" ? "outline" : tone}>
            {t.actions[row.action]}
          </Badge>
        );
      },
    },
    {
      title: t.columns.actor,
      dataIndex: "actorEmail",
      render: (_, row) => (
        <div>
          <div>{row.actorEmail ?? t.systemActor}</div>
          {row.actorRole ? (
            <div className="text-caption text-muted-foreground">
              {row.actorRole}
              {row.ipAddress ? ` · ${row.ipAddress}` : null}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: t.columns.target,
      dataIndex: "targetLabel",
      render: (_, row) => (
        <div>
          <div>{row.targetLabel ?? "—"}</div>
          {/* Id hiện dạng đầy đủ và chọn được: nó là thứ người tra soát copy ra
              để dán vào ô lọc hoặc vào một câu SQL. */}
          {row.targetId ? (
            <code className="text-caption text-muted-foreground select-all">
              {row.targetId}
            </code>
          ) : null}
        </div>
      ),
    },
    {
      title: t.columns.details,
      dataIndex: "metadata",
      render: (_, row) => {
        const entries = Object.entries(row.metadata ?? {});
        if (entries.length === 0) return <span>—</span>;
        return (
          <div className="max-w-sm space-y-0.5">
            {entries.map(([key, value]) => (
              <div key={key} className="text-caption">
                <span className="text-muted-foreground">{key}: </span>
                <span className="break-all">
                  {value === null ? "—" : String(value)}
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Label htmlFor="audit-action">{t.filters.action}</Label>
          <Select
            aria-label={t.filters.action}
            className="w-full"
            value={action}
            onChange={(value) => {
              setAction(value as AuditAction | "");
              setPage(0);
            }}
            options={[
              { value: "", label: t.filters.allActions },
              ...AUDIT_ACTIONS.map((value) => ({
                value,
                label: t.actions[value],
              })),
            ]}
          />
        </div>
        <div className="w-full sm:w-80">
          <Label htmlFor="audit-target">{t.filters.targetId}</Label>
          <Input
            id="audit-target"
            value={targetId}
            placeholder={t.filters.targetIdPlaceholder}
            onChange={(event) => {
              setTargetId(event.target.value);
              setPage(0);
            }}
          />
        </div>
        {action || targetId ? (
          <Button variant="outline" onClick={onResetFilters}>
            <Eraser className="size-4" />
            {t.filters.reset}
          </Button>
        ) : null}
      </div>

      <AdminTable<AuditLog>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        emptyText={t.empty}
        totalLabel={dict.pagination.total}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onChange: setPage,
        }}
      />
    </div>
  );
}
