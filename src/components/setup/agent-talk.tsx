"use client";

import { useStore } from "@/lib/store";
import { useProject } from "@/lib/selectors";
import { hhmm, LANG_NAME } from "@/lib/format";
import type { Lang, Objection } from "@/lib/types";
import { Button } from "../ui/button";
import { Input, Select, Switch, Textarea } from "../ui/form";
import { Play, Plus, Trash } from "../icons";
import { SetupHeader } from "./setup-header";
import { speak, TryIt } from "./try-it";

const VOICES = [
  { id: "Aarti", detail: "Warm, mid pitch, unhurried" },
  { id: "Kiran", detail: "Calm, lower pitch, measured" },
  { id: "Meera", detail: "Bright, quick, energetic" },
];

export function AgentTalk() {
  const draft = useStore((s) => s.agentDraft);
  const published = useStore((s) => s.agentPublished);
  const publishedAt = useStore((s) => s.agentPublishedAt);
  const set = useStore((s) => s.setAgentDraft);
  const publish = useStore((s) => s.publishAgent);
  const discard = useStore((s) => s.discardAgentDraft);
  const toast = useStore((s) => s.toast);
  const project = useProject();
  const dirty = JSON.stringify(draft) !== JSON.stringify(published);
  const noDisclosure = draft.langs.filter((l) => !/AI|assistant/i.test(draft.opening[l]));

  const setObjection = (id: string, patch: Partial<Objection>) =>
    set({ objections: draft.objections.map((o) => (o.id === id ? { ...o, ...patch } : o)) });

  const toggleLang = (l: Lang) => {
    const on = draft.langs.includes(l);
    if (on && draft.langs.length === 1) {
      toast("The agent needs at least one language.", "warn");
      return;
    }
    set({ langs: on ? draft.langs.filter((x) => x !== l) : [...draft.langs, l] });
  };

  return (
    <>
      <SetupHeader
        status={
          noDisclosure.length
            ? `The ${noDisclosure.map((l) => LANG_NAME[l]).join(" and ")} opening doesn't say it's an AI assistant. The law needs that before you can publish.`
            : dirty
            ? "You have changes that real calls aren't using yet. Try them on the right, then publish."
            : publishedAt !== null
              ? `Published at ${hhmm(publishedAt)}. Every new call uses this.`
              : "This is what every call uses right now."
        }
        action={
          <>
            {dirty && (
              <Button variant="ghost" onClick={discard}>
                Discard changes
              </Button>
            )}
            <Button
              variant="primary"
              size="lg"
              disabled={!dirty || noDisclosure.length > 0}
              onClick={() => {
                publish();
                toast("Published. New calls use these changes from now.", "good");
              }}
            >
              Publish
            </Button>
          </>
        }
      />

      <div className="grid gap-10 pt-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid min-w-0 gap-12">
          <Block title="Voice" hint="Leads hear this voice in every language.">
            <div className="grid gap-2 sm:grid-cols-3">
              {VOICES.map((v) => (
                <div
                  key={v.id}
                  className={`rounded-[var(--radius)] border p-3.5 transition-colors ${draft.voice === v.id ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"}`}
                >
                  <button type="button" aria-pressed={draft.voice === v.id} onClick={() => set({ voice: v.id })} className="block w-full text-left">
                    <span className="block text-sm font-medium text-fg">{v.id}</span>
                    <span className="block text-[13px] text-fg-2">{v.detail}</span>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {draft.langs.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          if (!speak(draft.opening[l].replace("{project}", project.name), l)) toast(`This browser has no ${LANG_NAME[l]} voice to preview with.`, "warn");
                        }}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-line-strong px-2 text-[12px] text-fg-2 hover:text-fg"
                        aria-label={`Play ${v.id} in ${LANG_NAME[l]}`}
                      >
                        <Play size={11} weight="fill" /> {l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-fg-3">Previews use your browser&apos;s built-in voice. Real calls use the licensed voice.</p>
          </Block>

          <Block title="Languages" hint="The agent listens for the lead's language in the first few seconds and switches.">
            <div className="flex flex-wrap gap-2">
              {(["EN", "HI", "TE"] as Lang[]).map((l) => (
                <label key={l} className="flex cursor-pointer items-center gap-2.5 rounded-full border border-line px-3 py-1.5 text-sm text-fg">
                  <Switch checked={draft.langs.includes(l)} onChange={() => toggleLang(l)} label={LANG_NAME[l]} />
                  {LANG_NAME[l]}
                </label>
              ))}
            </div>
          </Block>

          <Block title="How it opens" hint="Write {project} where the project name goes. Keep the AI and recording notice, the law needs it.">
            <div className="grid gap-4">
              {draft.langs.map((l) => {
                const missing = noDisclosure.includes(l);
                return (
                  <div key={l} className="grid gap-1.5">
                    <label htmlFor={`open-${l}`} className="text-[13px] font-medium text-fg-2">
                      {LANG_NAME[l]}
                    </label>
                    <Textarea id={`open-${l}`} rows={2} value={draft.opening[l]} onChange={(e) => set({ opening: { ...draft.opening, [l]: e.target.value } })} />
                    {missing && <p className="text-[12px] text-warn">This line doesn&apos;t say it&apos;s an AI assistant. Add it before publishing.</p>}
                  </div>
                );
              })}
            </div>
          </Block>

          <Block title="When leads push back" hint="Each line is a situation and what the agent should do. It still quotes only from approved documents.">
            <ul className="grid gap-3">
              {draft.objections.map((o) => (
                <li key={o.id} className="grid gap-2 rounded-[var(--radius)] border border-line bg-surface p-3.5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)_auto] sm:items-start">
                  <div className="grid gap-1">
                    <label htmlFor={`when-${o.id}`} className="text-[12px] text-fg-3">
                      When
                    </label>
                    <Input id={`when-${o.id}`} value={o.when} onChange={(e) => setObjection(o.id, { when: e.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <label htmlFor={`ans-${o.id}`} className="text-[12px] text-fg-3">
                      The agent should
                    </label>
                    <Textarea id={`ans-${o.id}`} rows={2} value={o.answer} onChange={(e) => setObjection(o.id, { answer: e.target.value })} />
                  </div>
                  <button
                    type="button"
                    onClick={() => set({ objections: draft.objections.filter((x) => x.id !== o.id) })}
                    className="mt-5 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-fg-3 hover:bg-surface-2 hover:text-crit"
                    aria-label={`Remove “${o.when}”`}
                  >
                    <Trash size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => set({ objections: [...draft.objections, { id: `o${Date.now()}`, when: "", answer: "" }] })}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <Plus size={14} /> Add a situation
            </button>
          </Block>

          <Block title="When to hand over to a person">
            <div className="grid gap-3 text-[15px] text-fg-2">
              <label className="flex flex-wrap items-center gap-3">
                <Switch checked={draft.handoverOnAsk} onChange={(v) => set({ handoverOnAsk: v })} label="Hand over when the lead asks for a person" />
                <span>Hand over straight away when the lead asks for a person.</span>
              </label>
              <p className="flex flex-wrap items-center gap-2">
                Also hand over when their score reaches
                <label htmlFor="hs" className="sr-only">
                  Score
                </label>
                <Select id="hs" value={draft.handoverScore} onChange={(e) => set({ handoverScore: Number(e.target.value) })} className="!h-8 !w-auto">
                  {[60, 70, 80, 90].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
                , and send them to
                <label htmlFor="ht" className="sr-only">
                  Who
                </label>
                <Select id="ht" value={draft.handoverTo} onChange={(e) => set({ handoverTo: e.target.value as "assigned" | "available" })} className="!h-8 !w-auto">
                  <option value="assigned">their own sales person</option>
                  <option value="available">whoever is free first</option>
                </Select>
                .
              </p>
            </div>
          </Block>

          <Block title="Follow-ups after a call" hint="Sent on WhatsApp from approved templates. Stops the moment a lead says not interested.">
            <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
              {draft.followUps.map((f, i) => (
                <li key={f.day} className="flex items-center gap-4 px-4 py-3">
                  <span className="tnum w-14 shrink-0 font-mono text-[13px] text-fg-3">{f.day === 0 ? "Same day" : `Day ${f.day}`}</span>
                  <span className={`min-w-0 flex-1 text-sm ${f.on ? "text-fg" : "text-fg-3"}`}>{f.what}</span>
                  <Switch
                    checked={f.on}
                    label={`${f.what} on ${f.day === 0 ? "the same day" : `day ${f.day}`}`}
                    onChange={(v) => set({ followUps: draft.followUps.map((x, k) => (k === i ? { ...x, on: v } : x)) })}
                  />
                </li>
              ))}
            </ul>
          </Block>
        </div>

        <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <TryIt />
        </div>
      </div>
    </>
  );
}

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[17px] font-semibold text-fg">{title}</h2>
      {hint && <p className="mb-4 mt-1 text-[13px] text-fg-3">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}
