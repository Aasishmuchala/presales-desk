import type { Metadata } from "next";
import { ConnectionsView } from "@/components/setup/connections";

export const metadata: Metadata = { title: "Setup" };

export default function Page() {
  return <ConnectionsView />;
}
