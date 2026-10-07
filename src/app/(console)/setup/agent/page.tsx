import type { Metadata } from "next";
import { AgentTalk } from "@/components/setup/agent-talk";

export const metadata: Metadata = { title: "How the agent talks" };

export default function Page() {
  return <AgentTalk />;
}
