"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "../icons";

export interface TabItem {
  href: string;
  label: string;
  count?: number;
  /** Treat the tab as active when the path starts with href (default) or matches exactly. */
  exact?: boolean;
}

export function PageHeader({
  title,
  status,
  action,
  tabs,
  back,
  size = "lg",
}: {
  title: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
  tabs?: TabItem[];
  back?: { href: string; label: string };
  size?: "lg" | "xl";
}) {
  return (
    <header className="pb-1 pt-6 md:pt-10">
      {back && (
        <Link
          href={back.href}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-fg-3 transition-colors hover:text-fg"
        >
          <ArrowLeft size={14} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <h1
            className={`display min-w-0 [overflow-wrap:anywhere] text-fg ${size === "xl" ? "text-[clamp(34px,5vw,56px)]" : "text-[clamp(30px,4vw,40px)]"}`}
          >
            {title}
          </h1>
          {status && <div className="mt-3 max-w-[70ch] text-[15px] text-fg-2">{status}</div>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {tabs && <Tabs items={tabs} />}
    </header>
  );
}

export function Tabs({ items }: { items: TabItem[] }) {
  const pathname = usePathname();
  // The longest matching href wins so nested tabs don't all light up.
  const active = items
    .filter((t) => (t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(`${t.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <nav aria-label="Sections" className="-mx-1 mt-6 overflow-x-auto overflow-y-hidden border-b border-line [scrollbar-width:none]">
      <ul className="flex min-w-max gap-1 px-1">
        {items.map((t) => {
          const isActive = active?.href === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative inline-flex h-10 items-center gap-2 px-3 text-sm transition-colors ${
                  isActive ? "text-fg" : "text-fg-3 hover:text-fg"
                }`}
              >
                {t.label}
                {typeof t.count === "number" && (
                  <span className={`tnum font-mono text-[12px] ${isActive ? "text-accent" : "text-fg-3"}`}>{t.count}</span>
                )}
                {isActive && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent-fill" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
