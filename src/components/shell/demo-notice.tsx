"use client";

import { useStore } from "@/lib/store";
import { dateLabel, hhmm } from "@/lib/format";
import { useIsPaused } from "@/lib/selectors";

/** A quiet strip that says this is sample data and shows the demo clock. */
export function DemoNotice() {
  const now = useStore((s) => Math.floor(s.nowMin));
  const paused = useIsPaused();
  const reset = useStore((s) => s.resetDemo);
  const toast = useStore((s) => s.toast);
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 border-b border-line px-4 py-1.5 text-[12px] text-fg-3 sm:px-6 lg:px-10">
      {paused && <span className="font-medium text-warn">Calling is paused</span>}
      <span>Sample data, nothing is dialled. Changes are saved in this browser.</span>
      <button
        type="button"
        onClick={() => {
          if (!window.confirm("Reset all sample data? Your bookings, approvals, lists and other changes will be lost.")) return;
          reset();
          toast("Sample data reset");
        }}
        className="font-medium text-fg-2 underline-offset-2 hover:text-fg hover:underline"
      >
        Reset
      </button>
      <span className="tnum font-mono">
        {dateLabel(0)} · {hhmm(now)} IST
      </span>
    </div>
  );
}
