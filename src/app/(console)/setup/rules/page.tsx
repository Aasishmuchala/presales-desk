import type { Metadata } from "next";
import { RulesView } from "@/components/setup/rules";

export const metadata: Metadata = { title: "Rules" };

export default function Page() {
  return <RulesView />;
}
