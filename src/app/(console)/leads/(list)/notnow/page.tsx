import type { Metadata } from "next";
import { LeadsTable } from "@/components/leads/leads-table";

export const metadata: Metadata = { title: "Not now" };

export default function Page() {
  return <LeadsTable view="notnow" />;
}
