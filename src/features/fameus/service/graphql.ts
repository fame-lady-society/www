import {
  fameFromNetwork,
  govSocietyFromNetwork,
  societyFromNetwork,
} from "@/features/fame/contract";
import { getBuiltGraphSDK } from "@/graphclient";
import { client as sepoliaClient } from "@/viem/sepolia-client";
import { client as baseClient } from "@/viem/base-client";
import { fameMirrorAbi } from "@/wagmi";
import { erc721Abi } from "viem";
import { sepolia, base } from "viem/chains";
import { getDN404Storage } from "@/service/fame";

async function fetchTokensByOwner({
  client,
  contractAddress,
  totalSupply,
  owner,
  abi = erc721Abi,
}: {
  client: typeof sepoliaClient | typeof baseClient;
  totalSupply: bigint;
  contractAddress: `0x${string}`;
  owner: `0x${string}`;
  abi?: typeof erc721Abi;
}) {
  const tokenIds = await Promise.all(
    Array.from({ length: Number(totalSupply) }).map(async (_, index) => {
      const tokenId = BigInt(index + 1);
      try {
        const thisOwner = await client.readContract({
          abi,
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

export async function fetchSepoliaGovNftLadiesData({
  owner,
}: {
  owner: `0x${string}`;
}) {
  return fetchTokensByOwner({
    client: sepoliaClient,
    contractAddress: govSocietyFromNetwork(sepolia.id),
    totalSupply: BigInt(200),
    owner,
  });
}

export async function fetchBaseGovNftLadiesData({
  owner,
}: {
  owner: `0x${string}`;
}) {
  const { burnPool, totalNFTSupply } = await getDN404Storage();
  return fetchTokensByOwner({
    client: baseClient,
    contractAddress: govSocietyFromNetwork(base.id),
    totalSupply: totalNFTSupply + BigInt(burnPool.length),
    owner,
  });
}

export async function fetchBaseSchwingNftsData({
  owner,
}: {
  owner: `0x${string}`;
}) {
  return fetchTokensByOwner({
    client: baseClient,
    contractAddress: "0x91d7950ac7CcB369589765e31d6D8996321556de", // $SCHWING Austin Powers NFT on base
    totalSupply: 400n,
    owner,
  });
}

export async function fetchBaseGovSchwingNftsData({
  owner,
}: {
  owner: `0x${string}`;
}) {
  return fetchTokensByOwner({
    client: baseClient,
    contractAddress: "0x1AA1702627f4491741944130f0fa975f90213851", // Governance $SCHWING Austin Powers NFT on base
    totalSupply: 400n,
    owner,
  });
}

export async function fetchSepoliaNftLadiesData({
  owner,
}: {
  owner: `0x${string}`;
}) {
  const contractAddress = societyFromNetwork(sepolia.id);
  return fetchTokensByOwner({
    client: sepoliaClient,
    contractAddress,
    totalSupply: 200n,
    owner,
  });
}

export async function fetchBaseNftLadiesData({
  owner,
}: {
  owner: `0x${string}`;
}): Promise<bigint[]> {
  const { burnPool, totalNFTSupply } = await getDN404Storage();
  return fetchTokensByOwner({
    client: baseClient,
    contractAddress: societyFromNetwork(base.id),
    totalSupply: totalNFTSupply + BigInt(burnPool.length),
    owner,
  });
}
