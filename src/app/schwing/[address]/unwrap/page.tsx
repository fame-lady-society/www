
import {
  fetchBaseGovSchwingNftsData,
} from "@/features/fameus/service/graphql";
import { isAddress } from "viem";
import { RedirectWhenConnected } from "../../wrap/RedirectWhenConnected";
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

  const tokenIds = await fetchBaseGovSchwingNftsData({ owner: params.address });

  return (
    <FameusProvider
      address={params.address}
      network={params.network as "sepolia" | "mainnet"}
    >
      <UnWrapTokens tokenIds={tokenIds} />

      <RedirectWhenConnected pathPrefix="fameus" pathPostfix="unwrap" />
    </FameusProvider>
  );
}


export const revalidate = 0;