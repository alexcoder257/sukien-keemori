"use client";

import { useEffect, useState } from "react";

/**
 * Giá trị trễ `delay` ms sau lần đổi cuối. Dùng cho ô tìm kiếm gọi backend:
 * gõ "tuananh@gmail.com" không phải là 17 request.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
