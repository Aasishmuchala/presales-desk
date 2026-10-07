"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { getProject, getRep, useSalesReps } from "@/lib/selectors";
import { absolute, DAY, dayWord, hhmm, inr, LANG_NAME, sentence, STAGE_LABEL, when } from "@/lib/format";
import type { Lead, Stage } from "@/lib/types";
import { PageHeader } from "../ui/page-header";
import { Button } from "../ui/button";
import { Field, Input, Select, Textarea } from "../ui/form";
import { Empty } from "../ui/misc";
import { Pill, Score } from "../ui/pill";
import { CalendarBlank, CheckCircle, Lock, Phone, WhatsappLogo, X } from "../icons";
import { Timeline } from "./timeline";
import { STAGE_TONE } from "./views";

export function Dossier({ id }: { id: string }) {
  const lead = useStore((s) => s.leads.find((l) => l.id === id));
  if (!lead) {
    return (
      <div className="pt-10">
        <Empty
          title="No lead with this link"
          body="It may have been merged in the CRM, or the link is wrong."
          action={
            <Link href="/leads" className="text-sm font-medium text-accent hover:underline">
              Back to leads
            </Link>
          }
        />
      </div>
    );
  }
  return <DossierInner key={lead.id} lead={lead} />;
}

type Panel = "none" | "book" | "whatsapp";

function DossierInner({ lead }: { lead: Lead }) {
  const [panel, setPanel] = useState<Panel>("none");
  const now = useStore((s) => s.nowMin);
  const addCall = useStore((s) => s.addCall);
  const openDesk = useStore((s) => s.openDesk);
  const toast = useStore((s) => s.toast);
  const updateLead = useStore((s) => s.updateLead);
  const locked = lead.stage === "optedout" || lead.dnd;
  const project = getProject(lead.projectId);

  useLayoutEffect(() => () => setPanel("none"), []);

  const callNow = () => {
    const id = addCall({
      projectId: lead.projectId,
      leadId: lead.id,
      start: now,
      durationSec: 260,
      result: "connected",
      outcome: "info_sent",
      lang: lead.lang,
      score: lead.score,
      manual: true,
    });
    updateLead(lead.id, { lastTouch: now });
    openDesk(id, "listen");
    toast(`The agent is calling ${lead.name}. You're listening in.`);
  };

  return (
    <div>
      <PageHeader
        back={{ href: "/leads", label: "Leads" }}
        title={lead.name}
        size="xl"
        status={
          <div className="grid gap-3">
            <p className="display max-w-[40ch] text-[clamp(19px,2.2vw,24px)] leading-snug text-fg">{lead.summary}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-3">
              <span className="tnum font-mono text-fg-2">{lead.phone}</span>
              <span>{LANG_NAME[lead.lang]}</span>
              <span className="flex items-center gap-1.5">
                Score <Score value={lead.score} />
              </span>
              <Pill tone={STAGE_TONE[lead.stage]}>{STAGE_LABEL[lead.stage]}</Pill>
              <span>{project.name}</span>
            </p>
          </div>
        }
        action={
          locked ? (
            <span className="inline-flex items-center gap-2 text-sm text-crit">
              <Lock size={16} /> Asked not to be contacted
            </span>
          ) : (
            <>
              <Button variant="secondary" icon={<Phone size={16} />} onClick={callNow}>
                Call now
              </Button>
              <Button variant="secondary" icon={<WhatsappLogo size={16} />} onClick={() => setPanel(panel === "whatsapp" ? "none" : "whatsapp")} aria-expanded={panel === "whatsapp"}>
                WhatsApp
              </Button>
              <Button variant="primary" size="lg" icon={<CalendarBlank size={17} />} onClick={() => setPanel(panel === "book" ? "none" : "book")} aria-expanded={panel === "book"}>
                Book visit
              </Button>
            </>
          )
        }
      />

      {panel === "book" && <BookPanel lead={lead} onClose={() => setPanel("none")} />}
      {panel === "whatsapp" && <WhatsAppPanel lead={lead} onClose={() => setPanel("none")} />}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <section aria-labelledby="timeline-title" className="min-w-0">
          <h2 id="timeline-title" className="mb-5 text-[15px] font-semibold text-fg">
            Everything so far
          </h2>
          <Timeline leadId={lead.id} leadName={lead.name} />
        </section>
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <FactsPanel key={lead.nextStep} lead={lead} />
        </aside>
      </div>
    </div>
  );
}

