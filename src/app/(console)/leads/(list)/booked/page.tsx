import type { Metadata } from "next";
import { LeadsTable } from "@/components/leads/leads-table";

export const metadata: Metadata = { title: "Visit booked" };

export default function Page() {
  return <LeadsTable view="booked" />;
}
