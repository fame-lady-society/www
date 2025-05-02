import { useWriteFunknlovePublicMint } from "@/wagmi";
import { funknloveAddressForChain } from "../contracts";
import { sepolia, mainnet } from "viem/chains";
import { useCallback } from "react";
import { useMintPrice } from "./useMintPrice";

export function useMint(chainId: typeof sepolia.id | typeof mainnet.id) {
  const result = useWriteFunknlovePublicMint();
  const { bronzePrice, silverPrice, goldPrice } = useMintPrice(chainId);

  const writeContractAsync = useCallback(
    async ({
      bronze,
      silver,
      gold,
    }: {
      bronze: number;
      silver: number;
      gold: number;
    }) => {
      if (!bronzePrice || !silverPrice || !goldPrice)
        throw new Error("Prices not found");
      return result.writeContractAsync({
        chainId,
        address: funknloveAddressForChain(chainId),
        args: [
          {
            bronze,
            silver,
            gold,
          },
        ],
        value:
          BigInt(bronze) * bronzePrice +
          BigInt(silver) * silverPrice +
          BigInt(gold) * goldPrice,
      });
    },
    [bronzePrice, chainId, goldPrice, result, silverPrice],
  );
  return { ...result, writeContractAsync };
}
