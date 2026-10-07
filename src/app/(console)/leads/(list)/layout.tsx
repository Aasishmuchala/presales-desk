import { LeadsHeader } from "@/components/leads/leads-header";

export default function LeadsListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LeadsHeader />
      <div className="pt-6">{children}</div>
    </>
  );
}
