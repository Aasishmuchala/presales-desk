"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { getRep, hasStarted, isLive } from "@/lib/selectors";
import { durationWords, OUTCOME_LABEL, when } from "@/lib/format";
import type { Booking, Call, Message, Task } from "@/lib/types";
import { CalendarBlank, Check, Phone, WhatsappLogo } from "../icons";

export type TimelineItem =
  | { kind: "call"; at: number; call: Call }
  | { kind: "message"; at: number; message: Message }
  | { kind: "task"; at: number; task: Task }
  | { kind: "booking"; at: number; booking: Booking };

export function useTimeline(leadId: string) {
  const calls = useStore((s) => s.calls);
  const messages = useStore((s) => s.messages);
  const tasks = useStore((s) => s.tasks);
  const bookings = useStore((s) => s.bookings);
  const pauses = useStore((s) => s.pauses);
  const now = useStore((s) => Math.ceil(s.nowMin * 4) / 4);
  return useMemo(() => {
    const items: TimelineItem[] = [];
    for (const c of calls) if (c.leadId === leadId && hasStarted(c, now, pauses)) items.push({ kind: "call", at: c.start, call: c });
    for (const m of messages) if (m.leadId === leadId && m.at <= now) items.push({ kind: "message", at: m.at, message: m });
    for (const t of tasks) if (t.leadId === leadId) items.push({ kind: "task", at: t.due, task: t });
    for (const b of bookings) if (b.leadId === leadId) items.push({ kind: "booking", at: b.at, booking: b });
    return items.sort((a, b) => b.at - a.at);
  }, [calls, messages, tasks, bookings, leadId, now, pauses]);
}

export function Timeline({ leadId, leadName, limit }: { leadId: string; leadName: string; limit?: number }) {
  const items = useTimeline(leadId);
  const now = useStore((s) => s.nowMin);
  const toggleTask = useStore((s) => s.toggleTask);
  const shown = limit ? items.slice(0, limit) : items;

  if (items.length === 0) {
    return <p className="rounded-[var(--radius)] border border-dashed border-line-strong px-4 py-6 text-sm text-fg-2">Nothing yet. The agent calls new leads within two minutes.</p>;
  }

  return (
    <ol className="relative grid gap-0">
      {shown.map((it, i) => (
        <li key={`${it.kind}-${i}`} className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
          {i < shown.length - 1 && <span className="absolute bottom-0 left-[13px] top-7 w-px bg-line" aria-hidden="true" />}
          <span className="z-[1] grid h-7 w-7 place-items-center rounded-full border border-line bg-surface text-fg-3">
            {it.kind === "call" ? (
              <Phone size={14} />
            ) : it.kind === "message" ? (
              <WhatsappLogo size={14} />
            ) : it.kind === "task" ? (
              <Check size={14} />
            ) : (
              <CalendarBlank size={14} />
            )}
          </span>
          <div className="min-w-0 pt-0.5">
            {it.kind === "call" && (
              <CallItem call={it.call} live={isLive(it.call, now)} leadId={leadId} />
            )}
            {it.kind === "message" && (
              <div>
                <p className="text-sm text-fg">
                  {it.message.direction === "out" ? "WhatsApp sent" : `${leadName.split(" ")[0]} replied on WhatsApp`}
                </p>
                <p className={`mt-1 inline-block max-w-full rounded-[10px] px-3 py-2 text-[13px] ${it.message.direction === "out" ? "bg-surface-2 text-fg-2" : "bg-accent-soft text-fg"}`}>
                  {it.message.text}
                </p>
                <p className="mt-1 text-[12px] text-fg-3">{when(it.at)}</p>
              </div>
            )}
            {it.kind === "task" && (
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={it.task.done}
                  onChange={() => toggleTask(it.task.id)}
                  className="mt-0.5 h-4 w-4 accent-[var(--accent-fill)]"
                />
                <span className="min-w-0">
                  <span className={`block text-sm ${it.task.done ? "text-fg-3 line-through" : "text-fg"}`}>{it.task.title}</span>
                  <span className="block text-[12px] text-fg-3">
                    Task for {getRep(it.task.repId)?.name} · due {when(it.task.due)}
                  </span>
                </span>
              </label>
            )}
            {it.kind === "booking" && (
              <div>
                <p className="text-sm font-medium text-fg">
                  {it.booking.kind === "visit" ? "Site visit" : it.booking.kind === "video" ? "Video call" : "Call-back"} · {when(it.at)}
                </p>
                <p className="text-[12px] text-fg-3">
                  With {getRep(it.booking.repId)?.name}
                  {it.booking.done ? " · done" : it.at > now ? " · reminder goes out on WhatsApp a day before" : ""}
                </p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function CallItem({ call, live, leadId }: { call: Call; live: boolean; leadId: string }) {
  const openDesk = useStore((s) => s.openDesk);
  const label =
    call.result === "connected"
      ? live
        ? "On a call with the agent now"
        : `Call · ${durationWords(call.durationSec)}${call.outcome ? ` · ${OUTCOME_LABEL[call.outcome]}` : ""}`
      : call.result === "no_answer"
        ? "Call · no answer"
        : call.result === "busy"
          ? "Call · busy"
          : "Call · voicemail";
  return (
    <div>
      <p className="text-sm text-fg">
        {call.result === "connected" && !live ? (
          <Link href={`/leads/${leadId}/calls/${call.id}`} className="hover:underline">
            {label}
          </Link>
        ) : (
          label
        )}
      </p>
      <p className="mt-0.5 flex items-center gap-3 text-[12px] text-fg-3">
        {when(call.start)}
        {live && (
          <button type="button" onClick={() => openDesk(call.id)} className="font-medium text-accent hover:underline">
            Listen
          </button>
        )}
        {call.result === "connected" && !live && (
          <Link href={`/leads/${leadId}/calls/${call.id}`} className="font-medium text-accent hover:underline">
            Hear it
          </Link>
        )}
      </p>
    </div>
  );
}
