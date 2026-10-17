/** Kết quả của một template email: đủ cho `MailService.send`. */
export interface RenderedEmail {
  subject: string;
  html: string;
  /** Bản chữ trơn cho ứng dụng thư không đọc HTML — và cho bộ lọc spam. */
  text: string;
}
