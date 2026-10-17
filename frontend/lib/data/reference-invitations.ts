import "server-only";

/**
 * Bespoke invitations with their own public routes, displayed alongside CMS
 * templates. Empty for now: Khải Hồ's birthday card became the `burgundy-birthday`
 * template, so it is listed through the catalog instead.
 */
export function getReferenceInvitations(): ReferenceInvitation[] {
  return [];
}

export type ReferenceInvitation = {
  slug: string;
  name: string;
  description: string;
  href: string;
  imageSrc: string;
  posterSrc: string;
};
