"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  address: string;
  /**
   * Toạ độ có được khi người dùng chọn địa điểm từ gợi ý (`venuePlace`). Có thì
   * bản đồ trỏ đúng điểm; không có thì rơi về tra theo chuỗi chữ như trước —
   * cách đó đoán sai khá thường với địa chỉ ở quê.
   */
  place?: { latitude: number; longitude: number } | null;
  title: string;
  className?: string;
};

/**
 * Hiển thị bản đồ theo địa chỉ bằng endpoint iframe công khai của Google Maps.
 * Không phụ thuộc API key nên preview không bị lỗi khi project chưa bật Maps
 * Embed API.
 *
 * **Ghim đỏ phải nằm giữa khung.** Khách mời liếc một cái phải thấy ngay chỗ
 * cần tới; ghim nằm nép một góc thì khung bản đồ chỉ còn là mảng trang trí.
 * Hai tham số quyết định điều đó:
 *
 * - Không truyền `iwloc`: nó mở bong bóng thông tin, mà bong bóng vừa che một
 *   góc bản đồ vừa khiến Google kéo khung lệch đi để hiển thị đủ nó.
 * - Có toạ độ thì mã `pb` ghi cùng một cặp vào tâm khung và truy vấn ghim.
 *   Chỉ tìm theo địa chỉ là giao cho Google tự chọn tâm, và với khung rộng-dẹt
 *   nó thường chọn lệch.
 *
 * Debounce giúp preview editor không tạo iframe mới sau mỗi phím gõ.
 */
export function GoogleMapEmbed({ address, place, title, className }: Props) {
  const [stableAddress, setStableAddress] = useState("");

  useEffect(() => {
    const value = address.trim();
    if (value.length < 4) {
      const timer = window.setTimeout(() => setStableAddress(""), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => setStableAddress(value), 500);
    return () => window.clearTimeout(timer);
  }, [address]);

  if (!stableAddress) return null;

  // Đi thẳng tới endpoint iframe. Endpoint `/maps?q=...&output=embed` trả một
  // redirect có `X-Frame-Options: SAMEORIGIN`; một số trình duyệt chặn ngay
  // response trung gian đó và chỉ vẽ khung trắng. URL `/maps/embed` trả thẳng
  // tài liệu được phép nhúng nên không gặp lỗi này.
  const src = new URL("https://www.google.com/maps/embed");
  // Toạ độ thắng chuỗi chữ: cùng một cái tên có ở nhiều tỉnh, còn một cặp
  // lat/lng thì chỉ có một chỗ. `pb` giữ tâm và ghim trùng nhau ở zoom 16.
  const coordinates = place ? `${place.latitude},${place.longitude}` : null;
  const query = coordinates ?? stableAddress;
  const viewport = coordinates
    ? `!1m12!1m8!1m3!1d7450!2d${place?.longitude}!3d${place?.latitude}` +
      "!3m2!1i1024!2i768!4f13.1"
    : "!1m3";
  src.searchParams.set("origin", "mfe");
  src.searchParams.set(
    "pb",
    `${viewport}!2m1!1s${query}!6i16!3m1!1svi!5m1!1svi`,
  );

  return (
    // `min-h-64` đặt ở khung chứ không ở iframe: để trên iframe thì mẫu nào ép
    // khung thấp hơn sẽ cắt mất phần dưới bản đồ, và ghim tụt khỏi vùng nhìn.
    <div className={cn("min-h-64", className)}>
      {/*
        Khung bản đồ **không nhận chuột**. Ghim đặt bằng toạ độ trần nên Google
        không có bản ghi địa điểm nào để hiện: bấm vào nó chỉ bung ra hộp "Không
        tải được thông tin về địa điểm". Khoá tương tác thì hộp đó không bao giờ
        bật, và trên điện thoại cuộn trang qua bản đồ không còn bị iframe nuốt.
        Khách cần bản đồ thật thì đã có nút mở Google Maps ngay dưới.
      */}
      <iframe
        title={title}
        src={src.toString()}
        className="pointer-events-none h-full min-h-64 w-full border-0"
        loading="eager"
        tabIndex={-1}
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
