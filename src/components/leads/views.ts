import type { Lead } from "@/lib/types";
import type { Tone } from "../ui/pill";

export type LeadView = "all" | "hot" | "booked" | "callback" | "notnow";

export const VIEWS: { id: LeadView; label: string; href: string; match: (l: Lead) => boolean }[] = [
  { id: "all", label: "All", href: "/leads", match: () => true },
  { id: "hot", label: "Hot", href: "/leads/hot", match: (l) => l.stage === "hot" },
  { id: "booked", label: "Visit booked", href: "/leads/booked", match: (l) => l.stage === "booked" },
  { id: "callback", label: "Call back", href: "/leads/callback", match: (l) => l.stage === "callback" },
  { id: "notnow", label: "Not now", href: "/leads/notnow", match: (l) => l.stage === "notnow" },
];

export function viewOf(id: LeadView) {
  return VIEWS.find((v) => v.id === id) ?? VIEWS[0];
}

export const STAGE_TONE: Record<Lead["stage"], Tone> = {
  new: "info",
  talking: "neutral",
  hot: "accent",
  booked: "good",
  callback: "neutral",
  notnow: "neutral",
  optedout: "crit",
  unreachable: "warn",
};
