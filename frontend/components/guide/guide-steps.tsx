import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/lib/format";
import type { GuideStep } from "@/lib/data/guide";

type Props = {
  steps: GuideStep[];
  dict: Dictionary["guide"];
  locale: Locale;
};

const ordinal = (index: number) => String(index + 1).padStart(2, "0");

/**
 * Ba bước tạo thiệp, kèm thao tác và ảnh chụp giao diện thật. Server
 * Component: không có gì ở đây cần JavaScript.
 */
export function GuideSteps({ steps, dict, locale }: Props) {
  return (
    <ol className="space-y-16 lg:space-y-24">
      {steps.map((step, index) => {
        const text = dict.steps[step.key];
        const reversed = index % 2 === 1;

        return (
          <li
            key={step.key}
            id={`step-${step.key}`}
            className="grid scroll-mt-28 items-start gap-8 lg:grid-cols-2 lg:gap-16"
          >
            <div className={reversed ? "lg:order-2" : undefined}>
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="font-heading text-[clamp(2.5rem,5vw,4rem)] leading-none font-medium tabular-nums text-primary/35"
                >
                  {ordinal(index)}
                </span>
                <span className="text-eyebrow text-primary">
                  {fill(dict.stepLabel, { index: index + 1 })}
                </span>
              </div>

              <h3 className="mt-5 font-heading text-h4 leading-snug font-medium">
                {text.title}
              </h3>
              <p className="mt-3 max-w-xl text-body-lg text-muted-foreground">
                {text.body}
              </p>

              <ol className="mt-6 space-y-5">
                {text.instructions.map((instruction, instructionIndex) => (
                  <li key={instruction.title} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-caption text-primary"
                    >
                      {instructionIndex + 1}
                    </span>
                    <div>
                      <h4 className="text-body font-medium">
                        {instruction.title}
                      </h4>
                      <p className="mt-1 text-small leading-relaxed text-muted-foreground">
                        {instruction.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-6 flex max-w-xl gap-3 border-l-2 border-primary/40 pl-4 text-small text-muted-foreground">
                {text.hint}
              </p>

              <p className="mt-6 text-caption text-muted-foreground tabular-nums">
                {fill(dict.minutes, { minutes: step.minutes })}
              </p>
              <Link
                href={`/${locale}${step.actionPath}`}
                className={buttonVariants({ variant: "ghost", className: "mt-4" })}
              >
                {text.action}
                <ArrowRight aria-hidden />
              </Link>
            </div>

            <figure
              className={
                reversed
                  ? "lg:order-1 lg:sticky lg:top-28"
                  : "lg:sticky lg:top-28"
              }
            >
              <div className="relative aspect-[5/3] overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                <Image
                  src={step.imageSrc}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 92vw, 46vw"
                  unoptimized
                  className="object-contain"
                />
              </div>
              <figcaption className="mt-3 text-caption leading-relaxed text-muted-foreground">
                {text.caption}
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ol>
  );
}
