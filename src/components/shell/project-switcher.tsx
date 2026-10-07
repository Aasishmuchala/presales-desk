"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { PROJECTS } from "@/lib/mock/seed";
import { useProject } from "@/lib/selectors";
import { Buildings, CaretDown, Check } from "../icons";

export function ProjectSwitcher({ compact = false }: { compact?: boolean }) {
  const project = useProject();
  const setProject = useStore((s) => s.setProject);
  const toast = useStore((s) => s.toast);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close when the route hides this component.
  useLayoutEffect(() => () => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Project: ${project.name}. Change project`}
        className={`flex w-full items-center gap-2.5 rounded-[var(--radius)] text-left transition-colors hover:bg-surface-2 ${
          compact ? "h-10 justify-center px-0" : "px-2.5 py-2"
        }`}
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent-soft text-accent">
          <Buildings size={17} weight="duotone" />
        </span>
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">{project.name}</span>
              <span className="block truncate text-[12px] text-fg-3">{project.locality}</span>
            </span>
            <CaretDown size={14} className="shrink-0 text-fg-3" />
          </>
        )}
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Projects"
          className="rise-in absolute left-0 top-full z-50 mt-1 w-64 rounded-[var(--radius)] border border-line-strong bg-surface-3 p-1 shadow-[var(--shadow)]"
        >
          {PROJECTS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={p.id === project.id}
                onClick={() => {
                  setProject(p.id);
                  setOpen(false);
                  if (p.id !== project.id) {
                    toast(`Showing ${p.name}`);
                    // A single lead, document, list or call belongs to one project, so go up a level.
                    const up = sectionRoot(pathname);
                    if (up) router.push(up);
                  }
                }}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-fg">{p.name}</span>
                  <span className="block text-[12px] text-fg-3">
                    {p.locality} · RERA <span className="font-mono">{p.rera}</span>
                  </span>
                </span>
                {p.id === project.id && <Check size={15} className="text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function sectionRoot(path: string) {
  if (/^\/leads\/[^/]+-L\d+/.test(path)) return "/leads";
  if (path.startsWith("/knowledge/doc/")) return "/knowledge";
  if (/^\/who-to-call\/(?!new$)/.test(path)) return "/leads/who-to-call";
  if (path.startsWith("/review/")) return "/today/review";
  return null;
}
