import type { Metadata } from "next";
import { GalleryView } from "@/features/fame-market/components/GalleryView";

export const metadata: Metadata = {
  title: "TEST Marketplace",
  description: "Browse the Base Sepolia TEST Marketplace.",
};

export default function Page() {
  return <GalleryView />;
}
