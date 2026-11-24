import type { Metadata } from "next";
import { PresentScreen } from "@/components/poll/Present";

export const metadata: Metadata = { title: "Live poll" };

export default function PresentPage() {
  return <PresentScreen />;
}
