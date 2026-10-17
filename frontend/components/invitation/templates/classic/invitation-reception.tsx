import { ExternalLink, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import type { InvitationContent } from "@/lib/schemas/invitation";
import { InvitationSection } from "./invitation-section";
import { GoogleMapEmbed } from "@/components/invitation/shared/google-map-embed";

type Props = {
  reception: InvitationContent["reception"];
  dict: Dictionary["invitation"]["sections"]["reception"];
};

/**
 * Bản đồ hiển thị dạng ô giữ chỗ kèm link mở Google Maps — nhúng iframe cần
 * API key nên để lại cho bước tích hợp sau.
 */
export function InvitationReception({ reception, dict }: Props) {
  return (
    <InvitationSection title={dict.title}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {reception.date ? (
            <div className="space-y-1 text-center">
              <p className="font-heading text-body-lg">{reception.date}</p>
            </div>
          ) : null}
          {reception.welcomeTime ? (
            <div className="space-y-1 text-center">
              <p className="text-caption text-muted-foreground">
                {dict.welcomeTime}
              </p>
              <p className="font-heading text-body-lg">
                {reception.welcomeTime}
              </p>
            </div>
          ) : null}
          {reception.startTime ? (
            <div className="space-y-1 text-center">
              <p className="text-caption text-muted-foreground">
                {dict.startTime}
              </p>
              <p className="font-heading text-body-lg">{reception.startTime}</p>
            </div>
          ) : null}
        </div>

        {reception.venueAddress ? (
          <p className="flex items-start justify-center gap-2 text-center text-body">
            <MapPin aria-hidden className="mt-1 size-4 shrink-0" />
            {reception.venueAddress}
          </p>
        ) : null}

        <GoogleMapEmbed
          address={reception.venueAddress}
          place={reception.venuePlace}
          title={`${dict.mapLabel}: ${reception.venueAddress}`}
          className="aspect-video overflow-hidden rounded-2xl ring-1 ring-foreground/10"
        />

        {reception.mapUrl ? (
          <div className="flex justify-center">
            <a
              href={reception.mapUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-2",
              })}
            >
              {dict.openMap}
              <ExternalLink aria-hidden />
            </a>
          </div>
        ) : null}
      </div>
    </InvitationSection>
  );
}
