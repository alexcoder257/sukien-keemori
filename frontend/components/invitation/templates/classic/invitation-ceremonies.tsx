import { CalendarDays, MapPin } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { InvitationSection } from "./invitation-section";
import { GoogleMapEmbed } from "@/components/invitation/shared/google-map-embed";

type Props = {
  ceremonies: InvitationContent["ceremonies"];
  dict: Dictionary["invitation"]["sections"]["ceremonies"];
  kindDict: Dictionary["editor"]["ceremonyKinds"];
};

/** Một thiệp hỗ trợ nhiều nghi lễ; mỗi nghi lễ có ngày giờ và địa điểm riêng. */
export function InvitationCeremonies({ ceremonies, dict, kindDict }: Props) {
  const filled = ceremonies.filter(
    (ceremony) => ceremony.dateTime || ceremony.venue,
  );
  if (filled.length === 0) return null;

  return (
    <InvitationSection title={dict.title}>
      <ul className="grid gap-6 sm:grid-cols-2">
        {filled.map((ceremony, index) => (
          <li
            key={index}
            className="space-y-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
          >
            <p className="text-eyebrow text-primary">
              {ceremony.kind === "other" && ceremony.customKind
                ? ceremony.customKind
                : kindDict[ceremony.kind]}
            </p>
            {ceremony.dateTime ? (
              <p className="flex items-start gap-2 text-body">
                <CalendarDays aria-hidden className="mt-1 size-4 shrink-0" />
                {ceremony.dateTime}
              </p>
            ) : null}
            {ceremony.venue ? (
              <>
                <p className="flex items-start gap-2 text-small text-muted-foreground">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {ceremony.venue}
                </p>
                <GoogleMapEmbed
                  address={ceremony.venue}
                  place={ceremony.venuePlace}
                  title={`${dict.mapLabel}: ${ceremony.venue}`}
                  className="mt-4 aspect-video overflow-hidden rounded-xl ring-1 ring-foreground/10"
                />
              </>
            ) : null}
            {ceremony.note ? (
              <p className="text-small text-muted-foreground">{ceremony.note}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </InvitationSection>
  );
}
