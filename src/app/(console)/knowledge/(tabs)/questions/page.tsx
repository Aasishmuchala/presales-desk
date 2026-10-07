import type { Metadata } from "next";
import { QuestionsInbox } from "@/components/knowledge/questions-inbox";

export const metadata: Metadata = { title: "Questions" };

export default function Page() {
  return <QuestionsInbox />;
}
