import { chance, hashString, int, mulberry32, pick, weighted, type Rng } from "../rand";
import { DAY, DEMO_START_MIN, inr } from "../format";
import type {
  AgentConfig,
  Booking,
  Call,
  CallingList,
  CallResult,
  Connection,
  KnowledgeDoc,
  Lang,
  Lead,
  Message,
  Outcome,
  PoolNumber,
  Project,
  Question,
  Rep,
  Rules,
  Stage,
  Task,
} from "../types";
import { buildDocs, PRICE_PARAMS } from "./docs";

export const PROJECTS: Project[] = [
  {
    id: "vanam",
    name: "Vanam Residences",
    locality: "Kokapet",
    city: "Hyderabad",
    rera: "P02400007841",
    possession: "Dec 2027",
    towers: 2,
    priceFromLakh: 126,
  },
  {
    id: "tara",
    name: "Tara Greens",
    locality: "Tellapur",
    city: "Hyderabad",
    rera: "P02400009316",
    possession: "Mar 2028",
    towers: 3,
    priceFromLakh: 96,
  },
];

export const ME_ID = "u1";
export const DEMO_REP_ID = "r1";

export const REPS: Rep[] = [
  { id: "u1", name: "Anand Varma", role: "manager", langs: ["EN", "TE", "HI"], available: true, calendar: true, phone: "+91 98480 22117" },
  { id: "r1", name: "Priyanka Reddy", role: "rep", langs: ["EN", "TE", "HI"], available: true, calendar: true, phone: "+91 99490 31862" },
  { id: "r2", name: "Arjun Rao", role: "rep", langs: ["EN", "TE"], available: true, calendar: true, phone: "+91 90002 47713" },
  { id: "r3", name: "Sameer Khan", role: "rep", langs: ["EN", "HI"], available: false, calendar: true, phone: "+91 97013 58824" },
  { id: "r4", name: "Lakshmi Prasanna", role: "rep", langs: ["EN", "TE"], available: true, calendar: false, phone: "+91 96528 90041" },
  { id: "l1", name: "Meera Iyer", role: "legal", langs: ["EN"], available: true, calendar: true, phone: "+91 98853 10276" },
  { id: "a1", name: "Kiran Goud", role: "admin", langs: ["EN", "TE"], available: true, calendar: true, phone: "+91 94400 66189" },
];

export const SALES_REPS = REPS.filter((r) => r.role === "rep");

const FIRST_TE = ["Ramesh", "Srinivas", "Venkatesh", "Anil", "Kiran", "Praveen", "Suresh", "Harish", "Naveen", "Mahesh", "Sandeep", "Ravi", "Vamsi", "Karthik", "Sai Teja", "Chaitanya", "Lakshmi", "Sravani", "Padma", "Swathi", "Divya", "Anusha", "Keerthi", "Madhavi", "Bhavana", "Harika", "Sowmya", "Jyothi", "Meghana", "Pavan", "Raghav", "Tejaswini"];
const LAST_TE = ["Reddy", "Rao", "Naidu", "Chowdary", "Varma", "Goud", "Raju", "Prasad", "Kumar", "Yadav", "Bhaskar", "Murthy"];
const FIRST_HI = ["Rohit", "Amit", "Vikas", "Manoj", "Deepak", "Sanjay", "Aditya", "Neha", "Pooja", "Shweta", "Ritu", "Priya", "Ankit", "Saurabh", "Nidhi", "Gaurav"];
const LAST_HI = ["Sharma", "Gupta", "Agarwal", "Mishra", "Jain", "Saxena", "Srivastava", "Kulkarni", "Patel", "Desai"];
const FIRST_UR = ["Imran", "Farhan", "Ayesha", "Sana", "Arif", "Zoya", "Salman", "Nazia"];
const LAST_UR = ["Khan", "Shaik", "Siddiqui", "Hussain", "Ali"];
const FIRST_S = ["Arvind", "Shruti", "Vivek", "Anjali", "Rahul", "Divya"];
const LAST_S = ["Iyer", "Menon", "Pillai", "Nair", "Bhat", "Shetty"];

