import type { Metadata } from "next";
import { FameSwapPage } from "@/features/fame-swap/components/FameSwapPage";

export const metadata: Metadata = {
  title: "FAME swap",
  description: "Trade FAME through preferred liquidity on Base.",
  openGraph: { images: ["/images/fame/gold-leaf.png"] },
};

export default function Page() {
  return <FameSwapPage />;
}
