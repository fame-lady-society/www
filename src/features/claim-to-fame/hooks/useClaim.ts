import { useQuery } from "@tanstack/react-query";
import { base, sepolia } from "viem/chains";
import type {
  Input,
  Output,
} from "@/app/api/[network]/[contractAddress]/claim/route";

function networkName(chainId: typeof sepolia.id | typeof base.id) {
  switch (chainId) {
    case sepolia.id:
      return "sepolia";
    case base.id:
      return "base";
  }
}

export class ClaimRequestError extends Error {
  constructor(public readonly status: number) {
    super(
      status === 401 || status === 403
        ? "Your wallet session is no longer authorized."
        : `Unable to load claim data (${status}).`,
    );
  }
}

export async function requestClaim(
  input: Input & {
    chainId: typeof sepolia.id | typeof base.id;
    contractAddress: `0x${string}`;
  },
  fetcher: typeof fetch = fetch,
): Promise<Output> {
  const response = await fetcher(
    `/api/${networkName(input.chainId)}/${input.contractAddress}/claim`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: input.address,
        tokenIds: input.tokenIds,
      } satisfies Input),
    },
  );
  if (!response.ok) throw new ClaimRequestError(response.status);
  return response.json() as Promise<Output>;
}

export const useClaim = ({
  enabled,
  address,
  contractAddress,
  chainId,
  tokenIds,
}: {
  enabled?: boolean;
  address?: `0x${string}`;
  contractAddress: `0x${string}`;
  tokenIds: number[];
  chainId: typeof sepolia.id | typeof base.id;
}) => {
  return useQuery<Output>({
    enabled,
    queryKey: [chainId, "claim", contractAddress, address, tokenIds],
    queryFn: () => {
      if (!address) throw new Error("A wallet address is required to claim.");
      return requestClaim({ address, contractAddress, chainId, tokenIds });
    },
  });
};
