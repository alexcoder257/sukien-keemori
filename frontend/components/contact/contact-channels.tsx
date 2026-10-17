import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  InstagramGlyph,
  TiktokGlyph,
  ZaloGlyph,
} from "@/components/shared/social-icons";
import { CONTACT } from "@/constants/contact";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatZaloPhone, zaloHref } from "@/lib/zalo";

type Props = {
  dict: Dictionary["contact"];
  /**
   * Link fanpage/Messenger, Instagram và TikTok, lấy từ `site_settings` — cùng
   * nguồn với nút chat nổi và hàng biểu tượng ở chân trang, nên vận hành đổi
   * một chỗ trong CMS (màn Cài đặt) là đổi mọi nơi. `null` khi chưa cấu hình,
   * và khi đó kênh đó **biến mất** thay vì hiện một link chết.
   */
  messengerUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  /** Số Zalo từ `site_settings`; `null` là ẩn thẻ Zalo. */
  zaloPhone: string | null;
};

type ChannelKey = "email" | "zalo" | "fanpage" | "instagram" | "tiktok";

/**
 * Các kênh liên hệ: một hộp thư, Zalo, fanpage, Instagram và TikTok. Không có
 * hotline — số điện thoại là cam kết có người trực máy, mà kênh thật của sản
 * phẩm này là email và tin nhắn. Số Zalo là địa chỉ của một kênh **nhắn tin**,
 * nên thẻ của nó mời nhắn chứ không mời gọi.
 *
 * Địa chỉ email lấy từ `constants/contact.ts` vì chúng giống nhau ở cả hai
 * ngôn ngữ; chỉ phần nhãn nằm trong dictionary. Link mạng xã hội thì đến từ
 * `site_settings` vì vận hành đổi được mà không cần deploy.
 *
 * Khác chân trang (luôn vẽ đủ bốn biểu tượng, kênh thiếu thì mờ): ở đây mỗi
 * kênh là một thẻ lớn có câu mời, một thẻ không bấm được là một lời hứa suông.
 */
export function ContactChannels({
  dict,
  messengerUrl,
  instagramUrl,
  tiktokUrl,
  zaloPhone,
}: Props) {
  const social = (
    [
      { key: "fanpage", icon: MessageCircle, href: messengerUrl },
      { key: "instagram", icon: InstagramGlyph, href: instagramUrl },
      { key: "tiktok", icon: TiktokGlyph, href: tiktokUrl },
    ] as const
  ).flatMap(({ key, icon, href }) =>
    href
      ? [{ key, icon, href, value: dict.channels[key].value, external: true }]
      : [],
  );

  const channels: {
    key: ChannelKey;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    value: string;
    external: boolean;
  }[] = [
    {
      key: "email",
      icon: Mail,
      value: CONTACT.supportEmail,
      href: `mailto:${CONTACT.supportEmail}`,
      external: false,
    },
    ...(zaloPhone
      ? [
          {
            key: "zalo" as const,
            icon: ZaloGlyph,
            value: formatZaloPhone(zaloPhone),
            href: zaloHref(zaloPhone),
            external: true,
          },
        ]
      : []),
    ...social,
  ];

  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {channels.map(({ key, icon: Icon, value, href, external }) => {
        const copy = dict.channels[key];
        return (
          <li key={key}>
            <Card className="h-full">
              <CardHeader className="gap-4">
                <span
                  aria-hidden
                  className="inline-flex size-11 items-center justify-center rounded-full border border-primary/40 text-primary"
                >
                  <Icon className="size-5" />
                </span>
                <div className="space-y-2">
                  <h2 className="font-heading text-body-lg font-medium">
                    {copy.title}
                  </h2>
                  <p className="text-small text-muted-foreground">
                    {copy.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="mt-auto">
                <a
                  href={href}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group inline-flex items-center gap-2 border-b border-input pb-1 text-small font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  <span className="tabular-nums">{value}</span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                  <span className="sr-only">{copy.action}</span>
                </a>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
