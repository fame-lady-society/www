import { fetchBaseGovSchwingNftsData } from "@/features/fameus/service/graphql";
import { isAddress } from "viem";
import { RedirectWhenConnected } from "../../wrap/RedirectWhenConnected";
import { UnWrapTokens } from "./UnwrapTokens";
import { FameusProvider } from "./context";

export default async function Home(
  props: {
    // TODO(next15-followup): This route only has an [address] segment. Tighten this
    // and the related alias routes that still type nonexistent params:
    // /~/page, /[network]/customize, /customize/[tokenId], and /schwing/[address]/wrap.
    params: Promise<{ address: string; network: string }>;
  }
) {
  const params = await props.params;
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
