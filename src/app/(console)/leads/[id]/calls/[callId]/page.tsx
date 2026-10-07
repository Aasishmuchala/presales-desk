import type { Metadata } from "next";
import { SEED } from "@/lib/mock/seed";
import { CallRecord } from "@/components/calls/call-record";

export function generateStaticParams() {
  return SEED.calls
    .filter((c) => c.result === "connected" && c.start < 0)
    .slice(0, 24)
    .map((c) => ({ id: c.leadId, callId: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/leads/[id]/calls/[callId]">): Promise<Metadata> {
  const { callId } = await params;
  const call = SEED.calls.find((c) => c.id === callId);
  const lead = call ? SEED.leads.find((l) => l.id === call.leadId) : undefined;
  return { title: lead ? `Call with ${lead.name}` : "Call" };
}

export default async function CallPage({ params }: PageProps<"/leads/[id]/calls/[callId]">) {
  const { callId } = await params;
  return <CallRecord callId={callId} />;
}
