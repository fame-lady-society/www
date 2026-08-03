import type { Metadata } from "next";
import { GalleryStakeUnstakeView } from "@/features/fame-gallery/components/GalleryStakeUnstakeView";

export const metadata: Metadata = {
  title: "Exit marketplace liquidity | FAME Gallery",
  description:
    "Browse pool Society inventory and exit a credited provider position.",
};

export default function Page() {
  return <GalleryStakeUnstakeView />;
}
