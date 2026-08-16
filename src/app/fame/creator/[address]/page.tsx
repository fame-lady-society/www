import { AppMain } from "@/layouts/AppMain";
import { Suspense } from "react";
import { isAddress } from "viem";
import { fetchBaseNftLadiesData } from "@/features/fameus/service/graphql";
import { getArtPoolRange, getFamePools } from "@/service/fame";
import { CreatorPortal } from "./CreatorPortal";
import { ReleaseArtwork } from "./ReleaseArtwork";
import { ChainSelector } from "../ChainSelector";
import { CreatorBaseNetworkGate } from "./CreatorBaseNetworkGate";
import { getCreatorUploadFundingSnapshot } from "@/service/creator_upload_funding";

async function ReleaseArtworkWithFunding({
  address,
}: {
  address: `0x${string}`;
}) {
  const funding = await getCreatorUploadFundingSnapshot();
  return <ReleaseArtwork address={address} initialFunding={funding} />;
}

async function ExistingArtworkPortal({ address }: { address: `0x${string}` }) {
  const [tokenIds, pools, artPoolRange] = await Promise.all([
    fetchBaseNftLadiesData({ owner: address }),
    getFamePools(),
    getArtPoolRange(),
  ]);
  return (
    <CreatorPortal
      address={address}
      tokenIds={tokenIds}
      burnPool={pools.burnPool.map(({ tokenId, image }) => ({
        tokenId: Number(tokenId),
        uri: image,
      }))}
      nextArtPoolIndex={artPoolRange.nextIndex}
      nextMintPoolIndex={pools.mintPoolStart}
      mintPool={pools.mintPool.map(({ tokenId, image }) => ({
        tokenId,
        uri: image,
      }))}
    />
  );
}

export default async function CreatorAddressPage(props: {
  params: Promise<{ address: string }>;
}) {
  const params = await props.params;
  if (!isAddress(params.address)) {
    throw new Error("Invalid address");
  }

  const address = params.address as `0x${string}`;

  return (
    <AppMain
      title="FAME Creator Portal"
      mobileTitle="Create"
      isDao
      headerRight={<ChainSelector />}
    >
      <CreatorBaseNetworkGate>
        <div className="mx-auto w-full max-w-4xl px-4 pt-8">
          <ReleaseArtworkWithFunding address={address} />
        </div>
        <Suspense
          fallback={
            <p className="py-8 text-center" role="status">
              Loading owned artwork tools…
            </p>
          }
        >
          <ExistingArtworkPortal address={address} />
        </Suspense>
      </CreatorBaseNetworkGate>
    </AppMain>
  );
}

export const revalidate = 60;
