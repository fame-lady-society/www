
import {
  fetchBaseGovNftLadiesData,
  fetchSepoliaGovNftLadiesData,
} from "@/features/fameus/service/graphql";
import { isAddress } from "viem";
import { RedirectWhenConnected } from "@/features/fameus/client-components/RedirectWhenConnected";
import { UnWrapTokens } from "./UnwrapTokens";
import { FameusProvider } from "./context";

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
      network={params.network as "sepolia" | "mainnet"}
    >
      <UnWrapTokens tokenIds={tokenIds} chainId={chainId} />

      <RedirectWhenConnected pathPrefix="fameus" pathPostfix="unwrap" toChain={chainId} />
    </FameusProvider>
  );
}


export const revalidate = 0;