const SOURCES: readonly (readonly [string, number])[] = [
  ["99acres", 26],
  ["MagicBricks", 18],
  ["Housing.com", 14],
  ["Meta lead ad", 20],
  ["Google ad", 10],
  ["Website form", 8],
  ["Channel partner", 4],
];

const PURPOSES = [
  ["buying for parents", "For parents"],
  ["for their own family", "Self use"],
  ["as an investment", "Investment"],
  ["moving back from Bengaluru", "Self use"],
  ["upgrading from a 2 BHK", "Self use"],
] as const;

const NOTES = [
  "free on Saturdays",
  "prefers calls after 7 pm",
  "wants a home loan with SBI",
  "needs possession before 2028",
  "asked about east-facing units",
  "wife will join the site visit",
  "comparing with two projects in Narsingi",
  "works in the Financial District",
];

const TIMELINES = ["Within 3 months", "3 to 6 months", "6 to 12 months", "Just exploring"] as const;

function phone(r: Rng) {
  const a = pick(r, ["98", "99", "97", "96", "95", "94", "93", "91", "90", "89", "88", "87", "86", "85", "79", "77", "73", "70"]);
  return `+91 ${a}${int(r, 100, 999)} ${int(r, 10000, 99999)}`;
}

function makeName(r: Rng): { name: string; lang: Lang } {
  const group = weighted(r, [
    ["te", 58],
    ["hi", 22],
    ["ur", 12],
    ["s", 8],
  ] as const);
  if (group === "te") return { name: `${pick(r, FIRST_TE)} ${pick(r, LAST_TE)}`, lang: chance(r, 0.55) ? "TE" : "EN" };
  if (group === "hi") return { name: `${pick(r, FIRST_HI)} ${pick(r, LAST_HI)}`, lang: chance(r, 0.5) ? "HI" : "EN" };
  if (group === "ur") return { name: `${pick(r, FIRST_UR)} ${pick(r, LAST_UR)}`, lang: chance(r, 0.6) ? "HI" : "EN" };
  return { name: `${pick(r, FIRST_S)} ${pick(r, LAST_S)}`, lang: "EN" };
}

export function summaryFor(l: Pick<Lead, "stage" | "config" | "facing" | "budgetLakh" | "purpose" | "note" | "source">, purposePhrase: string) {
  if (l.stage === "new") return `New enquiry from ${l.source}. Not spoken to yet.`;
  if (l.stage === "unreachable") return `Enquired on ${l.source}. Three calls, no answer yet.`;
  if (l.stage === "optedout") return "Asked not to be contacted again.";
  const facing = l.facing ? ` ${l.facing.toLowerCase()}-facing` : "";
  return `Wants a ${l.config}${facing} under ${inr(l.budgetLakh)}, ${purposePhrase}, ${l.note}.`;
}

const NEXT_STEP: Record<Stage, string[]> = {
  new: ["Agent calls within 2 minutes"],
  talking: ["Send floor plan and follow up", "Share payment plan on WhatsApp"],
  hot: ["Rep to call today", "Offer a site visit this weekend"],
  booked: ["Site visit", "Confirm visit a day before"],
  callback: ["Call back at the time they asked"],
  notnow: ["Agent checks in after 30 days"],
  optedout: ["No further contact"],
  unreachable: ["Retry on a different hour"],
};

const OUTCOME_WEIGHTS: readonly (readonly [Outcome, number])[] = [
  ["booked", 7],
  ["qualified", 15],
  ["transferred", 4],
  ["callback", 14],
  ["info_sent", 40],
  ["not_now", 18],
  ["opted_out", 2],
];

const RESULT_WEIGHTS: readonly (readonly [CallResult, number])[] = [
  ["connected", 46],
  ["no_answer", 38],
  ["busy", 9],
  ["voicemail", 7],
];

