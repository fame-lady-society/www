import type { Metadata } from "next";
import { GalleryStakeView } from "@/features/fame-market/components/GalleryStakeView";

export const metadata: Metadata = {
  title: "Marketplace liquidity | FAME Gallery",
  description:
    "Provide Society NFTs to the FAME marketplace and earn a share of provider fees.",
};

export default function Page() {
  return <GalleryStakeView />;
}
