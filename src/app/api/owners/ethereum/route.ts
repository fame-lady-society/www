import { fetchAllOwnersIterable } from "@/service/fetchAllOwnersIterable";
import { fameLadySocietyAddress } from "@/wagmi";
import { NextRequest } from "next/server";
import { client as viemClient } from "@/viem/mainnet-client";

export async function GET(req: NextRequest) {
  const owners = await fetchAllOwnersIterable({
    contractAddress: fameLadySocietyAddress[1],
    totalSupply: 8888n,
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
        [...reversedOwners.entries()].map(([key, value]) => [key, value]),
      ),
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}

export const revalidate = 300;
