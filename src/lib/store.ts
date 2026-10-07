"use client";

import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { DEMO_START_MIN } from "./format";
import { SEED, REPS } from "./mock/seed";
import type {
  AgentConfig,
  Booking,
  Call,
  CallingList,
  Connection,
  KnowledgeDoc,
  Lead,
  Message,
  PoolNumber,
  Question,
  Rep,
  Rules,
  Task,
} from "./types";

export type ToastTone = "info" | "good" | "warn" | "crit";
export interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

export interface Desk {
  callId: string;
  mode: "listen" | "bridged";
  muted: boolean;
  whispers: { at: number; text: string }[];
}

export interface Review {
  verdicts: Record<string, "agree" | "disagree">;
  note: string;
}

interface State {
  projectId: string;
  nowMin: number;
  pauses: { from: number; to: number | null }[];
  leads: Lead[];
  calls: Call[];
  messages: Message[];
  tasks: Task[];
  bookings: Booking[];
  docs: KnowledgeDoc[];
  questions: Question[];
  lists: CallingList[];
  connections: Connection[];
  numbers: PoolNumber[];
  reps: Rep[];
  agentDraft: AgentConfig;
  agentPublished: AgentConfig;
  agentPublishedAt: number | null;
  rules: Rules;
  reviewed: Record<string, Review>;
  handled: Record<string, true>;
  desk: Desk | null;
  toasts: Toast[];
  testCallDone: boolean;
  seq: number;
}

interface Actions {
  setProject: (id: string) => void;
  tick: (now: number) => void;
  pauseCalling: () => void;
  resumeCalling: () => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  updateLeads: (ids: string[], patch: Partial<Lead>) => void;
  addCall: (call: Omit<Call, "id">) => string;
  updateCall: (id: string, patch: Partial<Call>) => void;
  addMessage: (m: Omit<Message, "id">) => void;
  toggleTask: (id: string) => void;
  addTask: (t: Omit<Task, "id" | "done">) => void;
  addBooking: (b: Omit<Booking, "id" | "done">) => void;
  completeBooking: (id: string) => void;
  approveDoc: (id: string, by: string) => void;
  updateDoc: (id: string, patch: Partial<KnowledgeDoc>) => void;
  confirmFact: (docId: string, factId: string, confirmed: boolean) => void;
  addDoc: (doc: Omit<KnowledgeDoc, "id">) => string;
  answerQuestion: (id: string, text: string, docId: string | null) => void;
  addQuestion: (q: Omit<Question, "id">) => void;
  addList: (l: Omit<CallingList, "id">) => string;
  setListStatus: (id: string, status: CallingList["status"]) => void;
  setConnection: (id: string, patch: Partial<Connection>) => void;
  setNumber: (id: string, patch: Partial<PoolNumber>) => void;
  addNumber: (n: Omit<PoolNumber, "id">) => void;
  setRep: (id: string, patch: Partial<Rep>) => void;
  addRep: (r: Omit<Rep, "id">) => void;
  setAgentDraft: (patch: Partial<AgentConfig>) => void;
  publishAgent: () => void;
  discardAgentDraft: () => void;
  setRules: (patch: Partial<Rules>) => void;
  submitReview: (callId: string, review: Review) => void;
  handle: (key: string) => void;
  openDesk: (callId: string, mode?: Desk["mode"]) => void;
  closeDesk: () => void;
  setDesk: (patch: Partial<Desk>) => void;
  whisper: (text: string) => void;
  toast: (text: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
  markTestCall: () => void;
  resetDemo: () => void;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

type Saved = StorageValue<Partial<State>>;

let pending: { name: string; value: Saved } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastState: Partial<State> | null = null;

/** Only real changes count. The clock ticks every second but isn't saved. */
function changed(next: Partial<State>) {
  if (!lastState) return true;
  return (Object.keys(next) as (keyof State)[]).some((k) => next[k] !== lastState![k]);
}

function flush() {
  timer = null;
  if (!pending) return;
  const { name, value } = pending;
  pending = null;
  try {
    localStorage.setItem(name, JSON.stringify(value));
  } catch {
    /* storage blocked or full: the demo keeps working, it just isn't saved */
  }
}

/** Saves at most once a second, and only after a real change. */
const lazyStorage: PersistStorage<Partial<State>> = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      const value = raw ? (JSON.parse(raw) as Saved) : null;
      lastState = value?.state ?? null;
      return value;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (!changed(value.state)) return;
    lastState = value.state;
    pending = { name, value };
    if (!timer) timer = setTimeout(flush, 1000);
  },
  removeItem: (name) => {
    pending = null;
    lastState = null;
    try {
      localStorage.removeItem(name);
    } catch {
      /* storage blocked */
    }
  },
};

