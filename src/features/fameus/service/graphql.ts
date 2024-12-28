import {
  govSocietyFromNetwork,
  societyFromNetwork,
} from "@/features/fame/contract";
import { getBuiltGraphSDK } from "@/graphclient";
import { client as sepoliaClient } from "@/viem/sepolia-client";
import { client as baseClient } from "@/viem/base-client";
import { fameMirrorAbi, govSocietyAbi } from "@/wagmi";
import { erc721Abi } from "viem";
import { sepolia, base } from "viem/chains";

export async function fetchSepoliaGovNftLadiesData({
  owner,
}: {
  owner: `0x${string}`;
}) {
  // Works a little different since we don't have an indexer for sepolia, so we will just the ownerOf each token
  const totalSupply = await sepoliaClient.readContract({
    abi: fameMirrorAbi,
    address: societyFromNetwork(sepolia.id),
    functionName: "totalSupply",
  });
  const contractAddress = govSocietyFromNetwork(sepolia.id);
  const tokenIds = await Promise.all(
    Array.from({ length: Number(totalSupply) }).map(async (_, index) => {
      const tokenId = BigInt(index + 1);
      try {
        const thisOwner = await sepoliaClient.readContract({
          abi: erc721Abi,
          address: contractAddress,
          functionName: "ownerOf",
          args: [tokenId],
        });
        return owner === thisOwner ? tokenId : null;
      } catch (e) {
        return null;
      }
    }),
  );
  return tokenIds.filter((id) => id !== null) as bigint[];
}

export async function fetchBaseGovNftLadiesData({
  owner,
}: {
  owner: `0x${string}`;
}) {
  // Works a little different since we don't have an indexer for base, so we will just the ownerOf each token
  const contractAddress = govSocietyFromNetwork(base.id);
  const totalSupply = await baseClient.readContract({
    abi: fameMirrorAbi,
    address: societyFromNetwork(base.id),
    functionName: "totalSupply",
  });
  const tokenIds = await Promise.all(
    Array.from({ length: Number(totalSupply) }).map(async (_, index) => {
      const tokenId = BigInt(index + 1);
      try {
        const thisOwner = await baseClient.readContract({
          abi: erc721Abi,
          address: contractAddress,
          functionName: "ownerOf",
          args: [tokenId],
        });
        return owner === thisOwner ? tokenId : null;
      } catch (e) {
        return null;
      }
    }),
  );
  return tokenIds.filter((id) => id !== null) as bigint[];
}

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
