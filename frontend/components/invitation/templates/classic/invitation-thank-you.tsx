import type { Dictionary } from "@/i18n/dictionaries";
import { InvitationSection } from "./invitation-section";

type Props = {
  message: string;
  dict: Dictionary["invitation"]["sections"]["thankYou"];
};

export function InvitationThankYou({ message, dict }: Props) {
  if (!message) return null;

  return (
    <InvitationSection title={dict.title}>
      <p className="text-center text-body-lg whitespace-pre-line text-muted-foreground">
        {message}
      </p>
    </InvitationSection>
  );
}
