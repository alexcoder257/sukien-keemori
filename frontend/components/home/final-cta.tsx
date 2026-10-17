import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CountUp } from "@/components/home/story/count-up";
import { CtaAura } from "@/components/home/story/cta-aura";
import { RevealText } from "@/components/home/story/reveal-text";
import { StoryReveal } from "@/components/home/story/story-reveal";
import { buttonVariants } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getHomeStats } from "@/lib/data/home";

type Props = { dict: Dictionary["home"]["finalCta"]; locale: Locale };

/**
 * Dưới mốc này câu "Đã có N thiệp mời được tạo" phản tác dụng — "0+" hay "7+"
 * nói với khách rằng chưa ai dùng — nên khối bằng chứng xã hội ẩn hẳn.
 */
const SOCIAL_PROOF_MIN_INVITATIONS = 100;

/**
 * Chương 5 — khép câu chuyện. Sợi chỉ vàng thắt lại thành một vòng phía sau
 * lời mời cuối, CTA có vệt sáng chạy qua khi hover.
 */
export async function FinalCta({ dict, locale }: Props) {
  const homeStats = await getHomeStats();
  // Câu bằng chứng xã hội được cắt tại `{count}` để số ở giữa câu là một
  // `CountUp` thật, không phải chuỗi đã format sẵn.
  const [proofBefore, proofAfter] = dict.socialProof.split("{count}");

  return (
    <div className="relative container-page flex flex-col items-center gap-7 pt-16 pb-[calc(var(--spacing-section)*1.3)] text-center">
      <CtaAura className="absolute top-0 left-1/2 -z-10 size-[min(38rem,92vw)] -translate-x-1/2" />
      <span aria-hidden className="h-16 w-px bg-gradient-to-b from-transparent to-primary/70" />

      <RevealText
        as="h2"
        text={dict.title}
        className="max-w-3xl font-editorial text-[clamp(2.6rem,5.2vw,4.5rem)] leading-[1.12] font-medium tracking-[-0.03em]"
      />

      <StoryReveal className="space-y-3">
        <p className="mx-auto max-w-xl text-[1.3rem] font-light text-primary">
          {dict.lead}
        </p>
        <p className="mx-auto max-w-lg text-body-lg text-muted-foreground">
          {dict.subtitle}
        </p>
      </StoryReveal>

      {/* Bằng chứng xã hội đặt ngay trên nút: con số đang chạy lên là thứ duy
          nhất trong khối này chuyển động khi mắt dừng lại ở đây. */}
      {homeStats.invitations >= SOCIAL_PROOF_MIN_INVITATIONS ? (
        <StoryReveal className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-5 py-2 text-small text-muted-foreground">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse"
          />
          <span>
            {proofBefore}
            <CountUp
              value={homeStats.invitations}
              locale={locale}
              suffix="+"
              className="font-medium text-foreground tabular-nums"
            />
            {proofAfter}
          </span>
        </StoryReveal>
      ) : null}

      <StoryReveal className="flex flex-wrap items-center justify-center gap-5">
        <Link
          href={`/${locale}/tao-thiep`}
          className={buttonVariants({
            size: "lg",
            className:
              "group relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_var(--color-deep-gold)]",
          })}
        >
          {/* Vệt sáng quét qua nút khi hover — trang trí, không đổi layout. */}
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ivory/45 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
          />
          <span className="relative">{dict.cta}</span>
          <ArrowRight
            aria-hidden
            className="relative transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>

        <Link
          href={`/${locale}/bang-gia`}
          className={buttonVariants({ variant: "ghost", size: "lg" })}
        >
          {dict.secondaryCta}
        </Link>
      </StoryReveal>

      <p className="text-caption text-muted-foreground">{dict.note}</p>
    </div>
  );
}
