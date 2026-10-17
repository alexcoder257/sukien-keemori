import { Skeleton } from "@/components/ui/skeleton";

const ROW_COUNT = 3;

/**
 * Khung giữ chỗ của `InvitationList`, dùng trong `loading.tsx` của "Thiệp của
 * tôi". Lưới và khoảng cách chép từ `invitation-list.tsx` và
 * `invitation-row.tsx` — sửa bố cục ở đó thì sửa cả file này, lệch một class
 * là danh sách thật giật một cái lúc thay vào.
 *
 * Không có chữ: `loading.tsx` không nhận `params` nên không biết locale.
 */
export function InvitationListSkeleton() {
  return (
    <div aria-busy>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <ul className="flex flex-col gap-4">
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <li
            key={index}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-6 gap-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
          >
            <Skeleton className="row-span-2 aspect-[0.78] w-32 rounded-xl max-sm:w-18" />
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-6 w-48 max-sm:w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56 max-sm:w-full" />
            </div>
            <div className="flex flex-wrap gap-3 max-sm:col-span-full">
              {[24, 20, 28, 20].map((width, button) => (
                <Skeleton
                  key={button}
                  className="h-9 rounded-lg"
                  style={{ width: `${width * 4}px` }}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
