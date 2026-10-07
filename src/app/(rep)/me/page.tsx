import type { Metadata } from "next";
import { MyDay } from "@/components/rep/my-day";

export const metadata: Metadata = { title: "My day" };

export default function Page() {
  return <MyDay />;
}
