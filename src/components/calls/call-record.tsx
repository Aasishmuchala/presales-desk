"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { getRep, isLive, useLeadMap, useLocalFlag, useTranscript } from "@/lib/selectors";
import { dayOffset, durationWords, hhmm, LANG_NAME, longDate, OUTCOME_LABEL, when } from "@/lib/format";
import { hashString, mulberry32 } from "@/lib/rand";
import type { Call, Citation, Lead, Outcome, Turn } from "@/lib/types";
import { PageHeader } from "../ui/page-header";
import { Button } from "../ui/button";
import { Pill, Score } from "../ui/pill";
import { Empty, Kbd } from "../ui/misc";
import { Field, Input, Select, Textarea } from "../ui/form";
import { Sheet } from "../ui/sheet";
import { Check, CheckCircle, Ear, FileText, Warning, X } from "../icons";
import { Player, usePlayback } from "./player";

export function CallRecord({ callId, mode = "record" }: { callId: string; mode?: "record" | "review" }) {
  const call = useStore((s) => s.calls.find((c) => c.id === callId));
  const leadMap = useLeadMap();
  const lead = call ? leadMap.get(call.leadId) : undefined;

  if (!call || !lead) {
    return (
      <div className="pt-10">
        <Empty
          title="This call isn't here"
          body="It may belong to another project, or the link is wrong. Switch project from the menu, or go back to the leads list."
          action={
            <Link href="/leads" className="text-sm font-medium text-accent hover:underline">
              Back to leads
            </Link>
          }
        />
      </div>
    );
  }
  return <CallRecordInner key={call.id} call={call} lead={lead} mode={mode} />;
}

