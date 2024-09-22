import { getBuiltGraphSDK } from "@/graphclient";

export async function fetchBaseNftLadiesData({
  owner,
  first = 100,
  skip = 0,
  sorted = "asc",
}: {
  owner: `0x${string}`;
  first?: number;
  skip?: number;
  sorted?: "asc" | "desc";
}): Promise<bigint[]> {
  const sdk = getBuiltGraphSDK();
  const action = sdk.BaseFameNftTokenByOwner.bind(sdk);

  if (!action) {
    throw new Error("Unsupported chainId");
  }

  const result = await action({ owner, first, skip, orderDirection: sorted });

  return (
    result.base_fame_nft_ownerships
      ?.filter((o) => o?.tokenId !== null && o?.tokenId !== undefined)
      .map((o) => BigInt(o.tokenId.toString())) ?? []
  );
}
