import { client as mainnetClient } from "@/viem/mainnet-client";
import { client as polygonClient } from "@/viem/polygon-client";
import { ContractFunctionExecutionError } from "viem";

const ABI = [
  {
    type: "function",
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "id", internalType: "uint256", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
] as const;

export async function fetchAllOwnersIterable({
  contractAddress,
  client,
  totalSupply,
  zeroIndex,
}: {
  contractAddress: `0x${string}`;
  totalSupply?: bigint;
  zeroIndex?: boolean;
  client?: typeof mainnetClient | typeof polygonClient;
}) {
  totalSupply =
    totalSupply ??
    (await mainnetClient.readContract({
      abi: ABI,
      address: contractAddress,
      functionName: "totalSupply",
    }));

  client = client ?? mainnetClient;

  const ownerTokenMap = new Map<bigint, `0x${string}`>();
  await Promise.all(
    Array.from({ length: Number(totalSupply) }).map(async (_, index) => {
      const tokenId = BigInt(index + (zeroIndex ? 0 : 1));
      try {
        const owner = await client.readContract({
          abi: ABI,
          address: contractAddress,
          functionName: "ownerOf",
          args: [tokenId],
        });
        ownerTokenMap.set(tokenId, owner);
      } catch (error) {
        if (error instanceof ContractFunctionExecutionError) {
          // nothing
          return;
        }
        throw error;
      }
    }),
  );
  return ownerTokenMap;
}
