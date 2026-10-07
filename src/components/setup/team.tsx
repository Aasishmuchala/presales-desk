"use client";

import { useLayoutEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useReps } from "@/lib/selectors";
import { LANG_NAME } from "@/lib/format";
import type { Lang, Rep } from "@/lib/types";
import { Button } from "../ui/button";
import { Field, Input, Select, Switch } from "../ui/form";
import { Avatar } from "../ui/misc";
import { Pill } from "../ui/pill";
import { Plus } from "../icons";
import { SetupHeader } from "./setup-header";

const ROLE_LABEL: Record<Rep["role"], string> = {
  manager: "Sales manager",
  rep: "Sales person",
  legal: "Legal reviewer",
  admin: "Admin",
};

export function TeamView() {
  const reps = useReps();
  const setRep = useStore((s) => s.setRep);
  const addRep = useStore((s) => s.addRep);
  const toast = useStore((s) => s.toast);
  const [inviting, setInviting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Rep["role"]>("rep");
  const [error, setError] = useState("");

  useLayoutEffect(() => () => setInviting(false), []);

  const available = reps.filter((r) => r.role === "rep" && r.available).length;

  const invite = () => {
    const digits = phone.replace(/\D/g, "");
    if (name.trim().length < 2) return setError("Add their name.");
    if (!(digits.length === 10 || (digits.length === 12 && digits.startsWith("91")))) return setError("Use a 10-digit Indian mobile number.");
    const ten = digits.slice(-10);
    addRep({ name: name.trim(), phone: `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`, role, langs: ["EN"], available: true, calendar: false });
    toast(`Invite sent to ${name.trim()} on WhatsApp.`, "good");
    setName("");
    setPhone("");
    setError("");
    setInviting(false);
  };

  return (
    <>
      <SetupHeader
        status={`${available} sales ${available === 1 ? "person is" : "people are"} taking hand-overs today.`}
        action={
          <Button variant="primary" size="lg" icon={<Plus size={17} weight="bold" />} onClick={() => setInviting(true)} disabled={inviting}>
            Invite someone
          </Button>
        }
      />
      <div className="grid gap-6 pt-8">
        {inviting && (
          <form
            className="rise-in grid gap-4 rounded-[var(--radius)] border border-accent/60 bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_200px_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              invite();
            }}
            noValidate
          >
            <Field label="Name" htmlFor="inv-name">
              <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </Field>
            <Field label="Mobile" htmlFor="inv-phone">
              <Input id="inv-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98480 12345" />
            </Field>
            <Field label="Role" htmlFor="inv-role">
              <Select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as Rep["role"])}>
                {(Object.keys(ROLE_LABEL) as Rep["role"][]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => (setInviting(false), setError(""))}>
                Cancel
              </Button>
              <Button variant="secondary" type="submit">
                Send invite
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-[13px] text-crit sm:col-span-4">
                {error}
              </p>
            )}
          </form>
        )}

        <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
          {reps.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={r.name} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-fg">{r.name}</p>
                  <p className="truncate text-[13px] text-fg-3">
                    <span className="tnum font-mono">{r.phone}</span> · {r.langs.map((l: Lang) => LANG_NAME[l]).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                <label htmlFor={`role-${r.id}`} className="sr-only">
                  Role for {r.name}
                </label>
                <Select
                  id={`role-${r.id}`}
                  value={r.role}
                  disabled={r.id === "u1"}
                  onChange={(e) => {
                    setRep(r.id, { role: e.target.value as Rep["role"] });
                    toast(`${r.name} is now ${ROLE_LABEL[e.target.value as Rep["role"]].toLowerCase()}.`);
                  }}
                  className="!w-44"
                >
                  {(Object.keys(ROLE_LABEL) as Rep["role"][]).map((x) => (
                    <option key={x} value={x}>
                      {ROLE_LABEL[x]}
                    </option>
                  ))}
                </Select>
                {r.calendar ? <Pill tone="good">Calendar on</Pill> : <Pill>No calendar</Pill>}
                {r.role === "rep" && (
                  <label className="flex items-center gap-2 text-[13px] text-fg-2">
                    <Switch
                      checked={r.available}
                      onChange={(v) => {
                        setRep(r.id, { available: v });
                        toast(v ? `${r.name} is taking hand-overs again.` : `${r.name} won't get hand-overs today.`);
                      }}
                      label={`${r.name} is taking hand-overs`}
                    />
                    In today
                  </label>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
