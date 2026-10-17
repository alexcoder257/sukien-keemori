"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { ApiError } from "@/apis";
import {
  VOUCHER_DISCOUNT_TYPES,
  type Voucher,
  type VoucherDiscountType,
} from "@/apis/voucher";
import { ActionButton, ActionGroup } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select } from "@/components/ui/select";
import { AdminTable } from "@/components/ui/table";
import {
  useCreateVoucherMutation,
  useDeleteVoucherMutation,
  useUpdateVoucherMutation,
  useVouchersQuery,
} from "@/hooks/use-voucher";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Dictionary } from "@/i18n/dictionaries";
import { voucherSchema, type VoucherValues } from "@/lib/schemas/admin";

type Props = {
  dict: Dictionary["admin"];
  commonDict: Dictionary["common"];
};

const EMPTY: VoucherValues = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  maxDiscount: null,
  minAmount: 0,
  startsAt: "",
  expiresAt: "",
  usageLimit: null,
  perUserLimit: 1,
  isActive: true,
  isPublic: false,
};

/** `datetime-local` cần `YYYY-MM-DDTHH:mm` giờ địa phương, không phải ISO UTC. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatNumber(value: number): string {
  return value.toLocaleString("vi-VN");
}

/**
 * Mã giảm giá (quyền `super_admin`).
 *
 * Sửa trong hộp thoại chứ không sửa tại chỗ như bảng tag mẫu: một mã có mười
 * trường và bốn trong số đó ràng buộc lẫn nhau (loại giảm ↔ giá trị ↔ trần
 * giảm), nên nhét cả bộ vào một hàng bảng thì không đọc được và cũng không báo
 * lỗi ở đúng ô được.
 *
 * `code` chỉ nhập được lúc tạo. Mã đã phát ra ngoài mà đổi chữ là làm chết mọi
 * tờ rơi và tin nhắn đã gửi đi — cần mã khác thì tắt mã cũ, tạo mã mới.
 */
