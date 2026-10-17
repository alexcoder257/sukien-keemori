"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useOAuthLoginMutation } from "@/hooks/use-auth";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { OAUTH_PROVIDER_LABEL, type OAuthProvider } from "@/constants/oauth";
import { AuthCard } from "./auth-shell";

type Props = {
  dict: Dictionary["auth"];
  locale: Locale;
  provider: OAuthProvider;
};

/**
 * Trang trung chuyển sau khi nhà cung cấp OAuth trả người dùng về backend.
 *
 * Backend gắn token vào **fragment** (`#access_token=…`) chứ không phải query,
 * nên chỉ trình duyệt đọc được — server Next.js không bao giờ thấy token.
 * Đọc xong thì xoá fragment ngay để token không nằm lại trong history.
 */
export function OAuthCallback({ dict, locale, provider }: Props) {
  const router = useRouter();
  const oauthLogin = useOAuthLoginMutation();
  // Chỉ chạy một lần: StrictMode gọi effect hai lần trong dev, mà fragment đã
  // bị xoá ở lần đầu.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const next = params.get("next");
    history.replaceState(null, "", window.location.pathname);

    function failWith(reason: string) {
      router.replace(
        `/${locale}/dang-nhap?error=${reason}&provider=${provider}`,
      );
    }

    if (!accessToken || !refreshToken) {
      failWith("failed");
      return;
    }

    oauthLogin
      .mutateAsync({ accessToken, refreshToken })
      .then(() => {
        router.replace(next?.startsWith(`/${locale}`) ? next : `/${locale}`);
        router.refresh();
      })
      .catch(() => failWith("failed"));
    // Chạy đúng một lần lúc mount; `oauthLogin` đổi tham chiếu mỗi lần render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connecting = dict.oauth.connecting.replace(
    "{provider}",
    OAUTH_PROVIDER_LABEL[provider],
  );

  return (
    <AuthCard title={connecting} subtitle={dict.login.subtitle}>
      <div className="flex justify-center py-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span className="sr-only">{connecting}</span>
      </div>
    </AuthCard>
  );
}
