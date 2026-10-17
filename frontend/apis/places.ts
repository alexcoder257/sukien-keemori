"use client";

import { request } from "./http";

/** Một dòng trong danh sách gợi ý địa điểm. */
export interface PlaceSuggestion {
  placeId: string;
  /** Tên chính, ví dụ "Trung tâm tiệc cưới Star Palace". */
  mainText: string;
  /** Phần địa chỉ phía sau, ví dụ "Quận 1, TP.HCM". */
  secondaryText: string;
  /**
   * Toạ độ kèm sẵn khi nguồn là OpenStreetMap. Có sẵn thì **không cần** gọi
   * thêm `getPlaceDetails` — đó là lượt gọi chỉ Google mới bắt buộc.
   */
  latitude?: number;
  longitude?: number;
}

/** Địa điểm sau khi người dùng chọn một gợi ý. */
export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * Không gọi thẳng Google: key nằm ở backend nên đây là endpoint của chính mình.
 * Backend cũng là chỗ đếm lượt theo tài khoản và cache lại truy vấn trùng.
 */
export function autocompletePlaces(
  q: string,
  sessionToken: string,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({ q, sessionToken });
  return request<PlaceSuggestion[]>(
    `/places/autocomplete?${params.toString()}`,
  );
}

export function getPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<PlaceDetails> {
  const params = new URLSearchParams({ placeId, sessionToken });
  return request<PlaceDetails>(`/places/details?${params.toString()}`);
}

/** Kết quả bóc từ link chia sẻ Google Maps. */
export interface ResolvedMapLink {
  latitude: number;
  longitude: number;
  /** Tên địa điểm đọc từ link; rỗng nếu link không mang tên. */
  name: string;
  /** Địa chỉ đầy đủ (tên + số nhà + quận huyện) để đổ thẳng vào ô địa chỉ. */
  address: string;
  /** `pin` là điểm ghim thật, `viewport` là tâm khung nhìn (kém chính xác hơn). */
  precision: "pin" | "viewport";
}

/**
 * Đổi link chia sẻ Google Maps lấy toạ độ. Không tốn hạn mức API nào — backend
 * chỉ đi theo redirect và đọc chính URL đó.
 */
export function resolveMapLink(url: string): Promise<ResolvedMapLink> {
  return request<ResolvedMapLink>("/places/resolve-link", {
    method: "POST",
    body: { url },
  });
}
