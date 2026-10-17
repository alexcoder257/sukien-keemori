"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { ApiError } from "@/apis";
import { useInvitationCardSlug } from "@/components/invitation/shared/invitation-card-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWishMutation } from "@/hooks/use-wish";
import {
  WISH_MAX_MESSAGE_LENGTH,
  WISH_MAX_NAME_LENGTH,
} from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatDateTime } from "@/lib/format";
import { wishFormSchema, type Wish, type WishForm } from "@/lib/schemas/invitation";
import { cn } from "@/lib/utils";

type Props = {
  /** Chỉ lời chúc đã duyệt — việc lọc do `invitationBlocks` làm. */
  wishes: Wish[];
  dict: Dictionary["invitation"]["sections"]["wishes"];
  errors: Dictionary["invitation"]["errors"];
  locale: Locale;
  className?: string;
};

/**
 * Sổ lưu bút — block duy nhất trên thiệp mà **khách** ghi vào. Gồm ô viết lời
 * chúc và danh sách những lời chúc cặp đôi đã duyệt.
 *
 * Component không mang màu riêng: nó chỉ dùng token ngữ nghĩa (`--card`,
 * `--primary`, `--border`…), mà mỗi mẫu thiệp đã khai lại những token đó trong
 * CSS Module của mình. Nhờ vậy một component chạy đúng tông ở cả 13 mẫu, và
 * mẫu mới không phải sửa gì ở đây — đúng quy tắc "component dùng chung đặt bên
 * trong thiệp được chỉnh bằng token ngữ nghĩa, không sửa chính component đó"
 * (`CLAUDE.md` mục Design system).
 *
 * Gửi xong **không** chèn lời chúc vào danh sách: nó về ở trạng thái chờ duyệt
 * và chỉ hiện sau khi cặp đôi bấm Duyệt, nên chèn ngay là hứa với khách một
 * trạng thái không có thật.
 *
 * Thiệp đang xem lấy từ context (`useInvitationCardSlug`) chứ không phải prop:
 * 13 mẫu thiệp cùng dựng component này, mà mẫu nào quên chuyền prop xuống thì
 * sổ lưu bút hỏng im lặng. Không có slug nghĩa là đang ở preview trong editor —
 * ở đó form chỉ diễn lại luồng, không gửi gì cả.
 */
export function InvitationWishes({
  wishes,
  dict,
  errors,
  locale,
  className,
}: Props) {
  // Xoay vòng qua danh sách gợi ý thay vì lấy ngẫu nhiên: bấm hai lần phải ra
  // hai câu khác nhau, mà ngẫu nhiên thì không hứa được điều đó.
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const cardSlug = useInvitationCardSlug();
  const createWish = useCreateWishMutation(cardSlug ?? "");

  const form = useForm<WishForm>({
    resolver: zodResolver(wishFormSchema(errors)),
    defaultValues: { name: "", message: "" },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // Preview trong editor: không có thiệp thật nào để ghi vào, nhưng chủ thiệp
    // vẫn cần thấy khối này phản hồi ra sao.
    if (!cardSlug) {
      toast.success(dict.submitted);
      form.reset();
      return;
    }

    try {
      await createWish.mutateAsync(values);
      toast.success(dict.submitted);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : dict.submitFailed,
      );
    }
  });

  const onSuggest = () => {
    const suggestions = dict.suggestions;
    if (suggestions.length === 0) return;
    form.setValue("message", suggestions[suggestionIndex % suggestions.length], {
      shouldValidate: form.formState.isSubmitted,
    });
    setSuggestionIndex((index) => index + 1);
  };

  const fieldErrors = form.formState.errors;

  return (
    <div className={cn("flex w-full flex-col gap-8", className)}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6"
      >
        <div className="space-y-1.5">
          <Input
            {...form.register("name")}
            maxLength={WISH_MAX_NAME_LENGTH}
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
          <Textarea
            {...form.register("message")}
            maxLength={WISH_MAX_MESSAGE_LENGTH}
            rows={5}
            aria-label={dict.message}
            aria-invalid={!!fieldErrors.message}
            placeholder={dict.messagePlaceholder}
            className="min-h-36 rounded-xl border-primary/30 bg-background/40"
          />
          {fieldErrors.message ? (
            <p className="text-caption text-destructive">
              {fieldErrors.message.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Nút gợi ý đứng riêng bên trái ở mức nhấn thấp nhất: nó là trợ giúp
              cho người bí chữ, không phải hành động chính của khối này. */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSuggest}
            aria-label={dict.suggest}
            title={dict.suggest}
            className="rounded-xl bg-foreground/5 text-muted-foreground hover:text-foreground"
          >
            <Wand2 aria-hidden />
          </Button>
          <Button
            type="submit"
            disabled={createWish.isPending}
            className="rounded-full px-8"
          >
            {dict.submit}
          </Button>
        </div>
      </form>

      {wishes.length === 0 ? (
        <p className="text-center text-small text-muted-foreground">
          {dict.empty}
        </p>
      ) : (
        /* Danh sách cuộn trong khung thay vì kéo dài vô hạn: sổ lưu bút có thể
           lên tới hàng trăm dòng, mà nó không được đẩy phần còn lại của thiệp
           ra khỏi tầm cuộn. `data-lenis-prevent`: Lenis bắt mọi cú lăn chuột
           để cuộn cả trang, thiếu nó thì khung này không bao giờ tự cuộn. */
        <ul
          aria-label={dict.listLabel}
          data-lenis-prevent
          className="flex max-h-112 flex-col gap-3 overflow-y-auto pr-1"
        >
          {wishes.map((wish) => (
            <li
              key={wish.id}
              className="rounded-2xl border border-border/50 bg-card/50 px-5 py-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-medium text-primary">{wish.name}</p>
                <time
                  dateTime={wish.createdAt}
                  className="text-caption text-muted-foreground"
                >
                  {formatDateTime(wish.createdAt, locale)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-line text-body text-foreground/85">
                {wish.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
