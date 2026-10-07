"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { getRep, useLeadMap, type Need } from "@/lib/selectors";
import { firstName, hhmm } from "@/lib/format";
import { ArrowRight, Phone, Question, WhatsappLogo } from "../icons";

export function NeedsList({ needs, compact = false }: { needs: Need[]; compact?: boolean }) {
  const leadMap = useLeadMap();
  const addCall = useStore((s) => s.addCall);
  const openDesk = useStore((s) => s.openDesk);
  const handle = useStore((s) => s.handle);
  const toast = useStore((s) => s.toast);
  const now = useStore((s) => s.nowMin);
  const updateLead = useStore((s) => s.updateLead);
  const completeBooking = useStore((s) => s.completeBooking);

  if (needs.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-line-strong px-5 py-8">
        <p className="display text-[26px] text-fg">Nothing needs you</p>
        <p className="mt-2 text-sm text-fg-2">Hand-overs and call-backs will show up here the moment they happen.</p>
      </div>
    );
  }

  const callNow = (n: Need) => {
    const lead = n.leadId ? leadMap.get(n.leadId) : undefined;
    if (!lead) return;
    const id = addCall({
      projectId: lead.projectId,
      leadId: lead.id,
      start: now,
      durationSec: 900,
      result: "connected",
      outcome: "transferred",
      lang: lead.lang,
      score: lead.score,
      manual: true,
    });
    openDesk(id, "bridged");
    handle(n.key);
    if (n.kind === "callback") {
      const bookingId = n.key.split(":")[1];
      completeBooking(bookingId);
    }
    toast(`Calling ${lead.name} from your number. The agent's notes are on their page.`);
  };

  const giveToRep = (n: Need) => {
    const lead = n.leadId ? leadMap.get(n.leadId) : undefined;
    if (!lead) return;
    const rep = getRep(lead.repId);
    handle(n.key);
    updateLead(lead.id, { stage: "hot", nextStep: `${rep?.name ?? "Rep"} to call today` });
    toast(`Sent to ${rep?.name} on WhatsApp with the call summary.`, "good");
  };

  return (
    <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
      {needs.map((n) => {
        const lead = n.leadId ? leadMap.get(n.leadId) : undefined;
        const rep = lead ? getRep(lead.repId) : undefined;
        return (
          <li key={n.key} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">
                {lead ? (
                  <Link href={`/leads/${lead.id}`} className="hover:underline">
                    {n.title}
                  </Link>
                ) : (
                  n.title
                )}
              </p>
              <p className={`mt-0.5 text-[13px] text-fg-3 ${compact ? "line-clamp-2" : ""}`}>{n.detail}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {n.kind === "questions" ? (
                <Link
                  href="/knowledge/questions"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] text-fg hover:border-accent hover:text-accent"
                >
                  <Question size={15} /> Answer
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => callNow(n)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-accent px-3 text-[13px] font-medium text-accent hover:bg-accent-soft"
                  >
                    <Phone size={15} /> Call now
                  </button>
                  {rep && !compact && (
                    <button
                      type="button"
                      onClick={() => giveToRep(n)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] text-fg hover:border-line-strong hover:bg-surface-2"
                    >
                      <WhatsappLogo size={15} /> Give to {firstName(rep.name)}
                    </button>
                  )}
                  {n.kind === "callback" && !compact && (
                    <button
                      type="button"
                      onClick={() => {
                        handle(n.key);
                        completeBooking(n.key.split(":")[1]);
                        toast("Marked as done");
                      }}
                      className="inline-flex h-8 items-center rounded-full px-3 text-[13px] text-fg-3 hover:text-fg"
                    >
                      Done
                    </button>
                  )}
                </>
              )}
              {compact && n.kind !== "questions" && (
                <span className="tnum hidden font-mono text-[12px] text-fg-3 sm:inline">{hhmm(n.at)}</span>
              )}
            </div>
          </li>
        );
      })}
      {compact && (
        <li>
          <Link href="/today/needs" className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] text-fg-3 hover:text-fg">
            Everything that needs you <ArrowRight size={13} />
          </Link>
        </li>
      )}
    </ul>
  );
}
