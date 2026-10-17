/**
 * Giá **dự phòng** của gói duy nhất (thiệp custom). Nguồn thật là CMS "Bảng giá"
 * (`GET /pricing`, xem `lib/data/pricing.ts`): trang `/bang-gia` và mục "Dịch vụ
 * cung cấp" của trang Thông tin doanh nghiệp đọc từ đó. Hằng số này chỉ dùng khi
 * backend không trả lời — trang giá vẫn dựng được thay vì đổ 500 — và trùng với
 * giá mặc định lúc seed (899.000 ₫).
 */
export const CUSTOM_CARD_PRICE = 899_000;
