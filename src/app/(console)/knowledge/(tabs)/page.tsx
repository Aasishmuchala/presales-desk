import type { Metadata } from "next";
import { DocList } from "@/components/knowledge/doc-list";

export const metadata: Metadata = { title: "Project book" };

export default function Page() {
  return <DocList book="project" />;
}
