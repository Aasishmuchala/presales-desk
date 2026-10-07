import { TodayHeader } from "@/components/today/today-header";

export default function TodayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TodayHeader />
      <div className="pt-8">{children}</div>
    </>
  );
}
