import { fetchAllOwnersIterable } from "@/service/fetchAllOwnersIterable";
import { bulkMinterAddress, bulkMinterAbi } from "@/wagmi";
import { NextRequest } from "next/server";
import { client as viemClient } from "@/viem/base-sepolia-client";
import { baseSepolia } from "viem/chains";

export async function GET(req: NextRequest) {
  const totalSupply = await viemClient.readContract({
    address: bulkMinterAddress[baseSepolia.id],
    abi: bulkMinterAbi,
    functionName: "totalSupply",
  });
  const owners = await fetchAllOwnersIterable({
    contractAddress: bulkMinterAddress[baseSepolia.id],
    totalSupply: totalSupply,
    zeroIndex: true,
    client: viemClient,
  });

  // reverse the map from tokenId -> owner to owner -> tokenId[]
  const reversedOwners = new Map<string, number[]>();
  for (const [tokenId, owner] of owners.entries()) {
    if (!reversedOwners.has(owner)) {
      reversedOwners.set(owner, []);
    }
    reversedOwners.get(owner)!.push(Number(tokenId));
  }

  return new Response(
    JSON.stringify({
      owners: Object.fromEntries(
        [...reversedOwners.entries()].map(([key, value]) => [key.toLowerCase(), value]),
      ),
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

export const revalidate = 300;
