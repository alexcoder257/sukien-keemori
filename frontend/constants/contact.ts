/**
 * Thông tin liên hệ công khai. Đây là *nội dung*, không phải cấu hình môi
 * trường, nên nằm ở đây chứ không phải trong `.env`: giá trị giống nhau ở mọi
 * môi trường và cần hiện nguyên văn trong HTML để người dùng bấm gọi/gửi mail.
 *
 * Không dịch: email và số điện thoại giống nhau ở cả hai ngôn ngữ.
 *
 * **Một hộp thư duy nhất.** Một hộp thư có người trả lời tốt hơn nhiều hộp thư
 * mà có cái không ai mở. `constants/legal.ts` vẫn giữ khoá riêng cho
 * từng vai (`privacyEmail`, `complaintEmail`) cùng trỏ về đây,
 * nên ngày tách thật chỉ phải sửa file đó.
 *
 * Địa chỉ theo tên miền chính thức `keemori.com` — vẫn phải **tạo hộp thư thật**
 * trước khi lên production, vì nó được in vào các văn bản pháp lý (điều
 * khoản, khiếu nại, yêu cầu về dữ liệu cá nhân) chứ không chỉ trang Liên hệ.
 *
 * Messenger không nằm ở đây: đây là cấu hình vận hành lấy từ `site_settings`,
 * để đổi fanpage trong CMS không cần deploy lại frontend.
 */
export const CONTACT = {
  supportEmail: "hotro@keemori.com",
} as const;
