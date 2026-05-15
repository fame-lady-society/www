import type { Metadata } from "next";
import { FameSwapPage } from "@/features/fame-swap/components/FameSwapPage";

export const metadata: Metadata = {
  title: "FAME swap",
  description: "In-house FAME swap routing on Base.",
};

export default function Page() {
  return <FameSwapPage />;
}
