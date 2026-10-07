import type { Metadata } from "next";
import { NumbersView } from "@/components/setup/numbers";

export const metadata: Metadata = { title: "Phone numbers" };

export default function Page() {
  return <NumbersView />;
}
