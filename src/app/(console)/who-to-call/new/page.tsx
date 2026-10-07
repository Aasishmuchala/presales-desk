import type { Metadata } from "next";
import { NewList } from "@/components/lists/new-list";

export const metadata: Metadata = { title: "New calling list" };

export default function Page() {
  return <NewList />;
}
