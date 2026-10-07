"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { LANG_NAME } from "@/lib/format";
import type { Lang, Rules } from "@/lib/types";
import { Field, Input, Select, Textarea } from "../ui/form";
import { CheckCircle } from "../icons";
import { SetupHeader } from "./setup-header";

export function RulesView() {
  const rules = useStore((s) => s.rules);
  const setRules = useStore((s) => s.setRules);
  const [saved, setSaved] = useState(false);
  const [timeError, setTimeError] = useState("");

  const save = (patch: Partial<Rules>) => {
    setRules(patch);
    setSaved(true);
  };

  const setWindow = (from: string, to: string) => {
    if (from < "09:00" || to > "21:00") {
      setTimeError("By TRAI rules, calls must be between 09:00 and 21:00.");
      return;
    }
    if (from >= to) {
      setTimeError("The start time must be before the end time.");
      return;
    }
    setTimeError("");
    save({ callFrom: from, callTo: to });
  };

  return (
    <>
      <SetupHeader
        status={
          <span className="inline-flex items-center gap-2">
            Changes save as you make them.
            {saved && (
              <span className="inline-flex items-center gap-1 text-good">
                <CheckCircle size={15} weight="fill" /> Saved
              </span>
            )}
          </span>
        }
      />
      <div className="grid max-w-[880px] gap-12 pt-8">
        <Group title="Calling hours and retries" hint="These are defaults for every calling list. Lists can be stricter, never looser.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Call from" htmlFor="from">
              <Input id="from" type="time" min="09:00" max="21:00" value={rules.callFrom} onChange={(e) => setWindow(e.target.value, rules.callTo)} />
            </Field>
            <Field label="Call until" htmlFor="to">
              <Input id="to" type="time" min="09:00" max="21:00" value={rules.callTo} onChange={(e) => setWindow(rules.callFrom, e.target.value)} />
            </Field>
            {timeError && (
              <p role="alert" className="text-[13px] text-crit sm:col-span-2">
                {timeError}
              </p>
            )}
            <Field label="Tries per lead" htmlFor="retries">
              <Select id="retries" value={rules.retries} onChange={(e) => save({ retries: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Gap between tries" htmlFor="gap" hint="Each retry also moves to a different time of day.">
              <Select id="gap" value={rules.retryGapHours} onChange={(e) => save({ retryGapHours: Number(e.target.value) })}>
                {[4, 8, 16, 24, 48].map((n) => (
                  <option key={n} value={n}>
                    {n} hours
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Group>

        <Group title="Do-not-call and records" hint="Every number is checked against the national do-not-call registry before it's dialled.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Check the DND list daily at" htmlFor="dnd">
              <Input id="dnd" type="time" value={rules.dndScrubAt} onChange={(e) => save({ dndScrubAt: e.target.value })} />
            </Field>
            <Field label="Keep call recordings for" htmlFor="ret" hint="After this they are deleted. Leads can ask for earlier deletion.">
              <Select id="ret" value={rules.retentionDays} onChange={(e) => save({ retentionDays: Number(e.target.value) })}>
                {[90, 180, 365].map((n) => (
                  <option key={n} value={n}>
                    {n} days
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="DLT template IDs for SMS and WhatsApp" htmlFor="dlt" hint="One per line. Find them in your DLT portal.">
                <Textarea id="dlt" rows={3} value={rules.dltTemplates} onChange={(e) => save({ dltTemplates: e.target.value })} placeholder="Paste template IDs here" />
              </Field>
            </div>
          </div>
        </Group>

        <Group title="What the agent says first" hint="Said at the start of every call, before anything else. Required by law.">
          <div className="grid gap-4">
            {(Object.keys(rules.disclosure) as Lang[]).map((l) => (
              <Field key={l} label={LANG_NAME[l]} htmlFor={`disc-${l}`}>
                <Textarea id={`disc-${l}`} rows={2} value={rules.disclosure[l]} onChange={(e) => save({ disclosure: { ...rules.disclosure, [l]: e.target.value } })} />
              </Field>
            ))}
          </div>
        </Group>

        <Group title="Comparison" hint="Used only for the cost comparison on This week.">
          <div className="max-w-xs">
            <Field label="What a call by a person costs you, per dial (₹)" htmlFor="human">
              <Input
                id="human"
                type="number"
                min={1}
                inputMode="numeric"
                value={rules.humanCostPerDial}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n > 0) save({ humanCostPerDial: n });
                }}
              />
            </Field>
          </div>
        </Group>
      </div>
    </>
  );
}

function Group({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[17px] font-semibold text-fg">{title}</h2>
      <p className="mb-5 mt-1 text-[13px] text-fg-3">{hint}</p>
      {children}
    </section>
  );
}