if (typeof window !== "undefined") window.addEventListener("pagehide", flush);

/** The sample data a fresh demo starts from. */
function initialData() {
  return {
    projectId: "vanam",
    pauses: [] as State["pauses"],
    leads: SEED.leads,
    calls: SEED.calls,
    messages: SEED.messages,
    tasks: SEED.tasks,
    bookings: SEED.bookings,
    docs: SEED.docs,
    questions: SEED.questions,
    lists: SEED.lists,
    connections: SEED.connections,
    numbers: SEED.numbers,
    reps: REPS,
    agentDraft: clone(SEED.agent),
    agentPublished: SEED.agent,
    agentPublishedAt: null as number | null,
    rules: SEED.rules,
    reviewed: {} as State["reviewed"],
    handled: {} as State["handled"],
    testCallDone: false,
    seq: 1,
    desk: null as Desk | null,
  };
}

export const useStore = create<State & Actions>()(
  persist(
  (set, get) => ({
  nowMin: DEMO_START_MIN,
  ...initialData(),
  toasts: [],

  setProject: (id) => set({ projectId: id }),
  tick: (now) => set({ nowMin: now }),
  pauseCalling: () => {
    const { pauses, nowMin } = get();
    if (pauses.length && pauses[pauses.length - 1].to === null) return;
    set({ pauses: [...pauses, { from: nowMin, to: null }] });
  },
  resumeCalling: () => {
    const { pauses, nowMin } = get();
    if (!pauses.length || pauses[pauses.length - 1].to !== null) return;
    const next = pauses.slice();
    next[next.length - 1] = { ...next[next.length - 1], to: nowMin };
    set({ pauses: next });
  },
  updateLead: (id, patch) => set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  updateLeads: (ids, patch) => {
    const setIds = new Set(ids);
    set((s) => ({ leads: s.leads.map((l) => (setIds.has(l.id) ? { ...l, ...patch } : l)) }));
  },
  addCall: (call) => {
    const id = `manual-${get().seq}`;
    set((s) => ({ calls: [...s.calls, { ...call, id }], seq: s.seq + 1 }));
    return id;
  },
  updateCall: (id, patch) => set((s) => ({ calls: s.calls.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, { ...m, id: `msg-${s.seq}` }], seq: s.seq + 1 })),
  toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
  addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: `task-${s.seq}`, done: false }], seq: s.seq + 1 })),
  addBooking: (b) => set((s) => ({ bookings: [...s.bookings, { ...b, id: `bk-${s.seq}`, done: false }], seq: s.seq + 1 })),
  completeBooking: (id) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, done: true } : b)) })),
  approveDoc: (id, by) =>
    set((s) => {
      const doc = s.docs.find((d) => d.id === id);
      if (!doc) return {};
      // The approved version replaces older versions of the same document.
      const older = (d: KnowledgeDoc) => d.id !== id && d.projectId === doc.projectId && d.title === doc.title && d.version < doc.version;
      return {
        docs: s.docs
          .filter((d) => !older(d))
          .map((d) => (d.id === id ? { ...d, status: "approved", effective: "10 Oct 2026", updatedBy: by } : d)),
      };
    }),
  updateDoc: (id, patch) => set((s) => ({ docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  confirmFact: (docId, factId, confirmed) =>
    set((s) => ({
      docs: s.docs.map((d) =>
        d.id === docId ? { ...d, facts: d.facts.map((f) => (f.id === factId ? { ...f, confirmed } : f)) } : d,
      ),
    })),
  addDoc: (doc) => {
    const id = `upload-${get().seq}`;
    set((s) => ({ docs: [...s.docs, { ...doc, id }], seq: s.seq + 1 }));
    return id;
  },
  answerQuestion: (id, text, docId) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === id ? { ...q, answer: { text, docId, by: "Anand Varma" } } : q,
      ),
    })),
  addQuestion: (q) => set((s) => ({ questions: [{ ...q, id: `q-${s.seq}` }, ...s.questions], seq: s.seq + 1 })),
  addList: (l) => {
    const id = `list-${get().seq}`;
    set((s) => ({ lists: [{ ...l, id }, ...s.lists], seq: s.seq + 1 }));
    return id;
  },
  setListStatus: (id, status) => set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, status } : l)) })),
  setConnection: (id, patch) =>
    set((s) => ({ connections: s.connections.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  setNumber: (id, patch) => set((s) => ({ numbers: s.numbers.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
  addNumber: (n) => set((s) => ({ numbers: [...s.numbers, { ...n, id: `num-${s.seq}` }], seq: s.seq + 1 })),
  setRep: (id, patch) => set((s) => ({ reps: s.reps.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  addRep: (r) => set((s) => ({ reps: [...s.reps, { ...r, id: `rep-${s.seq}` }], seq: s.seq + 1 })),
  setAgentDraft: (patch) => set((s) => ({ agentDraft: { ...s.agentDraft, ...patch } })),
  publishAgent: () => set((s) => ({ agentPublished: clone(s.agentDraft), agentPublishedAt: s.nowMin })),
  discardAgentDraft: () => set((s) => ({ agentDraft: clone(s.agentPublished) })),
  setRules: (patch) => set((s) => ({ rules: { ...s.rules, ...patch } })),
  submitReview: (callId, review) => set((s) => ({ reviewed: { ...s.reviewed, [callId]: review } })),
  handle: (key) => set((s) => ({ handled: { ...s.handled, [key]: true } })),
  openDesk: (callId, mode = "listen") => set({ desk: { callId, mode, muted: false, whispers: [] } }),
  closeDesk: () => set({ desk: null }),
  setDesk: (patch) => set((s) => (s.desk ? { desk: { ...s.desk, ...patch } } : {})),
  whisper: (text) =>
    set((s) => (s.desk ? { desk: { ...s.desk, whispers: [...s.desk.whispers, { at: s.nowMin, text }] } } : {})),
  toast: (text, tone = "info") => {
    const id = get().seq;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, tone }], seq: s.seq + 1 }));
    window.setTimeout(() => get().dismissToast(id), 4200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markTestCall: () => set({ testCallDone: true }),
  resetDemo: () => set({ ...initialData(), toasts: [] }),
}),
    {
      name: "psd-demo",
      version: 1,
      // Every read and write is guarded; a blocked or full store just means nothing is saved.
      storage: lazyStorage,
      // Rehydrated after mount, so server and first client render match.
      skipHydration: true,
      partialize: (s) => ({
        projectId: s.projectId,
        leads: s.leads,
        calls: s.calls,
        messages: s.messages,
        tasks: s.tasks,
        bookings: s.bookings,
        docs: s.docs,
        questions: s.questions,
        lists: s.lists,
        connections: s.connections,
        numbers: s.numbers,
        reps: s.reps,
        agentDraft: s.agentDraft,
        agentPublished: s.agentPublished,
        agentPublishedAt: s.agentPublishedAt,
        rules: s.rules,
        reviewed: s.reviewed,
        handled: s.handled,
        testCallDone: s.testCallDone,
        seq: s.seq,
      }),
    },
  ),
);
