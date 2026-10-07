"use client";

import { useStore } from "@/lib/store";
import { CheckCircle, Warning, X } from "../icons";

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  const deskOpen = useStore((s) => s.desk !== null);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4 ${
        deskOpen ? "bottom-[150px] md:bottom-[96px]" : "bottom-[84px] md:bottom-6"
      }`}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rise-in pointer-events-auto flex max-w-[min(560px,100%)] items-start gap-3 rounded-[var(--radius)] border border-line-strong bg-surface-3 px-4 py-3 text-sm text-fg shadow-[var(--shadow)]"
        >
          {t.tone === "good" ? (
            <CheckCircle size={18} className="mt-px shrink-0 text-good" weight="fill" />
          ) : t.tone === "warn" || t.tone === "crit" ? (
            <Warning size={18} className={`mt-px shrink-0 ${t.tone === "crit" ? "text-crit" : "text-warn"}`} weight="fill" />
          ) : null}
          <span className="min-w-0">{t.text}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="-mr-1 shrink-0 rounded p-0.5 text-fg-3 hover:text-fg"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
