import { MediaPlaceholder } from "@/components/shared/media-placeholder";
import { invitationKindOf } from "@/constants/invitation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, formatDate } from "@/lib/format";
import type { InvitationContent } from "@/lib/schemas/invitation";
import {
  InvitationCoverGreeting,
  InvitationGuestGreeting,
} from "@/components/invitation/shared/invitation-guest-greeting";

/**
 * Hero của các loại thiệp khác thiệp cưới — cùng khung với `InvitationHero`,
 * chỉ khác phần tên: thay cho tên cô dâu chú rể là thông tin chính của dịp
 * (`content.occasion`) kèm một dòng phụ theo loại.
 *
 * Thiệp chúc mừng là ngoại lệ về bố cục: nó không mời ai tới đâu, nên tiêu đề
 * là chính lời chúc ("Chúc mừng khai trương"), người nhận đứng dưới, và lời
 * chúc dài là thứ nổi bật nhất trên màn đầu.
 */
export function InvitationOccasionHero({
  content,
  showEnvelope,
  dict,
  locale,
}: {
  content: InvitationContent;
  showEnvelope: boolean;
  dict: Dictionary["invitation"]["kinds"];
  locale: Locale;
}) {
  const kind = invitationKindOf(content);
  const occasion = content.occasion;
  if (kind === "wedding" || !occasion) return null;

  const isGreeting = kind === "greeting";
  const eyebrow = isGreeting
    ? dict.occasionLabel.greeting
    : dict.occasionLabel[kind];
  const title = isGreeting
    ? dict.greetingHeadline[occasion.greetingOccasion]
    : occasion.nickname || occasion.name;
  const subline = occasionSubline(content, dict);
  const greetingFirst =
    isGreeting && showEnvelope && !!content.envelope.greeting;

  return (
    <section className="theme-forest relative bg-background px-6 py-20 text-center text-foreground">
      <MediaPlaceholder
        aria-hidden
        className="absolute inset-0 rounded-none border-0 bg-secondary/40"
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6">
        <InvitationGuestGreeting />
        {/* Thiệp chúc mừng mở bằng chính lời chào của phong bì ("Gửi đến bạn")
            thay cho nhãn loại — để nó ở dưới tên người gửi là nói hai lần một
            việc. Loại khác giữ thứ tự của thiệp cưới: lời chào dưới tên. */}
        {greetingFirst ? (
          <InvitationCoverGreeting className="text-eyebrow text-primary">
            {content.envelope.greeting}
          </InvitationCoverGreeting>
        ) : (
          <p className="text-eyebrow text-primary">{eyebrow}</p>
        )}
        {title ? (
          <h1 className="font-heading text-h2 font-normal">{title}</h1>
        ) : null}
        {subline ? (
          <p className="text-body-lg text-muted-foreground">{subline}</p>
        ) : null}

        {isGreeting && occasion.message ? (
          <p className="max-w-md font-heading text-body-lg whitespace-pre-line">
            {occasion.message}
          </p>
        ) : null}
        {isGreeting && occasion.sender ? (
          <p className="text-body text-muted-foreground">
            {fill(dict.from, { name: occasion.sender })}
          </p>
        ) : null}

        {!greetingFirst && showEnvelope && content.envelope.greeting ? (
          <InvitationCoverGreeting className="text-eyebrow text-primary">
            {content.envelope.greeting}
          </InvitationCoverGreeting>
        ) : null}
        {!isGreeting && content.countdown.weddingDate ? (
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

/** Dòng phụ dưới tên — mỗi loại một nội dung, rỗng thì không vẽ. */
function occasionSubline(
  content: InvitationContent,
  dict: Dictionary["invitation"]["kinds"],
): string {
  const occasion = content.occasion;
  if (!occasion) return "";
  const organizedBy = occasion.organizer
    ? fill(dict.organizedBy, { name: occasion.organizer })
    : "";

  switch (invitationKindOf(content)) {
    case "birthday":
      return [occasion.age, organizedBy].filter(Boolean).join(" · ");
    case "graduation":
      return [occasion.major, occasion.school, occasion.classOf]
        .filter(Boolean)
        .join(" · ");
    case "event":
      return organizedBy;
    case "anniversary":
      return occasion.years;
    case "greeting":
      return occasion.name ? fill(dict.to, { name: occasion.name }) : "";
    default:
      return "";
  }
}
