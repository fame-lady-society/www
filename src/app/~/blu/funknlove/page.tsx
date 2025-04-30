import { Teaser } from "./Teaser";
import { polygon } from "viem/chains";
import { TokenGated } from "./TokenGated";
import { funknloveAddressForChain } from "./contracts";
import { SocialLinks } from "./SocialLinks";

export default function Page() {
  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <TokenGated contractAddress={funknloveAddressForChain(polygon.id)} />
        <Teaser />
        <h3 className="text-2xl font-bold mt-4 mb-2 text-center">By</h3>
        <SocialLinks />
        <p className="text-lg mt-2 mb-4">
          An open edition music NFT where 100% of the proceeds go to charity
        </p>
      </div>
    </>
  );
}
