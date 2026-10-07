import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface-2 px-1.5 font-mono text-[11px] text-fg-2">
      {children}
    </kbd>
  );
}

export function Empty({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid place-items-start gap-3 rounded-[var(--radius)] border border-dashed border-line-strong px-6 py-10">
      <p className="display text-[26px] text-fg">{title}</p>
      {body && <div className="max-w-[56ch] text-[15px] text-fg-2">{body}</div>}
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-2 ${className}`} />;
}

export function Section({
  title,
  aside,
  children,
  className = "",
}: {
  title: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
        {aside && <div className="text-[13px] text-fg-3">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const parts = name.split(" ").filter(Boolean);
  const text = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-medium uppercase text-fg-2"
    >
      {text}
    </span>
  );
}
