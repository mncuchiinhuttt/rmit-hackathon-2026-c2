import type { Metadata } from "next";
import { DemoPage } from "@/features/demo/components/demo-page";

export const metadata: Metadata = { title: "Hostless Hui — offline demo" };

export default function Page() {
  return <DemoPage />;
}
