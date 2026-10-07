"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useStore } from "./store";
import { DAY, DEMO_START_MIN } from "./format";
import { PROJECTS } from "./mock/seed";
import { buildTranscript } from "./mock/transcript";
import type { Call, Lead, Project, Rep } from "./types";

export function getProject(id: string): Project {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
}

export function getRep(id: string): Rep | undefined {
  return useStore.getState().reps.find((r) => r.id === id);
}

export function useReps() {
  return useStore((s) => s.reps);
}

export function useSalesReps() {
  const reps = useStore((s) => s.reps);
  return useMemo(() => reps.filter((r) => r.role === "rep"), [reps]);
}

export function useProject() {
  const id = useStore((s) => s.projectId);
  return getProject(id);
}

type Pause = { from: number; to: number | null };

export function inPause(t: number, pauses: Pause[]) {
  return pauses.some((p) => t >= p.from && (p.to === null || t < p.to));
}

/** A call has happened (or is happening) if it started before now and outside a pause. */
export function hasStarted(c: Call, now: number, pauses: Pause[]) {
  if (c.start < 0) return true;
  if (c.start > now) return false;
  if (c.manual) return true;
  return !inPause(c.start, pauses);
}

export function isLive(c: Call, now: number) {
  return c.result === "connected" && c.start <= now && now < c.start + c.durationSec / 60;
}

export function callEnd(c: Call) {
  return c.start + c.durationSec / 60;
}

export function useProjectLeads() {
  const leads = useStore((s) => s.leads);
  const projectId = useStore((s) => s.projectId);
  return useMemo(() => leads.filter((l) => l.projectId === projectId), [leads, projectId]);
}

export function useLeadMap() {
  const leads = useStore((s) => s.leads);
  return useMemo(() => {
    const m = new Map<string, Lead>();
    for (const l of leads) m.set(l.id, l);
    return m;
  }, [leads]);
}

/** Today's calls for the current project that have started, given the demo clock. */
export function useTodayCalls() {
  const calls = useStore((s) => s.calls);
  const projectId = useStore((s) => s.projectId);
  const pauses = useStore((s) => s.pauses);
  const now = useStore((s) => s.nowMin);
  const window = useCallingWindow();
  const projectToday = useMemo(
    () => calls.filter((c) => c.projectId === projectId && c.start >= 0 && c.start < DAY && (c.manual || plannedInWindow(c.start, window))),
    [calls, projectId, window],
  );
  return useMemo(() => projectToday.filter((c) => hasStarted(c, now, pauses)), [projectToday, now, pauses]);
}

