import { request } from "./http";

/** Đúng những gì `StoredFile` của backend trả về. */
export interface UploadedImage {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

/**
 * Ảnh bìa / ảnh chụp dài của ô "Cặp đôi đã tạo thiệp". Đi đường riêng vì ảnh
 * biên tập bị thu về cạnh dài 1600px — ảnh chụp dài cả chục nghìn điểm ảnh sẽ
 * thành một sợi chỉ. Đường này chỉ chặn bề ngang 960px, ra AVIF.
 */
export function uploadShowcaseImage(file: File): Promise<UploadedImage> {
  const form = new FormData();
  form.append("file", file);
  return request<UploadedImage>("/admin/uploads/showcase-image", {
    method: "POST",
    body: form,
  });
}
