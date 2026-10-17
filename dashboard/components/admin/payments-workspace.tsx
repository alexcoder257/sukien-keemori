"use client";

import { useState } from "react";
import { Segmented } from "antd";
import { PaymentOrderTable } from "@/components/admin/payment-order-table";
import { PaymentTransactionTable } from "@/components/admin/payment-transaction-table";
import { useUnmatchedQuery } from "@/hooks/use-payments";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Tab = "orders" | "unmatched";

type Props = {
  dict: Dictionary["admin"];
  commonDict: Dictionary["common"];
  locale: Locale;
  initialQuery: string;
};

/**
 * Màn Thanh toán: tra cứu đơn là việc chính, hàng đợi tiền chưa ghép là việc
 * phụ nhưng không được để quên — nên số khoản đang chờ hiện ngay trên tab.
 */
export function PaymentsWorkspace({
  dict,
  commonDict,
  locale,
  initialQuery,
}: Props) {
  const t = dict.payments;
  const [tab, setTab] = useState<Tab>("orders");
  // Cùng query key với trang đầu của tab kia, nên không tốn thêm request.
  const { data: pending } = useUnmatchedQuery("", 0);
  const pendingCount = pending?.total ?? 0;

  return (
    <div className="space-y-5">
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "orders", label: t.tabs.orders },
          {
            value: "unmatched",
            label: pendingCount
              ? `${t.tabs.unmatched} (${pendingCount})`
              : t.tabs.unmatched,
          },
        ]}
      />
      {tab === "orders" ? (
        <PaymentOrderTable
          dict={dict}
          commonDict={commonDict}
          locale={locale}
          initialQuery={initialQuery}
        />
      ) : (
        <PaymentTransactionTable
          dict={dict}
          commonDict={commonDict}
          locale={locale}
        />
      )}
    </div>
  );
}
