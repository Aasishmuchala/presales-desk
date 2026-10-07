import type { Metadata } from "next";
import { NeedsView } from "@/components/today/needs-view";

export const metadata: Metadata = { title: "Needs you" };

export default function NeedsPage() {
  return <NeedsView />;
}
