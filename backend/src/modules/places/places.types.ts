/** Một dòng gợi ý địa điểm, không phụ thuộc nhà cung cấp nào. */
export interface PlaceSuggestion {
  placeId: string;
  /** Tên chính, ví dụ "Trung tâm tiệc cưới Star Palace". */
  mainText: string;
  /** Phần địa chỉ phía sau, ví dụ "Quận 1, TP.HCM". */
  secondaryText: string;
  /**
   * Toạ độ kèm sẵn nếu nhà cung cấp trả về ngay (Photon). Google Places bắt gọi
   * thêm một lượt `details` mới có, nên trường này vắng mặt ở đó — frontend dựa
   * vào chính nó để quyết định có phải gọi thêm hay không.
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
