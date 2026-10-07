import type { Metadata } from "next";
import { LeadsTable } from "@/components/leads/leads-table";

export const metadata: Metadata = { title: "Hot leads" };

export default function Page() {
  return <LeadsTable view="hot" />;
}