const HOUR_WEIGHTS = [0.6, 1, 1.1, 0.9, 0.6, 0.8, 1, 1, 1.2, 1.4, 1.3, 0.9]; // 09:00 to 20:00

const STAGE_FOR_OUTCOME: Record<Outcome, Stage> = {
  booked: "booked",
  qualified: "hot",
  transferred: "hot",
  callback: "callback",
  info_sent: "talking",
  not_now: "notnow",
  opted_out: "optedout",
};

export interface Seed {
  leads: Lead[];
  purposePhrase: Record<string, string>;
  calls: Call[];
  messages: Message[];
  tasks: Task[];
  bookings: Booking[];
  docs: KnowledgeDoc[];
  questions: Question[];
  lists: CallingList[];
  connections: Connection[];
  numbers: PoolNumber[];
  agent: AgentConfig;
  rules: Rules;
}

/** Moves a time into the 09:00 to 20:50 calling window of the same day. */
function inWindow(t: number) {
  const day = Math.floor(t / DAY);
  const m = t - day * DAY;
  if (m >= 9 * 60 && m <= 20 * 60 + 50) return t;
  return day * DAY + 9 * 60 + (Math.abs(Math.round(m * 7)) % (11 * 60 + 50));
}

function budgetFor(r: Rng, projectId: string, config: string) {
  const unit = PRICE_PARAMS[projectId].units.find((u) => u.config === config) ?? PRICE_PARAMS[projectId].units[0];
  return Math.round((unit.fromLakh * (0.95 + r() * 0.35)) / 5) * 5;
}

