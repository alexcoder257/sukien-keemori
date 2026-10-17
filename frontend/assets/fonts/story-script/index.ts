import localFont from "next/font/local";

/** Hand-drawn / chibi — display script. */
export const storyScript = localFont({
  src: "./storyscript-regular.woff2",
  variable: "--font-story-script",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: false,
});
