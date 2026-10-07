"use client";

import { useNeeds } from "@/lib/selectors";
import { NeedsList } from "./needs-list";

export function NeedsView() {
  const needs = useNeeds();
  const handovers = needs.filter((n) => n.kind === "handover");
  const callbacks = needs.filter((n) => n.kind === "callback");
  const questions = needs.filter((n) => n.kind === "questions");
  return (
    <div className="grid max-w-[880px] gap-10">
      <Group title="Asked for a person" hint="The agent promised a call from the team. Call now or give it to the assigned sales person." needs={handovers} empty="No one is waiting for a person." />
      <Group title="Call-backs due" hint="Leads who asked to be called at a set time, from an hour ago to the next half hour." needs={callbacks} empty="No call-backs due in the next half hour." />
      {questions.length > 0 && <Group title="Questions" hint="Answer once and the agent uses the answer on every call after." needs={questions} empty="" />}
    </div>
  );
}

function Group({ title, hint, needs, empty }: { title: string; hint: string; needs: ReturnType<typeof useNeeds>; empty: string }) {
  return (
    <section>
      <h2 className="text-[15px] font-semibold text-fg">
        {title} <span className="tnum ml-1 font-mono text-[13px] font-normal text-fg-3">{needs.length}</span>
      </h2>
      <p className="mb-3 mt-1 text-[13px] text-fg-3">{hint}</p>
      {needs.length ? <NeedsList needs={needs} /> : <p className="rounded-[var(--radius)] border border-dashed border-line-strong px-4 py-5 text-sm text-fg-2">{empty}</p>}
    </section>
  );
}
