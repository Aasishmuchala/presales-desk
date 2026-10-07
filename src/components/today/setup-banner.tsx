"use client";

import Link from "next/link";
import { useChecklist } from "../setup/checklist";
import { ArrowRight } from "../icons";

export function SetupBanner() {
  const steps = useChecklist();
  const left = steps.filter((s) => !s.done);
  if (left.length === 0) return null;
  return (
    <Link
      href="/setup"
      className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-accent/50 bg-accent-soft px-4 py-3 text-sm text-fg transition-colors hover:border-accent"
    >
      <span>
        <span className="font-medium">
          {left.length} setup {left.length === 1 ? "step" : "steps"} left.
        </span>{" "}
        <span className="text-fg-2">Next: {left[0].title.toLowerCase()}.</span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-accent" />
    </Link>
  );
}
