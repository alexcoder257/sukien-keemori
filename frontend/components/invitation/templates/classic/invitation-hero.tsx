import { MediaPlaceholder } from "@/components/shared/media-placeholder";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/lib/format";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { coupleShortNames } from "@/components/invitation/shared/couple-name";
import {
  InvitationCoverGreeting,
  InvitationGuestGreeting,
} from "@/components/invitation/shared/invitation-guest-greeting";

/**
 * Hero full-bleed: tên cặp đôi (dạng tên gọi thân mật trích từ họ tên đầy đủ)
 * cùng lời chào và lời mời của block phong bì.
 */
export function InvitationHero({
  content,
  showEnvelope,
  locale,
}: {
  content: InvitationContent;
  showEnvelope: boolean;
  locale: Locale;
}) {
  const couple = coupleShortNames(content.couple, "stacked");

  return (
    <section className="theme-forest relative bg-background px-6 py-20 text-center text-foreground">
      <MediaPlaceholder
        aria-hidden
        className="absolute inset-0 rounded-none border-0 bg-secondary/40"
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6">
        <InvitationGuestGreeting />
        {couple ? (
          <h1 className="font-heading text-h2 whitespace-pre-line font-normal">
            {couple}
          </h1>
        ) : null}
        {showEnvelope && content.envelope.greeting ? (
          <InvitationCoverGreeting className="text-eyebrow text-primary">
            {content.envelope.greeting}
          </InvitationCoverGreeting>
        ) : null}
        {content.countdown.weddingDate ? (
          <p className="text-body-lg text-muted-foreground">
            {formatDate(content.countdown.weddingDate, locale)}
          </p>
        ) : null}
        {showEnvelope && content.envelope.invitation ? (
          <p className="max-w-md text-body text-muted-foreground">
            {content.envelope.invitation}
          </p>
        ) : null}
      </div>
    </section>
  );
}
