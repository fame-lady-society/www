import { AppMain } from "@/layouts/AppMain";
import { client as baseClient } from "@/viem/base-client";
import { base } from "viem/chains";
import NextImage from "next/image";
import { InfoTooltip } from "@/components/InfoToolTip";
import { getDN404Storage } from "@/service/fame";
import { fameFromNetwork } from "@/features/fame/contract";

const BASE_URL = "https://fame.support/thumb/";

function ImageForToken({ tokenId }: { tokenId: bigint }) {
  return (
    <NextImage
      src={`${BASE_URL}${tokenId.toString()}`}
      alt={`Burned token ${tokenId.toString()}`}
      width={400}
      height={400}
    />
  );
}

export default async function Home() {
  const { burnPool } = await getDN404Storage();

  return (
    <>
      <AppMain title="FAMEus DAO">
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">Coming Soon</h1>
            <p className="text-lg text-left mb-6">Burned pool</p>
            <h1 className="text-4xl font-bold mb-6 flex items-center">
              The next $FAME Ladies to be minted
              <InfoTooltip text="The burn pool contains the token IDs of the $FAME Ladies that have been burned and are waiting to be recycled." />
            </h1>
            <div className="flex flex-wrap gap-4">
              {burnPool.map((tokenId) => (
                <ImageForToken key={tokenId.toString()} tokenId={tokenId} />
              ))}
            </div>
          </div>
        </div>
      </AppMain>
    </>
  );
}
