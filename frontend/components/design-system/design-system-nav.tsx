"use client";

import {
  CalendarHeart,
  GalleryHorizontalEnd,
  Images,
  LayoutGrid,
  ListTree,
  PanelTopOpen,
  Type,
} from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const items = [
  { segment: null, label: "Tổng quan", icon: LayoutGrid },
  { segment: "fonts", label: "Fonts", icon: Type },
  { segment: "opening", label: "Opening", icon: PanelTopOpen },
  { segment: "details", label: "Chi tiết", icon: GalleryHorizontalEnd },
  { segment: "ceremonies", label: "Nghi lễ", icon: CalendarHeart },
  { segment: "timeline", label: "Timeline", icon: ListTree },
  { segment: "album", label: "Album", icon: Images },
] as const;

/** Điều hướng cố định giữa các trang tham chiếu nội bộ của Design System. */
export function DesignSystemNav({ locale }: { locale: Locale }) {
  const activeSegment = useSelectedLayoutSegment();
  const baseHref = `/${locale}/design-system`;

  return (
    <div className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="container-page flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:gap-6">
        <Link
          href={baseHref}
          className="shrink-0 font-heading text-small font-semibold tracking-tight text-foreground outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Keemori Design System
        </Link>

        <nav
          aria-label="Điều hướng Design System"
          className="flex flex-wrap gap-2"
        >
          {items.map(({ segment, label, icon: Icon }) => {
            const isActive = activeSegment === segment;
            const href = segment ? `${baseHref}/${segment}` : baseHref;

            return (
              <Link
                key={label}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-small font-medium outline-none transition-colors duration-200",
                  "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary/70 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
