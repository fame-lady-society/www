import type { Metadata } from "next";
import { FameSwapPage } from "@/features/fame-swap/components/FameSwapPage";

export const metadata: Metadata = {
  title: "FAME swap",
  description:
    "Live FAME router swap routing and simulation for Base.",
};

export default function Page() {
  return <FameSwapPage />;
}
