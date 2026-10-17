import { Clock3 } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { InvitationContent } from "@/lib/schemas/invitation";
import {
  WeddingTimeline,
  weddingTimelineData,
} from "@/components/invitation/shared/wedding-timeline";
import { InvitationSection } from "@/components/invitation/templates/classic/invitation-section";

type Props = {
  timeline: InvitationContent["timeline"];
  dict: Dictionary["invitation"]["sections"]["timeline"];
};
export function InvitationTimeline({ timeline, dict }: Props) {
  const items = timeline.items.filter(
    (item) => item.startTime || item.endTime || item.activity,
  );
  if (!items.length) return null;
  return (
    <InvitationSection>
      <WeddingTimeline
        variant="vertical"
        data={weddingTimelineData(items, timeline.title || dict.title, {
          kind: "icon",
          resolve: () => <Clock3 />,
        })}
        typography={{ combo: "playfair-display" }}
        colors={{
          ink: "var(--foreground)",
          muted: "var(--muted-foreground)",
          accent: "var(--primary)",
          rule: "var(--border)",
        }}
      />
    </InvitationSection>
  );
}