function buildProject(p: Project, r: Rng, seed: Seed, leadCount: number, dialsToday: number) {
  const configs = PRICE_PARAMS[p.id].units.map((u) => u.config);
  const projLeads: Lead[] = [];

  for (let i = 0; i < leadCount; i++) {
    const { name, lang } = makeName(r);
    const config = weighted(r, configs.map((c, idx) => [c, idx === 1 ? 5 : idx === 0 ? 3 : 2] as const));
    const [purposePhrase, purpose] = pick(r, PURPOSES);
    const stage = weighted<Stage>(r, [
      ["new", 10],
      ["talking", 34],
      ["hot", 9],
      ["booked", 7],
      ["callback", 10],
      ["notnow", 18],
      ["optedout", 3],
      ["unreachable", 9],
    ]);
    const createdAt = -int(r, 0, 40) * DAY + int(r, 8 * 60, 21 * 60);
    const l: Lead = {
      id: `${p.id}-L${String(i + 1).padStart(3, "0")}`,
      projectId: p.id,
      name,
      phone: phone(r),
      lang,
      source: weighted(r, SOURCES),
      config,
      budgetLakh: budgetFor(r, p.id, config),
      facing: chance(r, 0.4) ? pick(r, ["East", "North", "West"]) : null,
      purpose,
      timeline: pick(r, TIMELINES),
      note: pick(r, NOTES),
      stage,
      score: 0,
      repId: pick(r, SALES_REPS).id,
      createdAt,
      lastTouch: createdAt,
      nextStep: "",
      summary: "",
      consent: stage !== "new",
      dnd: stage === "optedout" || chance(r, 0.02),
    };
    seed.purposePhrase[l.id] = purposePhrase;
    projLeads.push(l);
  }

  // History calls on previous days for leads already spoken to.
  for (const l of projLeads) {
    if (l.stage === "new") continue;
    const n = l.stage === "unreachable" ? 3 : int(r, 1, 3);
    let t = Math.max(l.createdAt + 3, -9 * DAY);
    for (let k = 0; k < n; k++) {
      t = inWindow(Math.min(t + int(r, 200, 3000), -60));
      const last = k === n - 1;
      const connected = l.stage !== "unreachable" && (last || chance(r, 0.5));
      const outcome: Outcome | undefined = connected
        ? last
          ? (Object.entries(STAGE_FOR_OUTCOME).find(([, s]) => s === l.stage)?.[0] as Outcome | undefined) ?? "info_sent"
          : "info_sent"
        : undefined;
      seed.calls.push({
        id: `${l.id}-h${k}`,
        projectId: p.id,
        leadId: l.id,
        start: t,
        durationSec: connected ? int(r, 110, 420) : int(r, 18, 40),
        result: connected ? "connected" : pick(r, ["no_answer", "busy", "voicemail"] as const),
        outcome,
        lang: l.lang,
        score: connected ? int(r, 30, 92) : undefined,
      });
      l.lastTouch = t;
    }
  }

  // Today's dial attempts from 09:00 to 21:00. Calls after the demo clock happen live.
  const callable = projLeads.filter((l) => l.stage !== "optedout" && !l.dnd);
  const total = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);
  let seq = 0;
  const today: Call[] = [];
  HOUR_WEIGHTS.forEach((w, hi) => {
    const count = Math.round((dialsToday * w) / total);
    for (let c = 0; c < count; c++) {
      const start = (9 + hi) * 60 + r() * 60;
      const l = pick(r, callable);
      const result = weighted(r, RESULT_WEIGHTS);
      const connected = result === "connected";
      const outcome = connected ? weighted(r, OUTCOME_WEIGHTS) : undefined;
      seq += 1;
      today.push({
        id: `${p.id}-c${String(seq).padStart(4, "0")}`,
        projectId: p.id,
        leadId: l.id,
        start: Math.round(start * 10) / 10,
        durationSec: connected ? int(r, 95, 400) : int(r, 18, 45),
        result,
        outcome,
        lang: l.lang,
        score: connected ? (outcome === "booked" || outcome === "qualified" || outcome === "transferred" ? int(r, 70, 95) : int(r, 25, 72)) : undefined,
      });
    }
  });
  today.sort((a, b) => a.start - b.start);

  // A guaranteed handful of calls running at the moment the demo opens.
  const liveIdx = today.filter((c) => c.start < DEMO_START_MIN).slice(-40);
  for (let k = 0; k < 6; k++) {
    const c = liveIdx[liveIdx.length - 1 - k * 3];
    if (!c) continue;
    c.result = "connected";
    c.start = DEMO_START_MIN - (0.4 + k * 0.55);
    c.durationSec = int(r, 220, 400);
    c.outcome = weighted(r, OUTCOME_WEIGHTS.filter(([o]) => o !== "opted_out"));
    c.score = int(r, 55, 90);
  }
  // Two recently finished hand-overs so "Needs you" is never empty at start.
  const recent = today.filter((c) => c.start < DEMO_START_MIN - 8 && c.start > DEMO_START_MIN - 30);
  recent.slice(0, 2).forEach((c, i) => {
    c.result = "connected";
    c.outcome = "transferred";
    c.durationSec = 240 + i * 40;
    c.score = 86 - i * 4;
  });

  // QA flags on a few finished calls.
  const qaNotes: { kind: "accuracy" | "compliance" | "tone"; note: string }[] = [
    { kind: "accuracy", note: "Quoted a carpet area without citing the price sheet." },
    { kind: "compliance", note: "AI disclosure was cut off when the lead interrupted." },
    { kind: "tone", note: "Talked over the lead twice in Telugu." },
    { kind: "accuracy", note: "Said the clubhouse is included, which is still marked 'check'." },
    { kind: "compliance", note: "Lead said 'don't call again'. Outcome was not set to opted out." },
    { kind: "tone", note: "Repeated the same price three times." },
    { kind: "accuracy", note: "Gave the builder's target date instead of the RERA date." },
  ];
  const finishedConnected = today.filter((c) => c.result === "connected" && c.start < DEMO_START_MIN - 10);
  qaNotes.forEach((n, i) => {
    const c = finishedConnected[(i * 7 + 3) % finishedConnected.length];
    if (!c || c.qa) return;
    c.qa = {
      flags: [n],
      accuracy: n.kind === "accuracy" ? int(r, 1, 3) : int(r, 4, 5),
      compliance: n.kind === "compliance" ? int(r, 1, 3) : 5,
      tone: n.kind === "tone" ? int(r, 2, 3) : int(r, 4, 5),
    };
  });

  // Today's finished calls move lead state forward.
  for (const c of today) {
    if (c.start > DEMO_START_MIN) continue;
    const l = projLeads.find((x) => x.id === c.leadId)!;
    l.lastTouch = c.start;
    if (c.result === "connected" && c.outcome && c.start + c.durationSec / 60 <= DEMO_START_MIN) {
      l.stage = STAGE_FOR_OUTCOME[c.outcome];
      l.consent = true;
    }
  }

  seed.calls.push(...today);

  // Scores, summaries and next steps.
  for (const l of projLeads) {
    const base: Record<Stage, [number, number]> = {
      new: [0, 0],
      talking: [35, 65],
      hot: [72, 95],
      booked: [70, 92],
      callback: [45, 75],
      notnow: [12, 40],
      optedout: [0, 10],
      unreachable: [0, 0],
    };
    const [a, b] = base[l.stage];
    l.score = a === b ? a : int(r, a, b);
    l.summary = summaryFor(l, seed.purposePhrase[l.id]);
    l.nextStep = pick(r, NEXT_STEP[l.stage]);
  }

  // Bookings, tasks and messages.
  let bk = 0;
  let tk = 0;
  let ms = 0;
  for (const l of projLeads) {
    if (l.stage === "booked") {
      bk += 1;
      const dayOff = pick(r, [0, 1, 1, 2, 3]);
      const slot = pick(r, [10 * 60 + 30, 11 * 60 + 30, 12 * 60 + 30, 15 * 60, 16 * 60 + 30, 17 * 60 + 30, 18 * 60]);
      const at = dayOff === 0 ? Math.max(slot, 17 * 60) : dayOff * DAY + slot;
      seed.bookings.push({ id: `${p.id}-b${bk}`, leadId: l.id, repId: l.repId, kind: "visit", at, done: false });
      l.nextStep = `Site visit ${dayOff === 0 ? "today" : dayOff === 1 ? "tomorrow" : "this week"}`;
    }
    if (l.stage === "callback") {
      bk += 1;
      const at = DEMO_START_MIN + int(r, -300, 270);
      seed.bookings.push({ id: `${p.id}-b${bk}`, leadId: l.id, repId: l.repId, kind: "callback", at: Math.round(at), done: false });
    }
    if (l.stage === "hot" || l.stage === "booked") {
      const titles = [
        "Confirm the SBI home-loan tie-up and processing fee",
        `Send the ${l.config} floor plan as a PDF`,
        "Share construction progress photos from this week",
        "Check availability of an east-facing unit above the 10th floor",
        "Call back with the exact all-inclusive price",
      ];
      const first = int(r, 0, titles.length - 1);
      const n = int(r, 1, 2);
      for (let k = 0; k < n; k++) {
        tk += 1;
        seed.tasks.push({
          id: `${p.id}-t${tk}`,
          leadId: l.id,
          repId: l.repId,
          title: titles[(first + k * 2) % titles.length],
          due: DEMO_START_MIN + int(r, -90, 300),
          done: chance(r, 0.2),
        });
      }
    }
    const lastConnected = [...seed.calls].reverse().find((c) => c.leadId === l.id && c.result === "connected" && c.start <= DEMO_START_MIN);
    if (lastConnected && l.stage !== "optedout") {
      ms += 1;
      const at = lastConnected.start + lastConnected.durationSec / 60 + 1;
      seed.messages.push({
        id: `${p.id}-m${ms}`,
        leadId: l.id,
        channel: "whatsapp",
        direction: "out",
        at,
        text: `Brochure, ${l.config} floor plan and price sheet v7 for ${p.name}.`,
      });
      if (chance(r, 0.35)) {
        ms += 1;
        seed.messages.push({
          id: `${p.id}-m${ms}`,
          leadId: l.id,
          channel: "whatsapp",
          direction: "in",
          at: at + int(r, 4, 120),
          text: pick(r, ["Thanks, will check and revert.", "Received. Is the 4th floor available?", "Ok. Can I visit on Sunday?", "Thank you 🙏"]),
        });
      }
    }
  }

  seed.leads.push(...projLeads);
  return projLeads;
}

