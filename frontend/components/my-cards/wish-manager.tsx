"use client";

import { toast } from "sonner";
import { ApiError } from "@/apis";
import { WishModerationList } from "@/components/shared/wish-moderation-list";
import {
  useCardWishesQuery,
  useDeleteWishMutation,
  useSetWishApprovedMutation,
} from "@/hooks/use-wish";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Wish } from "@/lib/schemas/invitation";

type Props = {
  /** Thiệp đang quản lý — mọi thao tác duyệt/xoá ghi vào đúng thiệp này. */
  cardId: string;
  /**
   * Danh sách trang server-render đã nạp sẵn, để không nháy một khung rỗng.
   * Bỏ trống thì hook tự gọi — editor mở thiệp cũ không nạp lời chúc cùng nội
   * dung.
   */
  wishes?: Wish[];
  dict: Dictionary["editor"]["blocks"]["wishes"];
  locale: Locale;
};

/**
 * Phần tương tác của trang quản lý lời chúc: nối hai hành động duyệt/xoá vào
 * `WishModerationList`.
 *
 * Danh sách do trang server-render nạp sẵn và truyền vào làm `initialData`,
 * nhưng nguồn thật là cache React Query — nếu không, hai lượt bấm liên tiếp sẽ
 * đọc lại state cũ. Backend là nơi kiểm quyền sở hữu.
 */
export function WishManager({ cardId, wishes: initial, dict, locale }: Props) {
  const { data: wishes = [] } = useCardWishesQuery(cardId, initial);
  const setApproved = useSetWishApprovedMutation(cardId);
  const remove = useDeleteWishMutation(cardId);

  const onError = (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : dict.actionFailed);

  const onApprovedChange = (id: string, approved: boolean) => {
    setApproved.mutate(
      { wishId: id, approved },
      {
        onSuccess: () =>
          toast.success(approved ? dict.approveDone : dict.unapproveDone),
        onError,
      },
    );
  };

  const onDelete = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => toast.success(dict.deleteDone),
      onError,
    });
  };

  return (
    <WishModerationList
      wishes={wishes}
      dict={dict}
      locale={locale}
      onApprovedChange={onApprovedChange}
      onDelete={onDelete}
    />
  );
}
