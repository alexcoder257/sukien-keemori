"use client";

import { useEffect, useState } from "react";

/**
 * Giá trị trễ `delay` ms sau lần đổi cuối. Dùng cho ô tìm kiếm gọi API: gõ
 * "minh lan" không được bắn tám request, mỗi request một chữ cái.
 */
export function useDebouncedValue<Value>(value: Value, delay: number): Value {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
