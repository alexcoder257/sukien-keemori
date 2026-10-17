import type { Dictionary } from "@/i18n/dictionaries";
import { InvitationSection } from "./invitation-section";

type Props = {
  message: string;
  dict: Dictionary["invitation"]["sections"]["story"];
};

export function InvitationStory({ message, dict }: Props) {
  if (!message) return null;

  return (
    <InvitationSection title={dict.title}>
      <p className="mx-auto max-w-[62ch] text-center text-body-lg whitespace-pre-line text-muted-foreground">
        {message}
      </p>
    </InvitationSection>
  );
}
