"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useIsPaused, useProjectLeads } from "@/lib/selectors";
import { STAGE_LABEL } from "@/lib/format";
import {
  ArrowRight,
  Books,
  FileText,
  Gear,
  Moon,
  Pause,
  Phone,
  Play,
  Plus,
  Pulse,
  Question,
  UploadSimple,
  UserCircle,
  Users,
} from "../icons";
import { usePalette } from "./palette-state";
import { toggleTheme } from "./theme-toggle";

export function CommandPalette() {
  const open = usePalette((s) => s.open);
  const setOpen = usePalette((s) => s.setOpen);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const leads = useProjectLeads();
  const docs = useStore((s) => s.docs);
  const projectId = useStore((s) => s.projectId);
  const paused = useIsPaused();
  const pause = useStore((s) => s.pauseCalling);
  const resume = useStore((s) => s.resumeCalling);
  const toast = useStore((s) => s.toast);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!usePalette.getState().open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const go = (href: string) => {
    setOpen(false);
    setSearch("");
    router.push(href);
  };
  const run = (fn: () => void) => {
    setOpen(false);
    setSearch("");
    fn();
  };

  const q = search.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const leadMatches =
    q.length >= 2
      ? leads
          .filter((l) => l.name.toLowerCase().includes(q) || (digits.length >= 3 && l.phone.replace(/\D/g, "").includes(digits)))
          .slice(0, 8)
      : [];
  const projectDocs = docs.filter((d) => d.projectId === projectId);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch("");
      }}
      label="Search and commands"
      shouldFilter={true}
      overlayClassName="fixed inset-0 z-[80] bg-[var(--overlay)]"
      contentClassName="fixed left-1/2 top-[12vh] z-[90] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[10px] border border-line-strong bg-surface shadow-[var(--shadow)]"
    >
      <Command.Input value={search} onValueChange={setSearch} placeholder="Find a lead by name or phone, or type a command" />
      <Command.List>
        <Command.Empty>Nothing matches “{search}”.</Command.Empty>

        {leadMatches.length > 0 && (
          <Command.Group heading="Leads">
            {leadMatches.map((l) => (
              <Command.Item key={l.id} value={`lead ${l.name} ${l.phone}`} onSelect={() => go(`/leads/${l.id}`)}>
                <UserCircle size={17} />
                <span className="flex-1 truncate">{l.name}</span>
                <span className="font-mono text-[12px] text-fg-3">{l.phone}</span>
                <span className="text-[12px] text-fg-3">{STAGE_LABEL[l.stage]}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Go to">
          <Command.Item value="today floor live" onSelect={() => go("/today")}>
            <Pulse size={17} /> Today
          </Command.Item>
          <Command.Item value="needs you handovers callbacks" onSelect={() => go("/today/needs")}>
            <ArrowRight size={17} /> Needs you
          </Command.Item>
          <Command.Item value="review flagged calls qa" onSelect={() => go("/today/review")}>
            <ArrowRight size={17} /> Review flagged calls
          </Command.Item>
          <Command.Item value="this week analytics numbers" onSelect={() => go("/today/week")}>
            <ArrowRight size={17} /> This week
          </Command.Item>
          <Command.Item value="leads all" onSelect={() => go("/leads")}>
            <Users size={17} /> Leads
          </Command.Item>
          <Command.Item value="hot leads" onSelect={() => go("/leads/hot")}>
            <ArrowRight size={17} /> Hot leads
          </Command.Item>
          <Command.Item value="who to call calling lists campaigns" onSelect={() => go("/leads/who-to-call")}>
            <ArrowRight size={17} /> Who to call
          </Command.Item>
          <Command.Item value="knowledge project book" onSelect={() => go("/knowledge")}>
            <Books size={17} /> What the agent knows
          </Command.Item>
          <Command.Item value="questions unanswered" onSelect={() => go("/knowledge/questions")}>
            <Question size={17} /> Questions the agent could not answer
          </Command.Item>
          <Command.Item value="setup connections" onSelect={() => go("/setup")}>
            <Gear size={17} /> Setup
          </Command.Item>
          <Command.Item value="how the agent talks voice script try it" onSelect={() => go("/setup/agent")}>
            <ArrowRight size={17} /> How the agent talks
          </Command.Item>
          <Command.Item value="my day sales person app rep" onSelect={() => go("/me")}>
            <UserCircle size={17} /> Sales person&apos;s app
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Actions">
          {paused ? (
            <Command.Item
              value="resume calling"
              onSelect={() =>
                run(() => {
                  resume();
                  toast("Calling resumed", "good");
                })
              }
            >
              <Play size={17} /> Resume calling
            </Command.Item>
          ) : (
            <Command.Item
              value="pause calling stop"
              onSelect={() =>
                run(() => {
                  pause();
                  toast("Calling paused. Calls in progress will finish.", "warn");
                })
              }
            >
              <Pause size={17} /> Pause calling
            </Command.Item>
          )}
          <Command.Item value="new calling list who to call" onSelect={() => go("/who-to-call/new")}>
            <Plus size={17} /> New calling list
          </Command.Item>
          <Command.Item value="test call try the agent" onSelect={() => go("/setup/agent#try")}>
            <Phone size={17} /> Try the agent
          </Command.Item>
          <Command.Item value="upload document" onSelect={() => go("/knowledge#upload")}>
            <UploadSimple size={17} /> Upload a document
          </Command.Item>
          <Command.Item value="toggle theme dark light" onSelect={() => run(toggleTheme)}>
            <Moon size={17} /> Switch light or dark
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Documents">
          {projectDocs.map((d) => (
            <Command.Item key={d.id} value={`doc ${d.title} ${d.kind}`} onSelect={() => go(`/knowledge/doc/${d.id}`)}>
              <FileText size={17} />
              <span className="flex-1 truncate">{d.title}</span>
              <span className="text-[12px] text-fg-3">
                v{d.version} · {d.status === "draft" ? "Draft" : "Approved"}
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
