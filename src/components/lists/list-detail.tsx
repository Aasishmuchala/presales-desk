"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { getRep, useLeadMap } from "@/lib/selectors";
import { ago, num, sentence, STAGE_LABEL, when } from "@/lib/format";
import { PageHeader } from "../ui/page-header";
import { Button } from "../ui/button";
import { Empty } from "../ui/misc";
import { Pill, Score } from "../ui/pill";
import { Pause, Play } from "../icons";
import { STAGE_TONE } from "../leads/views";
import { LIST_STATUS } from "./lists-overview";
import { useListProgress } from "./progress";

export function ListDetail({ id }: { id: string }) {
  const list = useStore((s) => s.lists.find((l) => l.id === id));
  if (!list) {
    return (
      <div className="pt-10">
        <Empty
          title="This list isn't here"
          body="It may belong to another project."
          action={
            <Link href="/leads/who-to-call" className="text-sm font-medium text-accent hover:underline">
              All calling lists
            </Link>
          }
        />
      </div>
    );
  }
  return <Inner id={id} />;
}

function Inner({ id }: { id: string }) {
  const list = useStore((s) => s.lists.find((l) => l.id === id))!;
  const setStatus = useStore((s) => s.setListStatus);
  const toast = useStore((s) => s.toast);
  const now = useStore((s) => s.nowMin);
  const leadMap = useLeadMap();
  const p = useListProgress(list);
  const st = LIST_STATUS[list.status];
  const leads = list.leadIds.map((x) => leadMap.get(x)).filter((l) => !!l);
  const left = Math.max(0, leads.length - p.called);

  const status =
    list.status === "running"
      ? `Calling now. ${num(left)} leads still to call.`
      : list.status === "paused"
        ? `Paused. ${num(left)} leads still to call. Resuming keeps their place in the queue.`
        : list.status === "scheduled"
          ? `Starts ${sentence(when(list.startsAt))}.`
          : "Finished. Every lead was tried.";

  return (
    <div>
      <PageHeader
        back={{ href: "/leads/who-to-call", label: "Who to call" }}
        title={list.name}
        status={
          <span className="flex flex-wrap items-center gap-3">
            <Pill tone={st.tone}>{st.label}</Pill>
            {status}
          </span>
        }
        action={
          list.status === "running" ? (
            <Button
              variant="primary"
              size="lg"
              icon={<Pause size={17} weight="fill" />}
              onClick={() => {
                setStatus(list.id, "paused");
                toast("List paused", "warn");
              }}
            >
              Pause
            </Button>
          ) : list.status === "paused" || list.status === "scheduled" ? (
            <Button
              variant="primary"
              size="lg"
              icon={<Play size={17} weight="fill" />}
              onClick={() => {
                setStatus(list.id, "running");
                toast("Calling this list now", "good");
              }}
            >
              {list.status === "scheduled" ? "Start now" : "Resume"}
            </Button>
          ) : undefined
        }
      />

      <dl className="mt-8 grid grid-cols-2 gap-y-6 border-y border-line py-6 sm:grid-cols-4 sm:divide-x sm:divide-line">
        <Big k="Leads" v={leads.length} />
        <Big k="Called" v={p.called} />
        <Big k="Talked" v={p.talked} />
        <Big k="Visits booked" v={p.booked} accent />
      </dl>

      <p className="mt-6 text-sm text-fg-2">
        Opens with <span className="text-fg">{list.script}</span>. Language: <span className="text-fg">{list.langPolicy.toLowerCase()}</span>. Made by {list.createdBy}.
      </p>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold text-fg">Leads in this list</h2>
        {leads.length === 0 ? (
          <Empty title="No leads in this list" body="Leads may have moved to another project or been removed in the CRM." />
        ) : (
          <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
            {leads.slice(0, 80).map((l) => (
              <li key={l.id}>
                <Link href={`/leads/${l.id}`} className="flex items-center gap-4 px-4 py-3 text-sm hover:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-fg">{l.name}</span>
                    <span className="block truncate text-[13px] text-fg-3">{getRep(l.repId)?.name}</span>
                  </span>
                  <Score value={l.score} />
                  <Pill tone={STAGE_TONE[l.stage]}>{STAGE_LABEL[l.stage]}</Pill>
                  <span className="tnum hidden w-24 text-right text-[13px] text-fg-3 sm:inline">{ago(l.lastTouch, now)}</span>
                </Link>
              </li>
            ))}
            {leads.length > 80 && <li className="px-4 py-3 text-[13px] text-fg-3">And {leads.length - 80} more.</li>}
          </ul>
        )}
      </section>
    </div>
  );
}

function Big({ k, v, accent }: { k: string; v: number; accent?: boolean }) {
  return (
    <div className="min-w-0 sm:px-6 sm:first:pl-0">
      <dt className="text-[13px] text-fg-3">{k}</dt>
      <dd className={`tnum display mt-2 text-[clamp(30px,4vw,44px)] ${accent ? "text-accent" : "text-fg"}`}>{num(v)}</dd>
    </div>
  );
}
