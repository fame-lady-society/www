import type { Metadata } from "next";
import { GalleryStakeDepositView } from "@/features/fame-market/components/GalleryStakeDepositView";

export const metadata: Metadata = {
  title: "Stake Society NFTs | FAME Gallery",
  description: "Deposit Society NFTs as credited FAME marketplace liquidity.",
};

export default function Page() {
  return <GalleryStakeDepositView />;
}
