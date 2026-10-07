"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { callEnd, useLeadMap, useTodayCalls } from "@/lib/selectors";
import { hhmm, LANG_NAME } from "@/lib/format";
import { Pill } from "../ui/pill";
import { ArrowRight } from "../icons";

const KIND_LABEL = { accuracy: "Facts", compliance: "Compliance", tone: "Tone" } as const;

export function ReviewQueue() {
  const calls = useTodayCalls();
  const now = useStore((s) => s.nowMin);
  const reviewed = useStore((s) => s.reviewed);
  const leadMap = useLeadMap();
  const flagged = calls.filter((c) => c.qa && callEnd(c) <= now);
  const open = flagged
    .filter((c) => !reviewed[c.id])
    .sort((a, b) => worst(a) - worst(b) || b.start - a.start);
  const done = flagged.filter((c) => reviewed[c.id]);

  return (
    <div className="grid max-w-[960px] gap-10">
      <section>
        <p className="mb-4 max-w-[64ch] text-sm text-fg-2">
          Automatic checks score every call for facts, compliance and tone. Calls that score low land here. Most serious first.
        </p>
        {open.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-dashed border-line-strong px-5 py-8">
            <p className="display text-[26px] text-fg">All reviewed</p>
            <p className="mt-2 text-sm text-fg-2">New flags appear as calls finish.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
            {open.map((c) => {
              const lead = leadMap.get(c.leadId);
              const flag = c.qa!.flags[0];
              const score = Math.min(c.qa!.accuracy, c.qa!.compliance, c.qa!.tone);
              return (
                <li key={c.id}>
                  <Link href={`/review/${c.id}`} className="group flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-surface-2 sm:flex-row sm:items-center sm:gap-5">
                    <Pill tone={score <= 2 ? "crit" : "warn"}>
                      {KIND_LABEL[flag.kind]} <span className="tnum font-mono">{score}/5</span>
                    </Pill>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{flag.note}</p>
                      <p className="mt-0.5 text-[13px] text-fg-3">
                        {lead?.name} · {hhmm(c.start)} · {LANG_NAME[c.lang]}
                      </p>
                    </div>
                    <span className="hidden items-center gap-1 text-[13px] text-fg-3 group-hover:text-accent sm:flex">
                      Review <ArrowRight size={14} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-fg">
            Reviewed today <span className="tnum ml-1 font-mono text-[13px] font-normal text-fg-3">{done.length}</span>
          </h2>
          <ul className="divide-y divide-line rounded-[var(--radius)] border border-line">
            {done.map((c) => (
              <li key={c.id}>
                <Link href={`/review/${c.id}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-fg-2 hover:bg-surface-2">
                  <span className="min-w-0 truncate">{c.qa!.flags[0].note}</span>
                  <span className="shrink-0 text-[13px] text-fg-3">{leadMap.get(c.leadId)?.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function worst(c: { qa?: { accuracy: number; compliance: number; tone: number } }) {
  return c.qa ? Math.min(c.qa.accuracy, c.qa.compliance, c.qa.tone) : 9;
}
