import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";
import { useSiweSession } from "@/context/SiweSession";
import { readOwnedTokenIds } from "@/utils/ownedTokens";

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
  const { isSignedIn, session } = useSiweSession();

  const query = useQuery({
    queryKey: ["gateNftTokens", network, address, session?.expiresAt],
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(getOwnedApiRoute(network));

      return readOwnedTokenIds(response);
    },
    enabled: !!address && isSignedIn,
  });

  return query;
}
