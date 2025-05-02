import { funknloveAbi } from "@/wagmi";
import { funknloveAddressForChain } from "../contracts";
import { sepolia, mainnet } from "viem/chains";
import { useReadContracts } from "wagmi";

export const useMintPrice = (
  chainId: typeof sepolia.id | typeof mainnet.id,
) => {
  const { data: [bronzePrice, silverPrice, goldPrice] = [], ...rest } =
    useReadContracts({
      contracts: [
        {
          address: funknloveAddressForChain(chainId),
          abi: funknloveAbi,
          functionName: "getBronzePrice",
          chainId,
        },
        {
          address: funknloveAddressForChain(chainId),
          abi: funknloveAbi,
          functionName: "getSilverPrice",
          chainId,
        },
        {
          address: funknloveAddressForChain(chainId),
          abi: funknloveAbi,
          functionName: "getGoldPrice",
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
