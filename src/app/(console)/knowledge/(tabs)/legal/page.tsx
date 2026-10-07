import type { Metadata } from "next";
import { DocList } from "@/components/knowledge/doc-list";

export const metadata: Metadata = { title: "Legal book" };

export default function Page() {
  return <DocList book="legal" />;
}
