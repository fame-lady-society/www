import { AppMain } from "@/layouts/AppMain";
import { isAddress } from "viem";
import { fetchBaseNftLadiesData } from "@/features/fameus/service/graphql";
import { getArtPoolRange, getDN404Storage, getFamePools } from "@/service/fame";
import { CreatorPortal } from "./CreatorPortal";
import { ChainSelector } from "../ChainSelector";

export default async function CreatorAddressPage({
  params,
}: {
  params: { address: string };
}) {
  if (!isAddress(params.address)) {
    throw new Error("Invalid address");
  }

  // Fetch user's NFTs and pools data
  const [tokenIds, dn404Storage, pools, artPoolRange] = await Promise.all([
    fetchBaseNftLadiesData({ owner: params.address }),
    getDN404Storage(),
    getFamePools(),
    getArtPoolRange(),
  ]);

  // Calculate mint pool start
  const mintPoolStart =
    dn404Storage.totalNFTSupply + BigInt(dn404Storage.burnPool.length);

  const artPool: Record<number, string> = {};
  for (let i = artPoolRange.startIndex; i <= artPoolRange.endIndex; i++) {
    if (i < artPoolRange.nextIndex) {
      artPool[i] = `/fame/token/image/${i}`;
    } else {
      artPool[i] = "/images/fame/gold-leaf-square.png";
    }
  }
  return (
    <AppMain title="FAME Creator Portal" mobileTitle="Create" isDao headerRight={<ChainSelector />}>
      <CreatorPortal
        address={params.address}
        tokenIds={tokenIds}
        burnPool={pools.burnPool.map(({ tokenId, image }) => ({
          tokenId: Number(tokenId),
          uri: image,
        }))}
        nextArtPoolIndex={artPoolRange.nextIndex}
        nextMintPoolIndex={Number(mintPoolStart)}
        // We can never agree on these names
        mintPool={pools.mintPool.map(({ tokenId, image }) => ({
          tokenId,
          uri: image,
        }))}
        artPool={artPool}
      />
    </AppMain>
  );
}

export const revalidate = 60;
