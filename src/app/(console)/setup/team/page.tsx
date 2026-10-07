import type { Metadata } from "next";
import { TeamView } from "@/components/setup/team";

export const metadata: Metadata = { title: "Team" };

export default function Page() {
  return <TeamView />;
}
