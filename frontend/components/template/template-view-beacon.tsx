"use client";

import { useEffect } from "react";
import type { TemplateViewKind } from "@/apis/template-view";
import { reportTemplateView } from "@/lib/template-view";

/**
 * Đặt trong trang mẫu (Server Component) để báo một lượt xem lúc trang hiện ra.
 * Là Client Component riêng chứ không biến cả trang thành client: trang mẫu là
 * trang tĩnh (ISR), beacon chạy sau khi hydrate nên không đụng tới cache.
 */
export function TemplateViewBeacon({
  slug,
  kind,
}: {
  slug: string;
  kind: TemplateViewKind;
}) {
  useEffect(() => {
    reportTemplateView(slug, kind);
  }, [slug, kind]);
  return null;
}
