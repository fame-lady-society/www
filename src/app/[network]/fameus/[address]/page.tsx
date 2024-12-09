import { AppMain } from "@/layouts/AppMain";
import { fetchBaseNftLadiesData, fetchSepoliaNftLadiesData } from "@/features/fameus/service/graphql";
import { isAddress } from "viem";
import InfoIcon from "@mui/icons-material/Info";
import NextImage from "next/image";
import { RedirectWhenConnected } from "@/features/fameus/client-components/RedirectWhenConnected";
import { InfoTooltip } from "@/components/InfoToolTip";

const BASE_URL = "https://fame.support/thumb/";

function ImageForToken({ tokenId }: { tokenId: bigint }) {
  return (
    <NextImage
      src={`${BASE_URL}${tokenId.toString()}`}
      alt="FAMEus"
      width={400}
      height={400}
    />
  );
}

export default async function Home({
  params,
}: {
  params: { address: string, network: string };
}) {
  if (!isAddress(params.address)) {
    return (
      <AppMain title="FAMEus" isDao>
        <section className="flex flex-col items-start justify-center h-full m-4 border rounded-lg p-6">
          <h1 className="text-4xl font-bold">FAMEus</h1>
        </section>
      </AppMain>
    );
  }

  const chainId = params.network === "mainnet" ? 1 : params.network === "sepolia" ? 11155111 : null;
  if (!chainId) {
    return (
      <AppMain title="FAMEus">
        <section className="flex flex-col items-start justify-center h-full m-4 border rounded-lg p-6">
          <h1 className="text-4xl font-bold">FAMEus</h1>
        </section>
      </AppMain>
    );
  }
  const tokenIds = chainId === 1 ? await fetchBaseNftLadiesData({ owner: params.address }) : await fetchSepoliaNftLadiesData({ owner: params.address });

  return (
    <>
      <AppMain title="FAMEus DAO">
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">Coming Soon</h1>
            <p className="text-lg text-left mb-6">
              The FAMEus DAO is currently under development. Check back soon for
              updates!
            </p>
            <h1 className="text-4xl font-bold mb-6 flex items-center">
              Liquid $FAME Ladies
              <InfoTooltip text="Liquid ladies are the native $FAME Society NFT that have 1 Million $FAME tokens backing them and are linked to the tokens" />
            </h1>
            <div className="flex flex-wrap gap-4">
              {tokenIds.map((tokenId) => (
                <ImageForToken key={tokenId.toString()} tokenId={tokenId} />
              ))}
            </div>
          </div>
        </div>
      </AppMain>
      <RedirectWhenConnected pathPrefix="fameus" toChain={chainId} />
    </>
  );
}
