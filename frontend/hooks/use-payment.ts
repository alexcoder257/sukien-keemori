"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getCheckoutInfo, type CheckoutInfo } from "@/apis";
import { revalidateInvitationPages } from "@/app/[locale]/thanh-toan/actions";
import { cardQueryKeys } from "@/hooks/use-card";
import type { Locale } from "@/i18n/config";

function cardsUrl(locale: Locale, slug?: string | null): string {
  return `/${locale}/thiep-cua-toi${slug ? `?moi=${encodeURIComponent(slug)}` : ""}`;
}

/** Hai cache độc lập: render Next của "Thiệp của tôi" và danh sách React Query. */
export function useReturnToCardsAfterPayment(locale: Locale) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    /** `slug` có thì danh sách mở sẵn hộp link của thiệp vừa trả tiền (`?moi=`). */
    mutationFn: async (slug?: string | null) => {
      // Xoá cả query không đang mount: invalidate mặc định không tải lại chúng,
      // và lần quay về sẽ vẽ dữ liệu chưa thanh toán cũ trước khi refetch xong.
      queryClient.removeQueries({ queryKey: cardQueryKeys.all });
      await revalidateInvitationPages(locale);
      return slug;
    },
    onSuccess: (slug) => router.push(cardsUrl(locale, slug)),
    // Nếu action không gọi được, tải trang mới vẫn bỏ được cả hai cache cũ.
    onError: (_error, slug) => window.location.assign(cardsUrl(locale, slug)),
  });
}

export const paymentQueryKeys = {
  all: ["payment"] as const,
  checkout: (orderId: string) =>
    [...paymentQueryKeys.all, "checkout", orderId] as const,
};

/** Nhịp hỏi lại backend trong lúc khách đang chuyển khoản. */
const POLL_INTERVAL_MS = 5_000;

/**
 * Thông tin thanh toán của một đơn, tự hỏi lại cho tới khi tiền về.
 *
 * **Đây là ngoại lệ có chủ đích của quy tắc "không polling"** (xem module
 * `notifications` trong `CLAUDE.md`). Ở đó polling bị cấm vì cái chuông chạy
 * suốt phiên và nhân số request theo số tab đang mở. Ở đây thì khác hẳn: người
 * dùng đang ngồi nhìn màn hình chờ, nhịp hỏi tự tắt ngay khi đơn rời khỏi
 * `pending`, và không có đường nào khác để biết tiền đã về — webhook đi vào
 * backend chứ không đi vào trình duyệt.
 *
 * Không dùng `refetchInterval` cố định mà truyền hàm: nó đọc trạng thái của
 * chính lần fetch gần nhất, nên vòng lặp tự dừng chứ không cần bên gọi tắt hộ.
 */
export function useCheckoutQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: paymentQueryKeys.checkout(orderId ?? ""),
    queryFn: () => getCheckoutInfo(orderId as string),
    enabled: Boolean(orderId),
    // Hai điều kiện dừng, cả hai đọc thẳng từ dữ liệu của chính lần fetch gần
    // nhất nên vòng lặp tự tắt, bên gọi không phải tắt hộ:
    //
    // 1. Đơn đã rời `pending` — màn hình lúc đó đã sang trạng thái thành
    //    công/huỷ.
    // 2. Đã quá thời gian giữ đơn — một tab bị bỏ quên không được hỏi mãi. Đơn
    //    vẫn sống; người dùng đã được báo và có nút kiểm tra lại.
    refetchInterval: (query) => {
      const info = query.state.data;
      if (info?.status !== "pending") return false;
      if (isCheckoutHoldExpired(info)) return false;
      return POLL_INTERVAL_MS;
    },
    // Khách hay chuyển khoản ở app ngân hàng rồi quay lại tab này; hỏi lại
    // ngay lúc quay lại cho kết quả nhanh hơn chờ hết nhịp.
    refetchOnWindowFocus: true,
    retry: false,
  });
}

/**
 * Đã quá thời gian màn thanh toán chờ tiền hay chưa.
 *
 * **Không có nghĩa là đơn hết hạn**: đơn vẫn `pending`, mã vẫn ghép được, tiền
 * chuyển muộn vẫn về đúng đơn đó. Nó chỉ quyết định trang ngừng tự hỏi và
 * chuyển sang nói cho người dùng biết. Mốc do backend cấp (`holdExpiresAt`,
 * tính từ lúc tạo đơn) nên tải lại trang không kéo dài thêm giờ.
 */
export function isCheckoutHoldExpired(info: CheckoutInfo | undefined): boolean {
  if (!info?.holdExpiresAt) return false;
  return new Date(info.holdExpiresAt).getTime() <= Date.now();
}
