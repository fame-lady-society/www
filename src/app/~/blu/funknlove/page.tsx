import { SocialLinks } from "./SocialLinks";
import { funknloveAddressForChain } from "./contracts";
import { Teaser } from "./Teaser";
import { TokenGated } from "./TokenGated";
import { mainnet } from "viem/chains";
import { MintOpen } from "./MintOpen";

export default function Page() {
  return (
    <Teaser>
      <div className="flex flex-col items-center justify-center h-full px-4">
        <TokenGated contractAddress={funknloveAddressForChain(mainnet.id)} />
        <h3 className="text-2xl font-bold mt-4 mb-2 text-center">By</h3>
        <SocialLinks />
        <p className="text-lg mt-2 mb-4 text-center" style={{ width: "80%" }}>
          An open edition music NFT where 100% of the proceeds go to charity
        </p>
        <p
          className="text-lg mt-2 mb-4 text-center"
          style={{ width: "80%" }}
        ></p>
        <MintOpen chainId={mainnet.id} />
      </div>
    </Teaser>
  );
}
