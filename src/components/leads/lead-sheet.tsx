"use client";

import { useStore } from "@/lib/store";
import { getRep } from "@/lib/selectors";
import { inr, LANG_NAME, STAGE_LABEL } from "@/lib/format";
import { Sheet } from "../ui/sheet";
import { LinkButton } from "../ui/button";
import { Pill, Score } from "../ui/pill";
import { ArrowRight } from "../icons";
import { Timeline } from "./timeline";
import { STAGE_TONE } from "./views";

export function LeadSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const lead = useStore((s) => (id ? s.leads.find((l) => l.id === id) : undefined));
  return (
    <Sheet
      open={!!lead}
      onClose={onClose}
      title={lead?.name ?? "Lead"}
      footer={
        lead ? (
          <LinkButton href={`/leads/${lead.id}`} variant="secondary" className="w-full" icon={<ArrowRight size={15} />}>
            Open full page
          </LinkButton>
        ) : undefined
      }
    >
      {lead && (
        <div className="grid gap-6">
          <div>
            <p className="display text-[22px] leading-tight text-fg">{lead.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</Pill>
              <span className="text-[13px] text-fg-3">Score</span>
              <Score value={lead.score} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Fact k="Phone" v={<span className="tnum font-mono text-[13px]">{lead.phone}</span>} />
            <Fact k="Language" v={LANG_NAME[lead.lang]} />
            <Fact k="Looking for" v={lead.config} />
            <Fact k="Budget" v={inr(lead.budgetLakh)} />
            <Fact k="Source" v={lead.source} />
            <Fact k="Sales person" v={getRep(lead.repId)?.name ?? "-"} />
            <Fact k="Next step" v={lead.nextStep} wide />
          </dl>
          <div>
            <h3 className="mb-3 text-[13px] font-medium text-fg-3">Latest</h3>
            <Timeline leadId={lead.id} leadName={lead.name} limit={5} />
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Fact({ k, v, wide }: { k: string; v: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[12px] text-fg-3">{k}</dt>
      <dd className="mt-0.5 text-fg">{v}</dd>
    </div>
  );
}
