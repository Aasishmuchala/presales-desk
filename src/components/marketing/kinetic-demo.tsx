"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { getProject } from "@/lib/selectors";
import { buildTranscript } from "@/lib/mock/transcript";
import { SEED } from "@/lib/mock/seed";
import { FileText } from "../icons";

const DEMO_CALL = SEED.calls.find((c) => c.projectId === "vanam" && c.result === "connected" && c.outcome === "booked" && c.lang === "TE" && c.start < 0)
  ?? SEED.calls.find((c) => c.result === "connected" && c.outcome === "booked")!;

/** A real transcript from the sample data, played line by line. */
export function KineticDemo() {
  const opening = useStore((s) => s.agentPublished.opening);
  const turns = useMemo(() => {
    const lead = SEED.leads.find((l) => l.id === DEMO_CALL.leadId)!;
    return buildTranscript(DEMO_CALL, lead, getProject(DEMO_CALL.projectId), opening[DEMO_CALL.lang]);
  }, [opening]);
  const lead = SEED.leads.find((l) => l.id === DEMO_CALL.leadId)!;
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % turns.length), 3400);
    return () => window.clearInterval(id);
  }, [turns.length]);

  const prev = turns[(i - 1 + turns.length) % turns.length];
  const cur = turns[i];
  return (
    <div className="force-dark rounded-[12px] border border-line bg-bg p-5 sm:p-7" aria-label="Sample call transcript">
      <div className="flex items-center justify-between gap-3 text-[12px] text-fg-3">
        <span className="flex items-center gap-2">
          <span className="live-dot h-2 w-2 rounded-full bg-accent-fill" aria-hidden="true" />
          Sample call with {lead.name.split(" ")[0]} · Telugu and English
        </span>
        <span className="tnum font-mono">
          {i + 1}/{turns.length}
        </span>
      </div>
      <p className="mt-6 min-h-[22px] truncate text-[14px] text-fg-3">
        <span className="mr-2 font-medium">{prev.speaker === "agent" ? "Agent" : lead.name.split(" ")[0]}</span>
        {prev.text}
      </p>
      <div key={i} className="rise-in mt-3 min-h-[132px]">
        <span className={`text-[12px] font-medium ${cur.speaker === "lead" ? "text-accent" : "text-fg-2"}`}>{cur.speaker === "agent" ? "Agent" : lead.name.split(" ")[0]}</span>
        <p className="display mt-1 text-[clamp(22px,2.6vw,32px)] leading-[1.15] text-fg">{cur.text}</p>
        {cur.cites && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cur.cites.map((c, k) => (
              <span key={k} className="inline-flex h-6 items-center gap-1 rounded-full border border-accent/60 px-2 text-[11px] text-accent">
                <FileText size={12} /> {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
