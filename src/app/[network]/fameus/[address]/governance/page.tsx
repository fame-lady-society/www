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
import { WrappedLink } from "@/components/WrappedLink";

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
      ? await fetchBaseGovNftLadiesData({ owner: params.address })
      : await fetchSepoliaGovNftLadiesData({ owner: params.address });

  return (
    <FameusProvider
      address={params.address}
      network={params.network as "sepolia" | "base"}
    >
      <h1 className="text-4xl font-bold mb-6 text-center">FAMEus DAO</h1>
      <TabBar activeTab="governance" />
      <h2 className="text-4xl font-bold mb-6">Governance</h2>
      <p className="text-lg text-left mb-6">
        These are your Governance $FAME Ladies which can be used to vote on
        proposals of the FAMEus DAO.
      </p>
      <p className="text-lg text-left mb-6">
        From this page you can lock and unwrap your Governance $FAME Ladies. To
        delegate your vote, vote, or create a proposal, see{" "}
        <WrappedLink
          href="https://www.tally.xyz/gov/fameus-dao"
          target="_blank"
          rel="noopener noreferrer"
        >
          tally.xyz/gov/fameus-dao
        </WrappedLink>
        .
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
