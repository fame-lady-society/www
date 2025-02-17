import { useWriteLingerieDreamsPublicMint } from "@/wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { polygonAmoy, polygon } from "viem/chains";
import { useCallback } from "react";
import { useMintPrice } from "./useMintPrice";

export function useMint(chainId: typeof polygonAmoy.id | typeof polygon.id) {
  const { data: mintPrice } = useMintPrice(chainId);
  const result = useWriteLingerieDreamsPublicMint();

  const writeContractAsync = useCallback(
    async (amount: number) => {
      if (!mintPrice) throw new Error("Mint price not found");
      return result.writeContractAsync({
        address: lingerieDreamsAddressForChain(chainId),
        args: [amount],
        value: mintPrice * BigInt(amount),
      });
    },
    [chainId, mintPrice, result],
  );
  return { ...result, writeContractAsync };
}
