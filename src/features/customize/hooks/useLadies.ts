import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";
import { withAuthHeaders } from "@/utils/authToken";
import { useAuthSession } from "@/hooks/useAuthSession";
import { mainnet , sepolia, baseSepolia } from "viem/chains";

function chainIdToChainName(chainId: typeof mainnet.id | typeof sepolia.id | typeof baseSepolia.id): string {
  switch (chainId) {
    case mainnet.id:
      return "ethereum";
    case sepolia.id:
      return "sepolia";
    case baseSepolia.id:
      return "base-sepolia";
    default:
      return "ethereum";
  }
}

export function useLadies({chainId}: { chainId: typeof mainnet.id | typeof sepolia.id | typeof baseSepolia.id }) {
  const { address } = useAccount();
  const authSession = useAuthSession();
  const query = useQuery({
    queryKey: ["ladies", chainId, address, authSession?.token],
    queryFn: async () => {
      if (!address) return [];
      const ownedTokens = await fetch(`/api/${chainIdToChainName(chainId)}/owned`, {
        headers: withAuthHeaders(undefined, authSession),
      })
        .then((res) => res.json() as Promise<number[]>)
        .catch(() => [] as number[]);

      return ownedTokens;
    },
    enabled: !!address,
  });

  return query;
}
