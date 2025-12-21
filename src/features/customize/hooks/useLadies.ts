import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const baseUrl = publicRuntimeConfig.baseUrl;

export function useLadies() {
  const { address, chainId } = useAccount();
  const query = useQuery({
    queryKey: ["ladies", address, chainId],
    queryFn: async () => {
      if (!address) return [];

      const ownedTokens = await fetch(`${baseUrl}/api/ethereum/owned`)
        .then((res) => res.json() as Promise<number[]>)
        .catch(() => []);

      return ownedTokens;
    },
  });

  return query;
}
