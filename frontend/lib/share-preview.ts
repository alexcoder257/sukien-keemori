import type { PhotoSlotKey } from "@/constants/invitation";
import type { InvitationContent } from "@/lib/schemas/invitation";

/** Chỉ ảnh tải lên; editor local có thể cho xem thử bằng ảnh mẫu. */
export function sharePreviewPhotos(
  content: InvitationContent,
  slots: readonly PhotoSlotKey[],
  includeSamplePhotos = false,
) {
  const seen = new Set<string>();
  return [
    ...slots.map((slot) => ({
      url: content.photos[slot],
      group: "wedding" as const,
    })),
    ...content.album.photos.map((url) => ({ url, group: "album" as const })),
  ].filter((photo): photo is { url: string; group: "wedding" | "album" } => {
    if (!photo.url || seen.has(photo.url)) return false;
    if (
      !photo.url.startsWith("blob:") &&
      !/^\/uploads\/cards\/[^/]+\/(photos|album)\/[^/]+$/.test(photo.url) &&
      !(
        includeSamplePhotos &&
        /^\/images\/templates\/[^/]+\/photos\/[^/]+$/.test(photo.url)
      )
    )
      return false;
    seen.add(photo.url);
    return true;
  });
}

export function sharePreviewSource(
  content: InvitationContent,
  slots: readonly PhotoSlotKey[],
  includeSamplePhotos = false,
): string | undefined {
  const settings = content.sharePreview;
  // Mặc định là ảnh Keemori; `auto` cũ (từng là "tự lấy ảnh bìa") cũng vậy.
  // Ảnh riêng chỉ khi chủ thiệp chọn, và ảnh đó còn hợp lệ — mất thì về Keemori.
  if (settings?.mode !== "photo") return undefined;
  const photos = sharePreviewPhotos(content, slots, includeSamplePhotos);
  return photos.some(({ url }) => url === settings.photoUrl)
    ? settings.photoUrl
    : undefined;
}

/** Chỉ JPEG server đã tạo cho đúng ảnh hiện tại mới đi vào metadata. */
export function sharePreviewImage(
  content: InvitationContent,
  slots: readonly PhotoSlotKey[],
): string | undefined {
  const settings = content.sharePreview;
  const source = sharePreviewSource(content, slots);
  return source &&
    settings?.sourceUrl === source &&
    /^\/uploads\/cards\/[^/]+\/share\/[^/]+\.jpg$/.test(settings.imageUrl ?? "")
    ? settings.imageUrl
    : undefined;
}
