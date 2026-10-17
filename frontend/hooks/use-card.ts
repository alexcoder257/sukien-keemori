"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { invitationKindOf } from "@/constants/invitation";
import {
  changeCardTemplate,
  createCard,
  deleteCard,
  getPendingWishCounts,
  stripWishes,
  updateCard,
  type Card,
} from "@/apis";
import { isBlobPhoto, resolvePhotoUrl } from "@/lib/album-uploads";
import { claimPhotos, type PendingPhoto } from "@/lib/photo-staging";
import type { InvitationContent } from "@/lib/schemas/invitation";

export interface SaveCardInput {
  /** Có thì là sửa thiệp cũ; không có thì tạo thiệp mới. */
  cardId?: string;
  templateSlug: string;
  /** Người dùng đã đổi mẫu trong editor — chỉ có nghĩa khi sửa thiệp cũ. */
  templateChanged?: boolean;
  /** Tên hiển thị trong danh sách, suy từ tên cô dâu chú rể. */
  title: string;
  content: InvitationContent;
  /**
   * Báo tiến độ nhận ảnh về thiệp. Ảnh thường đã lên vùng tạm từ lúc chọn nên
   * bước này nhanh, nhưng có thể phải đợi server nén nốt vài tấm — nút "Đang
   * lưu…" đứng im ở đó đọc ra như treo máy.
   *
   * `total` là số ảnh **mới** của lần lưu này, không phải số ảnh trong thiệp:
   * ảnh đã nằm trong thiệp từ lần lưu trước không tốn gì cả.
   */
  onUploadProgress?: (done: number, total: number) => void;
  /**
   * Thiệp vừa được tạo trong lượt lưu này. Lượt lưu hỏng **sau** bước tạo (mất
   * mạng lúc nhận ảnh) thì lần bấm sau phải ghi vào đúng thiệp đó, không dựng
   * thêm một thiệp nháp nữa — bên gọi giữ lại id này.
   */
  onCardCreated?: (card: { id: string; templateSlug: string }) => void;
}

/**
 * "Lưu" — một cú bấm, nhiều bước ở backend.
 *
 * Tách nhiều route thay vì một endpoint gộp là chủ ý của backend: tạo thiệp
 * dựng nội dung rỗng chuẩn, rồi `PUT` ghi nội dung. Nơi ghép chúng lại là hook
 * chứ không phải component — component chỉ biết "người dùng bấm lưu".
 *
 * **Không xuất bản ở đây.** Link công khai chỉ có sau khi thiệp được thanh
 * toán: thiệp trả về mang `status` (`draft` → editor mở hộp thanh toán, `paid`
 * → link đã sống từ trước, chỉ cần lưu).
 *
 * Làm mới cache danh sách thiệp trước khi rời editor. Nếu giữ cache cũ, màn
 * danh sách không thấy thiệp vừa lưu.
 */
export function useSaveCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      templateSlug,
      templateChanged,
      title,
      content,
      onUploadProgress,
      onCardCreated,
    }: SaveCardInput): Promise<Card> => {
      let id = cardId;

      if (!id) {
        const created = await createCard({
          templateSlug,
          title,
          kind: invitationKindOf(content),
        });
        id = created.id;
        onCardCreated?.({ id, templateSlug });
      }

      if (templateChanged) {
        // Trước khi ghi nội dung: đổi mẫu có thể bị từ chối, và khi đó không
        // nên có nội dung nào đã kịp lưu dưới mẫu sai.
        await changeCardTemplate(id, templateSlug);
      }

      // Ảnh phải thành ảnh thật của thiệp **trước** khi ghi nội dung: `content`
      // đang giữ URL `blob:` chỉ sống trong tab này, lưu thẳng là tấm thiệp
      // công khai không có ảnh nào.
      const stored = await resolvePendingPhotos(id, content, onUploadProgress);

      return updateCard(id, { title, content: stripWishes(stored) });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.all }),
  });
}

/**
 * Đổi mọi ảnh còn `blob:` trong `content` thành URL thật của thiệp.
 *
 * Ảnh đã lên vùng tạm từ lúc chọn (`lib/photo-staging.ts`), nên đây chỉ là bước
 * **nhận về**: server chép bản đã nén sang thư mục của thiệp. Tấm nào chưa kịp
 * lên — hỏng mạng lúc chọn — được gửi nốt ở đây. Ảnh đã là URL thật (sửa lại
 * thiệp cũ) đi qua nguyên vẹn.
 *
 * Hỏng thì ném lỗi và **không** ghi nội dung: những tấm đã được nhận về được
 * nhớ lại trong `album-uploads`, nên bấm lưu lần nữa chỉ làm phần còn thiếu.
 */
async function resolvePendingPhotos(
  cardId: string,
  content: InvitationContent,
  onProgress?: (done: number, total: number) => void,
): Promise<InvitationContent> {
  const pending: PendingPhoto[] = [
    ...Object.values(content.photos).map((url) => ({
      url,
      kind: "photo" as const,
    })),
    ...content.album.photos.map((url) => ({ url, kind: "album" as const })),
  ].filter(({ url }) => isBlobPhoto(resolvePhotoUrl(url)));

  if (pending.length > 0) await claimPhotos(cardId, pending, onProgress);

  const resolve = (url: string) => {
    const resolved = resolvePhotoUrl(url);
    // Vẫn còn `blob:` nghĩa là URL này đã chết cùng document tạo ra nó — ghi
    // xuống database thì tấm thiệp công khai trỏ vào bộ nhớ của một tab đã
    // đóng, và không có gì báo lỗi. Thà hỏng ngay ở đây.
    if (isBlobPhoto(resolved)) {
      throw new Error(`Ảnh chưa tải lên được: ${resolved}`);
    }
    return resolved;
  };

  return {
    ...content,
    photos: Object.fromEntries(
      Object.entries(content.photos).map(([key, url]) => [key, resolve(url)]),
    ),
    album: { ...content.album, photos: content.album.photos.map(resolve) },
    ...(content.sharePreview
      ? {
          sharePreview: {
            ...content.sharePreview,
            photoUrl: content.sharePreview.photoUrl
              ? resolvePhotoUrl(content.sharePreview.photoUrl)
              : "",
          },
        }
      : {}),
  };
}

/**
 * Cache React Query của thiệp. Mọi mutation đụng tới danh sách thiệp phải xoá cache dưới khoá `all`.
 */
export const cardQueryKeys = {
  all: ["cards"] as const,
  pendingWishes: () => [...cardQueryKeys.all, "pending-wishes"] as const,
};

export function usePendingWishCountsQuery() {
  return useQuery({
    queryKey: cardQueryKeys.pendingWishes(),
    queryFn: getPendingWishCounts,
  });
}

/**
 * Xoá thiệp. Xoá luôn cache của màn quản lý thiệp; "Thiệp của tôi" thì tự
 * `router.refresh()` vì nó do Server Component dựng.
 */
export function useDeleteCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => deleteCard(cardId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.all }),
  });
}
