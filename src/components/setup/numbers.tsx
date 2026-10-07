"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useTodayCalls } from "@/lib/selectors";
import { num } from "@/lib/format";
import { Button } from "../ui/button";
import { Field, Input, Select, Switch } from "../ui/form";
import { Pill } from "../ui/pill";
import { Plus } from "../icons";
import { SetupHeader } from "./setup-header";

export function NumbersView() {
  const numbers = useStore((s) => s.numbers);
  const setNumber = useStore((s) => s.setNumber);
  const addNumber = useStore((s) => s.addNumber);
  const toast = useStore((s) => s.toast);
  const calls = useTodayCalls();
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [provider, setProvider] = useState("Exotel");
  const [error, setError] = useState("");

  useLayoutEffect(() => () => setAdding(false), []);

  const active = numbers.filter((n) => n.active);
  // Today's dials spread across active numbers, weighted to healthy ones.
  const dialled = useMemo(() => {
    const out: Record<string, number> = {};
    const weights = active.map((n) => (n.reputation === "good" ? 1 : 0.35));
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    active.forEach((n, i) => (out[n.id] = Math.round((calls.length * weights[i]) / total)));
    return out;
  }, [active, calls.length]);

  const add = () => {
    const d = value.replace(/\D/g, "");
    const ten = d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
    if (ten.length !== 10) return setError("Use a 10-digit number. Landlines include the area code, like 40 4852 1190.");
    if (numbers.some((n) => n.number.replace(/\D/g, "").endsWith(ten))) return setError("That number is already in the pool.");
    const pretty = ten.startsWith("40") ? `+91 40 ${ten.slice(2, 6)} ${ten.slice(6)}` : `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
    addNumber({ number: pretty, provider, reputation: "good", dialledToday: 0, active: true });
    toast(`${pretty} added. It starts with a few calls a day to build trust.`, "good");
    setValue("");
    setError("");
    setAdding(false);
  };

  return (
    <>
      <SetupHeader
        status={`${active.length} numbers in use. Calls rotate across healthy numbers so none gets marked as spam.`}
        action={
          <Button variant="primary" size="lg" icon={<Plus size={17} weight="bold" />} onClick={() => setAdding(true)} disabled={adding}>
            Add a number
          </Button>
        }
      />
      <div className="grid gap-6 pt-8">
        {adding && (
          <form
            noValidate
            className="rise-in grid gap-4 rounded-[var(--radius)] border border-accent/60 bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_200px_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <Field label="Number" htmlFor="num">
              <Input id="num" inputMode="tel" value={value} onChange={(e) => setValue(e.target.value)} placeholder="40 4852 1193" autoFocus />
            </Field>
            <Field label="Provider" htmlFor="prov">
              <Select id="prov" value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option>Exotel</option>
                <option>Plivo</option>
                <option>Twilio</option>
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => (setAdding(false), setError(""))}>
                Cancel
              </Button>
              <Button variant="secondary" type="submit">
                Add
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-[13px] text-crit sm:col-span-3">
                {error}
              </p>
            )}
          </form>
        )}

        <div className="overflow-x-auto rounded-[var(--radius)] border border-line bg-surface">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[12px] text-fg-3">
                <th className="px-5 py-2.5 font-medium">Number</th>
                <th className="px-3 py-2.5 font-medium">Provider</th>
                <th className="px-3 py-2.5 font-medium">Reputation</th>
                <th className="px-3 py-2.5 text-right font-medium">Dialled today</th>
                <th className="px-5 py-2.5 text-right font-medium">In use</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map((n) => (
                <tr key={n.id} className="border-b border-line/60 last:border-0">
                  <td className="tnum px-5 py-3 font-mono text-[13px] text-fg">{n.number}</td>
                  <td className="px-3 py-3 text-fg-2">{n.provider}</td>
                  <td className="px-3 py-3">
                    {n.reputation === "good" ? <Pill tone="good">Healthy</Pill> : n.reputation === "watch" ? <Pill tone="warn">Watch</Pill> : <Pill tone="crit">Flagged</Pill>}
                  </td>
                  <td className="tnum px-3 py-3 text-right font-mono text-[13px] text-fg-2">{n.active ? num(dialled[n.id] ?? 0) : "-"}</td>
                  <td className="px-5 py-3 text-right">
                    <Switch
                      checked={n.active}
                      label={`Use ${n.number}`}
                      onChange={(v) => {
                        if (!v && active.length === 1) {
                          toast("Keep at least one number on, or calling stops.", "warn");
                          return;
                        }
                        setNumber(n.id, { active: v });
                        toast(v ? `${n.number} is back in rotation.` : `${n.number} is resting. It won't make calls.`);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="max-w-[70ch] text-[13px] text-fg-3">
          A number marked Watch got more “spam” reports or short hang-ups than usual this week. It makes fewer calls until it recovers. Resting a number for a day also helps.
        </p>
      </div>
    </>
  );
}
