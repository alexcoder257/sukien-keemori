import { Skeleton } from "@/components/ui/skeleton";

/** Đủ lấp màn hình đầu ở mọi breakpoint (3 cột × 2 hàng trên desktop). */
const CARD_COUNT = 6;

/**
 * Khung giữ chỗ của `TemplateGallery`, dùng trong `loading.tsx` của kho mẫu.
 *
 * Lưới, khoảng cách và breakpoint **chép đúng** từ `template-gallery.tsx`
 * và `PosterCard` — lệch một class là lúc nội dung thật
 * thay vào trang giật một cái, đúng thứ skeleton sinh ra để tránh. Sửa bố cục
 * gallery thì sửa cả file này.
 *
 * Không có chữ nào: `loading.tsx` không nhận `params` nên không biết locale.
 */
export function TemplateGallerySkeleton() {
  return (
    <div
      aria-busy
      className="container-page py-16 max-mobile:pt-6 max-mobile:pb-12"
    >
      <div className="grid gap-6 max-mobile:grid-cols-2 max-mobile:gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: CARD_COUNT }, (_, index) => (
          <div
            key={index}
            className="flex flex-col overflow-hidden rounded-xl bg-card"
          >
            <Skeleton className="aspect-[0.78] rounded-none" />
            <div className="w-full min-w-0 space-y-2 p-5 max-mobile:px-2.5 max-mobile:py-2 sm:p-6">
              <Skeleton className="h-6 w-3/5 max-mobile:h-5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
