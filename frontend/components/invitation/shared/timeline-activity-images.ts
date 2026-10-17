import type { TimelineActivityKind } from "@/lib/schemas/invitation";

/**
 * Each template owns a complete, consistently named set of event illustrations.
 * Keep this exhaustive so adding an editor option also requires its artwork.
 * Unknown free-text activities use a clock, never another event's illustration.
 */
export function timelineActivityImages(directory: string): {
  byKind: Record<TimelineActivityKind, string>;
  neutral: string;
} {
  return {
    byKind: {
      welcome: `${directory}/event-welcome.avif`,
      ancestral: `${directory}/event-ancestral.avif`,
      procession: `${directory}/event-procession.avif`,
      ceremony: `${directory}/event-ceremony.avif`,
      reception: `${directory}/event-reception.avif`,
      toast: `${directory}/event-toast.avif`,
      cake: `${directory}/event-cake.avif`,
      photo: `${directory}/event-photo.avif`,
      music: `${directory}/event-music.avif`,
      farewell: `${directory}/event-farewell.avif`,
    },
    neutral: `${directory}/event-neutral.avif`,
  };
}
