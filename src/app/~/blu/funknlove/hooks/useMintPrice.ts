import { funknloveAbi, useReadFunknloveMintPrice } from "@/wagmi";
import { funknloveAddressForChain } from "../contracts";
import { polygonAmoy, polygon } from "viem/chains";
import { useReadContracts } from "wagmi";

export const useMintPrice = (
  chainId: typeof polygonAmoy.id | typeof polygon.id,
) => {
  const { data: [bronzePrice, silverPrice, goldPrice] = [], ...rest } =
    useReadContracts({
      contracts: [
        {
          address: funknloveAddressForChain(chainId),
          abi: funknloveAbi,
          functionName: "bronzePrice",
          chainId,
        },
        {
          address: funknloveAddressForChain(chainId),
          abi: funknloveAbi,
          functionName: "silverPrice",
          chainId,
        },
        {
          address: funknloveAddressForChain(chainId),
          abi: funknloveAbi,
          functionName: "goldPrice",
          chainId,
        },
      ],
      allowFailure: false,
    });

  return {
    ...rest,
    ...(typeof bronzePrice !== "undefined" &&
    typeof silverPrice !== "undefined" &&
    typeof goldPrice !== "undefined"
      ? {
          bronzePrice,
          silverPrice,
          goldPrice,
        }
      : {}),
  };
};
