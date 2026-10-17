import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type Action = { label: string; href: string };

type Props = {
  title: string;
  body?: string;
  primary: Action;
  secondary?: Action;
};

/**
 * Dải kêu gọi hành động khép trang, dùng chung cho các trang nội dung. Trang
 * chủ có bản riêng (`components/home/final-cta.tsx`) vì nó là cảnh cuối của
 * câu chuyện và có phần nền động; ở đây chỉ cần một dải tĩnh, gọn.
 */
export function CtaBand({ title, body, primary, secondary }: Props) {
  return (
    <section className="border-t border-border">
      <div className="container-page flex flex-col items-center gap-6 py-16 text-center lg:py-20">
        <h2 className="max-w-2xl font-heading text-h3 leading-tight font-medium">
          {title}
        </h2>
        {body ? (
          <p className="max-w-xl text-body-lg text-muted-foreground">{body}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={primary.href}
            className={buttonVariants({ size: "lg", className: "group" })}
          >
            {primary.label}
            <ArrowRight
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
