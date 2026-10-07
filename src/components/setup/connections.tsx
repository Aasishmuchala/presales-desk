"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { hhmm } from "@/lib/format";
import type { Connection } from "@/lib/types";
import { Pill } from "../ui/pill";
import { Button } from "../ui/button";
import { ArrowsClockwise, CalendarBlank, Copy, EnvelopeSimple, Phone, Plug, WhatsappLogo } from "../icons";
import { Checklist } from "./checklist";
import { SetupHeader } from "./setup-header";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  crm: Plug,
  phone: Phone,
  whatsapp: WhatsappLogo,
  email: EnvelopeSimple,
  calendar: CalendarBlank,
};

const WEBHOOK = "https://hooks.presales-desk.example/crm/v1/vanam/8f3c2a";

export function ConnectionsView() {
  const connections = useStore((s) => s.connections);
  const broken = connections.filter((c) => c.status !== "connected").length;
  return (
    <>
      <SetupHeader
        status={broken ? `${broken} ${broken === 1 ? "connection needs" : "connections need"} attention. Everything else is working.` : "Everything is connected."}
      />
      <div className="grid gap-10 pt-8">
        <Checklist />
        <section id="connections" className="scroll-mt-24">
          <h2 className="mb-3 text-[15px] font-semibold text-fg">Connections</h2>
          <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
            {connections.map((c) => (
              <ConnectionRow key={c.id} c={c} />
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function ConnectionRow({ c }: { c: Connection }) {
  const setConnection = useStore((s) => s.setConnection);
  const toast = useStore((s) => s.toast);
  const now = useStore((s) => s.nowMin);
  const [testing, setTesting] = useState(false);
  const [showHook, setShowHook] = useState(false);
  const Icon = ICONS[c.id] ?? Plug;

  const test = () => {
    setTesting(true);
    window.setTimeout(() => {
      setTesting(false);
      if (c.status === "connected") {
        setConnection(c.id, { lastCheck: hhmm(now) });
        toast(`${c.name} is working.`, "good");
      } else if (c.status === "error") {
        toast(`${c.name} still can't reach one calendar. Lakshmi needs to sign in again.`, "warn");
      }
    }, 1100);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK);
      toast("Webhook address copied", "good");
    } catch {
      toast("Couldn't copy. Select the address and copy it by hand.", "warn");
    }
  };

  return (
    <li className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] bg-surface-2 text-fg-2">
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2.5">
          <span className="text-[15px] font-medium text-fg">{c.name}</span>
          {c.status === "connected" ? (
            <Pill tone="good">Working</Pill>
          ) : c.status === "error" ? (
            <Pill tone="crit">Needs attention</Pill>
          ) : (
            <Pill>Not connected</Pill>
          )}
        </p>
        <p className="mt-1 text-[13px] text-fg-2">{c.detail}</p>
        <p className="mt-1 text-[12px] text-fg-3">{c.status === "error" ? c.lastCheck : `Last checked ${c.lastCheck}`}</p>
        {c.id === "crm" && showHook && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 max-w-full select-all overflow-x-auto rounded bg-surface-2 px-2 py-1 font-mono text-[12px] text-fg-2">{WEBHOOK}</code>
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-[13px] text-fg-2 hover:text-fg">
              <Copy size={14} /> Copy
            </button>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {c.id === "crm" && (
          <Button variant="ghost" size="sm" onClick={() => setShowHook((v) => !v)} aria-expanded={showHook}>
            {showHook ? "Hide webhook" : "Webhook address"}
          </Button>
        )}
        {c.status === "not_connected" ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast(`Connecting ${c.name.toLowerCase()} opens the provider's sign-in. It works once the backend is running.`)}
          >
            Connect
          </Button>
        ) : c.status === "error" ? (
          <Button variant="secondary" size="sm" onClick={() => toast("Sent Lakshmi a link on WhatsApp to give calendar access again.", "good")}>
            Ask Lakshmi to reconnect
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={test} disabled={testing} icon={<ArrowsClockwise size={14} className={testing ? "animate-spin" : ""} />}>
            {testing ? "Testing" : "Test"}
          </Button>
        )}
      </div>
    </li>
  );
}
