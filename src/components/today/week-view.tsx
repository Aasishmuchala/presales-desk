"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { dayStats, useTodayCalls } from "@/lib/selectors";
import { dateLabel, num, rupees } from "@/lib/format";
import { hashString, int, mulberry32 } from "@/lib/rand";
import { Section } from "../ui/misc";

// Per-minute and per-call rates from the product plan, used for the estimate.
const RATE = { telephony: 0.75, stt: 0.45, tts: 1.5, llmPerCall: 2 };

export function WeekView() {
  const calls = useTodayCalls();
  const now = useStore((s) => s.nowMin);
  const projectId = useStore((s) => s.projectId);
  const questions = useStore((s) => s.questions);
  const humanCost = useStore((s) => s.rules.humanCostPerDial);
  const today = dayStats(calls, now);

  const days = useMemo(() => {
    const r = mulberry32(hashString(`week-${projectId}`));
    const scale = projectId === "vanam" ? 1 : 0.47;
    return Array.from({ length: 6 }, (_, i) => {
      const dialled = Math.round(int(r, 540, 690) * scale);
      const connected = Math.round(dialled * (0.42 + r() * 0.08));
      const qualified = Math.round(connected * (0.2 + r() * 0.07));
      const booked = Math.round(connected * (0.055 + r() * 0.03));
      const minutes = connected * (3 + r() * 0.6);
      return { offset: i - 6, dialled, connected, qualified, booked, minutes, partial: false };
    });
  }, [projectId]);

  const todayMinutes = calls.filter((c) => c.result === "connected").reduce((s, c) => s + Math.min(c.durationSec, (now - c.start) * 60) / 60, 0);
  const all = [...days, { offset: 0, ...today, minutes: todayMinutes, partial: true }];
  const maxConnected = Math.max(...all.map((d) => d.connected), 1);

  const totals = all.reduce(
    (s, d) => ({
      dialled: s.dialled + d.dialled,
      connected: s.connected + d.connected,
      booked: s.booked + d.booked,
      minutes: s.minutes + d.minutes,
    }),
    { dialled: 0, connected: 0, booked: 0, minutes: 0 },
  );
  const agentCost =
    totals.minutes * (RATE.telephony + RATE.stt + RATE.tts) + totals.connected * RATE.llmPerCall + (totals.dialled - totals.connected) * 0.3;
  const humanTotal = totals.dialled * humanCost;
  const perVisitAgent = totals.booked ? agentCost / totals.booked : 0;
  const perVisitHuman = totals.booked ? humanTotal / totals.booked : 0;

  const hours = useMemo(() => {
    const r = mulberry32(hashString(`hours-${projectId}`));
    return Array.from({ length: 12 }, (_, i) => {
      const h = 9 + i;
      const todays = calls.filter((c) => Math.floor(c.start / 60) === h);
      const rateToday = todays.length ? todays.filter((c) => c.result === "connected").length / todays.length : null;
      const base = 0.34 + (h >= 18 && h <= 20 ? 0.14 : 0) + (h === 13 ? -0.08 : 0) + r() * 0.06;
      return { h, rate: rateToday === null ? base : (base * 6 + rateToday) / 7 };
    });
  }, [calls, projectId]);

  const langs = useMemo(() => {
    const connected = calls.filter((c) => c.result === "connected");
    const count = { EN: 0, HI: 0, TE: 0 };
    connected.forEach((c) => (count[c.lang] += 1));
    const total = connected.length || 1;
    return (["EN", "TE", "HI"] as const).map((k) => ({ k, label: k === "EN" ? "English" : k === "TE" ? "Telugu" : "Hindi", share: count[k] / total }));
  }, [calls]);

  const topQs = questions
    .filter((q) => q.projectId === projectId)
    .sort((a, b) => b.asked - a.asked)
    .slice(0, 6);

  return (
    <div className="grid gap-12">
      <Section title="Conversations each day" aside="Bars are calls that connected. The number above is visits booked.">
        <div className="rounded-[var(--radius)] border border-line bg-surface p-5 pt-8">
          <div className="grid h-[220px] grid-cols-7 items-end gap-3 sm:gap-6">
            {all.map((d) => (
              <div key={d.offset} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                <span className={`tnum display text-[20px] ${d.partial ? "text-accent" : "text-fg"}`}>{d.booked}</span>
                <div
                  className={`w-full max-w-[56px] rounded-t-[3px] ${d.partial ? "bg-accent-fill" : "bg-fg-3/60"}`}
                  style={{ height: `${(d.connected / maxConnected) * 150}px` }}
                  title={`${num(d.connected)} conversations`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-3 border-t border-line pt-2 sm:gap-6">
            {all.map((d) => (
              <div key={d.offset} className="min-w-0 text-center">
                <span className="block truncate text-[12px] text-fg-2">{d.partial ? "Today" : dateLabel(d.offset).slice(0, 3)}</span>
                <span className="tnum block font-mono text-[11px] text-fg-3">{num(d.connected)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-fg-3">Today is still running, so its bar is partial.</p>
        </div>
      </Section>

      <div className="grid gap-12 lg:grid-cols-2">
        <Section title="Pick-up rate by hour" aside="This week">
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {hours.map((h) => (
              <div key={h.h} className="min-w-0">
                <div
                  className="h-14 rounded-[3px] bg-accent-fill"
                  style={{ opacity: Math.max(0.12, Math.min(1, (h.rate - 0.2) / 0.35)) }}
                  title={`${h.h}:00 · ${Math.round(h.rate * 100)}% picked up`}
                />
                <span className="tnum mt-1 block text-center font-mono text-[11px] text-fg-3">{h.h}</span>
                <span className="tnum block text-center font-mono text-[11px] text-fg-2">{Math.round(h.rate * 100)}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-fg-3">Evenings pick up most. Retries move to a different hour on purpose.</p>
        </Section>

        <Section title="Languages spoken today">
          <ul className="grid gap-3">
            {langs.map((l) => (
              <li key={l.k} className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-3 text-sm">
                <span className="text-fg-2">{l.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <span className="block h-full rounded-full bg-fg-2" style={{ width: `${l.share * 100}%` }} />
                </span>
                <span className="tnum text-right font-mono text-fg">{Math.round(l.share * 100)}%</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <Section title="Cost per site visit" aside="Estimate for this week">
          <div className="grid grid-cols-2 gap-6 rounded-[var(--radius)] border border-line bg-surface p-5">
            <div>
              <p className="text-[13px] text-fg-3">With the agent</p>
              <p className="tnum display mt-2 text-[40px] text-accent">{rupees(perVisitAgent)}</p>
            </div>
            <div>
              <p className="text-[13px] text-fg-3">All by people</p>
              <p className="tnum display mt-2 text-[40px] text-fg">{rupees(perVisitHuman)}</p>
            </div>
            <p className="col-span-2 text-[13px] text-fg-3">
              Agent cost uses per-minute telephony, speech and model rates from the plan. The people cost uses {rupees(humanCost)} per dial from{" "}
              <Link href="/setup/rules" className="text-fg-2 underline-offset-2 hover:underline">
                Rules
              </Link>
              . Change it to your own figure.
            </p>
          </div>
        </Section>

        <Section title="What leads ask most" aside={<Link href="/knowledge/questions" className="hover:text-fg">Answer them</Link>}>
          <ol className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
            {topQs.map((q) => (
              <li key={q.id} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                <span className="tnum w-6 shrink-0 font-mono text-[13px] text-fg-3">{q.asked}×</span>
                <span className="min-w-0 flex-1 text-fg-2">{q.text}</span>
                <span className={`shrink-0 text-[12px] ${q.answer ? "text-good" : "text-warn"}`}>{q.answer ? "Answered" : "No answer yet"}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}
