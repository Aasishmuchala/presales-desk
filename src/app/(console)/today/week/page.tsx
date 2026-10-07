import type { Metadata } from "next";
import { WeekView } from "@/components/today/week-view";

export const metadata: Metadata = { title: "This week" };

export default function WeekPage() {
  return <WeekView />;
}
