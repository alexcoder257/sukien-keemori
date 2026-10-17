/** Shared with next.config.ts: retain Next's default small widths. */
export const OPENING_IMAGE_SIZES = [
  32, 48, 64, 96, 128, 160, 192, 256, 320, 384, 480, 576, 630,
];
const DEVICE_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
export const OPENING_IMAGE_WIDTHS = [
  ...OPENING_IMAGE_SIZES,
  ...DEVICE_WIDTHS,
].sort((a, b) => a - b);
export const OPENING_IMAGE_DENSITY = 1.5;
export const OPENING_IMAGE_QUALITY = 70;

/** Native sizes of the newly generated material plates. */
export const OPENING_ARTWORK = {
  "envelope-closed": {
    width: 1536,
    height: 1024,
  },
  "wax-seal": {
    width: 1254,
    height: 1254,
  },
  "orchid-hydrangea": {
    width: 1024,
    height: 1536,
  },
  "orchid-cascade": {
    width: 1024,
    height: 1536,
  },
  "cotton-paper": {
    width: 1024,
    height: 1536,
  },
  "envelope-botanical-generated": {
    width: 1536,
    height: 1024,
  },
  "envelope-bouquet-generated": {
    width: 1536,
    height: 1024,
  },
  "envelope-ribbon-generated": {
    width: 1536,
    height: 1024,
  },
} as const;
export type OpeningArtworkName = keyof typeof OPENING_ARTWORK;

export function openingImageWidth(frameWidth: number): number {
  const target = Math.ceil(frameWidth * OPENING_IMAGE_DENSITY);
  return (
    OPENING_IMAGE_WIDTHS.find((width) => width >= target) ??
    OPENING_IMAGE_WIDTHS.at(-1)!
  );
}
