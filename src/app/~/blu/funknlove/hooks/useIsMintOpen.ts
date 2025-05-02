"use client";

import { funknloveAbi, useReadFunknloveIsMintOpen } from "@/wagmi";
import { funknloveAddressForChain } from "../contracts";
import { sepolia, mainnet } from "viem/chains";
import { useReadContracts } from "wagmi";

export function useIsMintOpen(chainId: typeof sepolia.id | typeof mainnet.id) {
  const { data: [isMintOpen, startTime, endTime] = [], ...rest } =
    useReadContracts({
      contracts: [
        {
          address: funknloveAddressForChain(chainId),
          abi: funknloveAbi,
          functionName: "isMintOpen",
        },
        {
          address: funknloveAddressForChain(chainId),
          abi: funknloveAbi,
          functionName: "getStartTime",
        },
        {
          address: funknloveAddressForChain(chainId),
          abi: funknloveAbi,
          functionName: "getEndTime",
        },
      ],
      allowFailure: false,
    });
  return {
    ...(typeof isMintOpen !== "undefined" &&
    typeof startTime !== "undefined" &&
    typeof endTime !== "undefined"
      ? {
          isMintOpen,
          startTime,
          endTime,
        }
      : {}),
    ...rest,
  };
}
