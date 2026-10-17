"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/apis/config";

const STORAGE_KEY = "last-visit-day";

/**
 * Đếm lượt truy cập cho màn Phân tích của CMS.
 *
 * Không đặt cookie, không gửi định danh nào: chỉ một cờ "lần đầu trong hôm nay"
 * suy từ mốc ngày lưu ở `localStorage`, còn backend gộp thẳng vào một hàng mỗi
 * ngày. Đổi lại là số khách chỉ là **ước lượng** — xoá dữ liệu trình duyệt hoặc
 * đổi máy sẽ đếm thành khách mới. Đó là đánh đổi có chủ đích: một con số
 * marketing xấp xỉ không đáng để dựng hạ tầng theo dõi người dùng.
 *
 * Lỗi mạng thì im lặng bỏ qua — đây là số liệu phụ, không được phép làm hỏng
 * trải nghiệm của người đang xem thiệp.
 */
export function VisitBeacon() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    let isNewVisitor = false;
    try {
      isNewVisitor = window.localStorage.getItem(STORAGE_KEY) !== today;
      if (isNewVisitor) window.localStorage.setItem(STORAGE_KEY, today);
    } catch {
      // Trình duyệt chặn localStorage (chế độ riêng tư): vẫn đếm lượt xem
      // trang, chỉ không biết đây có phải khách mới hay không.
    }

    void fetch(`${API_BASE_URL}/public/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isNewVisitor }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return null;
}
