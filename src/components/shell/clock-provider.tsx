"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { DEMO_START_MIN } from "@/lib/format";

/**
 * Drives the demo clock. The day starts at 16:20 IST on Sat 10 Oct 2026 and moves in real time.
 * Server render and first client render both use the fixed start, so markup always matches.
 */
export function ClockProvider() {
  const tick = useStore((s) => s.tick);
  // Load what this browser saved from earlier sessions.
  useEffect(() => {
    void useStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const started = performance.now();
    const id = window.setInterval(() => {
      const now = DEMO_START_MIN + (performance.now() - started) / 60000;
      tick(Math.min(now, 23 * 60 + 59));
    }, 1000);
    return () => window.clearInterval(id);
  }, [tick]);
  return null;
}
