"use client";

import { useState } from "react";
import { App } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Copy } from "lucide-react";
import type { AdminOrder, OrderStatus } from "@/apis/payments";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminTable } from "@/components/ui/table";
import { useAdminOrdersQuery } from "@/hooks/use-payments";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatCurrency, formatDateTime } from "@/lib/format";

type Props = {
  dict: Dictionary["admin"];
  /** Giữ chung chữ ký với `PaymentTransactionTable`. */
  commonDict?: Dictionary["common"];
  locale: Locale;
  /** Từ `?q=` — lối vào từ màn Người dùng ("Xem lịch sử thanh toán"). */
  initialQuery: string;
};

const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "cancelled"];

/** Chỉ ba sắc: xong, đang chờ người, đã dừng. */
const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "outline"> = {
  paid: "success",
  pending: "warning",
  cancelled: "outline",
};

/**
 * Tra cứu đơn mua thiệp.
 *
 * Mở ra khi khách báo sự cố thanh toán, nên mọi thứ cần để trả lời "tiền của
 * tôi đâu" nằm trên **một dòng**: mã đơn, người mua, thiệp, số tiền sau giảm
 * giá, trạng thái, và các khoản tiền vào đã gắn vào đơn. Đơn "Chờ thanh toán"
 * mà cột Tiền vào trống, trong khi khách nói đã chuyển, nghĩa là khoản tiền đó
 * đang nằm ở tab "Tiền vào chưa ghép".
 */
export function PaymentOrderTable({
  dict,
  locale,
  initialQuery,
}: Props) {
  const { message } = App.useApp();
  const t = dict.payments.orders;
  const [search, setSearch] = useState(initialQuery);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const q = useDebouncedValue(search.trim());

  const { data, isLoading } = useAdminOrdersQuery(
    {
      q: q || undefined,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
    },
    page,
  );
  const orders = data?.items ?? [];
  const total = data?.total ?? 0;

  const lookUp = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      message.success(fill(t.copied, { code }));
    } catch {
      // Trình duyệt chặn clipboard (http không an toàn): mã vẫn đọc được trên màn.
    }
  };

  const columns: ColumnsType<AdminOrder> = [
    {
      title: t.columns.code,
      dataIndex: "paymentCode",
      width: 170,
      render: (_, order) => (
        <div>
          {order.paymentCode ? (
            <button
              type="button"
              onClick={() => copyCode(order.paymentCode as string)}
              title={t.copy}
              aria-label={`${t.copy}: ${order.paymentCode}`}
              className="group inline-flex items-center gap-1.5 font-mono text-small font-semibold tracking-wider"
            >
              {order.paymentCode}
              <Copy
                aria-hidden
                className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            </button>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          <div className="text-caption text-muted-foreground">
            {fill(t.createdAt, { date: formatDateTime(order.createdAt, locale) })}
          </div>
        </div>
      ),
    },
    {
      title: t.columns.customer,
      dataIndex: "user",
      render: (_, order) =>
        order.user ? (
          <div className="min-w-0">
            <div className="truncate font-medium">{order.user.fullName}</div>
            {/* Bấm email là lọc ra mọi đơn của người đó — câu hỏi tiếp theo
                luôn là "người này còn mua gì nữa". */}
            <button
              type="button"
              onClick={() => lookUp(order.user?.email ?? "")}
              title={t.filterByUser}
              className="truncate text-caption text-primary hover:underline"
            >
              {order.user.email}
            </button>
          </div>
        ) : (
          <span className="text-caption text-muted-foreground">
            {t.deletedUser}
          </span>
        ),
    },
    {
      title: t.columns.card,
      dataIndex: "card",
      render: (_, order) =>
        order.card ? (
          <div className="min-w-0">
            <div className="truncate">{order.card.title}</div>
            <div className="truncate text-caption text-muted-foreground">
              /t/{order.card.slug}
            </div>
          </div>
        ) : (
          <span className="text-caption text-muted-foreground">
            {t.deletedCard}
          </span>
        ),
    },
    {
      title: t.columns.amount,
      dataIndex: "amount",
      width: 170,
      render: (_, order) => (
        <div>
          <span className="font-semibold tabular-nums">
            {formatCurrency(order.amount, locale)}
          </span>
          {order.voucherCode ? (
            <div className="text-caption text-muted-foreground">
              {order.voucherCode}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: t.columns.status,
      dataIndex: "status",
      width: 180,
      render: (_, order) => (
        <div>
          <Badge variant={STATUS_TONE[order.status]} size="sm">
            {t.status[order.status]}
          </Badge>
          {order.paidAt ? (
            <div className="mt-1 text-caption text-muted-foreground">
              {fill(t.paidAt, { date: formatDateTime(order.paidAt, locale) })}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: t.columns.payment,
      dataIndex: "transactions",
      width: 140,
      // Tổng tiền đã về cho đơn; chi tiết từng khoản không cần ở màn tra cứu.
      render: (_, order) => {
        const received = order.transactions.reduce(
          (sum, transaction) => sum + Number(transaction.transferAmount),
          0,
        );
        return received > 0 ? (
          <span className="font-medium tabular-nums">
            {formatCurrency(received, locale)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(event) => lookUp(event.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className="w-full max-w-md"
        />
        <Select<OrderStatus | "">
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(0);
          }}
          aria-label={t.columns.status}
          options={[
            { value: "", label: t.allStatuses },
            ...ORDER_STATUSES.map((value) => ({
              value,
              label: t.status[value],
            })),
          ]}
        />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(0);
            }}
            aria-label={t.from}
            className="w-auto"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(0);
            }}
            aria-label={t.to}
            className="w-auto"
          />
        </div>
      </div>

      {/* Tổng tính trên mọi đơn khớp bộ lọc, không riêng trang đang xem. */}
      {data ? (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-small">
          <span className="text-muted-foreground">
            {fill(t.total, { count: total })}
          </span>
          <span>
            <span className="text-muted-foreground">{t.paidTotal} </span>
            <strong className="text-body-lg tabular-nums">
              {formatCurrency(data.summary.paidAmount, locale)}
            </strong>
            <span className="text-muted-foreground">
              {" "}
              · {fill(t.paidCount, { count: data.summary.paidCount })}
            </span>
          </span>
        </div>
      ) : null}

      <AdminTable<AdminOrder>
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={isLoading}
        emptyText={q || status || from || to ? t.emptySearch : t.empty}
        totalLabel={dict.pagination.total}
        pagination={{ page, pageSize: PAGE_SIZE, total, onChange: setPage }}
      />
    </section>
  );
}
