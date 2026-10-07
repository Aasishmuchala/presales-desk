"use client";

import { useEffect } from "react";

export default function ConsoleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="max-w-xl pt-16">
      <p className="display text-[40px] text-fg">Something broke on this screen</p>
      <p className="mt-3 text-[15px] text-fg-2">The rest of the console still works. Try again, and if it keeps happening, tell us what you clicked.</p>
      <button type="button" onClick={reset} className="mt-6 h-10 rounded-full bg-accent-fill px-5 text-sm font-medium text-accent-ink">
        Try again
      </button>
    </div>
  );
}
