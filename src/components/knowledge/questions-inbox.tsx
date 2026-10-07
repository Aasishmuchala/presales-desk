"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useLeadMap } from "@/lib/selectors";
import { ago } from "@/lib/format";
import type { Question } from "@/lib/types";
import { Button } from "../ui/button";
import { Field, Select, Textarea } from "../ui/form";
import { Empty } from "../ui/misc";
import { CheckCircle } from "../icons";

export function QuestionsInbox() {
  const questions = useStore((s) => s.questions);
  const projectId = useStore((s) => s.projectId);
  const mine = questions.filter((q) => q.projectId === projectId);
  const open = mine.filter((q) => !q.answer).sort((a, b) => b.asked - a.asked);
  const answered = mine.filter((q) => q.answer);

  const cats = Array.from(new Set(mine.map((q) => q.category))).sort();

  return (
    <div className="grid gap-10">
      <section aria-label="Coverage">
        <p className="mb-3 text-sm text-fg-2">
          When the agent can&apos;t find an answer in an approved document, it tells the lead the team will confirm on WhatsApp, and the question lands here. Answer it once and the agent uses your answer from the next call.
        </p>
        <ul className="flex flex-wrap gap-2">
          {cats.map((c) => {
            const all = mine.filter((q) => q.category === c);
            const done = all.filter((q) => q.answer).length;
            return (
              <li key={c} className="rounded-full border border-line px-3 py-1 text-[13px] text-fg-2">
                {c} <span className={`tnum ml-1 font-mono ${done === all.length ? "text-good" : "text-fg-3"}`}>{done}/{all.length}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-fg">
          Waiting for an answer <span className="tnum ml-1 font-mono text-[13px] font-normal text-fg-3">{open.length}</span>
        </h2>
        {open.length === 0 ? (
          <Empty title="Every question has an answer" body="New ones appear here the moment a lead asks something the documents don't cover." />
        ) : (
          <ul className="grid gap-3">
            {open.map((q) => (
              <QuestionCard key={q.id} q={q} />
            ))}
          </ul>
        )}
      </section>

      {answered.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-fg">
            Answered <span className="tnum ml-1 font-mono text-[13px] font-normal text-fg-3">{answered.length}</span>
          </h2>
          <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
            {answered.map((q) => (
              <li key={q.id} className="px-4 py-3.5">
                <p className="flex items-start gap-2 text-sm font-medium text-fg">
                  <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-good" />
                  {q.text}
                </p>
                <p className="mt-1 pl-6 text-[13px] text-fg-2">{q.answer!.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function QuestionCard({ q }: { q: Question }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [docId, setDocId] = useState<string>("");
  const docs = useStore((s) => s.docs);
  const now = useStore((s) => s.nowMin);
  const answer = useStore((s) => s.answerQuestion);
  const toast = useStore((s) => s.toast);
  const leadMap = useLeadMap();
  const lead = leadMap.get(q.leadId);
  const sources = docs.filter((d) => d.projectId === q.projectId && d.status === "approved");

  useLayoutEffect(() => () => setOpen(false), []);

  return (
    <li className="rounded-[var(--radius)] border border-line bg-surface p-4 sm:p-5">
      <blockquote className="display text-[clamp(19px,2vw,23px)] leading-snug text-fg">“{q.quote}”</blockquote>
      <p className="mt-3 text-sm text-fg-2">{q.text}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-3">
        <span>
          Asked <span className="tnum font-mono text-fg-2">{q.asked}</span> {q.asked === 1 ? "time" : "times"}
        </span>
        <span>{q.category}</span>
        <span>Last {ago(q.lastAsked, now).toLowerCase()}</span>
        {lead && (
          <Link href={`/leads/${lead.id}`} className="hover:text-fg hover:underline">
            {lead.name}
          </Link>
        )}
      </p>
      {open ? (
        <form
          className="rise-in mt-4 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            answer(q.id, text.trim(), docId || null);
            toast("Saved. The agent uses this answer from the next call.", "good");
          }}
        >
          <Field label="Your answer" htmlFor={`ans-${q.id}`} hint="Write it the way you'd say it to a buyer. The agent will say it in their language.">
            <Textarea id={`ans-${q.id}`} rows={3} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          </Field>
          <Field label="Source" htmlFor={`src-${q.id}`}>
            <Select id={`src-${q.id}`} value={docId} onChange={(e) => setDocId(e.target.value)}>
              <option value="">My own answer, no document</option>
              {sources.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} v{d.version}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" type="submit" disabled={!text.trim()}>
              Save answer
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            Answer
          </Button>
        </div>
      )}
    </li>
  );
}
