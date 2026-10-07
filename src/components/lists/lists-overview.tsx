"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useLeadMap } from "@/lib/selectors";
import { num, sentence, when } from "@/lib/format";
import type { CallingList } from "@/lib/types";
import { Pill, type Tone } from "../ui/pill";
import { Empty } from "../ui/misc";
import { useListProgress } from "./progress";

export const LIST_STATUS: Record<CallingList["status"], { label: string; tone: Tone }> = {
  running: { label: "Calling", tone: "accent" },
  paused: { label: "Paused", tone: "warn" },
  scheduled: { label: "Scheduled", tone: "info" },
  done: { label: "Finished", tone: "neutral" },
};

export function ListsOverview() {
  const lists = useStore((s) => s.lists);
  const projectId = useStore((s) => s.projectId);
  const mine = lists.filter((l) => l.projectId === projectId);
  if (mine.length === 0) {
    return (
      <Empty
        title="No calling lists yet"
        body="A calling list is a group of leads, an opening line and a time window. Pick leads from any view and press Call these."
        action={
          <Link href="/who-to-call/new" className="text-sm font-medium text-accent hover:underline">
            Make the first list
          </Link>
        }
      />
    );
  }
  return (
    <ul className="grid gap-3">
      {mine.map((l) => (
        <ListRow key={l.id} list={l} />
      ))}
    </ul>
  );
}

function ListRow({ list }: { list: CallingList }) {
  const p = useListProgress(list);
  const setStatus = useStore((s) => s.setListStatus);
  const toast = useStore((s) => s.toast);
  const leadMap = useLeadMap();
  const st = LIST_STATUS[list.status];
  const total = list.leadIds.filter((id) => leadMap.has(id)).length;
  return (
    <li className="rounded-[var(--radius)] border border-line bg-surface transition-colors hover:border-line-strong">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <Link href={`/who-to-call/${list.id}`} className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2.5">
            <span className="text-[15px] font-medium text-fg">{list.name}</span>
            <Pill tone={st.tone}>{st.label}</Pill>
          </span>
          <span className="mt-1 block text-[13px] text-fg-3">
            {num(total)} leads · opens with “{list.script}” · {list.status === "scheduled" ? `starts ${sentence(when(list.startsAt))}` : `by ${list.createdBy}`}
          </span>
        </Link>
        <dl className="grid grid-cols-3 gap-6 text-right sm:w-[300px]">
          <Mini k="Called" v={p.called} />
          <Mini k="Talked" v={p.talked} />
          <Mini k="Booked" v={p.booked} accent />
        </dl>
        <div className="flex shrink-0 justify-end">
          {list.status === "running" ? (
            <button
              type="button"
              onClick={() => {
                setStatus(list.id, "paused");
                toast(`Paused “${list.name}”`, "warn");
              }}
              className="h-8 rounded-full border border-line-strong px-3 text-[13px] text-fg hover:bg-surface-2"
            >
              Pause
            </button>
          ) : list.status === "paused" ? (
            <button
              type="button"
              onClick={() => {
                setStatus(list.id, "running");
                toast(`Calling “${list.name}” again`, "good");
              }}
              className="h-8 rounded-full border border-accent px-3 text-[13px] text-accent hover:bg-accent-soft"
            >
              Resume
            </button>
          ) : (
            <span className="w-[74px]" />
          )}
        </div>
      </div>
      <div className="h-0.5 overflow-hidden rounded-b-[var(--radius)] bg-line">
        <span className="block h-full bg-accent-fill" style={{ width: `${total ? Math.min(100, (p.called / total) * 100) : 0}%` }} />
      </div>
    </li>
  );
}

function Mini({ k, v, accent }: { k: string; v: number; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[12px] text-fg-3">{k}</dt>
      <dd className={`tnum display mt-1 text-[22px] ${accent ? "text-accent" : "text-fg"}`}>{num(v)}</dd>
    </div>
  );
}