function FactsPanel({ lead }: { lead: Lead }) {
  const updateLead = useStore((s) => s.updateLead);
  const toast = useStore((s) => s.toast);
  const [next, setNext] = useState(lead.nextStep);
  const salesReps = useSalesReps();

  const saveNext = () => {
    const v = next.trim();
    if (v && v !== lead.nextStep) {
      updateLead(lead.id, { nextStep: v });
      toast("Next step saved", "good");
    }
  };

  return (
    <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
      <h2 className="text-[15px] font-semibold text-fg">Facts</h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 text-sm">
        <Row k="Looking for" v={`${lead.config}${lead.facing ? `, ${lead.facing.toLowerCase()} facing` : ""}`} />
        <Row k="Budget" v={`Up to ${inr(lead.budgetLakh)}`} />
        <Row k="Buying for" v={lead.purpose} />
        <Row k="When" v={lead.timeline} />
        <Row k="Also said" v={lead.note} wide />
        <Row k="Source" v={lead.source} />
        <Row k="First enquiry" v={when(lead.createdAt)} />
      </dl>
      <div className="mt-6 grid gap-4 border-t border-line pt-5">
        <Field label="Stage" htmlFor="stage">
          <Select
            id="stage"
            value={lead.stage}
            onChange={(e) => {
              const stage = e.target.value as Stage;
              updateLead(lead.id, { stage, ...(stage === "optedout" ? { dnd: true } : {}) });
              toast(`Stage changed to ${STAGE_LABEL[stage]}`);
            }}
          >
            {(Object.keys(STAGE_LABEL) as Stage[]).map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sales person" htmlFor="rep">
          <Select
            id="rep"
            value={lead.repId}
            onChange={(e) => {
              updateLead(lead.id, { repId: e.target.value });
              toast(`Assigned to ${getRep(e.target.value)?.name}`, "good");
            }}
          >
            {salesReps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.available ? "" : " (off today)"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Next step" htmlFor="next" hint="Press Enter to save.">
          <Input
            id="next"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            onBlur={saveNext}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur(), undefined)}
          />
        </Field>
      </div>
      <ul className="mt-5 grid gap-2 border-t border-line pt-4 text-[13px]">
        <li className="flex items-center gap-2 text-fg-2">
          {lead.consent ? <CheckCircle size={15} weight="fill" className="text-good" /> : <X size={15} className="text-fg-3" />}
          {lead.consent ? "Consent to be called captured on the first call" : "No call yet, so no consent captured"}
        </li>
        <li className={`flex items-center gap-2 ${lead.dnd ? "text-crit" : "text-fg-2"}`}>
          {lead.dnd ? <Lock size={15} /> : <CheckCircle size={15} weight="fill" className="text-good" />}
          {lead.dnd ? "On the do-not-call list. All outreach is off." : "Not on the national do-not-call list"}
        </li>
      </ul>
    </div>
  );
}

function Row({ k, v, wide }: { k: string; v: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[12px] text-fg-3">{k}</dt>
      <dd className="mt-0.5 text-fg">{v}</dd>
    </div>
  );
}

const SLOTS = [10 * 60 + 30, 11 * 60 + 30, 12 * 60 + 30, 15 * 60, 16 * 60 + 30, 17 * 60 + 30, 18 * 60 + 30];

function BookPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const now = useStore((s) => s.nowMin);
  const bookings = useStore((s) => s.bookings);
  const addBooking = useStore((s) => s.addBooking);
  const addMessage = useStore((s) => s.addMessage);
  const updateLead = useStore((s) => s.updateLead);
  const toast = useStore((s) => s.toast);
  const salesReps = useSalesReps();
  const [kind, setKind] = useState<"visit" | "video">("visit");
  const [repId, setRepId] = useState(() => (getRep(lead.repId)?.available ? lead.repId : (salesReps.find((r) => r.available)?.id ?? lead.repId)));
  const [slot, setSlot] = useState<number | null>(null);
  const project = getProject(lead.projectId);

  const days = useMemo(() => {
    return [0, 1, 2, 3].map((d) => ({
      d,
      slots: SLOTS.map((m) => d * DAY + m).filter((t) => t > now + 60 && !bookings.some((b) => b.repId === repId && Math.abs(b.at - t) < 45)),
    })).filter((x) => x.slots.length > 0).slice(0, 3);
  }, [now, bookings, repId]);

  const confirm = () => {
    if (slot === null) return;
    const rep = getRep(repId);
    addBooking({ leadId: lead.id, repId, kind, at: slot });
    updateLead(lead.id, { stage: "booked", repId, nextStep: `${kind === "visit" ? "Site visit" : "Video call"} ${dayWord(Math.floor(slot / DAY)).toLowerCase()} at ${hhmm(slot)}` });
    addMessage({
      leadId: lead.id,
      channel: "whatsapp",
      direction: "out",
      at: now,
      text:
        kind === "visit"
          ? `Your site visit to ${project.name} is confirmed for ${absolute(slot)}. ${rep?.name} will meet you at the sales office. Location pin attached.`
          : `Your video walkthrough of ${project.name} is confirmed for ${absolute(slot)} with ${rep?.name}. The link will come 10 minutes before.`,
    });
    toast(`Booked for ${sentence(when(slot))} with ${rep?.name}. Confirmation sent on WhatsApp.`, "good");
    onClose();
  };

  return (
    <section aria-label="Book a visit" className="rise-in mt-6 rounded-[var(--radius)] border border-accent/60 bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1" role="group" aria-label="Type">
          {(["visit", "video"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={`h-8 rounded-full border px-3 text-[13px] ${kind === k ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-2 hover:text-fg"}`}
            >
              {k === "visit" ? "Site visit" : "Video call"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="book-rep" className="text-[13px] text-fg-3">
            With
          </label>
          <Select id="book-rep" value={repId} onChange={(e) => (setRepId(e.target.value), setSlot(null))} className="!w-auto">
            {salesReps.filter((r) => r.available || r.id === repId).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-fg-3 hover:text-fg">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        {days.map(({ d, slots }) => (
          <div key={d}>
            <p className="mb-2 text-[13px] font-medium text-fg-2">{dayWord(d)}</p>
            <div className="flex flex-wrap gap-1.5">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={slot === t}
                  onClick={() => setSlot(t)}
                  className={`tnum h-9 rounded-[var(--radius)] border px-3 font-mono text-[13px] transition-colors ${
                    slot === t ? "border-accent bg-accent-soft text-accent" : "border-line text-fg hover:border-line-strong"
                  }`}
                >
                  {hhmm(t)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[13px] text-fg-3">
          {salesReps.find((r) => r.id === repId)?.calendar ? "Free slots from their calendar." : "This person's calendar isn't connected, so check with them."} Reminders go on WhatsApp a day and two hours before.
        </p>
        <Button variant="primary" disabled={slot === null} onClick={confirm}>
          {slot === null ? "Pick a time" : `Book ${when(slot)}`}
        </Button>
      </div>
    </section>
  );
}

const TEMPLATES = (lead: Lead, projectName: string) => [
  { id: "brochure", label: "Brochure", text: `Here's the ${projectName} brochure, as promised on the call.` },
  { id: "plan", label: `${lead.config} floor plan`, text: `Sharing the ${lead.config} floor plan with carpet areas for each room.` },
  { id: "price", label: "Price sheet", text: "Here's the current price sheet, valid until 31 October." },
  { id: "payment", label: "Payment plan", text: "Here's the construction-linked payment plan. Booking is 10% of the agreement value." },
  { id: "rera", label: "RERA certificate", text: "Here's the RERA registration certificate for the project." },
  { id: "location", label: "Location", text: "Here's the location pin for the sales office and site." },
];

function WhatsAppPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const project = getProject(lead.projectId);
  const templates = TEMPLATES(lead, project.name);
  const [picked, setPicked] = useState<string[]>(["brochure"]);
  const [text, setText] = useState(templates[0].text);
  const addMessage = useStore((s) => s.addMessage);
  const now = useStore((s) => s.nowMin);
  const toast = useStore((s) => s.toast);

  const togglePick = (id: string) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    setPicked(next);
    setText(templates.filter((t) => next.includes(t.id)).map((t) => t.text).join(" "));
  };

  return (
    <section aria-label="Send on WhatsApp" className="rise-in mt-6 rounded-[var(--radius)] border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-fg">Send on WhatsApp</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-fg-3 hover:text-fg">
          <X size={16} />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Attachments">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={picked.includes(t.id)}
            onClick={() => togglePick(t.id)}
            className={`h-8 rounded-full border px-3 text-[13px] ${picked.includes(t.id) ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-2 hover:text-fg"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <Field label="Message" htmlFor="wa-text" hint="Sent from an approved template. Free text only works within 24 hours of their last reply.">
          <Textarea id="wa-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          variant="secondary"
          icon={<WhatsappLogo size={16} />}
          disabled={!text.trim()}
          onClick={() => {
            addMessage({ leadId: lead.id, channel: "whatsapp", direction: "out", at: now, text: text.trim() });
            toast(`Sent to ${lead.name} on WhatsApp`, "good");
            onClose();
          }}
        >
          Send
        </Button>
      </div>
    </section>
  );
}
