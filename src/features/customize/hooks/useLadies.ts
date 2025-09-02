import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export function useLadies() {
  const { address, chainId } = useAccount();
  const query = useQuery({
    queryKey: ["ladies", address, chainId],
    queryFn: async () => {
      if (!address) return [];

      const ownedTokens = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/${
          chainId === 1 ? "ethereum" : "sepolia"
        }/owned`,
      )
        .then((res) => res.json() as Promise<number[]>)
        .catch(() => []);

      return ownedTokens;
    },
  });

  return query;
}