function CallRecordInner({ call, lead, mode }: { call: Call; lead: Lead; mode: "record" | "review" }) {
  const now = useStore((s) => s.nowMin);
  const openDesk = useStore((s) => s.openDesk);
  const transcript = useTranscript(call);
  const live = isLive(call, now);
  const total = call.durationSec;
  const { pos, playing, speed, seek, toggle, cycleSpeed } = usePlayback(total);
  const [cite, setCite] = useState<Citation | null>(null);
  // Close the source sheet when this route is hidden.
  useLayoutEffect(() => () => setCite(null), []);
  const [hintSeen, markHint] = useLocalFlag("psd-hint-player");
  const outcomeRef = useRef<HTMLSelectElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const currentIdx = useMemo(() => {
    let idx = -1;
    transcript.forEach((t, i) => {
      if (t.at <= pos + 0.01) idx = i;
    });
    return idx;
  }, [transcript, pos]);

  // Keep the spoken line in view inside the transcript panel.
  useEffect(() => {
    const el = currentRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    const top = el.offsetTop - list.offsetTop - list.clientHeight / 3;
    list.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [currentIdx]);

  // Space, arrows and E. Ignored while typing.
  useEffect(() => {
    if (call.result !== "connected") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (e.key === " ") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight" && !t.closest("[role=slider]")) {
        e.preventDefault();
        const next = transcript.find((x) => x.at > pos + 0.2);
        if (next) seek(next.at);
      } else if (e.key === "ArrowLeft" && !t.closest("[role=slider]")) {
        e.preventDefault();
        const prev = [...transcript].reverse().find((x) => x.at < pos - 1.5);
        seek(prev ? prev.at : 0);
      } else if (e.key.toLowerCase() === "e" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        outcomeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [call.result, toggle, seek, transcript, pos]);

  const status = (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>{when(call.start)}</span>
      <span className="text-fg-3">·</span>
      <span>{durationWords(call.durationSec)}</span>
      <span className="text-fg-3">·</span>
      <span>{LANG_NAME[call.lang]}</span>
      {call.outcome && !live && <Pill tone={call.outcome === "booked" ? "good" : "neutral"}>{OUTCOME_LABEL[call.outcome]}</Pill>}
      {live && <Pill tone="accent">On the call now</Pill>}
    </span>
  );

  return (
    <div>
      <PageHeader
        back={mode === "review" ? { href: "/today/review", label: "Review" } : { href: `/leads/${lead.id}`, label: lead.name }}
        title={`Call with ${lead.name}`}
        status={status}
        action={
          live ? (
            <Button variant="primary" size="lg" icon={<Ear size={17} />} onClick={() => openDesk(call.id)}>
              Listen live
            </Button>
          ) : undefined
        }
      />

      {call.result !== "connected" ? (
        <div className="mt-8">
          <Empty title={call.result === "voicemail" ? "Voicemail" : call.result === "busy" ? "Line busy" : "No answer"} body={transcript[0]?.text} />
        </div>
      ) : live ? (
        <div className="mt-8">
          <Empty
            title="This call is still running"
            body="Listen live from the desk. The full recording, transcript and outcome appear here as soon as the call ends."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <div className="min-w-0">
            <div className="force-dark rounded-[10px] border border-line bg-bg p-4 sm:p-6">
              <Player
                seed={call.id}
                total={total}
                pos={pos}
                playing={playing}
                speed={speed}
                turns={transcript}
                onToggle={toggle}
                onSeek={seek}
                onSpeed={cycleSpeed}
              />
              <ol ref={listRef} className="scroll-y relative mt-6 grid max-h-[460px] gap-4 pr-1" aria-label="Transcript">
                {transcript.map((t, i) => (
                  <TurnLine
                    key={i}
                    ref={i === currentIdx ? currentRef : undefined}
                    turn={t}
                    leadName={lead.name}
                    state={i === currentIdx ? "current" : i < currentIdx ? "past" : "future"}
                    onSeek={() => seek(t.at)}
                    onCite={setCite}
                  />
                ))}
              </ol>
            </div>
            {!hintSeen && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-fg-3">
                <Kbd>Space</Kbd> plays and pauses. <Kbd>←</Kbd> <Kbd>→</Kbd> skip a turn. <Kbd>E</Kbd> edits the outcome.
                <button type="button" onClick={markHint} className="ml-1 text-fg-2 underline-offset-2 hover:underline">
                  Got it
                </button>
              </p>
            )}
            <Compliance call={call} lead={lead} />
          </div>
          <div className="min-w-0">
            {mode === "review" ? <Scorecard call={call} /> : <OutcomePanel call={call} lead={lead} outcomeRef={outcomeRef} live={live} />}
          </div>
        </div>
      )}

      <CitationSheet cite={cite} onClose={() => setCite(null)} />
    </div>
  );
}

function TurnLine({
  turn,
  leadName,
  state,
  onSeek,
  onCite,
  ref,
}: {
  turn: Turn;
  leadName: string;
  state: "past" | "current" | "future";
  onSeek: () => void;
  onCite: (c: Citation) => void;
  ref?: React.Ref<HTMLLIElement>;
}) {
  const who = turn.speaker === "agent" ? "Agent" : leadName.split(" ")[0];
  return (
    <li ref={ref} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3">
      <button
        type="button"
        onClick={onSeek}
        className="pt-1 text-left font-mono text-[11px] text-fg-3 hover:text-fg"
        aria-label={`Play from ${who}'s line`}
      >
        <span className={`block font-sans text-[12px] font-medium ${turn.speaker === "lead" ? "text-accent" : "text-fg-2"}`}>{who}</span>
        {Math.floor(turn.at / 60)}:{String(Math.floor(turn.at % 60)).padStart(2, "0")}
      </button>
      <div className="min-w-0">
        <p
          className={`transition-[font-size,color] duration-200 ${
            state === "current"
              ? "display text-[clamp(20px,2.4vw,28px)] leading-[1.18] text-fg"
              : state === "past"
                ? "text-[15px] text-fg-2"
                : "text-[15px] text-fg-3"
          }`}
        >
          {turn.text}
        </p>
        {turn.cites && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {turn.cites.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onCite(c)}
                className="inline-flex h-6 items-center gap-1 rounded-full border border-accent/60 px-2 text-[11px] text-accent hover:bg-accent-soft"
              >
                <FileText size={12} /> {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function criteria(call: Call) {
  const r = mulberry32(hashString(`${call.id}-crit`));
  const s = call.score ?? 50;
  const jitter = () => Math.round((r() - 0.5) * 24);
  return [
    { label: "Budget fits", value: Math.min(100, Math.max(5, s + jitter())) },
    { label: "Buying soon", value: Math.min(100, Math.max(5, s + jitter())) },
    { label: "Interest shown", value: Math.min(100, Math.max(5, s + jitter())) },
    { label: "Engagement", value: Math.min(100, Math.max(5, s + jitter())) },
  ];
}

function OutcomePanel({
  call,
  lead,
  outcomeRef,
  live,
}: {
  call: Call;
  lead: Lead;
  outcomeRef: React.RefObject<HTMLSelectElement | null>;
  live: boolean;
}) {
  const updateCall = useStore((s) => s.updateCall);
  const updateLead = useStore((s) => s.updateLead);
  const toast = useStore((s) => s.toast);
  const [outcome, setOutcome] = useState<Outcome>(call.outcome ?? "info_sent");
  const [next, setNext] = useState(lead.nextStep);
  const dirty = outcome !== (call.outcome ?? "info_sent") || next !== lead.nextStep;
  const rep = getRep(lead.repId);
  const crit = criteria(call);

  const save = () => {
    const stageFor: Record<Outcome, Lead["stage"]> = {
      booked: "booked",
      qualified: "hot",
      transferred: "hot",
      callback: "callback",
      info_sent: "talking",
      not_now: "notnow",
      opted_out: "optedout",
    };
    updateCall(call.id, { outcome });
    updateLead(lead.id, { stage: stageFor[outcome], nextStep: next, ...(outcome === "opted_out" ? { dnd: true } : {}) });
    toast("Outcome saved. It's on the lead's page and in the CRM.", "good");
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-[var(--radius)] border border-line bg-surface p-5">
        <h2 className="text-[13px] font-medium text-fg-3">What the agent heard</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-fg">{lead.summary}</p>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[13px] text-fg-3">Lead score</p>
            <Score value={call.score ?? lead.score} size="lg" />
          </div>
          <p className="text-right text-[13px] text-fg-3">
            Assigned to <span className="text-fg-2">{rep?.name}</span>
          </p>
        </div>
        <dl className="mt-4 grid gap-2.5">
          {crit.map((c) => (
            <div key={c.label} className="grid grid-cols-[110px_minmax(0,1fr)_32px] items-center gap-3 text-[13px]">
              <dt className="text-fg-2">{c.label}</dt>
              <dd className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                <span className="block h-full rounded-full bg-fg-2" style={{ width: `${c.value}%` }} />
              </dd>
              <dd className="tnum text-right font-mono text-fg-3">{c.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-[var(--radius)] border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-fg">Outcome</h2>
        <div className="mt-4 grid gap-4">
          <Field label="What happened" htmlFor="outcome">
            <Select id="outcome" ref={outcomeRef} value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome)} disabled={live}>
              {(Object.keys(OUTCOME_LABEL) as Outcome[]).map((o) => (
                <option key={o} value={o}>
                  {OUTCOME_LABEL[o]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Next step" htmlFor="next-step">
            <Input id="next-step" value={next} onChange={(e) => setNext(e.target.value)} disabled={live} />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-fg-3">{live ? "You can edit once the call ends." : dirty ? "Unsaved changes" : "Saved"}</span>
            <Button variant="primary" onClick={save} disabled={!dirty || live}>
              Save outcome
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Compliance({ call, lead }: { call: Call; lead: Lead }) {
  const retention = useStore((s) => s.rules.retentionDays);
  const disclosureFlag = call.qa?.flags.some((f) => f.kind === "compliance");
  const items = [
    { ok: lead.consent || call.result === "connected", text: "Consent captured" },
    { ok: !disclosureFlag, text: disclosureFlag ? "AI disclosure was cut off" : "AI disclosure given" },
    { ok: !lead.dnd || lead.stage === "optedout", text: `Not on DND at ${hhmm(call.start - 1)}` },
  ];
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]" aria-label="Compliance">
      {items.map((i) => (
        <li key={i.text} className={`flex items-center gap-1.5 ${i.ok ? "text-fg-2" : "text-warn"}`}>
          {i.ok ? <CheckCircle size={15} className="text-good" weight="fill" /> : <Warning size={15} weight="fill" />}
          {i.text}
        </li>
      ))}
      <li className="text-fg-3">Recording kept until {longDate(dayOffset(call.start) + retention)}</li>
    </ul>
  );
}

function Scorecard({ call }: { call: Call }) {
  const router = useRouter();
  const submit = useStore((s) => s.submitReview);
  const reviewed = useStore((s) => s.reviewed[call.id]);
  const toast = useStore((s) => s.toast);
  const [verdicts, setVerdicts] = useState<Record<string, "agree" | "disagree">>(reviewed?.verdicts ?? {});
  const [note, setNote] = useState(reviewed?.note ?? "");
  const qa = call.qa;
  if (!qa) return <Empty title="Nothing flagged" body="Automatic checks found no problems on this call." />;

  const rows = [
    { key: "accuracy", label: "Facts and sources", score: qa.accuracy },
    { key: "compliance", label: "Disclosure and consent", score: qa.compliance },
    { key: "tone", label: "Tone and pace", score: qa.tone },
  ];
  const complete = rows.every((r) => verdicts[r.key]);

  return (
    <section className="rounded-[var(--radius)] border border-line bg-surface p-5">
      <h2 className="text-[15px] font-semibold text-fg">Scorecard</h2>
      <p className="mt-1 text-[13px] text-fg-3">Agree or disagree with each automatic score. Your answers train the checks.</p>
      <ul className="mt-5 grid gap-4">
        {rows.map((r) => {
          const flag = qa.flags.find((f) => f.kind === r.key);
          const v = verdicts[r.key];
          return (
            <li key={r.key} className="rounded-[var(--radius)] border border-line p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-fg">{r.label}</span>
                <Pill tone={r.score <= 2 ? "crit" : r.score === 3 ? "warn" : "good"}>
                  <span className="tnum font-mono">{r.score}/5</span>
                </Pill>
              </div>
              {flag && <p className="mt-2 text-[13px] text-fg-2">{flag.note}</p>}
              <div className="mt-3 flex gap-2" role="group" aria-label={`Your view on ${r.label}`}>
                {(["agree", "disagree"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={v === opt}
                    onClick={() => setVerdicts((s) => ({ ...s, [r.key]: opt }))}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors ${
                      v === opt ? "border-accent bg-accent-soft text-accent" : "border-line-strong text-fg-2 hover:text-fg"
                    }`}
                  >
                    {opt === "agree" ? <Check size={14} /> : <X size={14} />}
                    {opt === "agree" ? "Agree" : "Disagree"}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-5">
        <Field label="Note for the team" htmlFor="review-note" hint="Optional. Shown on the call and added to the test set.">
          <Textarea id="review-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[12px] text-fg-3">{complete ? "Ready to submit" : "Answer all three to submit"}</span>
        <Button
          variant="primary"
          disabled={!complete}
          onClick={() => {
            submit(call.id, { verdicts, note });
            toast("Review saved. The call is added to the test set.", "good");
            router.push("/today/review");
          }}
        >
          Submit review
        </Button>
      </div>
    </section>
  );
}

function CitationSheet({ cite, onClose }: { cite: Citation | null; onClose: () => void }) {
  const doc = useStore((s) => (cite ? s.docs.find((d) => d.id === cite.docId) : undefined));
  return (
    <Sheet open={!!cite} onClose={onClose} title={cite ? `Source: ${cite.label}` : "Source"}>
      {doc && cite ? (
        <div className="grid gap-4">
          <p className="text-[13px] text-fg-3">
            {doc.title} · v{doc.version} · {doc.status === "approved" ? `Approved, effective ${doc.effective}` : "Draft"}
          </p>
          <div className="paper-surface rounded-[var(--radius)] border border-line p-4">
            {doc.paras.slice(Math.max(0, cite.para - 1), cite.para + 2).map((p, i) => {
              const idx = Math.max(0, cite.para - 1) + i;
              const isHeading = p.startsWith("# ");
              return isHeading ? (
                <p key={idx} className="mt-2 text-[13px] font-semibold text-fg first:mt-0">
                  {p.slice(2)}
                </p>
              ) : (
                <p
                  key={idx}
                  className={`mt-2 rounded px-2 py-1.5 text-[15px] leading-relaxed first:mt-0 ${idx === cite.para ? "bg-accent-soft text-fg" : "text-fg-2"}`}
                >
                  {p}
                </p>
              );
            })}
          </div>
          <Link href={`/knowledge/doc/${doc.id}#p${cite.para}`} className="text-sm font-medium text-accent hover:underline">
            Open the full document
          </Link>
        </div>
      ) : (
        <p className="text-sm text-fg-2">This source is no longer available.</p>
      )}
    </Sheet>
  );
}
