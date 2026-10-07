import type { Metadata } from "next";
import { SEED } from "@/lib/mock/seed";
import { DocView } from "@/components/knowledge/doc-view";

export function generateStaticParams() {
  return SEED.docs.map((d) => ({ docId: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/knowledge/doc/[docId]">): Promise<Metadata> {
  const { docId } = await params;
  return { title: SEED.docs.find((d) => d.id === docId)?.title ?? "Document" };
}

export default async function DocPage({ params }: PageProps<"/knowledge/doc/[docId]">) {
  const { docId } = await params;
  return <DocView id={docId} />;
}
