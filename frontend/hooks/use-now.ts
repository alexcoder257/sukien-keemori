"use client";

import { useSyncExternalStore } from "react";

/**
 * Đồng hồ dùng chung cho mọi bộ đếm ngược: một `setInterval` duy nhất cho toàn
 * trang, đọc qua `useSyncExternalStore` nên không cần setState trong effect và
 * không lệch hydration (server luôn trả `0`).
 */
let now = 0;
let timer: number | null = null;
const listeners = new Set<() => void>();

function tick() {
  now = Date.now();
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  if (listeners.size === 0) {
    now = Date.now();
    timer = window.setInterval(tick, 1_000);
  }
  listeners.add(onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

/** Trả về mốc thời gian hiện tại (ms), hoặc `0` khi chưa đo được trên client. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => 0,
  );
}
