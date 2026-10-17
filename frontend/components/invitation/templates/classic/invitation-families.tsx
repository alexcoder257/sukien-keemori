import type { Dictionary } from "@/i18n/dictionaries";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { getInvitationFamilySides } from "@/components/invitation/shared/invitation-families";
import { InvitationSection } from "./invitation-section";

type Props = {
  content: InvitationContent;
  dict: Dictionary["invitation"]["sections"]["families"];
  /** Block "cặp đôi" có thể bị tắt riêng dù block gia đình vẫn hiện. */
  showCouple: boolean;
};

/** Hai cột nhà trai · nhà gái, kèm con thứ mấy của mỗi người khi có. */
export function InvitationFamilies({ content, dict, showCouple }: Props) {
  const sides = getInvitationFamilySides(content, dict, showCouple);

  if (sides.length === 0) return null;

  return (
    <InvitationSection title={dict.title}>
      <div className="grid gap-10 sm:grid-cols-2">
        {sides.map((side) => (
          <div key={side.key} className="space-y-3 text-center">
            <p className="text-eyebrow text-primary">{side.label}</p>
            {side.father ? (
              <p className="text-body">{`${dict.father} ${side.father}`}</p>
            ) : null}
            {side.mother ? (
              <p className="text-body">{`${dict.mother} ${side.mother}`}</p>
            ) : null}
            {side.address ? (
              <p className="text-small text-muted-foreground">{side.address}</p>
            ) : null}
            {showCouple && side.childName ? (
              <p className="pt-2 font-heading text-body-lg">
                {side.childOrder ? `${side.childOrder} · ` : ""}
                {side.childName}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </InvitationSection>
  );
}
