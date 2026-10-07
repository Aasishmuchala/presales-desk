"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { ArrowRight, Check } from "../icons";

export interface Step {
  id: string;
  title: string;
  detail: string;
  href: string;
  done: boolean;
}

export function useChecklist(): Step[] {
  const connections = useStore((s) => s.connections);
  const numbers = useStore((s) => s.numbers);
  const docs = useStore((s) => s.docs);
  const projectId = useStore((s) => s.projectId);
  const testCallDone = useStore((s) => s.testCallDone);
  const projectDocs = docs.filter((d) => d.projectId === projectId);
  const crm = connections.find((c) => c.id === "crm")?.status === "connected";
  const legalDrafts = projectDocs.filter((d) => d.book === "legal" && d.status === "draft");
  return [
    { id: "crm", title: "Connect your CRM", detail: "New leads arrive here within seconds.", href: "/setup#connections", done: crm },
    { id: "number", title: "Add a phone number", detail: "The number leads see when the agent calls.", href: "/setup/numbers", done: numbers.some((n) => n.active) },
    {
      id: "book",
      title: "Upload the project book",
      detail: "Price sheet, payment plan, brochure.",
      href: "/knowledge",
      done: projectDocs.some((d) => d.book === "project" && d.status === "approved"),
    },
    {
      id: "legal",
      title: "Approve the legal book",
      detail: legalDrafts.length ? `${legalDrafts[0].title} is still a draft.` : "Every legal document is approved.",
      href: legalDrafts.length ? `/knowledge/doc/${legalDrafts[0].id}` : "/knowledge/legal",
      done: legalDrafts.length === 0,
    },
    { id: "test", title: "Make a test call", detail: "Talk to the agent as if you were a lead.", href: "/setup/agent#try", done: testCallDone },
  ];
}

export function Checklist() {
  const steps = useChecklist();
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <section aria-labelledby="checklist-title" className="rounded-[var(--radius)] border border-line bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="checklist-title" className="display text-[26px] text-fg">
          Ready in five steps
        </h2>
        <span className="tnum font-mono text-[13px] text-fg-3">
          {done} of {steps.length} done
        </span>
      </div>
      <ol className="mt-5 grid gap-1">
        {steps.map((s, i) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className={`group flex items-center gap-4 rounded-[var(--radius)] px-3 py-3 transition-colors hover:bg-surface-2 ${s.done ? "" : ""}`}
            >
              <span
                className={`tnum grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-[12px] ${
                  s.done ? "border-transparent bg-good-soft text-good" : "border-line-strong text-fg-2"
                }`}
              >
                {s.done ? <Check size={14} weight="bold" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${s.done ? "text-fg-3 line-through decoration-line-strong" : "text-fg"}`}>{s.title}</span>
                <span className="block text-[13px] text-fg-3">{s.detail}</span>
              </span>
              {!s.done && <ArrowRight size={16} className="shrink-0 text-fg-3 group-hover:text-accent" />}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
