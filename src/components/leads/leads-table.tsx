"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useStore } from "@/lib/store";
import { getRep, useProjectLeads, useSalesReps } from "@/lib/selectors";
import { useDraftList } from "@/lib/draft-list";
import { ago, inr, LANG_NAME, STAGE_LABEL } from "@/lib/format";
import type { Lang, Lead } from "@/lib/types";
import { Checkbox, Input, Select } from "../ui/form";
import { Pill, Score } from "../ui/pill";
import { Empty } from "../ui/misc";
import { CaretDown, Funnel, MagnifyingGlass, Phone, X } from "../icons";
import { LeadSheet } from "./lead-sheet";
import { STAGE_TONE, viewOf, type LeadView } from "./views";

type ColId = "phone" | "lang" | "source" | "rep" | "budget";
const OPTIONAL: { id: ColId; label: string }[] = [
  { id: "phone", label: "Phone" },
  { id: "lang", label: "Language" },
  { id: "source", label: "Source" },
  { id: "rep", label: "Sales person" },
  { id: "budget", label: "Budget" },
];
type SortKey = "name" | "score" | "touch";



const PAGE = 60;

export function LeadsTable({ view }: { view: LeadView }) {
  const router = useRouter();
  const all = useProjectLeads();
  const now = useStore((s) => s.nowMin);
  const updateLeads = useStore((s) => s.updateLeads);
  const toast = useStore((s) => s.toast);
  const setDraft = useDraftList((s) => s.set);
  const salesReps = useSalesReps();

  const [q, setQ] = useState("");
  const [langs, setLangs] = useState<Lang[]>([]);
  const [source, setSource] = useState("");
  const [rep, setRep] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: view === "hot" ? "score" : "touch", dir: -1 });
  const [cols, setCols] = useState<ColId[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(PAGE);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const assignRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assignOpen) return;
    const onDown = (e: MouseEvent) => !assignRef.current?.contains(e.target as Node) && setAssignOpen(false);
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setAssignOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [assignOpen]);

  // Transient UI closes when this route is hidden.
  useLayoutEffect(
    () => () => {
      setSheetId(null);
      setAssignOpen(false);
    },
    [],
  );

  const sources = useMemo(() => Array.from(new Set(all.map((l) => l.source))).sort(), [all]);
  const v = viewOf(view);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");
    const out = all.filter((l) => {
      if (!v.match(l)) return false;
      if (langs.length && !langs.includes(l.lang)) return false;
      if (source && l.source !== source) return false;
      if (rep && l.repId !== rep) return false;
      if (minScore && l.score < minScore) return false;
      if (needle) {
        const hit =
          l.name.toLowerCase().includes(needle) ||
          (digits.length >= 3 && l.phone.replace(/\D/g, "").includes(digits)) ||
          l.source.toLowerCase().includes(needle) ||
          l.config.toLowerCase().includes(needle);
        if (!hit) return false;
      }
      return true;
    });
    out.sort((a, b) => {
      const d =
        sort.key === "name" ? a.name.localeCompare(b.name) : sort.key === "score" ? a.score - b.score : a.lastTouch - b.lastTouch;
      return d * sort.dir;
    });
    return out;
  }, [all, v, q, langs, source, rep, minScore, sort]);

  const visible = rows.slice(0, limit);
  const filtered = !!(q || langs.length || source || rep || minScore);
  const allVisibleSelected = visible.length > 0 && visible.every((l) => selected.has(l.id));

  useEffect(() => {
    // Drop selections that are no longer in the list.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep selection consistent with filters
    setSelected((s) => {
      const ids = new Set(rows.map((r) => r.id));
      const next = new Set([...s].filter((id) => ids.has(id)));
      return next.size === s.size ? s : next;
    });
  }, [rows]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }));

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, i: number, l: Lead) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      rowRefs.current[i + 1]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      rowRefs.current[i - 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      router.push(`/leads/${l.id}`);
    } else if (e.key === " ") {
      e.preventDefault();
      setSheetId(l.id);
    } else if (e.key.toLowerCase() === "x") {
      toggle(l.id, !selected.has(l.id));
    }
  };

  const clearFilters = () => {
    setQ("");
    setLangs([]);
    setSource("");
    setRep("");
    setMinScore(0);
  };

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
          <label htmlFor="lead-search" className="sr-only">
            Search leads
          </label>
          <Input id="lead-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, source or BHK" className="pl-9" />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Language">
          {(["EN", "HI", "TE"] as Lang[]).map((l) => {
            const on = langs.includes(l);
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                onClick={() => setLangs((s) => (on ? s.filter((x) => x !== l) : [...s, l]))}
                className={`h-9 rounded-full border px-3 text-[13px] transition-colors ${on ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-2 hover:border-line-strong hover:text-fg"}`}
              >
                {LANG_NAME[l]}
              </button>
            );
          })}
        </div>
        <label htmlFor="f-source" className="sr-only">
          Source
        </label>
        <Select id="f-source" value={source} onChange={(e) => setSource(e.target.value)} className="!w-auto rounded-full">
          <option value="">Any source</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <label htmlFor="f-rep" className="sr-only">
          Sales person
        </label>
        <Select id="f-rep" value={rep} onChange={(e) => setRep(e.target.value)} className="!w-auto rounded-full">
          <option value="">Anyone</option>
          {salesReps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
        <label htmlFor="f-score" className="sr-only">
          Minimum score
        </label>
        <Select id="f-score" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="!w-auto rounded-full">
          <option value={0}>Any score</option>
          <option value={45}>Score 45+</option>
          <option value={70}>Score 70+</option>
          <option value={85}>Score 85+</option>
        </Select>
        {filtered && (
          <button type="button" onClick={clearFilters} className="inline-flex h-9 items-center gap-1 px-2 text-[13px] text-fg-3 hover:text-fg">
            <X size={14} /> Clear
          </button>
        )}
        <div className="ml-auto">
          <ColumnChooser cols={cols} setCols={setCols} />
        </div>
      </div>

      {/* Bulk bar */}
      <div className="mt-4 flex min-h-10 flex-wrap items-center gap-3 text-[13px] text-fg-3">
        {selected.size > 0 ? (
          <>
            <span className="text-fg">
              <span className="tnum font-mono">{selected.size}</span> selected
            </span>
            <button
              type="button"
              onClick={() => {
                setDraft([...selected], "Picked by hand");
                router.push("/who-to-call/new");
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-fg hover:border-accent hover:text-accent"
            >
              <Phone size={14} /> Add to a calling list
            </button>
            <div ref={assignRef} className="relative">
              <button
                type="button"
                aria-expanded={assignOpen}
                onClick={() => setAssignOpen((o) => !o)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-fg hover:bg-surface-2"
              >
                Assign to <CaretDown size={12} />
              </button>
              {assignOpen && (
                <ul className="rise-in absolute left-0 top-full z-30 mt-1 w-56 rounded-[var(--radius)] border border-line-strong bg-surface-3 p-1 shadow-[var(--shadow)]">
                  {salesReps.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          updateLeads([...selected], { repId: r.id });
                          toast(`${selected.size} leads assigned to ${r.name}.`, "good");
                          setSelected(new Set());
                          setAssignOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
                      >
                        {r.name}
                        {!r.available && <span className="text-[12px] text-fg-3">off today</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" onClick={() => setSelected(new Set())} className="px-1 text-fg-3 hover:text-fg">
              Clear selection
            </button>
          </>
        ) : (
          <span>
            <span className="tnum font-mono text-fg-2">{rows.length}</span> {rows.length === 1 ? "lead" : "leads"}
            {filtered ? " match" : ""}. Click a row to preview, Enter to open.
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <Empty
          title={filtered ? "No leads match" : `No ${v.label.toLowerCase()} leads`}
          body={
            filtered ? (
              <>
                Nothing in <span className="text-fg">{v.label}</span> matches these filters.
              </>
            ) : (
              "Leads move here when the agent hears it on a call."
            )
          }
          action={
            filtered ? (
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-accent hover:underline">
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-[var(--radius)] border border-line bg-surface md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[12px] text-fg-3">
                  <th className="w-10 px-4 py-2.5">
                    <Checkbox
                      label="Select all shown"
                      checked={allVisibleSelected}
                      onChange={(on) =>
                        setSelected((s) => {
                          const n = new Set(s);
                          visible.forEach((l) => (on ? n.add(l.id) : n.delete(l.id)));
                          return n;
                        })
                      }
                    />
                  </th>
                  <SortTh label="Lead" k="name" sort={sort} onSort={toggleSort} />
                  <SortTh label="Score" k="score" sort={sort} onSort={toggleSort} className="w-20" />
                  <th className="px-3 py-2.5 font-medium">Stage</th>
                  <th className="px-3 py-2.5 font-medium">Next step</th>
                  {cols.includes("phone") && <th className="px-3 py-2.5 font-medium">Phone</th>}
                  {cols.includes("lang") && <th className="px-3 py-2.5 font-medium">Language</th>}
                  {cols.includes("source") && <th className="px-3 py-2.5 font-medium">Source</th>}
                  {cols.includes("rep") && <th className="px-3 py-2.5 font-medium">Sales person</th>}
                  {cols.includes("budget") && <th className="px-3 py-2.5 font-medium">Budget</th>}
                  <SortTh label="Last touch" k="touch" sort={sort} onSort={toggleSort} className="w-32 text-right" alignRight />
                </tr>
              </thead>
              <tbody>
                {visible.map((l, i) => (
                  <tr
                    key={l.id}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    tabIndex={0}
                    onClick={() => setSheetId(l.id)}
                    onKeyDown={(e) => onRowKey(e, i, l)}
                    aria-selected={sheetId === l.id}
                    className={`cursor-pointer border-b border-line/60 outline-none transition-colors last:border-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:shadow-[inset_2px_0_0_var(--accent-fill)] ${sheetId === l.id ? "bg-surface-2" : ""}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox label={`Select ${l.name}`} checked={selected.has(l.id)} onChange={(on) => toggle(l.id, on)} />
                    </td>
                    <td className="max-w-[380px] px-3 py-3">
                      <span className="block truncate font-medium text-fg">{l.name}</span>
                      <span className="block truncate text-[13px] text-fg-3">{l.summary}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Score value={l.score} />
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={STAGE_TONE[l.stage]}>{STAGE_LABEL[l.stage]}</Pill>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-fg-2">{l.nextStep}</td>
                    {cols.includes("phone") && <td className="tnum whitespace-nowrap px-3 py-3 font-mono text-[13px] text-fg-2">{l.phone}</td>}
                    {cols.includes("lang") && <td className="px-3 py-3 text-fg-2">{LANG_NAME[l.lang]}</td>}
                    {cols.includes("source") && <td className="whitespace-nowrap px-3 py-3 text-fg-2">{l.source}</td>}
                    {cols.includes("rep") && <td className="whitespace-nowrap px-3 py-3 text-fg-2">{getRep(l.repId)?.name}</td>}
                    {cols.includes("budget") && <td className="tnum whitespace-nowrap px-3 py-3 text-fg-2">{inr(l.budgetLakh)}</td>}
                    <td className="tnum whitespace-nowrap px-3 py-3 text-right text-[13px] text-fg-3">{ago(l.lastTouch, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone cards */}
          <ul className="grid gap-2 md:hidden">
            {visible.map((l) => (
              <li key={l.id} className="flex items-start gap-3 rounded-[var(--radius)] border border-line bg-surface p-3.5">
                <Checkbox label={`Select ${l.name}`} checked={selected.has(l.id)} onChange={(on) => toggle(l.id, on)} className="mt-1" />
                <Link href={`/leads/${l.id}`} className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-fg">{l.name}</span>
                    <Score value={l.score} />
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[13px] text-fg-3">{l.summary}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill tone={STAGE_TONE[l.stage]}>{STAGE_LABEL[l.stage]}</Pill>
                    <span className="text-[12px] text-fg-3">{ago(l.lastTouch, now)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {rows.length > limit && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE)}
                className="h-9 rounded-full border border-line-strong px-4 text-sm text-fg-2 hover:text-fg"
              >
                Show {Math.min(PAGE, rows.length - limit)} more of {rows.length - limit}
              </button>
            </div>
          )}
        </>
      )}

      <LeadSheet id={sheetId} onClose={() => setSheetId(null)} />
    </div>
  );
}

function SortTh({
  label,
  k,
  sort,
  onSort,
  className = "",
  alignRight,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  className?: string;
  alignRight?: boolean;
}) {
  const active = sort.key === k;
  return (
    <th className={`px-3 py-2.5 font-medium ${className}`} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 hover:text-fg ${active ? "text-fg" : ""} ${alignRight ? "flex-row-reverse" : ""}`}
      >
        {label}
        <CaretDown size={11} className={`transition-transform ${active ? "" : "opacity-0"} ${active && sort.dir === 1 ? "rotate-180" : ""}`} />
      </button>
    </th>
  );
}

function ColumnChooser({ cols, setCols }: { cols: ColId[]; setCols: (fn: (c: ColId[]) => ColId[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => () => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] text-fg-2 hover:border-line-strong hover:text-fg"
      >
        <Funnel size={14} /> Columns
      </button>
      {open && (
        <div className="rise-in absolute right-0 top-full z-30 mt-1 w-52 rounded-[var(--radius)] border border-line-strong bg-surface-3 p-2 shadow-[var(--shadow)]">
          {OPTIONAL.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm text-fg hover:bg-surface-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--accent-fill)]"
                checked={cols.includes(c.id)}
                onChange={(e) => setCols((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))}
              />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