function buildQuestions(p: Project, leads: Lead[], r: Rng): Question[] {
  const items: [string, string, string, number][] = [
    ["Can NRIs pay from an NRE account?", "I'm in Dubai right now. Can I pay the booking amount from my NRE account?", "Payments", 5],
    ["Is a second covered car park available, and at what price?", "Second car parking milega? Kitna extra hoga?", "Pricing", 7],
    ["When will the sample flat be open for visits?", "Sample flat eppudu ready avtundi?", "Site visit", 4],
    ["Can my lawyer see the title documents before booking?", "Before I pay anything, can my lawyer go through the title and link documents?", "Legal", 2],
    ["Is there a discount for paying 50% upfront?", "If I pay half the amount now, is there any discount?", "Pricing", 4],
    ["Are pets allowed in the towers?", "We have a golden retriever. Any rules about pets?", "Community", 3],
    ["Does the project use solar power for common areas?", "Do you have solar panels for the common area lighting?", "Specifications", 1],
    ["How far is the nearest planned metro station?", "Metro station ekkada vastundi, entha dooram?", "Location", 2],
  ];
  return items.map(([text, quote, category, asked], i) => ({
    id: `${p.id}-q${i + 1}`,
    projectId: p.id,
    text,
    quote,
    category,
    asked: p.id === "tara" ? Math.max(1, asked - 2) : asked,
    leadId: pick(r, leads.filter((l) => l.stage !== "new")).id,
    lastAsked: DEMO_START_MIN - int(r, 5, 60 * 30),
  }));
}

