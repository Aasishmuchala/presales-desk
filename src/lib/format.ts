import type { Lang, Outcome, Stage } from "./types";

// The demo runs on a fixed day: Saturday 10 October 2026, IST.
// All times in the data are minutes relative to that day's midnight.
const DAY_NAMES = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthDays = (y: number, m: number) =>
  [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];

/** Calendar date for a day offset from Sat 10 Oct 2026. */
export function calendar(offset: number) {
  let y = 2026;
  let m = 9;
  let d = 10 + offset;
  while (d > monthDays(y, m)) {
    d -= monthDays(y, m);
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  while (d < 1) {
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    d += monthDays(y, m);
  }
  return { y, m, d, wd: DAY_NAMES[((offset % 7) + 7) % 7] };
}

export const DEMO_START_MIN = 16 * 60 + 20;
export const DAY = 1440;

export function dayOffset(t: number) {
  return Math.floor(t / DAY);
}

export function minuteOfDay(t: number) {
  return ((t % DAY) + DAY) % DAY;
}

export function hhmm(t: number) {
  const m = Math.floor(minuteOfDay(t));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function dateLabel(offset: number) {
  const c = calendar(offset);
  return `${c.wd} ${c.d} ${MONTH_NAMES[c.m]}${c.y !== 2026 ? ` ${c.y}` : ""}`;
}

export function longDate(offset: number) {
  const c = calendar(offset);
  return `${c.d} ${MONTH_NAMES[c.m]} ${c.y}`;
}

export function dayWord(offset: number) {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  return dateLabel(offset);
}

/** "Today 14:05", "Yesterday 18:20", "Mon 12 Oct 11:30" */
export function when(t: number) {
  return `${dayWord(dayOffset(t))} ${hhmm(t)}`;
}

/** Fixed date for messages a buyer reads later: "Sun 11 Oct, 11:30". */
export function absolute(t: number) {
  return `${dateLabel(dayOffset(t))}, ${hhmm(t)}`;
}

/** Lower-cases a leading day word so it reads inside a sentence. */
export function sentence(s: string) {
  return s.replace(/^(Today|Tomorrow|Yesterday)/, (m) => m.toLowerCase());
}

/** Short relative label for tables: "14:05", "Yesterday", "3 days ago", "Tomorrow 11:30" */
export function ago(t: number, now: number) {
  const d = dayOffset(t);
  if (d === 0) {
    const diff = now - t;
    if (diff >= 0 && diff < 1) return "Just now";
    if (diff >= 1 && diff < 60) return `${Math.floor(diff)} min ago`;
    return hhmm(t);
  }
  if (d === -1) return "Yesterday";
  if (d < -1) return `${-d} days ago`;
  return when(t);
}

export function duration(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function durationWords(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function inr(lakh: number) {
  if (lakh >= 100) {
    const cr = lakh / 100;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/0$/, "")} Cr`;
  }
  return `₹${Math.round(lakh)} L`;
}

export function rupees(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function num(n: number) {
  return n.toLocaleString("en-IN");
}

export const LANG_NAME: Record<Lang, string> = { EN: "English", HI: "Hindi", TE: "Telugu" };

export const STAGE_LABEL: Record<Stage, string> = {
  new: "New",
  talking: "Talking",
  hot: "Hot",
  booked: "Visit booked",
  callback: "Call back",
  notnow: "Not now",
  optedout: "Opted out",
  unreachable: "Unreachable",
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  booked: "Site visit booked",
  qualified: "Qualified",
  transferred: "Handed to a person",
  callback: "Call back requested",
  info_sent: "Details sent",
  not_now: "Not now",
  opted_out: "Opted out",
};

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function firstName(name: string) {
  return name.split(" ")[0];
}
