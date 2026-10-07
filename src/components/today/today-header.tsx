"use client";

import { useStore } from "@/lib/store";
import { hhmm } from "@/lib/format";
import { useCallingWindow, useIsPaused, useNeeds, useTodayCalls, useUpcomingCount } from "@/lib/selectors";
import { PageHeader } from "../ui/page-header";
import { Button } from "../ui/button";
import { Pause, Play } from "../icons";

export function TodayHeader() {
  const paused = useIsPaused();
  const pauses = useStore((s) => s.pauses);
  const pause = useStore((s) => s.pauseCalling);
  const resume = useStore((s) => s.resumeCalling);
  const toast = useStore((s) => s.toast);
  const callTo = useStore((s) => s.rules.callTo);
  const now = useStore((s) => Math.floor(s.nowMin));
  const upcoming = useUpcomingCount();
  const win = useCallingWindow();
  const needs = useNeeds();
  const calls = useTodayCalls();
  const reviewed = useStore((s) => s.reviewed);
  const toReview = calls.filter((c) => c.qa && !reviewed[c.id] && c.start + c.durationSec / 60 <= now).length;
  const needCount = needs.filter((n) => n.kind !== "questions").length;

  let status: string;
  if (paused) {
    const since = pauses[pauses.length - 1].from;
    status = `Calling is paused since ${hhmm(since)}. Calls already in progress will finish.`;
  } else if (now >= win.to) {
    status = `Calling has stopped for the day. It starts again at ${hhmm(win.from)} tomorrow.`;
  } else if (now < win.from) {
    status = `Calling starts at ${hhmm(win.from)}.`;
  } else {
    status = `Calling until ${callTo}. ${upcoming} more calls planned today.`;
  }

  return (
    <PageHeader
      title="Today"
      size="xl"
      status={status}
      action={
        paused ? (
          <Button
            variant="primary"
            size="lg"
            icon={<Play size={17} weight="fill" />}
            onClick={() => {
              resume();
              toast("Calling resumed", "good");
            }}
          >
            Resume calling
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            icon={<Pause size={17} weight="fill" />}
            onClick={() => {
              pause();
              toast("Calling paused. Calls already in progress will finish.", "warn");
            }}
          >
            Pause calling
          </Button>
        )
      }
      tabs={[
        { href: "/today", label: "Floor", exact: true },
        { href: "/today/needs", label: "Needs you", count: needCount },
        { href: "/today/review", label: "Review", count: toReview },
        { href: "/today/week", label: "This week" },
      ]}
    />
  );
}
