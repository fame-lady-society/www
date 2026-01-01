import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";
import { withAuthHeaders } from "@/utils/authToken";

export function useLadies() {
  const { address } = useAccount();
  const query = useQuery({
    queryKey: ["ladies", address],
    queryFn: async () => {
      if (!address) return [];
      const queryParams = new URLSearchParams();
      queryParams.set("address", address);
      const ownedTokens = await fetch(
        `/api/ethereum/owned?${queryParams.toString()}`,
        { headers: withAuthHeaders() },
      )
        .then((res) => res.json() as Promise<number[]>)
        .catch(() => []);

      return ownedTokens;
    },
  });

  return query;
}
