import type { Metadata } from "next";
import { SocietyNftAuctionPage } from "@/features/society-nft-auction/components/SocietyNftAuctionPage";

export const metadata: Metadata = {
  title: "Society NFT auction",
  description: "Bid on the current Fame Lady Society NFT auction on Base.",
};

export default function Page() {
  return <SocietyNftAuctionPage />;
}
