"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
  onChange: (searchParams: URLSearchParams) => void;
};

function Listener({ onChange }: Props) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onChange(new URLSearchParams(searchParams.toString()));
  }, [searchParams, onChange]);
  return null;
}

/**
 * Báo query string hiện tại cho component cha, **không kéo cha xuống client**.
 *
 * Trong trang dựng tĩnh, `useSearchParams()` bắt mọi thứ từ nó lên tới
 * `<Suspense>` gần nhất phải render ở client — gọi thẳng trong gallery là lưới
 * mẫu biến khỏi HTML tĩnh (mất link cho Googlebot, mất nội dung trước khi JS
 * tải). Gói riêng phần đọc query vào một component rỗng trong `Suspense` thì
 * chỉ component này bỏ qua prerender.
 *
 * Đổi lại, lần render đầu (HTML tĩnh + hydrate) cha thấy query **rỗng**, rồi
 * mới nhận query thật sau khi hydrate. Cha phải chịu được nhịp đó — với bộ
 * lọc thì là một lần lọc lại ngay sau khi trang hiện.
 *
 * `onChange` nên ổn định (setState, hoặc `useCallback`), không thì mỗi lần cha
 * render là một lần báo lại.
 */
export function SearchParamsListener({ onChange }: Props) {
  return (
    <Suspense fallback={null}>
      <Listener onChange={onChange} />
    </Suspense>
  );
}