function buildLists(p: Project, leads: Lead[]): CallingList[] {
  const fresh = leads.filter((l) => l.stage === "new").map((l) => l.id);
  const notnow = leads.filter((l) => l.stage === "notnow").map((l) => l.id);
  const booked = leads.filter((l) => l.stage === "booked").map((l) => l.id);
  const unreachable = leads.filter((l) => l.stage === "unreachable").map((l) => l.id);
  return [
    { id: `${p.id}-list1`, projectId: p.id, name: "New enquiries from portals and ads", view: "New", script: "Fresh enquiry", langPolicy: "Detect from the first reply", status: "running", leadIds: fresh, startsAt: -7 * DAY + 9 * 60, createdBy: "Anand Varma" },
    { id: `${p.id}-list2`, projectId: p.id, name: "Said 'not now' in September", view: "Not now", script: "Check in after 30 days", langPolicy: "Use their last language", status: "paused", leadIds: notnow, startsAt: -2 * DAY + 10 * 60, createdBy: "Anand Varma" },
    { id: `${p.id}-list3`, projectId: p.id, name: "Site visit reminders for tomorrow", view: "Visit booked", script: "Visit reminder", langPolicy: "Use their last language", status: "scheduled", leadIds: booked, startsAt: DAY + 9 * 60, createdBy: "Kiran Goud" },
    { id: `${p.id}-list4`, projectId: p.id, name: "No answer after 3 tries", view: "Unreachable", script: "Fresh enquiry", langPolicy: "Detect from the first reply", status: "done", leadIds: unreachable, startsAt: -5 * DAY + 11 * 60, createdBy: "Kiran Goud" },
  ];
}

