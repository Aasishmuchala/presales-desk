"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { dayStats, isLive, useLeadMap, useNeeds, useTodayCalls } from "@/lib/selectors";
import { duration, LANG_NAME, num } from "@/lib/format";
import { Floor } from "./floor";
import { NeedsList } from "./needs-list";
import { SetupBanner } from "./setup-banner";
import { Ear } from "../icons";
import { Section } from "../ui/misc";
import { Score } from "../ui/pill";

export function FloorView() {
  const calls = useTodayCalls();
  const now = useStore((s) => s.nowMin);
  const leadMap = useLeadMap();
  const openDesk = useStore((s) => s.openDesk);
  const stats = dayStats(calls, now);
  const needs = useNeeds();
  const live = calls.filter((c) => isLive(c, now)).sort((a, b) => a.start - b.start);

  return (
    <div className="grid gap-10">
      <SetupBanner />
      <dl className="grid grid-cols-2 gap-y-6 border-y border-line py-6 sm:grid-cols-4 sm:divide-x sm:divide-line">
        <Stat label="Dialled" value={stats.dialled} />
        <Stat label="Connected" value={stats.connected} sub={stats.dialled ? `${Math.round((stats.connected / stats.dialled) * 100)}% picked up` : undefined} />
        <Stat label="Qualified" value={stats.qualified} sub={stats.connected ? `${Math.round((stats.qualified / stats.connected) * 100)}% of conversations` : undefined} />
        <Stat label="Visits booked" value={stats.booked} accent />
      </dl>

      <section aria-labelledby="floor-title">
        <div className="mb-8 flex items-baseline justify-between gap-3">
          <h2 id="floor-title" className="text-[15px] font-semibold text-fg">
            The floor
          </h2>
          <span className="text-[13px] text-fg-3">Every call today, 09:00 to 21:00</span>
        </div>
        <Floor calls={calls} now={now} leadMap={leadMap} onListen={(id) => openDesk(id)} />
        <HealthLine />
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Section title={`Live now (${live.length})`} aside={live.length ? "Listen to any call" : undefined}>
          {live.length === 0 ? (
            <p className="rounded-[var(--radius)] border border-dashed border-line-strong px-4 py-6 text-sm text-fg-2">
              No calls are running right now.
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
              {live.map((c) => {
                const lead = leadMap.get(c.leadId);
                if (!lead) return null;
                const elapsed = (now - c.start) * 60;
                const frac = elapsed / c.durationSec;
                const stage = frac < 0.15 ? "Greeting" : frac < 0.4 ? "Finding needs" : frac < 0.8 ? "Answering questions" : "Agreeing next step";
                return (
                  <li key={c.id} className="flex items-center gap-4 px-4 py-3">
                    <span className="live-dot h-2 w-2 shrink-0 rounded-full bg-accent-fill" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/leads/${lead.id}`} className="block truncate text-sm font-medium text-fg hover:underline">
                        {lead.name}
                      </Link>
                      <span className="block truncate text-[13px] text-fg-3">
                        {stage} · {LANG_NAME[c.lang]} · {lead.config}
                      </span>
                    </div>
                    <span className="tnum hidden font-mono text-[13px] text-fg-2 sm:inline">{duration(elapsed)}</span>
                    <Score value={Math.round((c.score ?? 50) * Math.min(1, 0.55 + frac * 0.6))} />
                    <button
                      type="button"
                      onClick={() => openDesk(c.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] text-fg transition-colors hover:border-accent hover:text-accent"
                    >
                      <Ear size={15} /> Listen
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
        <Section title="Needs you" aside={<Link href="/today/needs" className="hover:text-fg">See all</Link>}>
          <NeedsList needs={needs.slice(0, 4)} compact />
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: boolean }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlash((f) => f + 1);
    }
  }, [value]);
  return (
    <div className="min-w-0 sm:px-6 sm:first:pl-0">
      <dt className="text-[13px] text-fg-3">{label}</dt>
      <dd key={flash} className={`tnum display mt-2 inline-block rounded px-1 -mx-1 text-[clamp(34px,5vw,52px)] ${flash ? "tick" : ""} ${accent ? "text-accent" : "text-fg"}`}>
        {num(value)}
      </dd>
      {sub && <p className="mt-1 text-[13px] text-fg-3">{sub}</p>}
    </div>
  );
}

function HealthLine() {
  const minute = useStore((s) => Math.floor(s.nowMin));
  const numbers = useStore((s) => s.numbers);
  const scrubAt = useStore((s) => s.rules.dndScrubAt);
  const latency = 610 + ((minute * 37) % 90);
  const stt = (0.91 + ((minute * 13) % 40) / 1000).toFixed(2);
  const watch = numbers.filter((n) => n.active && n.reputation !== "good").length;
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-3 text-[13px] text-fg-3">
      <span>
        Reply time <span className="tnum font-mono text-fg-2">{latency} ms</span>
      </span>
      <span>
        Speech recognition <span className="tnum font-mono text-fg-2">{stt}</span>
      </span>
      <span>
        DND list checked at <span className="tnum font-mono text-fg-2">{scrubAt}</span>
      </span>
      {watch > 0 ? (
        <Link href="/setup/numbers" className="font-medium text-warn hover:underline">
          {watch} phone number to watch
        </Link>
      ) : (
        <span className="text-good">Phone numbers healthy</span>
      )}
    </p>
  );
}
