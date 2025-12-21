import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");

export function useLadies() {
  const { address, chainId } = useAccount();
  const query = useQuery({
    queryKey: ["ladies", address, chainId],
    queryFn: async () => {
      if (!address) return [];

      const ownedTokens = await fetch(
        `${baseUrl ? `${baseUrl}` : ""}/api/ethereum/owned`,
      )
        .then((res) => res.json() as Promise<number[]>)
        .catch(() => []);

      return ownedTokens;
    },
  });

  return query;
}
