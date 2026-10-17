"use client";

import { useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/contexts/smooth-scroll-provider";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import type { OpeningPhase } from "@/components/invitation/shared/wedding-opening/wedding-opening.types";

type Options = { enabled: boolean; contained: boolean; durationMs: number };

/** Opening lifecycle, reduced motion, scroll and focus. No visual styling. */
export function useWeddingOpening({ enabled, contained, durationMs }: Options) {
  const [state, setState] = useState<{ enabled: boolean; phase: OpeningPhase }>({
    enabled,
    phase: enabled ? "closed" : "open",
  });
  // An editor can toggle the opening without remounting the invitation content.
  if (state.enabled !== enabled) {
    setState({ enabled, phase: enabled ? "closed" : "open" });
  }
  const { phase } = state;
  const opened = phase !== "closed";
  const contentRef = useRef<HTMLDivElement>(null);
  const hasOpened = useRef(false);
  const { scrollTo } = useSmoothScroll();
  useAutoScroll(!contained && enabled && phase === "open");

  useEffect(() => {
    if (phase !== "opening") return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? Math.min(durationMs, 160)
      : durationMs;
    const timer = window.setTimeout(() => setState({ enabled, phase: "open" }), duration);
    return () => window.clearTimeout(timer);
  }, [phase, durationMs, enabled]);

  useEffect(() => {
    if (phase === "open" && hasOpened.current) {
      const target =
        contentRef.current?.querySelector<HTMLElement>("[data-opening-focus]") ??
        contentRef.current;
      target?.focus({ preventScroll: true });
      hasOpened.current = false;
    }
    if (phase === "closed") hasOpened.current = false;
  }, [phase]);

  function openInvitation() {
    if (phase !== "closed") return;
    if (!contained) scrollTo(0);
    hasOpened.current = true;
    setState({ enabled, phase: "opening" });
  }

  return { phase, opened, contentRef, openInvitation };
}
