import type { Metadata } from "next";
import { FloorView } from "@/components/today/floor-view";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return <FloorView />;
}
