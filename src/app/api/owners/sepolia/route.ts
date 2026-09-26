import { fetchAllOwnersIterable } from "@/service/fetchAllOwnersIterable";
import { wrappedNftAddress } from "@/wagmi";
import { client as viemClient } from "@/viem/sepolia-client";

export async function GET() {
  const owners = await fetchAllOwnersIterable({
    contractAddress: wrappedNftAddress[11155111],
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
        [...reversedOwners.entries()].map(([key, value]) => [
          key.toLowerCase(),
          value,
        ]),
      ),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "CDN-Cache-Control": "max-age=300, stale-while-revalidate=300",
      },
    },
  );
}

// Owner scans need live RPC access and must not run during the build.
export const dynamic = "force-dynamic";