export function VoucherTable({ dict, commonDict }: Props) {
  const { message } = App.useApp();
  const t = dict.vouchers;

  const [page, setPage] = useState(0);
  const { data, isLoading } = useVouchersQuery(page);
  const vouchers = data?.items;
  const createMutation = useCreateVoucherMutation();
  const updateMutation = useUpdateVoucherMutation();
  const deleteMutation = useDeleteVoucherMutation();

  /** `null` = hộp thoại đóng; `"new"` = tạo mới; còn lại là mã đang sửa. */
  const [editing, setEditing] = useState<Voucher | "new" | null>(null);
  const [deleting, setDeleting] = useState<Voucher | null>(null);

  const schema = useMemo(() => voucherSchema(dict.errors), [dict.errors]);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VoucherValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const discountType = useWatch({ control, name: "discountType" });
  const isActive = useWatch({ control, name: "isActive" });
  const isPublic = useWatch({ control, name: "isPublic" });
  function openCreate() {
    reset(EMPTY);
    setEditing("new");
  }

  function openEdit(voucher: Voucher) {
    reset({
      code: voucher.code,
      description: voucher.description ?? "",
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscount: voucher.maxDiscount,
      minAmount: voucher.minAmount,
      startsAt: toLocalInput(voucher.startsAt),
      expiresAt: toLocalInput(voucher.expiresAt),
      usageLimit: voucher.usageLimit,
      perUserLimit: voucher.perUserLimit,
      isActive: voucher.isActive,
      isPublic: voucher.isPublic,
    });
    setEditing(voucher);
  }

  function onSubmit(values: VoucherValues) {
    // Ô ngày trống nghĩa là "không giới hạn thời gian", nên nó phải đi lên
    // thành `null` chứ không phải chuỗi rỗng — backend đọc chuỗi rỗng là một
    // ngày không hợp lệ.
    const input = {
      ...values,
      description: values.description || null,
      // Hợp đồng API vẫn nhận các trường cũ: mã chỉ có một gói duy nhất nên
      // phạm vi gói để rỗng và không có cửa hàng độc quyền.
      tiers: [],
      partnerStoreId: null,
      startsAt: values.startsAt
        ? new Date(values.startsAt).toISOString()
        : null,
      expiresAt: values.expiresAt
        ? new Date(values.expiresAt).toISOString()
        : null,
    };

    const onError = (error: unknown) =>
      message.error(
        error instanceof ApiError ? error.message : dict.errors.failed,
      );
    const onSuccess = () => {
      message.success(t.saved);
      setEditing(null);
    };

    if (editing === "new") {
      createMutation.mutate(input, { onSuccess, onError });
      return;
    }
    if (editing) {
      // `code` bị bỏ lại một cách có chủ đích: backend không nhận trường này ở
      // nhánh sửa, xem `updateVoucher`.
      const { code, ...rest } = input;
      void code;
      updateMutation.mutate(
        { id: editing.id, input: rest },
        { onSuccess, onError },
      );
    }
  }

  function onDelete(voucher: Voucher) {
    deleteMutation.mutate(voucher.id, {
      onSuccess: () => {
        message.success(t.deleted);
        setDeleting(null);
      },
      onError: (error) =>
        message.error(
          error instanceof ApiError ? error.message : dict.errors.failed,
        ),
    });
  }

  const columns: ColumnsType<Voucher> = [
    {
      title: t.columns.code,
      dataIndex: "code",
      render: (_, voucher) => (
        <div>
          <div className="font-medium">{voucher.code}</div>
          {voucher.description ? (
            <div className="text-caption text-muted-foreground">
              {voucher.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: t.columns.discount,
      dataIndex: "discountValue",
      render: (_, voucher) => (
        <div>
          <div>
            {voucher.discountType === "percent"
              ? `${voucher.discountValue}%`
              : `${formatNumber(voucher.discountValue)} ₫`}
          </div>
          {voucher.maxDiscount !== null ? (
            <div className="text-caption text-muted-foreground">
              {t.maxDiscountShort}: {formatNumber(voucher.maxDiscount)} ₫
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: t.columns.scope,
      dataIndex: "isPublic",
      render: (_, voucher) => (
        <span className="text-caption text-muted-foreground">
          {voucher.isPublic ? t.publicShort : t.privateShort}
        </span>
      ),
    },
    {
      title: t.columns.usage,
      dataIndex: "usedCount",
      render: (_, voucher) => (
        <span className="tabular-nums">
          {voucher.usageLimit === null
            ? `${voucher.usedCount} / ∞`
            : `${voucher.usedCount} / ${voucher.usageLimit}`}
        </span>
      ),
    },
    {
      title: t.columns.window,
      dataIndex: "expiresAt",
      render: (_, voucher) => (
        <span className="text-caption text-muted-foreground">
          {voucher.expiresAt
            ? new Date(voucher.expiresAt).toLocaleString("vi-VN")
            : t.noExpiry}
        </span>
      ),
    },
    {
      title: t.columns.status,
      dataIndex: "isActive",
      render: (_, voucher) => (
        <Badge variant={voucher.isActive ? "success" : "outline"} size="xs">
          {voucher.isActive ? t.active : t.inactive}
        </Badge>
      ),
    },
    {
      title: t.columns.actions,
      key: "actions",
      dataIndex: "id",
      align: "right",
      render: (_, voucher) => (
        <ActionGroup>
          <ActionButton
            label={commonDict.actions.edit}
            icon={<Pencil />}
            onClick={() => openEdit(voucher)}
          />
          <ActionButton
            label={commonDict.actions.delete}
            icon={<Trash2 />}
            tone="danger"
            onClick={() => setDeleting(voucher)}
          />
        </ActionGroup>
      ),
    },
  ];

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-muted-foreground">{t.hint}</p>
        <Button size="sm" onClick={openCreate}>
          {t.create}
        </Button>
      </div>

      <AdminTable<Voucher>
        columns={columns}
        dataSource={vouchers ?? []}
        rowKey="id"
        loading={isLoading}
        emptyText={t.empty}
        totalLabel={dict.pagination.total}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onChange: setPage,
        }}
      />

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? t.create : t.editTitle}
            </DialogTitle>
            <DialogDescription>{t.dialogHint}</DialogDescription>
          </DialogHeader>

          <form
            id="voucher-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="voucher-code">{t.fields.code}</Label>
                <Input
                  id="voucher-code"
                  // Mã đã phát ra ngoài thì không đổi được — xem ghi chú ở đầu
                  // file và ở `updateVoucher`.
                  disabled={editing !== "new"}
                  className="uppercase"
                  {...register("code")}
                />
                {errors.code ? (
                  <p className="text-caption text-destructive">
                    {errors.code.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucher-description">
                  {t.fields.description}
                </Label>
                <Input id="voucher-description" {...register("description")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucher-type">{t.fields.discountType}</Label>
                <Select<VoucherDiscountType>
                  value={discountType}
                  onChange={(value) =>
                    setValue("discountType", value, { shouldDirty: true })
                  }
                  aria-label={t.fields.discountType}
                  className="w-full"
                  options={VOUCHER_DISCOUNT_TYPES.map((value) => ({
                    value,
                    label: t.discountTypes[value],
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucher-value">
                  {discountType === "percent"
                    ? t.fields.percentValue
                    : t.fields.amountValue}
                </Label>
                <Input
                  id="voucher-value"
                  type="number"
                  min={1}
                  max={discountType === "percent" ? 100 : undefined}
                  {...register("discountValue", { valueAsNumber: true })}
                />
                {errors.discountValue ? (
                  <p className="text-caption text-destructive">
                    {errors.discountValue.message}
                  </p>
                ) : null}
              </div>

              {/* Trần giảm chỉ có nghĩa với mã phần trăm: một mã trừ thẳng tiền
                  đã tự có trần là chính con số đó. */}
              {discountType === "percent" ? (
                <div className="space-y-2">
                  <Label htmlFor="voucher-max">{t.fields.maxDiscount}</Label>
                  <Input
                    id="voucher-max"
                    type="number"
                    min={0}
                    step={1000}
                    placeholder={t.unlimited}
                    {...register("maxDiscount", { valueAsNumber: true })}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="voucher-min">{t.fields.minAmount}</Label>
                <Input
                  id="voucher-min"
                  type="number"
                  min={0}
                  step={1000}
                  {...register("minAmount", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucher-starts">{t.fields.startsAt}</Label>
                <Input
                  id="voucher-starts"
                  type="datetime-local"
                  {...register("startsAt")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucher-expires">{t.fields.expiresAt}</Label>
                <Input
                  id="voucher-expires"
                  type="datetime-local"
                  {...register("expiresAt")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucher-usage">{t.fields.usageLimit}</Label>
                <Input
                  id="voucher-usage"
                  type="number"
                  min={1}
                  placeholder={t.unlimited}
                  {...register("usageLimit", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucher-per-user">
                  {t.fields.perUserLimit}
                </Label>
                <Input
                  id="voucher-per-user"
                  type="number"
                  min={1}
                  placeholder={t.unlimited}
                  {...register("perUserLimit", { valueAsNumber: true })}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-small">
              <Checkbox
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked, { shouldDirty: true })
                }
              />
              {t.fields.isActive}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-small">
                <Checkbox
                  checked={isPublic}
                  onCheckedChange={(checked) =>
                    setValue("isPublic", checked, { shouldDirty: true })
                  }
                />
                {t.fields.isPublic}
              </label>
              <p className="text-caption text-muted-foreground">
                {t.publicHint}
              </p>
            </div>
          </form>

          <DialogFooter>
            <DialogClose size="sm">{commonDict.actions.cancel}</DialogClose>
            <Button
              type="submit"
              form="voucher-form"
              size="sm"
              disabled={saving}
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xoá mã **không** xoá đơn đã dùng nó: `orders.voucher_id` về `null`
          nhưng `voucher_code` giữ lại chữ của mã, nên biên nhận cũ vẫn đọc
          được. Cái mất là sổ lượt dùng của chiến dịch. */}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
            <DialogDescription>{t.deleteBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose size="sm">{commonDict.actions.cancel}</DialogClose>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && onDelete(deleting)}
            >
              {commonDict.actions.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
