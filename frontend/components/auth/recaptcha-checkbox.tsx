"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  RECAPTCHA_SCRIPT_URL,
  RECAPTCHA_SITE_KEY,
  waitForGrecaptcha,
} from "@/lib/recaptcha";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  onVerify: (token: string | null) => void;
};

/**
 * Checkbox reCAPTCHA v2 ("Tôi không phải robot"). Không render gì khi chưa
 * cấu hình site key (dev) — form phía trên coi như không cần captcha.
 * Đổi `key` ở component cha để buộc render lại widget (token v2 dùng một
 * lần, phải reset sau mỗi lần submit).
 */
export function RecaptchaCheckbox({ locale, onVerify }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!scriptLoaded || widgetId.current !== null) return;

    let cancelled = false;
    void waitForGrecaptcha().then((grecaptcha) => {
      if (cancelled || !grecaptcha || !containerRef.current) return;
      grecaptcha.ready(() => {
        if (cancelled || !containerRef.current || widgetId.current !== null)
          return;
        widgetId.current = grecaptcha.render(containerRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          hl: locale,
          callback: (token) => onVerify(token),
          "expired-callback": () => onVerify(null),
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [scriptLoaded, locale, onVerify]);

  if (!RECAPTCHA_SITE_KEY) return null;

  return (
    <>
      <Script
        src={RECAPTCHA_SCRIPT_URL}
        strategy="afterInteractive"
        onReady={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} />
    </>
  );
}
