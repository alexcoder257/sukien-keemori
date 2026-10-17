import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INVITATION_KIND_ICONS } from "@/components/shared/invitation-kind-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DEFAULT_TEMPLATE_SLUG,
  INVITATION_KINDS,
  INVITATION_KIND_QUERY_PARAM,
  INVITATION_KIND_SLUGS,
} from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

/**
 * Lưới sáu loại thiệp. Mỗi thẻ là một link thẳng vào editor của mẫu dựng sẵn
 * kèm `?loai=` — editor dựng đúng form của loại đó. Server Component: không có
 * trạng thái nào, nên HTML dựng sẵn là đủ.
 */
export function KindPicker({
  dict,
  locale,
}: {
  dict: Dictionary["create"];
  locale: Locale;
}) {
  return (
    <section className="container-page pt-16 pb-section">
      <header className="mx-auto max-w-2xl space-y-4 text-center mb-stack">
        <p className="text-eyebrow text-primary">{dict.eyebrow}</p>
        <h1 className="text-h3">{dict.title}</h1>
        <p className="text-body-lg text-muted-foreground">{dict.subtitle}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INVITATION_KINDS.map((kind) => {
          const Icon = INVITATION_KIND_ICONS[kind];
          const copy = dict.kinds[kind];
          const href = `/${locale}/editor/${DEFAULT_TEMPLATE_SLUG}?${INVITATION_KIND_QUERY_PARAM}=${INVITATION_KIND_SLUGS[kind]}`;
          return (
            <li key={kind}>
              <Link
                href={href}
                className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <Card className="h-full transition-transform duration-300 group-hover:-translate-y-0.5">
                  <CardContent className="flex h-full flex-col gap-4">
                    <span
                      aria-hidden
                      className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
                    >
                      <Icon className="size-5" strokeWidth={1.5} />
                    </span>
                    <div className="space-y-2">
                      <h2 data-ui-heading className="text-h4 font-medium">
                        {copy.name}
                      </h2>
                      <p className="text-small text-muted-foreground">
                        {copy.description}
                      </p>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      <span className="text-foreground">
                        {dict.examplesLabel}:
                      </span>{" "}
                      {copy.examples}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 text-small font-medium text-primary">
                      {dict.start}
                      <ArrowRight
                        aria-hidden
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-center text-small text-muted-foreground">
        {dict.note}
      </p>
    </section>
  );
}
