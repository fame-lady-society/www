import { useSnapshot } from "@/features/claim/hooks/useSnapshot";

export function useFlsTokenAllocation(tokenId?: number) {
  const { flsPoolAllocation } = useSnapshot(3, 1.5);
  const allocation =
    typeof tokenId !== "undefined" ? flsPoolAllocation.get(tokenId) ?? 0n : 0n;
  return allocation;
}
