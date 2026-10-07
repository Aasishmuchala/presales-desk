import type { Metadata } from "next";
import { ListsOverview } from "@/components/lists/lists-overview";

export const metadata: Metadata = { title: "Who to call" };

export default function Page() {
  return <ListsOverview />;
}
