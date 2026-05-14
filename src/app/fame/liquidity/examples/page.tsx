import type { Metadata } from "next";
import { RouteGraphExamplesPage } from "@/features/fame-swap/components/RouteGraphExamplesPage";

export const metadata: Metadata = {
  title: "FAME route graph examples",
  description:
    "Wallet-free FAME swap route graph fixtures for design and browser inspection.",
};

export default function Page() {
  return <RouteGraphExamplesPage />;
}
