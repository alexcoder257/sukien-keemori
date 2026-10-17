"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { oauthUrl } from "@/apis";
import { Button } from "@/components/ui/button";
import { ENABLED_OAUTH_PROVIDERS, type OAuthProvider } from "@/constants/oauth";
import type { Locale } from "@/i18n/config";
import { GoogleIcon, FacebookIcon } from "./brand-icons";

type Props = {
  locale: Locale;
  googleLabel: string;
  facebookLabel: string;
  disabled?: boolean;
};

export function OAuthButtons({
  locale,
  googleLabel,
  facebookLabel,
  disabled,
}: Props) {
  // Rời khỏi trang mất một nhịp; khoá nút để không mở hai lần.
  const [redirecting, setRedirecting] = useState(false);
  const searchParams = useSearchParams();

  function startOAuth(provider: OAuthProvider) {
    setRedirecting(true);
    // Giữ nguyên trang đích người dùng đang muốn tới trước khi bị đẩy vào
    // đăng nhập; backend ký nó vào `state` và trả lại ở cuối luồng.
    const next = searchParams.get("next") ?? undefined;
    window.location.href = oauthUrl(
      provider,
      locale,
      next?.startsWith(`/${locale}`) ? next : undefined,
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2.5 text-sm font-medium"
        disabled={disabled || redirecting}
        onClick={() => startOAuth("google")}
      >
        <GoogleIcon />
        {googleLabel}
      </Button>
      {ENABLED_OAUTH_PROVIDERS.includes("facebook") && (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2.5 text-sm font-medium"
          disabled={disabled || redirecting}
          onClick={() => startOAuth("facebook")}
        >
          <FacebookIcon />
          {facebookLabel}
        </Button>
      )}
    </div>
  );
}
