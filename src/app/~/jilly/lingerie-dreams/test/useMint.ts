import { useWriteLingerieDreamsPublicMint } from "@/wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { polygonAmoy } from "viem/chains";
import { useCallback } from "react";

export function useMint(chainId: typeof polygonAmoy.id) {
  const result = useWriteLingerieDreamsPublicMint();

  const writeContractAsync = useCallback(
    async (amount: number) => {
      console.log("amount", BigInt(amount * 30 * 10 ** 18));
      return result.writeContractAsync({
        address: lingerieDreamsAddressForChain(chainId),
        args: [amount],
        value: BigInt(amount * 30 * 10 ** 18),
      });
    },
    [chainId, result],
  );
  return { ...result, writeContractAsync };
}
