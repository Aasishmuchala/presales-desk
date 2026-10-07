"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/brand";
import { useIsPaused, useNeeds } from "@/lib/selectors";
import { Books, Gear, MagnifyingGlass, Pulse, SignOut, UserCircle, Users } from "../icons";
import { Kbd } from "../ui/misc";
import { usePalette } from "./palette-state";
import { ProjectSwitcher } from "./project-switcher";
import { ThemeToggle } from "./theme-toggle";

export const PLACES = [
  { href: "/today", label: "Today", icon: Pulse },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/knowledge", label: "Knowledge", icon: Books },
  { href: "/setup", label: "Setup", icon: Gear },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function Rail() {
  const isActive = useActive();
  const needs = useNeeds().filter((n) => n.kind !== "questions").length;
  const paused = useIsPaused();
  const openPalette = usePalette((s) => s.setOpen);

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col border-r border-line bg-surface md:flex lg:w-[232px]"
    >
      <div className="flex h-14 items-center gap-2 px-4 lg:px-5">
        <Link href="/today" className="flex items-center gap-2.5 text-fg" aria-label={`${APP_NAME} home`}>
          <span className="display grid h-8 w-8 place-items-center rounded-full bg-accent-fill text-[15px] text-accent-ink">P</span>
          <span className="display hidden text-[17px] lg:inline">{APP_NAME}</span>
        </Link>
      </div>
      <div className="px-3 lg:px-3">
        <div className="hidden lg:block">
          <ProjectSwitcher />
        </div>
        <div className="lg:hidden">
          <ProjectSwitcher compact />
        </div>
      </div>
      <ul className="mt-5 grid gap-1 px-3">
        {PLACES.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                title={label}
                className={`flex h-11 items-center gap-3 rounded-[var(--radius)] px-3 text-[15px] transition-colors max-lg:justify-center ${
                  active ? "bg-surface-3 text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} className={active ? "text-accent" : ""} />
                <span className="hidden flex-1 lg:inline">{label}</span>
                {href === "/today" && needs > 0 && (
                  <span className="tnum hidden h-5 min-w-5 items-center justify-center rounded-full bg-accent-fill px-1.5 font-mono text-[11px] font-medium text-accent-ink lg:inline-flex">
                    {needs}
                  </span>
                )}
                {href === "/today" && paused && (
                  <span className="hidden text-[11px] text-warn lg:inline">Paused</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto grid gap-1 px-3 pb-4">
        <button
          type="button"
          onClick={() => openPalette(true)}
          className="flex h-9 items-center gap-2.5 rounded-[var(--radius)] px-2.5 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg max-lg:justify-center"
          aria-label="Search and commands"
        >
          <MagnifyingGlass size={18} />
          <span className="hidden flex-1 text-left lg:inline">Search</span>
          <span className="hidden gap-1 lg:inline-flex">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <div className="max-lg:flex max-lg:justify-center">
          <ThemeToggle withLabel />
        </div>
        <Link
          href="/me"
          className="flex h-9 items-center gap-2.5 rounded-[var(--radius)] px-2.5 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg max-lg:justify-center"
          title="Open the sales person's app"
        >
          <UserCircle size={18} />
          <span className="hidden lg:inline">Sales person&apos;s app</span>
        </Link>
        <div className="mt-2 flex items-center gap-2.5 border-t border-line px-2.5 pt-3 max-lg:justify-center">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-medium text-fg-2">AV</span>
          <span className="hidden min-w-0 flex-1 lg:block">
            <span className="block truncate text-[13px] text-fg">Anand Varma</span>
            <span className="block text-[12px] text-fg-3">Sales manager</span>
          </span>
          <Link href="/" className="hidden text-fg-3 hover:text-fg lg:inline" aria-label="Sign out" title="Sign out">
            <SignOut size={16} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function MobileTopBar() {
  const openPalette = usePalette((s) => s.setOpen);
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur md:hidden">
      <div className="min-w-0 flex-1">
        <ProjectSwitcher />
      </div>
      <button
        type="button"
        onClick={() => openPalette(true)}
        aria-label="Search and commands"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-fg-2 hover:bg-surface-2"
      >
        <MagnifyingGlass size={19} />
      </button>
      <ThemeToggle />
    </div>
  );
}

export function MobileBottomNav() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {PLACES.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[12px] ${active ? "text-fg" : "text-fg-3"}`}
              >
                <Icon size={22} weight={active ? "fill" : "regular"} className={active ? "text-accent" : ""} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
