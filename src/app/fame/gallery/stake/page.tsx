import type { Metadata } from "next";
import { GalleryStakeView } from "@/features/fame-gallery/components/GalleryStakeView";

export const metadata: Metadata = {
  title: "Marketplace liquidity | FAME Gallery",
  description: "Back FAME marketplace liquidity with Society NFTs.",
};

export default function Page() {
  return <GalleryStakeView />;
}
