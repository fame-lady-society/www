import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";
import { withAuthHeaders } from "@/utils/authToken";
import { useAuthSession } from "@/hooks/useAuthSession";

export function useLadies() {
  const { address } = useAccount();
  const authSession = useAuthSession();
  const query = useQuery({
    queryKey: ["ladies", address, authSession?.token],
    queryFn: async () => {
      if (!address) return [];
      const ownedTokens = await fetch(`/api/ethereum/owned`, {
        headers: withAuthHeaders(undefined, authSession),
      })
        .then((res) => res.json() as Promise<number[]>)
        .catch(() => []);

      return ownedTokens;
    },
    enabled: !!address,
  });

  return query;
}
