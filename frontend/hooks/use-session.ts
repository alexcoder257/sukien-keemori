"use client";

import { useSyncExternalStore } from "react";
import { hasSession, subscribeSession } from "@/apis/token";

/**
 * Người đang xem có phiên đăng nhập hay không, đọc ở trình duyệt.
 *
 * Trả `null` khi **chưa biết**: lúc server render và lúc hydrate. Trang public
 * là trang tĩnh dựng sẵn cho mọi người — server không đọc cookie, nên HTML
 * không thể nói người này đã đăng nhập hay chưa. Component phải vẽ một trạng
 * thái trung tính cho `null` (ô giữ chỗ, hoặc không vẽ gì), đừng coi `null` là
 * "chưa đăng nhập": làm vậy là người đã đăng nhập thấy nút "Đăng nhập" loé lên
 * rồi mới đổi sang avatar.
 *
 * `serverHint` dành cho trang **vốn đã động** (`thiep-cua-toi`…):
 * trang đó đọc cookie ở server đằng nào cũng có, truyền vào thì bỏ được nhịp
 * `null`.
 *
 * Như `hasSession` ở server, đây chỉ để chọn giao diện — quyền thật do backend
 * và `proxy.ts` quyết định.
 */
export function useSession(serverHint?: boolean): boolean | null {
  return useSyncExternalStore(
    subscribeSession,
    hasSession,
    () => serverHint ?? null,
  );
}