export function useUpcomingCount() {
  const calls = useStore((s) => s.calls);
  const projectId = useStore((s) => s.projectId);
  const now = useStore((s) => Math.floor(s.nowMin));
  const window = useCallingWindow();
  return useMemo(
    () => calls.filter((c) => c.projectId === projectId && c.start > now && c.start < DAY && !c.manual && plannedInWindow(c.start, window)).length,
    [calls, projectId, now, window],
  );
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** The calling window from Rules, in minutes of the day. */
export function useCallingWindow() {
  const from = useStore((s) => s.rules.callFrom);
  const to = useStore((s) => s.rules.callTo);
  return useMemo(() => ({ from: toMin(from), to: toMin(to) }), [from, to]);
}

/**
 * Calls planned after the demo opened follow the current Rules window.
 * Calls that already happened before then stay as they were.
 */
function plannedInWindow(start: number, w: { from: number; to: number }) {
  if (start <= DEMO_START_MIN) return true;
  return start >= w.from && start < w.to;
}

export function dayStats(calls: Call[], now: number) {
  let connected = 0;
  let qualified = 0;
  let booked = 0;
  for (const c of calls) {
    if (c.result !== "connected") continue;
    connected += 1;
    if (isLive(c, now)) continue;
    if (c.outcome === "qualified" || c.outcome === "transferred" || c.outcome === "booked") qualified += 1;
    if (c.outcome === "booked") booked += 1;
  }
  return { dialled: calls.length, connected, qualified, booked };
}

export function useIsPaused() {
  return useStore((s) => s.pauses.length > 0 && s.pauses[s.pauses.length - 1].to === null);
}

export interface Need {
  key: string;
  kind: "handover" | "callback" | "questions";
  leadId?: string;
  callId?: string;
  at: number;
  title: string;
  detail: string;
}

export function useNeeds(): Need[] {
  const todayCalls = useTodayCalls();
  const now = useStore((s) => Math.floor(s.nowMin));
  const bookings = useStore((s) => s.bookings);
  const handled = useStore((s) => s.handled);
  const questions = useStore((s) => s.questions);
  const projectId = useStore((s) => s.projectId);
  const leadMap = useLeadMap();

  return useMemo(() => {
    const out: Need[] = [];
    for (const c of todayCalls) {
      if (c.outcome !== "transferred") continue;
      const end = callEnd(c);
      if (end > now || now - end > 45) continue;
      const key = `handover:${c.id}`;
      if (handled[key]) continue;
      const lead = leadMap.get(c.leadId);
      if (!lead) continue;
      out.push({
        key,
        kind: "handover",
        leadId: lead.id,
        callId: c.id,
        at: end,
        title: `${lead.name} asked for a person`,
        detail: `Score ${c.score ?? lead.score}. ${lead.config}, ${lead.purpose.toLowerCase()}. Waiting ${Math.max(1, Math.round(now - end))} min.`,
      });
    }
    for (const b of bookings) {
      if (b.kind !== "callback" || b.done) continue;
      const lead = leadMap.get(b.leadId);
      if (!lead || lead.projectId !== projectId) continue;
      if (b.at < now - 60 || b.at > now + 30) continue;
      const key = `callback:${b.id}`;
      if (handled[key]) continue;
      const late = now - b.at;
      out.push({
        key,
        kind: "callback",
        leadId: lead.id,
        at: b.at,
        title: `Call back ${lead.name}`,
        detail: late > 0 ? `Asked for a call at ${fmt(b.at)}. ${Math.round(late)} min overdue.` : `Asked for a call at ${fmt(b.at)}.`,
      });
    }
    const open = questions.filter((q) => q.projectId === projectId && !q.answer);
    if (open.length && !handled[`questions:${open.length}`]) {
      out.push({
        key: `questions:${open.length}`,
        kind: "questions",
        at: now,
        title: `${open.length} questions the agent could not answer`,
        detail: `Asked ${open.reduce((s, q) => s + q.asked, 0)} times in total. Answer them once and the agent uses the answer.`,
      });
    }
    return out.sort((a, b) => (a.kind === "questions" ? 1 : b.kind === "questions" ? -1 : b.at - a.at));
  }, [todayCalls, now, bookings, handled, questions, projectId, leadMap]);
}

function fmt(t: number) {
  const m = Math.floor(((t % DAY) + DAY) % DAY);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function useTranscript(call: Call | undefined) {
  const leadMap = useLeadMap();
  const opening = useStore((s) => s.agentPublished.opening);
  return useMemo(() => {
    if (!call) return [];
    const lead = leadMap.get(call.leadId);
    if (!lead) return [];
    return buildTranscript(call, lead, getProject(call.projectId), opening[call.lang]);
  }, [call, leadMap, opening]);
}

/** True after the first client render. Use for values that only exist in the browser. */
export function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
const noopSubscribe = () => () => {};

export function useLocalFlag(key: string): [boolean, () => void] {
  const mounted = useMounted();
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    if (!mounted) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only storage after mount
      setSeen(localStorage.getItem(key) === "1");
    } catch {
      setSeen(false);
    }
  }, [key, mounted]);
  const mark = () => {
    setSeen(true);
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* storage blocked */
    }
  };
  return [seen, mark];
}