function build(): Seed {
  const r = mulberry32(hashString("presales-demo-2026-10-10"));
  const seed: Seed = {
    leads: [],
    purposePhrase: {},
    calls: [],
    messages: [],
    tasks: [],
    bookings: [],
    docs: buildDocs(PROJECTS),
    questions: [],
    lists: [],
    connections: [],
    numbers: [],
    agent: {} as AgentConfig,
    rules: {} as Rules,
  };
  const vanamLeads = buildProject(PROJECTS[0], r, seed, 240, 640);
  const taraLeads = buildProject(PROJECTS[1], r, seed, 130, 300);
  seed.questions = [...buildQuestions(PROJECTS[0], vanamLeads, r), ...buildQuestions(PROJECTS[1], taraLeads, r)];
  seed.lists = [...buildLists(PROJECTS[0], vanamLeads), ...buildLists(PROJECTS[1], taraLeads)];
  seed.connections = [
    { id: "crm", name: "Your CRM", detail: "Webhook on new and updated leads, plus a nightly check.", status: "connected", lastCheck: "16:18" },
    { id: "phone", name: "Phone numbers", detail: "Exotel SIP trunk into the voice agent. 4 numbers.", status: "connected", lastCheck: "16:15" },
    { id: "whatsapp", name: "WhatsApp Business", detail: "Meta Cloud API. 6 approved message templates.", status: "connected", lastCheck: "16:10" },
    { id: "email", name: "Email", detail: "Send follow-ups from your sales address.", status: "not_connected", lastCheck: "Never" },
    { id: "calendar", name: "Google Calendar", detail: "Site-visit slots for each sales person.", status: "error", lastCheck: "Lakshmi's calendar needs access again" },
  ];
  seed.numbers = [
    { id: "n1", number: "+91 40 4852 1190", provider: "Exotel", reputation: "good", dialledToday: 0, active: true },
    { id: "n2", number: "+91 40 4852 1191", provider: "Exotel", reputation: "good", dialledToday: 0, active: true },
    { id: "n3", number: "+91 40 4852 1192", provider: "Exotel", reputation: "good", dialledToday: 0, active: true },
    { id: "n4", number: "+91 40 7128 3304", provider: "Exotel", reputation: "watch", dialledToday: 0, active: true },
  ];
  seed.agent = {
    voice: "Aarti",
    langs: ["EN", "HI", "TE"],
    opening: {
      EN: "Hello, this is Aarti calling from {project}. I'm an AI assistant for the sales team and this call is recorded. Is now a good time for two minutes?",
      HI: "Namaste, main Aarti bol rahi hoon, {project} se. Main sales team ki AI assistant hoon aur yeh call record ho rahi hai. Kya abhi do minute baat kar sakte hain?",
      TE: "Namaskaram, nenu Aarti, {project} nunchi matladutunnanu. Nenu sales team ki AI assistant ni, ee call record avutondi. Ippudu rendu nimishalu matladagalara?",
    },
    objections: [
      { id: "o1", when: "The price feels high", answer: "Give the per-sq-ft rate from the price sheet, then offer the payment plan with 10% on booking." },
      { id: "o2", when: "They worry possession will be late", answer: "Quote the RERA completion date and the delay-interest clause from the Agreement for Sale." },
      { id: "o3", when: "They say 'just send me the details'", answer: "Agree, send the brochure and price sheet on WhatsApp, and ask for one good time to call back." },
      { id: "o4", when: "They ask if the builder is reliable", answer: "Mention the RERA registration and the escrow account. Offer a site visit to see construction progress." },
    ],
    handoverOnAsk: true,
    handoverScore: 70,
    handoverTo: "assigned",
    followUps: [
      { day: 0, on: true, what: "Brochure, floor plan and price sheet on WhatsApp" },
      { day: 2, on: true, what: "Reminder with two site-visit slots" },
      { day: 7, on: true, what: "Construction progress photos" },
      { day: 14, on: false, what: "Ask if they want to stay on the list" },
    ],
  };
  seed.rules = {
    callFrom: "09:00",
    callTo: "21:00",
    retries: 3,
    retryGapHours: 16,
    dndScrubAt: "06:00",
    retentionDays: 180,
    disclosure: {
      EN: "I'm an AI assistant for the sales team and this call is recorded.",
      HI: "Main sales team ki AI assistant hoon aur yeh call record ho rahi hai.",
      TE: "Nenu sales team ki AI assistant ni, ee call record avutondi.",
    },
    dltTemplates: "",
    humanCostPerDial: 60,
  };
  return seed;
}

export const SEED: Seed = build();
