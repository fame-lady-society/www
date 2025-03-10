import {
  fetchBaseNftLadiesData,
  fetchSepoliaNftLadiesData,
} from "@/features/fameus/service/graphql";
import { isAddress } from "viem";
import { WrapTokens } from "./WrapTokens";
import { RedirectWhenConnected } from "@/features/fameus/client-components/RedirectWhenConnected";
import { FameusProvider } from "./context";
import { InfoTooltip } from "@/components/InfoToolTip";
import { TabBar } from "../TabBar";

export default async function Home({
  params,
}: {
  params: { address: string; network: string };
}) {
  if (!isAddress(params.address)) {
    throw new Error("Invalid address");
  }

  const chainId =
    params.network === "base"
      ? 8453
      : params.network === "sepolia"
        ? 11155111
        : null;

  if (!chainId) {
    throw new Error("Invalid chain");
  }

  const tokenIds =
    chainId === 8453
      ? await fetchBaseNftLadiesData({ owner: params.address })
      : await fetchSepoliaNftLadiesData({ owner: params.address });

  return (
    <FameusProvider
      address={params.address}
      network={params.network as "sepolia" | "base"}
    >
      <h1 className="text-4xl font-bold mb-6 text-center">FAMEus DAO</h1>
      <TabBar activeTab="wrap" />
      <h2 className="text-4xl font-bold mb-6">Wrap</h2>
      <p className="text-lg text-left mb-6">
        The FAMEus DAO requires you to wrap your $FAME Society NFTs into
        Governance Society NFTs. These Governance Society NFTs will be used to
        vote on the future of the FAMEus DAO.
      </p>
      <p className="text-lg text-left mb-6">
        When you wrap your $FAME Society NFTs, you will receive a Governance
        Society NFT and your $FAME Society NFT and 1 million $FAME tokens will
        be staked. You can unwrap your Governance Society NFT at any time to
        receive your $FAME Society NFT and 1 million $FAME tokens.
      </p>
      <h3 className="text-2xl font-bold mb-6 flex items-center">
        Liquid $FAME Society NFTs
        <InfoTooltip text="Liquid ladies are the native $FAME Society NFT that have 1 Million $FAME tokens backing them and are linked to the tokens" />
      </h3>
      <WrapTokens tokenIds={tokenIds} chainId={chainId} />

      <RedirectWhenConnected
        pathPrefix="fameus"
        pathPostfix="wrap"
        toChain={chainId}
      />
    </FameusProvider>
  );
}

export const revalidate = 60;
