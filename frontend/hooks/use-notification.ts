"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/apis";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationQueryKeys.all, "list"] as const,
};

/**
 * Thông báo trong chuông.
 *
 * **Cố ý không realtime.** Không websocket, không `refetchInterval`, không
 * refetch khi quay lại tab: danh sách chỉ được nạp khi component mount lần đầu
 * — tức là lúc đăng nhập hoặc lúc trang được tải lại — và sau đó chỉ đổi khi
 * chính người dùng đọc một thông báo. Lời chúc chờ duyệt không phải thứ cần
 * biết trong hai giây, còn một cái chuông tự gọi API mỗi phút thì nhân số
 * request lên theo số tab đang mở.
 *
 * `enabled` để trang công khai không gọi khi chưa đăng nhập.
 */
export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: getNotifications,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

/**
 * Đánh dấu một thông báo đã đọc. Cập nhật lạc quan vì người dùng bấm rồi điều
 * hướng đi ngay — chờ round-trip thì chấm đỏ vẫn còn đó lúc trang mới hiện.
 */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: (id) => {
      const previous = queryClient.getQueryData<AppNotification[]>(
        notificationQueryKeys.list(),
      );
      queryClient.setQueryData<AppNotification[]>(
        notificationQueryKeys.list(),
        (old) =>
          old?.map((item) =>
            item.id === id && !item.readAt
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          notificationQueryKeys.list(),
          context.previous,
        );
      }
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      const readAt = new Date().toISOString();
      queryClient.setQueryData<AppNotification[]>(
        notificationQueryKeys.list(),
        (old) => old?.map((item) => (item.readAt ? item : { ...item, readAt })),
      );
    },
  });
}
