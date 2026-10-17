/**
 * Gói dịch vụ — bản rút gọn của `frontend/constants/invitation.ts`.
 *
 * CMS chỉ cần *tên gói* để hiện nhãn và cấu hình giá; mọi quy tắc đi kèm gói
 * (số ô ảnh, album, block nào bật) là chuyện của thiệp và sống ở repo trang
 * khách. Chép cả file đó sang đây sẽ tạo ra bản thứ hai của luật nghiệp vụ mà
 * không ai nhớ đồng bộ.
 */
export const TIERS = ["free", "gold", "diamond"] as const;
export type Tier = (typeof TIERS)[number];
