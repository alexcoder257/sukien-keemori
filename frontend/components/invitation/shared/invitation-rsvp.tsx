"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { ApiError, type RsvpReceipt } from "@/apis";
import { useInvitationCardSlug } from "@/components/invitation/shared/invitation-card-context";
import { useInvitationGuest } from "@/components/invitation/shared/invitation-guest-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RSVP_MAX_PARTY_SIZE,
  RSVP_NAME_MAX_LENGTH,
} from "@/constants/invitation";
import { useSubmitRsvpMutation } from "@/hooks/use-rsvp";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import { rsvpFormSchema, type RsvpForm } from "@/lib/schemas/invitation";
import { cn } from "@/lib/utils";

type Props = {
  dict: Dictionary["invitation"]["sections"]["rsvp"];
  errors: Dictionary["invitation"]["errors"];
  className?: string;
};

/**
 * Xác nhận tham dự: tên, có đi hay không, và đi mấy người.
 *
 * Component **không vẽ tiêu đề**. Mẫu thiệp bọc nó trong chính khung section
 * của mình — cùng khung với sổ lưu bút ngay phía trên — nên tiêu đề tự ra đúng
 * font, cỡ và hoạ tiết của mẫu mà component không phải biết gì. Màu chỉ dùng
 * token ngữ nghĩa, cùng lý do với `InvitationWishes`.
 *
 * Vào bằng link mời riêng thì tên được điền sẵn và mã link đi kèm phản hồi:
 * backend ghi phản hồi đứng tên đúng khách đó, gửi lại là sửa chứ không thêm
 * dòng. Tên vẫn sửa được — khách có thể muốn ghi "Minh" thay cho "Bạn Minh" —
 * vì thứ nối phản hồi với khách là mã, không phải chữ.
 *
 * Không slug là preview trong editor: form chỉ diễn lại luồng, không gửi gì.
 */
export function InvitationRsvp({ dict, errors, className }: Props) {
  const cardSlug = useInvitationCardSlug();
  const guest = useInvitationGuest();
  const submit = useSubmitRsvpMutation(cardSlug ?? "");
  const [receipt, setReceipt] = useState<RsvpReceipt | null>(null);

  const form = useForm<RsvpForm>({
    resolver: zodResolver(rsvpFormSchema(errors)),
    defaultValues: { name: guest?.name ?? "", partySize: 1 },
    mode: "onBlur",
  });
  const attending = useWatch({ control: form.control, name: "attending" });
  const partySize = useWatch({ control: form.control, name: "partySize" });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!cardSlug) {
      setReceipt({
        attending: values.attending,
        partySize: values.attending ? values.partySize : 0,
      });
      return;
    }

    try {
      setReceipt(
        await submit.mutateAsync({ ...values, guestToken: guest?.token }),
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : dict.submitFailed);
    }
  });

  const choose = (value: boolean) =>
    form.setValue("attending", value, { shouldValidate: true });
  const changePartySize = (delta: number) =>
    form.setValue(
      "partySize",
      Math.min(RSVP_MAX_PARTY_SIZE, Math.max(1, partySize + delta)),
    );

  const fieldErrors = form.formState.errors;
  const panel = "rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6";

  if (receipt) {
    return (
      <div className={cn("w-full", className)}>
        <div
          role="status"
          className={cn(panel, "flex flex-col items-center gap-3 text-center")}
        >
          <p className="text-body text-foreground">
            {receipt.attending
              ? fill(dict.thanksAttending, { count: receipt.partySize })
              : dict.thanksDeclined}
          </p>
          {/* Link riêng thì gửi lại là sửa; link chung thì là thêm một dòng —
              chủ thiệp xoá được dòng thừa, nên vẫn cho đổi ý ở cả hai. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setReceipt(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            {dict.change}
          </Button>
        </div>
      </div>
    );
  }

  const choiceClass = (selected: boolean) =>
    cn(
      "min-h-12 rounded-xl border px-4 py-3 text-small font-medium transition-colors",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "border-primary/30 bg-background/40 text-foreground hover:bg-primary/10",
    );

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={onSubmit}
        noValidate
        className={cn(panel, "flex flex-col gap-4")}
      >
        <div className="space-y-1.5">
          <Input
            {...form.register("name")}
            maxLength={RSVP_NAME_MAX_LENGTH}
            aria-label={dict.name}
            aria-invalid={!!fieldErrors.name}
            placeholder={dict.namePlaceholder}
            className="h-12 rounded-xl border-primary/30 bg-background/40"
          />
          {fieldErrors.name ? (
            <p className="text-caption text-destructive">
              {fieldErrors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div
            role="radiogroup"
            aria-label={dict.question}
            className="grid gap-3 sm:grid-cols-2"
          >
            <button
              type="button"
              role="radio"
              aria-checked={attending === true}
              onClick={() => choose(true)}
              className={choiceClass(attending === true)}
            >
              {dict.accept}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={attending === false}
              onClick={() => choose(false)}
              className={choiceClass(attending === false)}
            >
              {dict.decline}
            </button>
          </div>
          {fieldErrors.attending ? (
            <p className="text-caption text-destructive">
              {fieldErrors.attending.message}
            </p>
          ) : null}
        </div>

        {/* Chỉ hỏi số người khi khách đã chọn đi: với người không đi, câu hỏi
            này là một ô vô nghĩa phải lướt qua. */}
        {attending ? (
          <div className="flex items-center justify-between gap-4">
            <span id="rsvp-party-size" className="text-small text-foreground">
              {dict.partySize}
            </span>
            <div
              role="group"
              aria-labelledby="rsvp-party-size"
              className="flex items-center gap-3"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => changePartySize(-1)}
                disabled={partySize <= 1}
                aria-label={dict.fewer}
                className="rounded-full border-primary/30 bg-background/40"
              >
                <Minus aria-hidden />
              </Button>
              <output
                aria-live="polite"
                className="min-w-8 text-center text-body font-medium tabular-nums"
              >
                {partySize}
              </output>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => changePartySize(1)}
                disabled={partySize >= RSVP_MAX_PARTY_SIZE}
                aria-label={dict.more}
                className="rounded-full border-primary/30 bg-background/40"
              >
                <Plus aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={submit.isPending}
          className="self-center rounded-full px-8"
        >
          {dict.submit}
        </Button>
      </form>
    </div>
  );
}
