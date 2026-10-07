"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import type { KnowledgeDoc } from "@/lib/types";
import { Pill } from "../ui/pill";
import { ArrowRight, FileText, UploadSimple } from "../icons";

export function DocList({ book }: { book: KnowledgeDoc["book"] }) {
  const docs = useStore((s) => s.docs);
  const projectId = useStore((s) => s.projectId);
  const mine = docs
    .filter((d) => d.projectId === projectId && d.book === book)
    .sort((a, b) => (a.status === b.status ? a.title.localeCompare(b.title) : a.status === "draft" ? -1 : 1));

  return (
    <div className="grid gap-8">
      <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
        {mine.map((d) => {
          const confirmed = d.facts.filter((f) => f.confirmed).length;
          return (
            <li key={d.id}>
              <Link href={`/knowledge/doc/${d.id}`} className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-2 sm:flex-row sm:items-center sm:gap-6 sm:px-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] bg-surface-2 text-fg-3">
                  <FileText size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[15px] font-medium text-fg">{d.title}</span>
                    <span className="tnum font-mono text-[12px] text-fg-3">v{d.version}</span>
                    {d.status === "draft" ? <Pill tone="warn">Draft</Pill> : <Pill tone="good">Approved</Pill>}
                  </span>
                  <span className="mt-1 block text-[13px] text-fg-3">
                    {d.kind} · {d.pages} {d.pages === 1 ? "page" : "pages"} · {d.status === "approved" ? `effective ${d.effective}` : d.previous ? `agent still reads v${d.previous.version}` : "agent doesn't use it yet"} · {d.updatedBy}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-4 text-[13px] text-fg-3">
                  {d.facts.length > 0 && (
                    <span>
                      <span className="tnum font-mono text-fg-2">{confirmed}</span>/{d.facts.length} facts confirmed
                    </span>
                  )}
                  <ArrowRight size={15} className="group-hover:text-accent" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div id="upload" className="flex scroll-mt-24 items-center gap-4 rounded-[var(--radius)] border border-dashed border-line-strong px-5 py-6 text-sm text-fg-2">
        <UploadSimple size={22} className="shrink-0 text-fg-3" />
        <p>
          Drag files anywhere on this page, or use <span className="font-medium text-fg">Upload</span>. New files arrive as drafts. The agent only reads a document after
          {book === "legal" ? " the legal reviewer approves it." : " someone approves it."}
        </p>
      </div>
    </div>
  );
}
