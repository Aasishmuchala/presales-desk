import type { ReactNode } from "react";

export type Tone = "neutral" | "accent" | "good" | "warn" | "crit" | "info";

const tones: Record<Tone, string> = {
  neutral: "border-line-strong text-fg-2",
  accent: "border-accent text-accent",
  good: "border-good/60 text-good bg-good-soft",
  warn: "border-warn/60 text-warn bg-warn-soft",
  crit: "border-crit/60 text-crit bg-crit-soft",
  info: "border-info/60 text-info",
};

export function Pill({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-[12px] font-medium leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function scoreTone(score: number): Tone {
  if (score >= 70) return "good";
  if (score >= 45) return "neutral";
  return "warn";
}

export function Score({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const tone = scoreTone(value);
  const color = tone === "good" ? "text-good" : tone === "warn" ? "text-fg-3" : "text-fg";
  if (size === "lg") return <span className={`display tnum text-[34px] ${color}`}>{value}</span>;
  return <span className={`tnum font-mono text-[13px] font-medium ${color}`}>{value > 0 ? value : "-"}</span>;
}
