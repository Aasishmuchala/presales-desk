"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "../icons";

/**
 * Side sheet. Pushes in from the right. On narrow screens it covers the page.
 * Escape closes it. Focus moves into the sheet when it opens and back when it closes.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  width = 480,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const returnTo = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (returnTo && document.contains(returnTo)) returnTo.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-[var(--overlay)] lg:hidden" onClick={onClose} aria-hidden="true" />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={typeof title === "string" ? title : undefined}
        style={{ ["--sheet-w" as string]: `${width}px` }}
        className="sheet-in fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-line bg-surface shadow-[var(--shadow)] outline-none sm:w-[var(--sheet-w)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0 text-[15px] font-medium text-fg">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-fg-3 hover:bg-surface-2 hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>
        <div className="scroll-y min-h-0 flex-1 px-5 py-5">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
      </aside>
    </>
  );
}
