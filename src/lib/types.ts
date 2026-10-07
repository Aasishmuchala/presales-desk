export type Lang = "EN" | "HI" | "TE";

export type Stage =
  | "new"
  | "talking"
  | "hot"
  | "booked"
  | "callback"
  | "notnow"
  | "optedout"
  | "unreachable";

export type Outcome =
  | "booked"
  | "qualified"
  | "transferred"
  | "callback"
  | "info_sent"
  | "not_now"
  | "opted_out";

export type CallResult = "connected" | "no_answer" | "busy" | "voicemail";

export interface Project {
  id: string;
  name: string;
  locality: string;
  city: string;
  rera: string;
  possession: string;
  towers: number;
  priceFromLakh: number;
}

export interface Rep {
  id: string;
  name: string;
  role: "manager" | "rep" | "legal" | "admin";
  langs: Lang[];
  available: boolean;
  calendar: boolean;
  phone: string;
}

export interface Lead {
  id: string;
  projectId: string;
  name: string;
  phone: string;
  lang: Lang;
  source: string;
  config: string;
  budgetLakh: number;
  facing: string | null;
  purpose: string;
  timeline: string;
  note: string;
  stage: Stage;
  score: number;
  repId: string;
  createdAt: number; // minutes relative to demo-day midnight
  lastTouch: number;
  nextStep: string;
  summary: string;
  consent: boolean;
  dnd: boolean;
}

export interface Citation {
  docId: string;
  para: number;
  label: string;
}

export interface Turn {
  speaker: "agent" | "lead";
  text: string;
  at: number; // seconds from call start
  lang: Lang;
  cites?: Citation[];
}

export interface QaFlag {
  kind: "accuracy" | "compliance" | "tone";
  note: string;
}

export interface Call {
  id: string;
  projectId: string;
  leadId: string;
  start: number; // minutes relative to demo-day midnight
  durationSec: number;
  result: CallResult;
  outcome?: Outcome;
  lang: Lang;
  score?: number;
  qa?: { flags: QaFlag[]; accuracy: number; compliance: number; tone: number };
  manual?: boolean;
}

export interface Message {
  id: string;
  leadId: string;
  channel: "whatsapp" | "email";
  direction: "out" | "in";
  at: number;
  text: string;
}

export interface Task {
  id: string;
  leadId: string;
  repId: string;
  title: string;
  due: number;
  done: boolean;
}

export interface Booking {
  id: string;
  leadId: string;
  repId: string;
  kind: "visit" | "callback" | "video";
  at: number;
  done: boolean;
}

export interface Fact {
  id: string;
  label: string;
  value: string;
  para: number;
  confidence: "high" | "check";
  confirmed: boolean;
  keywords: string[];
}

export interface DocSection {
  heading: string;
  paras: string[];
}

export interface KnowledgeDoc {
  id: string;
  projectId: string;
  book: "project" | "legal";
  title: string;
  kind: string;
  version: number;
  status: "draft" | "approved";
  effective: string;
  updatedBy: string;
  pages: number;
  paras: string[]; // flat list, headings are paras that start with "# "
  facts: Fact[];
  previous?: { version: number; paras: string[] };
}

export interface Question {
  id: string;
  projectId: string;
  text: string;
  quote: string;
  leadId: string;
  asked: number;
  category: string;
  lastAsked: number;
  answer?: { text: string; docId: string | null; by: string };
}

export interface CallingList {
  id: string;
  projectId: string;
  name: string;
  view: string;
  script: string;
  langPolicy: string;
  status: "running" | "paused" | "scheduled" | "done";
  leadIds: string[];
  startsAt: number;
  createdBy: string;
}

export interface Connection {
  id: string;
  name: string;
  detail: string;
  status: "connected" | "not_connected" | "error";
  lastCheck: string;
}

export interface PoolNumber {
  id: string;
  number: string;
  provider: string;
  reputation: "good" | "watch" | "flagged";
  dialledToday: number;
  active: boolean;
}

export interface Objection {
  id: string;
  when: string;
  answer: string;
}

export interface AgentConfig {
  voice: string;
  langs: Lang[];
  opening: Record<Lang, string>;
  objections: Objection[];
  handoverOnAsk: boolean;
  handoverScore: number;
  handoverTo: "assigned" | "available";
  followUps: { day: number; on: boolean; what: string }[];
}

export interface Rules {
  callFrom: string;
  callTo: string;
  retries: number;
  retryGapHours: number;
  dndScrubAt: string;
  retentionDays: number;
  disclosure: Record<Lang, string>;
  dltTemplates: string;
  humanCostPerDial: number;
}
