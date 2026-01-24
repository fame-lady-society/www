import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";
import { withAuthHeaders } from "@/utils/authToken";
import { useAuthSession } from "@/hooks/useAuthSession";

export type NetworkType = "sepolia" | "mainnet" | "base-sepolia";

function getOwnedApiRoute(network: NetworkType): string {
  switch (network) {
    case "sepolia":
      return "/api/sepolia/owned";
    case "mainnet":
      return "/api/ethereum/owned";
    case "base-sepolia":
      return "/api/base-sepolia/owned";
  }
}

export function useOwnedGateNftTokens(network: NetworkType) {
  const { address } = useAccount();
  const authSession = useAuthSession();

  const query = useQuery({
    queryKey: ["gateNftTokens", network, address, authSession?.token],
    queryFn: async () => {
      if (!address) return [];
      const ownedTokens = await fetch(getOwnedApiRoute(network), {
        headers: withAuthHeaders(undefined, authSession),
      })
        .then((res) => res.json() as Promise<number[]>)
        .catch(() => [] as number[]);

      return ownedTokens;
    },
    enabled: !!address && !!authSession?.token,
  });

  return query;
}
