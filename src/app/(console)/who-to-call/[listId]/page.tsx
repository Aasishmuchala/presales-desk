import type { Metadata } from "next";
import { SEED } from "@/lib/mock/seed";
import { ListDetail } from "@/components/lists/list-detail";

export function generateStaticParams() {
  return SEED.lists.map((l) => ({ listId: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/who-to-call/[listId]">): Promise<Metadata> {
  const { listId } = await params;
  return { title: SEED.lists.find((l) => l.id === listId)?.name ?? "Calling list" };
}

export default async function ListPage({ params }: PageProps<"/who-to-call/[listId]">) {
  const { listId } = await params;
  return <ListDetail id={listId} />;
}
