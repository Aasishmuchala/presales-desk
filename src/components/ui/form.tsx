import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full min-w-0 rounded-[var(--radius)] border border-line bg-surface-2 px-3 text-sm text-fg placeholder:text-fg-3 transition-colors hover:border-line-strong focus:border-accent focus:outline-none disabled:opacity-50";

export function Input({ className = "", ...rest }: ComponentProps<"input">) {
  return <input className={`${control} h-9 ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: ComponentProps<"textarea">) {
  return <textarea className={`${control} py-2 leading-relaxed ${className}`} {...rest} />;
}

export function Select({ className = "", children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={`${control} h-9 cursor-pointer pr-8 ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-fg-3">{hint}</p>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full border transition-colors duration-150 disabled:opacity-45 ${
        checked ? "border-transparent bg-accent-fill" : "border-line-strong bg-surface-3"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full shadow transition-transform duration-150 ${
          checked ? "translate-x-[18px] bg-accent-ink" : "translate-x-[3px] bg-fg-3"
        }`}
      />
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  className = "",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className={`h-4 w-4 cursor-pointer rounded border-line-strong accent-[var(--accent-fill)] ${className}`}
    />
  );
}
