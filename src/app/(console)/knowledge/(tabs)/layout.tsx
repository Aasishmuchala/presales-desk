import { KnowledgeHeader } from "@/components/knowledge/knowledge-header";
import { DropZone } from "@/components/knowledge/upload";

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KnowledgeHeader />
      <div className="pt-8">{children}</div>
      <DropZone />
    </>
  );
}
