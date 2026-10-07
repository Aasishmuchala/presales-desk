import type { Metadata } from "next";
import { LeadsTable } from "@/components/leads/leads-table";

export const metadata: Metadata = { title: "Call back" };

export default function Page() {
  return <LeadsTable view="callback" />;
}
