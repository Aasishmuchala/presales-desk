"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import { useStore } from "@/lib/store";
import { getProject, getRep, useLeadMap, useSalesReps } from "@/lib/selectors";
import { DAY, dayOffset, dayWord, firstName, hhmm, sentence, when } from "@/lib/format";
import { DEMO_REP_ID } from "@/lib/mock/seed";
import type { Lead, Task } from "@/lib/types";
import { Score } from "../ui/pill";
import { ArrowLeft, CalendarBlank, Check, ListChecks, Lightning, Phone, WhatsappLogo } from "../icons";

type Tab = "next" | "hot" | "tasks";

const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;
const waHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

export function MyDay() {
  const [repId, setRepId] = useState(DEMO_REP_ID);
  const [tab, setTab] = useState<Tab>("next");
  const now = useStore((s) => s.nowMin);
  const bookings = useStore((s) => s.bookings);
  const tasks = useStore((s) => s.tasks);
  const leads = useStore((s) => s.leads);
  const salesReps = useSalesReps();
  const leadMap = useLeadMap();
  const rep = getRep(repId);

  const myBookings = bookings
    .filter((b) => b.repId === repId && !b.done && b.at >= now - 30 && b.at < now + 3 * DAY)
    .sort((a, b) => a.at - b.at);
  const next = myBookings[0];
  const nextLead = next ? leadMap.get(next.leadId) : undefined;
  const hot = leads.filter((l) => l.repId === repId && l.stage === "hot").sort((a, b) => b.score - a.score);
  const myTasks = tasks.filter((t) => t.repId === repId).sort((a, b) => Number(a.done) - Number(b.done) || a.due - b.due);
  const openTasks = myTasks.filter((t) => !t.done).length;
  const hour = Math.floor(now / 60) % 24;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <header className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
        <Link href="/today" className="inline-flex items-center gap-1 text-[13px] text-fg-3 hover:text-fg">
          <ArrowLeft size={14} /> Manager view
        </Link>
        <label className="flex items-center gap-2 text-[12px] text-fg-3">
          Viewing as
          <select
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            className="h-8 rounded-full border border-line bg-surface-2 px-2.5 text-[13px] text-fg focus:border-accent focus:outline-none"
          >
            {salesReps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        <h1 className={tab === "next" ? "text-[15px] font-normal text-fg-2" : "sr-only"}>
          {greeting}, {rep ? firstName(rep.name) : ""}.
        </h1>

        {tab === "next" && (
          <section aria-label="Next" className="mt-4 grid gap-6">
            {next && nextLead ? (
              <div className="rounded-[14px] border border-accent/60 bg-surface p-5">
                <p className="text-[13px] text-fg-3">
                  {next.kind === "visit" ? "Site visit" : next.kind === "video" ? "Video call" : "Call back"} · {dayWord(dayOffset(next.at))}
                  {next.at < now && <span className="font-medium text-warn"> · {Math.max(1, Math.round(now - next.at))} min overdue</span>}
                </p>
                <p className="tnum display mt-2 text-[76px] leading-[0.9] text-fg">{hhmm(next.at)}</p>
                <Link href={`/leads/${nextLead.id}`} className="mt-4 block text-[19px] font-medium text-fg hover:underline">
                  {nextLead.name}
                </Link>
                <p className="mt-1 text-sm text-fg-2">{nextLead.summary}</p>
                <p className="mt-1 text-[13px] text-fg-3">{getProject(nextLead.projectId).name}</p>
                <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                  <a href={telHref(nextLead.phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-fill text-[15px] font-semibold text-accent-ink">
                    <Phone size={18} weight="fill" /> Call {firstName(nextLead.name)}
                  </a>
                  <a
                    href={waHref(nextLead.phone)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp ${nextLead.name}`}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line-strong text-fg"
                  >
                    <WhatsappLogo size={20} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-[14px] border border-dashed border-line-strong p-6">
                <p className="display text-[28px] text-fg">No visits coming up</p>
                <p className="mt-2 text-sm text-fg-2">New bookings from the agent show up here with a brief.</p>
              </div>
            )}
            {myBookings.length > 1 && (
              <div>
                <h2 className="mb-2 text-[13px] font-medium text-fg-3">After that</h2>
                <ul className="divide-y divide-line rounded-[12px] border border-line bg-surface">
                  {myBookings.slice(1, 8).map((b) => {
                    const l = leadMap.get(b.leadId);
                    if (!l) return null;
                    return (
                      <li key={b.id}>
                        <Link href={`/leads/${l.id}`} className="flex items-center gap-3 px-4 py-3">
                          <span className="tnum w-24 shrink-0 font-mono text-[13px] text-fg-2">{when(b.at).replace("Today ", "")}</span>
                          <span className="min-w-0 flex-1 truncate text-sm text-fg">{l.name}</span>
                          <span className="text-[12px] text-fg-3">{b.kind === "visit" ? "Visit" : b.kind === "video" ? "Video" : "Call"}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        )}

        {tab === "hot" && (
          <section aria-label="Hot leads" className="mt-4">
            <h2 className="display text-[30px] text-fg">Hot today</h2>
            <p className="mt-1 text-[13px] text-fg-3">Leads the agent qualified and handed to you. Each has a one-line brief.</p>
            {hot.length === 0 ? (
              <p className="mt-5 rounded-[12px] border border-dashed border-line-strong p-5 text-sm text-fg-2">Nothing hot right now.</p>
            ) : (
              <ul className="mt-5 grid gap-3">
                {hot.map((l) => (
                  <HotCard key={l.id} lead={l} />
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "tasks" && (
          <section aria-label="Tasks" className="mt-4">
            <h2 className="display text-[30px] text-fg">Tasks</h2>
            <p className="mt-1 text-[13px] text-fg-3">Swipe right or tap the circle to mark done.</p>
            {myTasks.length === 0 ? (
              <p className="mt-5 rounded-[12px] border border-dashed border-line-strong p-5 text-sm text-fg-2">No tasks. The agent adds them when a lead asks for something it can&apos;t do.</p>
            ) : (
              <ul className="mt-5 grid gap-2">
                {myTasks.map((t) => (
                  <TaskRow key={t.id} task={t} lead={leadMap.get(t.leadId)} now={now} />
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      <nav aria-label="My day" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur">
        <ul className="mx-auto grid max-w-[480px] grid-cols-3">
          {(
            [
              { id: "next", label: "Next", icon: CalendarBlank, count: myBookings.length },
              { id: "hot", label: "Hot", icon: Lightning, count: hot.length },
              { id: "tasks", label: "Tasks", icon: ListChecks, count: openTasks },
            ] as const
          ).map(({ id, label, icon: Icon, count }) => (
            <li key={id}>
              <button
                type="button"
                aria-current={tab === id ? "page" : undefined}
                onClick={() => setTab(id)}
                className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[12px] ${tab === id ? "text-fg" : "text-fg-3"}`}
              >
                <span className="relative">
                  <Icon size={22} weight={tab === id ? "fill" : "regular"} className={tab === id ? "text-accent" : ""} />
                  {count > 0 && (
                    <span className="tnum absolute -right-3 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent-fill px-1 font-mono text-[10px] text-accent-ink">{count}</span>
                  )}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function HotCard({ lead }: { lead: Lead }) {
  return (
    <li className="rounded-[12px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/leads/${lead.id}`} className="text-[16px] font-medium text-fg hover:underline">
          {lead.name}
        </Link>
        <Score value={lead.score} />
      </div>
      <p className="mt-1.5 text-sm text-fg-2">{lead.summary}</p>
      <p className="mt-1 text-[13px] text-fg-3">Next: {lead.nextStep}</p>
      <div className="mt-3 flex gap-2">
        <a href={telHref(lead.phone)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-accent-fill text-sm font-semibold text-accent-ink">
          <Phone size={16} weight="fill" /> Call
        </a>
        <a
          href={waHref(lead.phone)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong text-sm text-fg"
        >
          <WhatsappLogo size={16} /> WhatsApp
        </a>
      </div>
    </li>
  );
}

function TaskRow({ task, lead, now }: { task: Task; lead?: Lead; now: number }) {
  const toggle = useStore((s) => s.toggleTask);
  const toast = useStore((s) => s.toast);
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const overdue = !task.done && task.due < now;

  const complete = () => {
    toggle(task.id);
    if (!task.done) toast("Done. It's on the lead's timeline.", "good");
  };

  const onDown = (e: PointerEvent<HTMLLIElement>) => {
    if (e.pointerType === "mouse") return;
    start.current = e.clientX;
  };
  const onMove = (e: PointerEvent<HTMLLIElement>) => {
    if (start.current === null) return;
    setDx(Math.max(0, Math.min(120, e.clientX - start.current)));
  };
  const onUp = () => {
    if (start.current !== null && dx > 80 && !task.done) complete();
    start.current = null;
    setDx(0);
  };

  return (
    <li
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="relative touch-pan-y overflow-hidden rounded-[12px] border border-line bg-good-soft"
    >
      <span className="absolute inset-y-0 left-4 flex items-center text-good" aria-hidden="true">
        <Check size={20} weight="bold" />
      </span>
      <div className="relative flex items-start gap-3 bg-surface p-4 transition-transform duration-150" style={{ transform: `translateX(${dx}px)` }}>
        <button
          type="button"
          onClick={complete}
          aria-pressed={task.done}
          aria-label={task.done ? `Mark “${task.title}” not done` : `Mark “${task.title}” done`}
          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${task.done ? "border-transparent bg-good text-bg" : "border-line-strong"}`}
        >
          {task.done && <Check size={13} weight="bold" />}
        </button>
        <div className="min-w-0">
          <p className={`text-sm ${task.done ? "text-fg-3 line-through" : "text-fg"}`}>{task.title}</p>
          <p className={`mt-0.5 text-[12px] ${overdue ? "text-warn" : "text-fg-3"}`}>
            {lead?.name} · {overdue ? `overdue since ${hhmm(task.due)}` : `due ${sentence(when(task.due))}`}
          </p>
        </div>
      </div>
    </li>
  );
}
