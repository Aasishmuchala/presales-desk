import type { Metadata } from "next";
import { SEED } from "@/lib/mock/seed";
import { Dossier } from "@/components/leads/dossier";

export function generateStaticParams() {
  return SEED.leads.filter((l) => l.stage === "hot" || l.stage === "booked").map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/leads/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: SEED.leads.find((l) => l.id === id)?.name ?? "Lead" };
}

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  return <Dossier id={id} />;
}
