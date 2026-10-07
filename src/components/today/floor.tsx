"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { callEnd, isLive } from "@/lib/selectors";
import { durationWords, hhmm, OUTCOME_LABEL } from "@/lib/format";
import type { Call, Lead } from "@/lib/types";
import { Ear } from "../icons";

const FROM = 9 * 60;
const TO = 21 * 60;
const SPAN = TO - FROM;
const LANES = 9;
const LANE_H = 9;

const pct = (t: number) => ((t - FROM) / SPAN) * 100;

function assignLanes(calls: Call[]) {
  const ends = new Array<number>(LANES).fill(-Infinity);
  const out = new Map<string, number>();
  for (const c of calls) {
    const end = Math.max(callEnd(c), c.start + 1.6);
    let lane = ends.findIndex((e) => e <= c.start - 0.6);
    if (lane === -1) lane = ends.indexOf(Math.min(...ends));
    ends[lane] = end;
    out.set(c.id, lane);
  }
  return out;
}

export function Floor({
  calls,
  now,
  leadMap,
  onListen,
  preview = false,
}: {
  calls: Call[];
  now: number;
  leadMap: Map<string, Lead>;
  onListen?: (callId: string) => void;
  preview?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  const sorted = useMemo(() => [...calls].sort((a, b) => a.start - b.start), [calls]);
  const lanes = useMemo(() => assignLanes(sorted), [sorted]);

  const nearest = useMemo(() => {
    if (scrub === null) return null;
    let best: Call | null = null;
    let bestD = Infinity;
    for (const c of sorted) {
      const mid = c.start + Math.min(c.durationSec / 120, 2);
      const d = Math.abs(mid - scrub) + (c.result === "connected" ? 0 : 2.5);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best && bestD < 8 ? best : null;
  }, [scrub, sorted]);

  const minuteAt = (clientX: number) => {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - r.left, 0), r.width);
    return FROM + (x / r.width) * SPAN;
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (pinned && e.buttons === 0) return;
    const m = minuteAt(e.clientX);
    if (m !== null) setScrub(Math.min(m, Math.max(now, FROM)));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 30 : 5;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const base = scrub ?? Math.min(now, TO);
      const next = Math.min(Math.max(base + (e.key === "ArrowRight" ? step : -step), FROM), Math.min(now, TO));
      setScrub(next);
      setPinned(true);
    } else if (e.key === "Escape") {
      setScrub(null);
      setPinned(false);
    }
  };

  const nowPct = pct(Math.min(Math.max(now, FROM), TO));
  const height = LANES * LANE_H + 28;
  const lead = nearest ? leadMap.get(nearest.leadId) : undefined;
  const nearestLive = nearest ? isLive(nearest, now) : false;

  return (
    <div>
      <div
        ref={ref}
        role={preview ? "img" : "slider"}
        aria-label={preview ? "Calls across today's calling window" : "Today's calls from 09:00 to 21:00. Use the arrow keys to move through the day."}
        aria-valuemin={preview ? undefined : FROM}
        aria-valuemax={preview ? undefined : TO}
        aria-valuenow={preview ? undefined : Math.round(scrub ?? now)}
        aria-valuetext={preview ? undefined : hhmm(scrub ?? now)}
        tabIndex={preview ? -1 : 0}
        onPointerMove={preview ? undefined : onMove}
        onPointerDown={
          preview
            ? undefined
            : (e) => {
                const m = minuteAt(e.clientX);
                if (m !== null) setScrub(Math.min(m, Math.max(now, FROM)));
                setPinned(true);
              }
        }
        onPointerLeave={preview ? undefined : () => !pinned && setScrub(null)}
        onKeyDown={preview ? undefined : onKey}
        style={{ height }}
        className={`relative w-full touch-none select-none rounded-[var(--radius)] border border-line bg-surface ${preview ? "" : "cursor-crosshair"}`}
      >
        {/* Hour grid */}
        {Array.from({ length: 13 }, (_, i) => FROM + i * 60).map((t, i) => (
          <div key={t} className="absolute inset-y-0" style={{ left: `${pct(t)}%` }}>
            <div className={`absolute inset-y-0 w-px ${i % 3 === 0 ? "bg-line-strong/60" : "bg-line/60"}`} />
            {i % 3 === 0 && (
              <span
                className={`tnum absolute top-1.5 font-mono text-[10px] text-fg-3 ${i === 12 ? "-translate-x-full pr-1.5" : "pl-1.5"}`}
              >
                {hhmm(t)}
              </span>
            )}
          </div>
        ))}

        {/* Calls */}
        <div className="absolute inset-x-0 bottom-2" style={{ height: LANES * LANE_H }}>
          {sorted.map((c) => {
            const lane = lanes.get(c.id) ?? 0;
            const live = isLive(c, now);
            const end = Math.min(callEnd(c), now);
            const width = Math.max(pct(Math.max(end, c.start + 1.4)) - pct(c.start), 0.18);
            const tone = live
              ? "bg-accent-fill"
              : c.result !== "connected"
                ? "bg-line-strong/70"
                : c.outcome === "booked"
                  ? "bg-good"
                  : "bg-fg-3/70";
            const isNear = nearest?.id === c.id;
            return (
              <span
                key={c.id}
                className={`absolute rounded-[2px] ${tone} ${isNear ? "outline outline-2 outline-offset-1 outline-fg" : ""}`}
                style={{
                  left: `${pct(c.start)}%`,
                  width: `${width}%`,
                  bottom: lane * LANE_H,
                  height: c.result === "connected" ? 6 : 4,
                }}
              />
            );
          })}
        </div>

        {/* Now line */}
        {now >= FROM && now <= TO && (
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${nowPct}%` }}>
            <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-accent-fill" />
            <span className="tnum absolute -top-5 -translate-x-1/2 font-mono text-[11px] font-medium text-accent">{hhmm(now)}</span>
          </div>
        )}
        {/* After the window, everything to the right is dimmed */}
        {now < TO && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 bg-bg/45"
            style={{ left: `${Math.max(nowPct, 0)}%` }}
            aria-hidden="true"
          />
        )}

        {/* Scrub line */}
        {scrub !== null && !preview && (
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pct(scrub)}%` }}>
            <div className="absolute inset-y-0 w-px -translate-x-1/2 bg-fg" />
          </div>
        )}
      </div>

      {!preview && (
        <div className="mt-3 flex min-h-[44px] flex-wrap items-center justify-between gap-x-6 gap-y-2">
          {nearest && lead ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="tnum font-mono text-fg-3">{hhmm(nearest.start)}</span>
              <Link href={`/leads/${lead.id}`} className="font-medium text-fg hover:underline">
                {lead.name}
              </Link>
              <span className="text-fg-2">
                {nearestLive
                  ? "On the call now"
                  : nearest.result === "connected"
                    ? `${durationWords(nearest.durationSec)} · ${nearest.outcome ? OUTCOME_LABEL[nearest.outcome] : "Talked"}`
                    : nearest.result === "no_answer"
                      ? "No answer"
                      : nearest.result === "busy"
                        ? "Busy"
                        : "Voicemail"}
              </span>
              {nearestLive && onListen ? (
                <button
                  type="button"
                  onClick={() => onListen(nearest.id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-accent px-3 text-[13px] font-medium text-accent hover:bg-accent-soft"
                >
                  <Ear size={15} /> Listen
                </button>
              ) : nearest.result === "connected" ? (
                <Link href={`/leads/${lead.id}/calls/${nearest.id}`} className="text-[13px] font-medium text-accent hover:underline">
                  Hear this call
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-fg-3">Point at the floor or use the arrow keys to hear any call from today.</p>
          )}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-fg-3" aria-label="Legend">
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-sm bg-accent-fill" /> Live
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-sm bg-fg-3/70" /> Talked
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-sm bg-good" /> Visit booked
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-3 rounded-sm bg-line-strong/70" /> No answer
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
