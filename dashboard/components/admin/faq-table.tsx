"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/apis";
import type { Faq, FaqInput } from "@/apis/content";
import { Badge } from "@/components/ui/badge";
import { ActionButton, ActionGroup } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminTable } from "@/components/ui/table";
import {
  useCreateFaqMutation,
  useDeleteFaqMutation,
  useFaqsQuery,
  useUpdateFaqMutation,
} from "@/hooks/use-content";
import { PAGE_SIZE } from "@/constants/pagination";
import type { Dictionary } from "@/i18n/dictionaries";
import { withoutId } from "@/lib/entity";
import { faqSchema, type FaqValues } from "@/lib/schemas/admin";

type Props = {
  dict: Dictionary["admin"];
  commonDict: Dictionary["common"];
};

const EMPTY: FaqInput = {
  questionVi: "",
  answerVi: "",
  questionEn: "",
  answerEn: "",
  sortOrder: 0,
  isPublished: true,
};

/**
 * Danh sách FAQ (spec mục 4).
 *
 * Một bản ghi mang **cả hai ngôn ngữ** nên form có bốn ô: FAQ là text giao diện,
 * thiếu một cột thì trang công khai bên ngôn ngữ kia hiện ô trống chứ không rơi
 * về ngôn ngữ còn lại.
 */
export function FaqTable({ dict, commonDict }: Props) {
  const { message } = App.useApp();
  const t = dict.faq;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);

  const [page, setPage] = useState(0);
  const { data, isLoading } = useFaqsQuery(page);
  const faqs = data?.items;
  const createMutation = useCreateFaqMutation();
  const updateMutation = useUpdateFaqMutation();
  const deleteMutation = useDeleteFaqMutation();

  const schema = useMemo(() => faqSchema(dict.errors), [dict.errors]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FaqValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  function reportError(error: unknown) {
    message.error(error instanceof ApiError ? error.message : dict.errors.failed);
  }

  function startCreate() {
    setEditing(null);
    reset({ ...EMPTY, sortOrder: (faqs?.length ?? 0) + 1 });
    setOpen(true);
  }

  function startEdit(faq: Faq) {
    setEditing(faq);
    reset(withoutId(faq));
    setOpen(true);
  }

  function onSubmit(values: FaqValues) {
    const handlers = {
      onSuccess: () => {
        message.success(editing ? t.updated : t.created);
        setOpen(false);
      },
      onError: reportError,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, input: values }, handlers);
    } else {
      createMutation.mutate(values, handlers);
    }
  }

  function onDelete(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    deleteMutation.mutate(id, {
      onSuccess: () => message.success(t.deleted),
      onError: reportError,
    });
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<Faq> = [
    {
      title: t.columns.question,
      dataIndex: "questionVi",
      render: (_, faq) => (
        <div>
          <div className="font-medium">{faq.questionVi}</div>
          <div className="text-caption text-muted-foreground">
            {faq.questionEn}
          </div>
        </div>
      ),
    },
    {
      title: t.columns.order,
      dataIndex: "sortOrder",
      className: "text-muted-foreground",
    },
    {
      title: t.columns.status,
      dataIndex: "isPublished",
      render: (_, faq) => (
        <Badge variant={faq.isPublished ? "solid" : "outline"} size="sm">
          {faq.isPublished ? t.published : "—"}
        </Badge>
      ),
    },
    {
      title: t.columns.actions,
      dataIndex: "actions",
      render: (_, faq) => (
        <ActionGroup>
          <ActionButton
            label={commonDict.actions.edit}
            icon={<Pencil />}
            onClick={() => startEdit(faq)}
          />
          <ActionButton
            label={commonDict.actions.delete}
            icon={<Trash2 />}
            tone="danger"
            disabled={deleteMutation.isPending}
            onClick={() => onDelete(faq.id)}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <Button type="button" size="sm" onClick={startCreate}>
        <Plus />
        {t.add}
      </Button>

      <AdminTable<Faq>
        columns={columns}
        dataSource={faqs ?? []}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t.columns.question : t.add}</DialogTitle>
          </DialogHeader>

          <form
            id="faq-form"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="space-y-2">
              <Label htmlFor="questionVi">{t.questionVi}</Label>
              <Input
                id="questionVi"
                aria-invalid={!!errors.questionVi}
                {...register("questionVi")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionEn">{t.questionEn}</Label>
              <Input
                id="questionEn"
                aria-invalid={!!errors.questionEn}
                {...register("questionEn")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answerVi">{t.answerVi}</Label>
              <Textarea
                id="answerVi"
                rows={4}
                aria-invalid={!!errors.answerVi}
                {...register("answerVi")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answerEn">{t.answerEn}</Label>
              <Textarea
                id="answerEn"
                rows={4}
                aria-invalid={!!errors.answerEn}
                {...register("answerEn")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">{t.sortOrder}</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-end pb-2">
              <Controller
                control={control}
                name="isPublished"
                render={({ field }) => (
                  <Label className="gap-3 font-normal">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                    {t.published}
                  </Label>
                )}
              />
            </div>
          </form>

          <DialogFooter>
            <DialogClose>
              {commonDict.actions.cancel}
            </DialogClose>
            <Button type="submit" form="faq-form" size="sm" disabled={saving}>
              {commonDict.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
