"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useCallingWindow, useProjectLeads } from "@/lib/selectors";
import { useDraftList } from "@/lib/draft-list";
import { DAY, hhmm, num, rupees, sentence, when } from "@/lib/format";
import { PageHeader } from "../ui/page-header";
import { Button } from "../ui/button";
import { Field, Input, Select } from "../ui/form";
import { CaretDown, Check } from "../icons";
import { VIEWS } from "../leads/views";

const SCRIPTS = [
  { id: "Fresh enquiry", detail: "Introduce the project, find what they need, offer a visit." },
  { id: "Check in after 30 days", detail: "Remind them of the project, share what's new, ask if plans changed." },
  { id: "Visit reminder", detail: "Confirm tomorrow's visit, share the location, offer to reschedule." },
];

/** The opening that fits each group of leads. */
function scriptFor(audience: string) {
  const a = audience.toLowerCase();
  if (a.includes("not now") || a === "notnow") return "Check in after 30 days";
  if (a.includes("visit booked") || a === "booked") return "Visit reminder";
  return "Fresh enquiry";
}

export function NewList() {
  const router = useRouter();
  const leads = useProjectLeads();
  const projectId = useStore((s) => s.projectId);
  const rules = useStore((s) => s.rules);
  const numbers = useStore((s) => s.numbers);
  const now = useStore((s) => s.nowMin);
  const addList = useStore((s) => s.addList);
  const toast = useStore((s) => s.toast);
  const draft = useDraftList();

  const [audience, setAudience] = useState<string>(draft.leadIds.length ? "picked" : "new");
  const [script, setScript] = useState(() => scriptFor(draft.leadIds.length ? draft.source : "new"));
  const [start, setStart] = useState<"now" | "tomorrow">("now");
  const [more, setMore] = useState(false);
  const [langPolicy, setLangPolicy] = useState("Detect from the first reply");
  const [callerId, setCallerId] = useState("rotate");
  const [retries, setRetries] = useState(rules.retries);
  const [name, setName] = useState("");

  const audienceOptions = [
    ...(draft.leadIds.length ? [{ id: "picked", label: `${draft.source} (${draft.leadIds.length})` }] : []),
    { id: "new", label: "New, not spoken to yet" },
    ...VIEWS.filter((v) => v.id !== "all").map((v) => ({ id: v.id, label: v.label })),
    { id: "unreachable", label: "No answer yet" },
  ];

  const picked = useMemo(() => {
    if (audience === "picked") {
      const ids = new Set(draft.leadIds);
      return leads.filter((l) => ids.has(l.id));
    }
    if (audience === "new") return leads.filter((l) => l.stage === "new");
    if (audience === "unreachable") return leads.filter((l) => l.stage === "unreachable");
    const v = VIEWS.find((x) => x.id === audience);
    return v ? leads.filter(v.match) : [];
  }, [audience, draft.leadIds, leads]);

  const excludedDnd = picked.filter((l) => l.dnd || l.stage === "optedout");
  const excludedBooked = audience !== "booked" && script !== "Visit reminder" ? picked.filter((l) => l.stage === "booked") : [];
  const final = picked.filter((l) => !excludedDnd.includes(l) && !excludedBooked.includes(l));
  const estPerLead = 11;
  const win = useCallingWindow();
  const within = now >= win.from && now < win.to - 30;
  const startsAt = start === "now" && within ? now : DAY + win.from;
  const listName = name.trim() || `${audienceOptions.find((a) => a.id === audience)?.label.replace(/ \(\d+\)$/, "")}, ${script.toLowerCase()}`;

  const create = () => {
    const id = addList({
      projectId,
      name: listName,
      view: audienceOptions.find((a) => a.id === audience)?.label ?? audience,
      script,
      langPolicy,
      status: start === "now" && within ? "running" : "scheduled",
      leadIds: final.map((l) => l.id),
      startsAt,
      createdBy: "Anand Varma",
    });
    draft.clear();
    toast(start === "now" && within ? `Calling ${final.length} leads now.` : `Scheduled for ${sentence(when(startsAt))}.`, "good");
    router.push(`/who-to-call/${id}`);
  };

  return (
    <div className="max-w-[860px]">
      <PageHeader
        back={{ href: "/leads/who-to-call", label: "Who to call" }}
        title="New calling list"
        status="Pick who, how the agent opens, and when. Everything else has a sensible default."
      />

      <div className="mt-10 grid gap-10">
        <Step n={1} title="Who to call">
          <Field label="Leads" htmlFor="aud">
            <Select id="aud" value={audience} onChange={(e) => {
                setAudience(e.target.value);
                setScript(scriptFor(e.target.value));
              }}>
              {audienceOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
          <p className="mt-2 text-[13px] text-fg-3">
            <span className="tnum font-mono text-fg-2">{num(picked.length)}</span> leads in this group.
          </p>
        </Step>

        <Step n={2} title="How the agent opens">
          <div className="grid gap-2" role="radiogroup" aria-label="Opening">
            {SCRIPTS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={script === s.id}
                onClick={() => setScript(s.id)}
                className={`flex items-start gap-3 rounded-[var(--radius)] border p-3.5 text-left transition-colors ${
                  script === s.id ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"
                }`}
              >
                <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${script === s.id ? "border-accent bg-accent-fill" : "border-line-strong"}`}>
                  {script === s.id && <Check size={10} weight="bold" className="text-accent-ink" />}
                </span>
                <span>
                  <span className="block text-sm font-medium text-fg">{s.id}</span>
                  <span className="block text-[13px] text-fg-2">{s.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </Step>

        <Step n={3} title="When">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Start">
            {(["now", "tomorrow"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={start === s}
                disabled={s === "now" && !within}
                onClick={() => setStart(s)}
                className={`h-9 rounded-full border px-4 text-sm disabled:opacity-40 ${start === s ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-2 hover:text-fg"}`}
              >
                {s === "now" ? "Start now" : `Tomorrow at ${rules.callFrom}`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-fg-3">
            Calls only between {rules.callFrom} and {rules.callTo}. {within ? `It's ${hhmm(now)} now.` : "Today's window has closed."}
          </p>
        </Step>

        <div>
          <button
            type="button"
            aria-expanded={more}
            onClick={() => setMore((m) => !m)}
            className="inline-flex items-center gap-1.5 text-sm text-fg-2 hover:text-fg"
          >
            <CaretDown size={14} className={`transition-transform ${more ? "rotate-180" : ""}`} /> More settings
          </button>
          {more && (
            <div className="rise-in mt-4 grid gap-4 rounded-[var(--radius)] border border-line bg-surface p-5 sm:grid-cols-2">
              <Field label="List name" htmlFor="lname" hint="Leave empty to name it automatically.">
                <Input id="lname" value={name} onChange={(e) => setName(e.target.value)} placeholder={listName} />
              </Field>
              <Field label="Language" htmlFor="lang">
                <Select id="lang" value={langPolicy} onChange={(e) => setLangPolicy(e.target.value)}>
                  <option>Detect from the first reply</option>
                  <option>Use their last language</option>
                  <option>Always start in English</option>
                  <option>Always start in Telugu</option>
                  <option>Always start in Hindi</option>
                </Select>
              </Field>
              <Field label="Caller ID" htmlFor="cid">
                <Select id="cid" value={callerId} onChange={(e) => setCallerId(e.target.value)}>
                  <option value="rotate">Rotate healthy numbers</option>
                  {numbers
                    .filter((n) => n.active)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.number}
                        {n.reputation !== "good" ? " (watch)" : ""}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Tries per lead" htmlFor="retries" hint={`At least ${rules.retryGapHours} hours apart, at different times of day.`}>
                <Select id="retries" value={retries} onChange={(e) => setRetries(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
        </div>

        <section aria-label="Review" className="rounded-[var(--radius)] border border-line bg-surface p-5 md:p-6">
          <h2 className="text-[15px] font-semibold text-fg">Before you start</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <ReviewRow k="Will be called" v={<span className="tnum display text-[28px] text-fg">{num(final.length)}</span>} />
            <ReviewRow k="Estimated cost" v={<span className="tnum display text-[28px] text-fg">{rupees(final.length * estPerLead)}</span>} />
            <ReviewRow k="Left out, on do-not-call" v={<span className="tnum font-mono">{excludedDnd.length}</span>} />
            <ReviewRow k="Left out, visit already booked" v={<span className="tnum font-mono">{excludedBooked.length}</span>} />
            <ReviewRow k="First call" v={start === "now" && within ? "Within a minute" : when(startsAt)} />
            <ReviewRow k="Opens with" v={script} />
          </dl>
          <p className="mt-4 text-[13px] text-fg-3">
            Cost is an estimate of about {rupees(estPerLead)} per lead, from per-minute phone, speech and model rates.
          </p>
          <div className="mt-5 flex justify-end">
            <Button variant="primary" size="lg" disabled={final.length === 0} onClick={create}>
              {start === "now" && within ? `Start calling ${num(final.length)}` : "Schedule"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 sm:grid-cols-[40px_minmax(0,1fr)]">
      <span className="tnum hidden h-8 w-8 place-items-center rounded-full border border-line-strong font-mono text-[13px] text-fg-2 sm:grid">{n}</span>
      <div className="min-w-0">
        <h2 className="mb-3 text-[17px] font-semibold text-fg">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function ReviewRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/60 pb-2 sm:block sm:border-0 sm:pb-0">
      <dt className="text-[13px] text-fg-3">{k}</dt>
      <dd className="mt-1 text-fg">{v}</dd>
    </div>
  );
}
