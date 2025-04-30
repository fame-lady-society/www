import { useWriteFunknlovePublicMint } from "@/wagmi";
import { funknloveAddressForChain } from "../contracts";
import { polygonAmoy, polygon } from "viem/chains";
import { useCallback } from "react";
import { useMintPrice } from "./useMintPrice";

export function useMint(chainId: typeof polygonAmoy.id | typeof polygon.id) {
  const result = useWriteFunknlovePublicMint();
  const { data: { bronzePrice, silverPrice, goldPrice } = {} } =
    useMintPrice(chainId);

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
