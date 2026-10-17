"use client";

import { useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";
import type { AuthUser } from "@/apis";
import { cn } from "@/lib/utils";

/**
 * Avatar của tài khoản: ảnh thật khi tài khoản đăng nhập qua Google/Facebook
 * (chỉ hai đường đó mới có `avatarUrl`), còn lại là icon người mặc định — kể cả
 * khi chưa nạp xong hồ sơ. Không dựng chữ cái đầu từ tên: đó là một avatar
 * *giả* trông như ảnh đại diện thật, trong khi tài khoản đăng ký bằng email
 * chưa từng chọn ảnh nào.
 *
 * Ảnh hỏng cũng rơi về icon đó. Link avatar của nhà cung cấp không sống mãi:
 * Facebook ký kèm hạn vào URL và trả 404 khi người dùng chưa có/đã xoá ảnh,
 * Google đổi URL khi người dùng đổi ảnh. Ta lưu URL tại thời điểm đăng nhập nên
 * không có cách nào biết trước — chỉ biết lúc trình duyệt tải hỏng.
 *
 * Kích thước đặt bằng class `size-*`. */
export function UserAvatar({
  user,
  className,
}: {
  user: Pick<AuthUser, "fullName" | "avatarUrl"> | undefined;
  className?: string;
}) {
  // Khoá theo URL: đổi tài khoản (hoặc đổi ảnh) thì thử lại từ đầu, không ôm
  // trạng thái hỏng của ảnh trước.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const avatarUrl = user?.avatarUrl;
  const showImage = !!avatarUrl && failedUrl !== avatarUrl;

  return (
    <span aria-hidden className={cn("relative flex shrink-0", className)}>
      {showImage ? (
        <Image
          src={avatarUrl}
          alt=""
          width={96}
          height={96}
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(avatarUrl)}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center rounded-full bg-primary/15 text-primary">
          <UserRound className="size-[55%]" />
        </span>
      )}
    </span>
  );
}
