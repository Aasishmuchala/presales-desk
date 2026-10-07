"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { Fact, KnowledgeDoc } from "@/lib/types";
import { PageHeader } from "../ui/page-header";
import { Button } from "../ui/button";
import { Empty } from "../ui/misc";
import { Pill } from "../ui/pill";
import { Select } from "../ui/form";
import { Check, CheckCircle, Scales } from "../icons";

export function DocView({ id }: { id: string }) {
  const doc = useStore((s) => s.docs.find((d) => d.id === id));
  if (!doc) {
    return (
      <div className="pt-10">
        <Empty
          title="This document isn't here"
          body="It may belong to another project or have been replaced."
          action={
            <Link href="/knowledge" className="text-sm font-medium text-accent hover:underline">
              Back to the project book
            </Link>
          }
        />
      </div>
    );
  }
  return <DocInner key={doc.id} doc={doc} />;
}

function DocInner({ doc }: { doc: KnowledgeDoc }) {
  const approve = useStore((s) => s.approveDoc);
  const updateDoc = useStore((s) => s.updateDoc);
  const confirmFact = useStore((s) => s.confirmFact);
  const toast = useStore((s) => s.toast);
  const [showDiff, setShowDiff] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);

  // Jump to a paragraph when the link carries #p12.
  useEffect(() => {
    const m = /^#p(\d+)$/.exec(window.location.hash);
    if (!m) return;
    const n = Number(m[1]);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- highlight comes from the URL hash, only known in the browser
    setHighlight(n);
    const t = window.setTimeout(() => document.getElementById(`p${n}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 60);
    return () => window.clearTimeout(t);
  }, []);

  const factsByPara = useMemo(() => {
    const m = new Map<number, Fact[]>();
    for (const f of doc.facts) m.set(f.para, [...(m.get(f.para) ?? []), f]);
    return m;
  }, [doc.facts]);

  const outline = doc.paras.map((p, i) => ({ p, i })).filter(({ p }) => p.startsWith("# "));
  const backHref = doc.book === "legal" ? "/knowledge/legal" : "/knowledge";
  const unconfirmed = doc.facts.filter((f) => !f.confirmed).length;

  const status =
    doc.status === "approved"
      ? `Approved, effective ${doc.effective}. The agent reads this version.`
      : doc.previous
        ? `Draft v${doc.version}. The agent still reads v${doc.previous.version} until this is approved.`
        : "Draft. The agent doesn't use this document until it's approved.";

  return (
    <div>
      <PageHeader
        back={{ href: backHref, label: doc.book === "legal" ? "Legal book" : "Project book" }}
        title={doc.title}
        status={
          <span className="flex flex-wrap items-center gap-3">
            {doc.status === "approved" ? <Pill tone="good">Approved</Pill> : <Pill tone="warn">Draft</Pill>}
            <span>
              v{doc.version} · {status}
            </span>
          </span>
        }
        action={
          doc.status === "draft" ? (
            <Button
              variant="primary"
              size="lg"
              disabled={doc.facts.length === 0}
              title={doc.facts.length === 0 ? "No facts have been pulled out of this file yet" : undefined}
              icon={<Check size={17} weight="bold" />}
              onClick={() => {
                approve(doc.id, "Anand Varma");
                toast(`Approved v${doc.version}. The agent uses it from the next call.`, "good");
              }}
            >
              Approve v{doc.version}
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-fg-3">
        <span>
          {doc.kind} · {doc.pages} {doc.pages === 1 ? "page" : "pages"} · last change by {doc.updatedBy}
        </span>
        {doc.previous && (
          <button type="button" onClick={() => setShowDiff((v) => !v)} aria-pressed={showDiff} className="font-medium text-accent hover:underline">
            {showDiff ? "Hide changes" : `See what changed from v${doc.previous.version}`}
          </button>
        )}
        {doc.kind === "Unsorted" && (
          <label className="flex items-center gap-2">
            Belongs in
            <Select
              value={doc.book}
              onChange={(e) => {
                updateDoc(doc.id, { book: e.target.value as KnowledgeDoc["book"] });
                toast("Moved");
              }}
              className="!h-8 !w-auto"
            >
              <option value="project">Project book</option>
              <option value="legal">Legal book</option>
            </Select>
          </label>
        )}
        {doc.book === "legal" && (
          <span className="flex items-center gap-1.5">
            <Scales size={14} /> On legal questions the agent quotes the clause and suggests the buyer confirms with the agreement.
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Outline" className="hidden xl:block">
          <ul className="sticky top-6 grid gap-1 text-[13px]">
            {outline.map(({ p, i }) => (
              <li key={i}>
                <a href={`#p${i}`} className="block rounded px-2 py-1 text-fg-3 hover:bg-surface-2 hover:text-fg">
                  {p.slice(2)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="paper-surface min-w-0 rounded-[10px] border border-line px-5 py-8 sm:px-10 sm:py-12">
          <h2 className="display mb-8 text-[clamp(26px,3vw,36px)] text-fg">{doc.title}</h2>
          {showDiff && doc.previous ? (
            <Diff before={doc.previous.paras} after={doc.paras} />
          ) : (
            <div className="grid gap-0">
              {doc.paras.map((p, i) => {
                const facts = factsByPara.get(i) ?? [];
                if (p.startsWith("# ")) {
                  return (
                    <h3 key={i} id={`p${i}`} className="mb-3 mt-8 scroll-mt-24 text-[17px] font-semibold text-fg first:mt-0">
                      {p.slice(2)}
                    </h3>
                  );
                }
                return (
                  <div key={i} id={`p${i}`} className="grid scroll-mt-24 gap-x-8 gap-y-2 pb-4 lg:grid-cols-[minmax(0,64ch)_220px]">
                    <p className={`rounded px-2 py-1 -mx-2 text-[16px] leading-[1.7] text-fg ${highlight === i ? "bg-accent-soft" : ""}`}>{p}</p>
                    {facts.length > 0 && (
                      <ul className="grid content-start gap-2" aria-label="Facts from this paragraph">
                        {facts.map((f) => (
                          <FactChip key={f.id} fact={f} onConfirm={(v) => confirmFact(doc.id, f.id, v)} />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
      {doc.facts.length === 0 && doc.status === "draft" && (
        <p className="mt-4 max-w-[70ch] text-[13px] text-warn">
          No facts have been pulled out of this file yet, so it can&apos;t be approved. The document reader runs on the server and isn&apos;t connected in this preview.
          {doc.previous ? ` The agent keeps using v${doc.previous.version}.` : ""}
        </p>
      )}
      {doc.facts.length > 0 && (
        <p className="mt-4 text-[13px] text-fg-3">
          {unconfirmed === 0
            ? "Every fact is confirmed."
            : `${unconfirmed} ${unconfirmed === 1 ? "fact needs" : "facts need"} a check. Until confirmed, the agent says the team will confirm instead of quoting it.`}
        </p>
      )}
    </div>
  );
}

function FactChip({ fact, onConfirm }: { fact: Fact; onConfirm: (v: boolean) => void }) {
  return (
    <li className={`rounded-[var(--radius)] border px-3 py-2 text-[13px] ${fact.confirmed ? "border-line bg-surface-2" : "border-warn/60 bg-warn-soft"}`}>
      <span className="block text-fg-3">{fact.label}</span>
      <span className="block font-medium text-fg">{fact.value}</span>
      <span className="mt-1.5 flex items-center justify-between gap-2">
        {fact.confirmed ? (
          <span className="inline-flex items-center gap-1 text-good">
            <CheckCircle size={14} weight="fill" /> Confirmed
          </span>
        ) : (
          <span className="text-warn">Needs a check</span>
        )}
        <button type="button" onClick={() => onConfirm(!fact.confirmed)} className="text-fg-2 underline-offset-2 hover:text-fg hover:underline">
          {fact.confirmed ? "Undo" : "Confirm"}
        </button>
      </span>
    </li>
  );
}

function Diff({ before, after }: { before: string[]; after: string[] }) {
  const n = Math.max(before.length, after.length);
  const rows = Array.from({ length: n }, (_, i) => ({ a: before[i], b: after[i] }));
  const changed = rows.filter((r) => r.a !== r.b).length;
  return (
    <div className="grid gap-3">
      <p className="text-[13px] text-fg-3">
        {changed} {changed === 1 ? "paragraph" : "paragraphs"} changed. Removed text is struck through, new text is highlighted.
      </p>
      {rows.map((r, i) => {
        const heading = (r.b ?? r.a ?? "").startsWith("# ");
        if (r.a === r.b) {
          return heading ? (
            <h3 key={i} className="mt-4 text-[17px] font-semibold text-fg">
              {r.b!.slice(2)}
            </h3>
          ) : (
            <p key={i} className="text-[16px] leading-[1.7] text-fg-2">
              {r.b}
            </p>
          );
        }
        return (
          <div key={i} className="grid gap-1.5">
            {r.a && (
              <p className="rounded bg-crit-soft px-2 py-1 text-[16px] leading-[1.7] text-fg line-through decoration-crit/70">
                <span className="sr-only">Removed: </span>
                {r.a.replace(/^# /, "")}
              </p>
            )}
            {r.b && (
              <p className="rounded bg-good-soft px-2 py-1 text-[16px] leading-[1.7] text-fg">
                <span className="sr-only">Added: </span>
                {r.b.replace(/^# /, "")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
