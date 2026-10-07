"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "../icons";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const getTheme = () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

export function toggleTheme() {
  const next = getTheme() === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("psd-theme", next);
  } catch {
    /* storage blocked */
  }
}

export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, () => "dark" as const);
}

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const theme = useTheme();
  const label = theme === "light" ? "Switch to dark" : "Switch to light";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="inline-flex h-9 items-center gap-2.5 rounded-[var(--radius)] px-2.5 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      {withLabel && <span className="hidden lg:inline">{theme === "light" ? "Dark" : "Light"}</span>}
    </button>
  );
}
