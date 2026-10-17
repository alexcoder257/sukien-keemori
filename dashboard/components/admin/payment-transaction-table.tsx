"use client";

import { useState } from "react";
import { App } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link2 } from "lucide-react";
import { ApiError } from "@/apis";
import type { PaymentTransaction } from "@/apis/payments";
import { ActionButton, ActionGroup } from "@/components/ui/action-button";
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
import { Label } from "@/components/ui/label";
import { AdminTable } from "@/components/ui/table";
import {
  useMatchTransactionMutation,
  useUnmatchedQuery,
} from "@/hooks/use-payments";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatCurrency, formatDateTime } from "@/lib/format";

type Props = {
  dict: Dictionary["admin"];
  commonDict: Dictionary["common"];
  locale: Locale;
};

/**
 * Tiền vào chưa ghép — hàng đợi tra soát.
 *
 * Chỉ **tiền vào** chưa gắn được vào đơn nào. Tiền chuyển đi không bao giờ hiện
 * (backend gắn nhãn `ignored` và không trả ra route nào của CMS).
 *
 * Màn này tồn tại vì **khớp theo nội dung chuyển khoản không bao giờ đúng
 * 100%**: khách xoá mất mã, gõ nhầm, hoặc chuyển từ một ví chèn thêm chữ của
 * riêng nó. Những khoản đó vẫn được ghi vào sổ cái (webhook luôn báo thành
 * công) và nằm lại đây chờ người xử lý.
 *
 * Ghép tay đi qua đúng `markPaid` như webhook, nên nó **xuất bản thiệp thật**
 * — không phải một thao tác dán nhãn. Vì vậy hộp xác nhận nói rõ điều đó
 * trước khi bấm.
 */
export function PaymentTransactionTable({
  dict,
  commonDict,
  locale,
}: Props) {
  const { message } = App.useApp();
  const t = dict.payments;
  const [search, setSearch] = useState("");
  const [matching, setMatching] = useState<PaymentTransaction | null>(null);
  const [paymentCode, setPaymentCode] = useState("");

  const [page, setPage] = useState(0);
  const q = useDebouncedValue(search.trim());
  const { data, isLoading } = useUnmatchedQuery(q, page);
  const matchMutation = useMatchTransactionMutation();

  const onConfirmMatch = () => {
    const code = paymentCode.trim().toUpperCase();
    if (!matching || !code) return;
    matchMutation.mutate(
      { id: matching.id, paymentCode: code },
      {
        onSuccess: () => {
          message.success(fill(t.matched, { code }));
          setMatching(null);
          setPaymentCode("");
        },
        onError: (error) =>
          message.error(
            error instanceof ApiError ? error.message : dict.errors.failed,
          ),
      },
    );
  };

  const transactions = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: ColumnsType<PaymentTransaction> = [
    {
      title: t.columns.date,
      dataIndex: "transactionDate",
      render: (_, row) => (
        <div>
          <div>{formatDateTime(row.transactionDate, locale)}</div>
          <div className="text-caption text-muted-foreground">
            {row.gateway} · {row.accountNumber}
          </div>
        </div>
      ),
    },
    {
      title: t.columns.amount,
      dataIndex: "transferAmount",
      // Số tiền về từ cột `bigint` nên là chuỗi; ép số ngay tại chỗ hiển thị
      // thay vì ở tầng API, để giá trị gốc của sổ cái không bị làm tròn ở đâu đó.
      render: (_, row) => (
        <span className="font-medium">
          {formatCurrency(Number(row.transferAmount), locale)}
        </span>
      ),
    },
    {
      title: t.columns.content,
      dataIndex: "content",
      render: (_, row) => (
        <div className="max-w-md">
          <p className="break-words">{row.content}</p>
          <div className="text-caption text-muted-foreground">
            {row.paymentCode ?? t.noCode}
            {row.referenceCode ? ` · ${row.referenceCode}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: t.columns.actions,
      dataIndex: "actions",
      width: 100,
      align: "right",
      render: (_, row) => (
        <ActionGroup>
          <ActionButton
            label={t.match}
            icon={<Link2 />}
            onClick={() => {
              setMatching(row);
              // Khách gõ mã sai một ký tự thì hệ thống không dò ra, nhưng
              // người đọc vẫn thấy — điền sẵn thứ gần nhất để sửa cho nhanh.
              setPaymentCode(row.paymentCode ?? "");
            }}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder={t.unmatched.searchPlaceholder}
          aria-label={t.unmatched.searchPlaceholder}
          className="w-full max-w-md"
        />
        {data ? (
          <span className="text-caption text-muted-foreground">
            {fill(t.unmatched.total, { count: total })}
          </span>
        ) : null}
      </div>

      <AdminTable<PaymentTransaction>
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        loading={isLoading}
        emptyText={q ? t.unmatched.emptySearch : t.unmatched.empty}
        totalLabel={dict.pagination.total}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onChange: setPage,
        }}
      />

      <Dialog
        open={matching !== null}
        onOpenChange={(open) => {
          if (!open) setMatching(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.matchDialog.title}</DialogTitle>
            <DialogDescription>
              {fill(t.matchDialog.body, {
                amount: matching
                  ? formatCurrency(Number(matching.transferAmount), locale)
                  : "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="match-payment-code">
              {t.matchDialog.orderLabel}
            </Label>
            <Input
              id="match-payment-code"
              value={paymentCode}
              onChange={(event) =>
                setPaymentCode(event.target.value.toUpperCase())
              }
              placeholder={t.matchDialog.orderPlaceholder}
              autoComplete="off"
              className="font-mono tracking-wider"
            />
            <p className="text-caption text-muted-foreground">
              {t.matchDialog.hint}
            </p>
          </div>

          <DialogFooter>
            <DialogClose>{commonDict.actions.cancel}</DialogClose>
            <Button
              type="button"
              onClick={onConfirmMatch}
              disabled={!paymentCode.trim() || matchMutation.isPending}
            >
              {t.matchDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
