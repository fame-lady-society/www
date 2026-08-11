import {
  fetchBaseGovNftLadiesData,
  fetchSepoliaGovNftLadiesData,
} from "@/features/fameus/service/graphql";
import { isAddress } from "viem";
import { RedirectWhenConnected } from "@/features/fameus/client-components/RedirectWhenConnected";
import { ManageTokens } from "./ManageTokens";
import { FameusProvider } from "./context";
import { InfoTooltip } from "@/components/InfoToolTip";
import { TabBar } from "../TabBar";

export default async function Home(props: {
  params: Promise<{ address: string; network: string }>;
}) {
  const params = await props.params;
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
      ? await fetchBaseGovNftLadiesData({ owner: params.address })
      : await fetchSepoliaGovNftLadiesData({ owner: params.address });

  return (
    <FameusProvider
      address={params.address}
      network={params.network as "sepolia" | "base"}
    >
      <h1 className="text-4xl font-bold mb-6 text-center">FAMEus Recovery</h1>
      <TabBar activeTab="governance" />
      <h2 className="text-4xl font-bold mb-6">Recovery</h2>
      <p className="text-lg text-left mb-6">
        FAMEus governance is paused. Select your Governance Society NFTs below
        to use the existing legacy lock or unwrap controls.
      </p>
      <p className="text-lg text-left mb-6">
        This site supports unwrapping Governance Society NFTs.
      </p>
      <h3 className="text-2xl font-bold mb-6 flex items-center ">
        Your Governance $FAME Ladies
        <InfoTooltip text="Liquid ladies are the native $FAME Society NFT that have 1 Million $FAME tokens backing them and are linked to the tokens" />
      </h3>
      <ManageTokens tokenIds={tokenIds} chainId={chainId} />

      <RedirectWhenConnected
        pathPrefix="fameus"
        pathPostfix="governance"
        toChain={chainId}
      />
    </FameusProvider>
  );
}

export const revalidate = 60;
