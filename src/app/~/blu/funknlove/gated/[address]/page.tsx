import React from "react";
import DownloadCard from "./DownloadCard";
import { RedirectWhenNotConnected } from "./RedirectWhenNotConnected";
import { mainnet } from "viem/chains";
import { SocialLinks } from "../../SocialLinks";

export default function Page({ params }: { params: { address: string } }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <DownloadCard />
      <h3 className="text-2xl font-bold mt-4 text-center">
        <SocialLinks />
      </h3>
      <p className="text-lg mt-2 mb-4">A 1/1 limited edition Music NFT</p>
      <RedirectWhenNotConnected toGo="/~/blu/funknlove" toChain={mainnet.id} />
    </div>
  );
}
