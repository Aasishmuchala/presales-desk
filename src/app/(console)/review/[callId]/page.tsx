import type { Metadata } from "next";
import { SEED } from "@/lib/mock/seed";
import { ReviewDetail } from "@/components/today/review-detail";

export function generateStaticParams() {
  return SEED.calls.filter((c) => c.qa).map((c) => ({ callId: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/review/[callId]">): Promise<Metadata> {
  const { callId } = await params;
  const call = SEED.calls.find((c) => c.id === callId);
  const lead = call ? SEED.leads.find((l) => l.id === call.leadId) : undefined;
  return { title: lead ? `Call with ${lead.name}` : "Call" };
}

export default async function ReviewCallPage({ params }: PageProps<"/review/[callId]">) {
  const { callId } = await params;
  return <ReviewDetail callId={callId} />;
}
