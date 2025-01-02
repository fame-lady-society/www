
import {
  fetchBaseSchwingNftsData,
} from "@/features/fameus/service/graphql";
import { isAddress } from "viem";
import { WrapTokens } from "./WrapTokens";
import { RedirectWhenConnected } from "../../wrap/RedirectWhenConnected";
import { FameusProvider } from "../context";

export default async function Home({
  params,
}: {
  params: { address: string; };
}) {
  if (!isAddress(params.address)) {
    throw new Error("Invalid address");
  }

  const tokenIds = await fetchBaseSchwingNftsData({ owner: params.address });

  return (
    <FameusProvider
      address={params.address}
    >
      <WrapTokens tokenIds={tokenIds} chainId={8453} />

      <RedirectWhenConnected pathPrefix="schwing" pathPostfix="wrap" />
    </FameusProvider>
  );
}
