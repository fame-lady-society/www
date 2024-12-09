import { societyFromNetwork } from "@/features/fame/contract";
import { getBuiltGraphSDK } from "@/graphclient";
import { client as sepoliaClient } from "@/viem/sepolia-client";
import { fameMirrorAbi } from "@/wagmi";
import { sepolia } from "viem/chains";

export async function fetchSepoliaNftLadiesData({
  owner,
}: {
  owner: `0x${string}`;
}) {
  // Works a little different since we don't have an indexer for sepolia, so we will just the ownerOf each token
  const contractAddress = societyFromNetwork(sepolia.id);
  const totalSupply = await sepoliaClient.readContract({
    abi: fameMirrorAbi,
    address: contractAddress,
    functionName: "totalSupply",
  });
  const tokenIds = await Promise.all(
    Array.from({ length: Number(totalSupply) }).map(async (_, index) => {
      const tokenId = BigInt(index + 1);
      const thisOwner = await sepoliaClient.readContract({
        abi: fameMirrorAbi,
        address: contractAddress,
        functionName: "ownerOf",
        args: [tokenId],
      });
      return owner === thisOwner ? tokenId : null;
    }),
  );
  return tokenIds.filter((id) => id !== null) as bigint[];
}

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
    return [];
  }

  const result = await action({ owner, first, skip, orderDirection: sorted });

  return (
    result.base_fame_nft_ownerships
      ?.filter((o) => o?.tokenId !== null && o?.tokenId !== undefined)
      .map((o) => BigInt(o.tokenId.toString())) ?? []
  );
}
