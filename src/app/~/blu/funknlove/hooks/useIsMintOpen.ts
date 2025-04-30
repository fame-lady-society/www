"use client";

import { funknloveAbi, useReadFunknloveIsMintOpen } from "@/wagmi";
import { funknloveAddressForChain } from "../contracts";
import { polygonAmoy, polygon } from "viem/chains";
import { useReadContracts } from "wagmi";

export function useIsMintOpen(
  chainId: typeof polygonAmoy.id | typeof polygon.id,
) {
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
