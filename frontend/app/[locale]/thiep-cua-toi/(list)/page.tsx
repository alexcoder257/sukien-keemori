import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationList } from "@/components/my-cards/invitation-list";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getMyInvitations } from "@/lib/data/invitations";
import { getPricing } from "@/lib/data/pricing";
import { NO_INDEX } from "@/lib/seo";

/**
 * Trang này đọc request (cookie — thiệp của người đang đăng nhập) nên phải render theo từng lượt xem.
 *
 * Phải khai tường minh: layout `[locale]` để `generateStaticParams` rỗng (trang
 * public dựng lúc có người vào lần đầu), nên lúc build Next không dựng thử
 * trang nào và **không tự phát hiện** được trang động. Thiếu dòng này thì bản
 * build coi trang là tĩnh và ném 500 "Page changed from static to dynamic at
 * runtime" ở lượt xem đầu tiên — `next dev` không báo gì.
 *
 * `revalidate = 0` chứ không `force-dynamic`: cái sau tắt luôn cache của mọi
 * `fetch` trong trang, còn cái này giữ nguyên `fetch` đã khai `revalidate`.
 */
export const revalidate = 0;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/thiep-cua-toi">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  // Trang sau đăng nhập — không có nội dung công khai nào để Google lưu.
  return { title: dict.myCards.meta.title, robots: NO_INDEX };
}

/**
 * "Thiệp của tôi" — **chỉ** của user thường. Route được `proxy.ts` gác đăng
 * nhập; quyền sở hữu do backend kiểm tra.
 */
export default async function MyCardsPage({
  params,
}: PageProps<"/[locale]/thiep-cua-toi">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, pricing] = await Promise.all([
    getDictionary(locale),
    getPricing(),
  ]);

  // Header, tiêu đề và footer nằm ở `layout.tsx` cùng group, để `loading.tsx`
  // chỉ thay danh sách thiệp — phần phải chờ backend.
  return (
    <InvitationList
      invitations={await getMyInvitations()}
      dict={dict.myCards}
      commonDict={dict.common}
      paymentDict={dict.payment.upgrade}
      price={pricing.finalPrice}
      locale={locale}
    />
  );
}
