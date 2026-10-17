export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

export const RECAPTCHA_SCRIPT_URL = "https://www.google.com/recaptcha/api.js";

export interface Grecaptcha {
  ready: (cb: () => void) => void;
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      hl?: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

// Script nạp bằng next/script nên có thể chưa sẵn sàng lúc widget mount.
export async function waitForGrecaptcha(
  timeoutMs = 5000,
): Promise<Grecaptcha | undefined> {
  const startedAt = Date.now();
  while (!window.grecaptcha) {
    if (Date.now() - startedAt > timeoutMs) return undefined;
    await new Promise((r) => setTimeout(r, 100));
  }
  return window.grecaptcha;
}
