"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { hasStarted } from "@/lib/selectors";
import { hashString, mulberry32 } from "@/lib/rand";
import { DEMO_START_MIN } from "@/lib/format";
import type { CallingList } from "@/lib/types";

/**
 * Progress for a calling list. Real calls in the data count first; finished and
 * paused lists also carry a deterministic share so older lists don't read as empty.
 */
export function useListProgress(list: CallingList) {
  const calls = useStore((s) => s.calls);
  const pauses = useStore((s) => s.pauses);
  const now = useStore((s) => Math.floor(s.nowMin));
  return useMemo(() => {
    const ids = new Set(list.leadIds);
    const relevant = calls.filter((c) => ids.has(c.leadId) && c.start >= list.startsAt && hasStarted(c, now, pauses));
    const calledLeads = new Set(relevant.map((c) => c.leadId));
    const talked = new Set(relevant.filter((c) => c.result === "connected").map((c) => c.leadId));
    const booked = new Set(relevant.filter((c) => c.outcome === "booked").map((c) => c.leadId));
    // Lists made in this session only show calls that really happened.
    if (list.status === "scheduled" || list.leadIds.length === 0 || list.startsAt >= DEMO_START_MIN) {
      return { called: calledLeads.size, talked: talked.size, booked: booked.size };
    }
    const r = mulberry32(hashString(list.id));
    const n = list.leadIds.length;
    const share = list.status === "done" ? 1 : 0.35 + r() * 0.4;
    const called = Math.max(calledLeads.size, Math.round(n * share));
    const talkedN = Math.max(talked.size, Math.round(called * (0.42 + r() * 0.1)));
    const bookedN = Math.max(booked.size, Math.round(talkedN * (0.06 + r() * 0.05)));
    return { called: Math.min(called, n), talked: Math.min(talkedN, n), booked: Math.min(bookedN, n) };
  }, [calls, pauses, now, list]);
}
