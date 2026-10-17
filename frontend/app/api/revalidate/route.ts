import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Backend gọi route này sau khi admin lưu cấu hình (giá, FAQ, kho mẫu…) để
 * nội dung mới hiện ra ngay thay vì chờ hết chu kỳ `revalidate`.
 *
 * Bảo vệ bằng secret dùng chung (`REVALIDATE_SECRET` ở cả hai app): route xoá
 * cache là một cửa DoS nếu để mở — ai gọi cũng được thì mỗi request là một
 * lượt truy vấn thẳng xuống Postgres.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    tags?: unknown;
  } | null;
  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  if (tags.length === 0) {
    return NextResponse.json({ message: "tags required" }, { status: 400 });
  }

  // "max": chuẩn stale-while-revalidate của Next 16 — khách đang xem vẫn nhận
  // trang cũ tức thì, bản mới nạp nền và thay ngay sau đó.
  for (const tag of tags) revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: tags });
}
